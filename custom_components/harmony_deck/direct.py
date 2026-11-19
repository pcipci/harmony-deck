"""Direct devices in Home Assistant: capabilities, current state and carrying out an op.

The generic adapter covers every ``media_player`` with what Home Assistant offers. An extension (a module in
``extensions/``, registered in EXTENSIONS) may add capabilities for devices it recognises; consumers never see
which adapter answered. Version 0.7 ships no extension yet; the list is the place where e.g. LG Netcast goes.
"""

from __future__ import annotations

import asyncio
from typing import Any, Protocol

from homeassistant.core import Context, HomeAssistant
from homeassistant.helpers import area_registry as ar, device_registry as dr, entity_registry as er

from . import directdev, mismatch
from .const import DOMAIN

_TIMEOUT = 30


class Extension(Protocol):
    """Extra capabilities for some kind of device, on top of what its entity offers."""

    name: str

    def applies(self, hass: HomeAssistant, entity: str) -> bool: ...

    def caps(self, hass: HomeAssistant, entity: str) -> list[str]: ...

    def snapshot(self, hass: HomeAssistant, entity: str) -> dict[str, Any]: ...

    async def run(self, hass: HomeAssistant, entity: str, op: str, value: Any) -> bool:
        """Carry out the op if the extension handles it (True), else leave it to the generic adapter (False)."""


EXTENSIONS: list[Extension] = []


def config(hass: HomeAssistant) -> dict[str, dict[str, dict[str, Any]]]:
    return directdev.clean_config(((hass.data.get(DOMAIN) or {}).get("settings") or {}).get("directDevices"))


def device_of(hass: HomeAssistant, hub: str, device: str) -> dict[str, Any] | None:
    return directdev.device_of(config(hass), hub, device)


def _extensions(hass: HomeAssistant, entity: str) -> list[Extension]:
    return [ext for ext in EXTENSIONS if ext.applies(hass, entity)]


def caps(hass: HomeAssistant, entity: str) -> list[str]:
    state = hass.states.get(entity)
    found = set(directdev.media_caps(None if state is None else state.state, None if state is None else dict(state.attributes)))
    for ext in _extensions(hass, entity):
        found.update(ext.caps(hass, entity))
    return [c for c in directdev.CAPS if c in found]


def snapshot(hass: HomeAssistant, entity: str) -> dict[str, Any]:
    state = hass.states.get(entity)
    snap = directdev.snapshot(None if state is None else state.state, None if state is None else dict(state.attributes))
    for ext in _extensions(hass, entity):
        snap.update({k: v for k, v in ext.snapshot(hass, entity).items() if v is not None})
    return snap


async def run(hass: HomeAssistant, entity: str, op: str, value: Any, context: Context | None = None) -> None:
    """Carry out one op (on, off, volume, mute, source). Raises ValueError with a short English reason."""
    need = directdev.OPS[op]
    if need not in caps(hass, entity):
        raise ValueError(f"{entity} cannot do this ({need.replace('_', ' ')})")
    if op == "source":
        state = hass.states.get(entity)
        sources = state.attributes.get("source_list") if state else None
        if isinstance(sources, list) and value not in sources:
            raise ValueError(f"unknown source: {value}")
    if op == "mute" and snapshot(hass, entity).get("muted") is value:
        return      # already so; some players (LG Netcast) only know "toggle mute" and would undo it
    for ext in _extensions(hass, entity):
        if await ext.run(hass, entity, op, value):
            return
    domain, service, data = directdev.service_call(entity, op, value)
    async with asyncio.timeout(_TIMEOUT):
        await hass.services.async_call(domain, service, data, blocking=True, context=context)


def platform(hass: HomeAssistant, entity: str) -> str | None:
    """Integration an entity comes from (entity registry), e.g. "lg_netcast", "webostv"; None if not registered."""
    entry = er.async_get(hass).async_get(entity)
    return entry.platform if entry else None


def summary(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Every linked device with what was found about it (for the sensor "Network control" and diagnostics)."""
    out = []
    for hub, devices in config(hass).items():
        for device, link in devices.items():
            entity = link["entity"]
            found = caps(hass, entity)
            plat = platform(hass, entity)
            snap = snapshot(hass, entity)
            out.append({"hub": hub, "device": device, "entity": entity, "platform": plat, "capabilities": found,
                        "on": snap.get("on"), "volume": snap.get("volume"), "muted": snap.get("muted"),
                        "source": snap.get("source"), "quirks": directdev.quirks(plat, found)})
    return out


def suggest_settings(hass: HomeAssistant) -> dict[str, Any]:
    return directdev.clean_suggest(((hass.data.get(DOMAIN) or {}).get("settings") or {}).get("directSuggest"))


def candidates(hass: HomeAssistant) -> list[dict[str, Any]]:
    """All media players that can do something useful, with maker and model from the device registry.

    Pure playback targets (AirPlay, DLNA, music servers) are left out: they never stand for a Harmony device.
    """
    ents, devs, areas = er.async_get(hass), dr.async_get(hass), ar.async_get(hass)
    out = []
    for state in hass.states.async_all("media_player"):
        found = caps(hass, state.entity_id)
        if not set(found) - {"state"}:
            continue
        name = state.attributes.get("friendly_name") or state.entity_id
        entry = ents.async_get(state.entity_id)
        if directdev.playback_target(entry.platform if entry else None, name, state.entity_id):
            continue
        item: dict[str, Any] = {"entity": state.entity_id, "name": name, "caps": found}
        if isinstance(state.attributes.get("device_class"), str):
            item["kind"] = state.attributes["device_class"]
        device = devs.async_get(entry.device_id) if entry and entry.device_id else None
        if device:
            item["manufacturer"], item["model"] = device.manufacturer, device.model
        area_id = (entry.area_id if entry else None) or (device.area_id if device else None)
        area = areas.async_get_area(area_id) if area_id else None
        if area:
            item["area"] = area.name
        out.append(item)
    return sorted(out, key=lambda c: str(c["name"]).casefold())


def overview(hass: HomeAssistant, hubs: dict[str, Any]) -> dict[str, Any]:
    """Per hub and Harmony device: the linked entity (with capabilities and state) or a suggestion; plus all candidates."""
    cands = candidates(hass)
    cfg = config(hass)
    prefs = suggest_settings(hass)
    out: dict[str, Any] = {}
    for hub, info in hubs.items():
        meta = info.get("deviceMeta") or {}
        area = (info.get("area") or {}).get("name")
        linked = cfg.get(hub) or {}
        taken = {d["entity"] for d in linked.values()}
        free = [c for c in cands if c["entity"] not in taken]
        devices = {}
        for label in info.get("devices") or {}:
            item: dict[str, Any] = {**(meta.get(label) or {})}
            if label in linked:
                entity = linked[label]["entity"]
                found = caps(hass, entity)
                plat = platform(hass, entity)
                item.update(linked[label], caps=found, state=snapshot(hass, entity), known=hass.states.get(entity) is not None,
                            platform=plat, quirks=directdev.quirks(plat, found))
                item["inputList"] = _inputs(hass, info, label, linked[label])
            elif label in (prefs["never"].get(hub) or []):
                item["noSuggest"] = True
            elif not prefs["off"] and (pick := directdev.suggest({**item, "label": label}, free, area)) is not None:
                item["suggest"] = pick
            # Players that fit (best first), for the "Matching" group of the list in the card.
            item["fits"] = [e for score, e in directdev.ranked({**item, "label": label}, cands, area) if score >= 2][:5]
            devices[label] = item
        out[hub] = devices
    return {"hubs": out, "candidates": cands, "suggestOff": prefs["off"], "extensions": [ext.name for ext in EXTENSIONS]}


def _sources(hass: HomeAssistant, entity: str) -> list[str]:
    state = hass.states.get(entity)
    found = state.attributes.get("source_list") if state else None
    return [str(s) for s in found] if isinstance(found, list) else []


def _inputs(hass: HomeAssistant, info: dict[str, Any], device: str, link: dict[str, Any]) -> list[dict[str, Any]]:
    """Harmony inputs the activities use on a device, each with the chosen source, a guess and the player's sources."""
    sources = _sources(hass, link["entity"])
    out: dict[str, dict[str, Any]] = {}
    for activity, items in (info.get("setup") or {}).items():
        for item in items:
            if item.get("device") != device or not item.get("input"):
                continue
            entry = out.setdefault(item["input"], {"input": item["input"], "activities": []})
            entry["activities"].append(activity)
            others = [i["device"] for i in items if i.get("power") and i.get("device") != device]
            entry.setdefault("guess", mismatch.guess_source(item["input"], sources, others))
    chosen = link.get("inputs") or {}
    for entry in out.values():
        entry["source"] = chosen.get(entry["input"])
    return list(out.values())


def check(hass: HomeAssistant, hub: str, info: dict[str, Any]) -> list[dict[str, Any]]:
    """Differences between what the current activity needs and what the linked devices report."""
    links = config(hass).get(hub) or {}
    remote = hass.states.get(hub)
    activity = remote.attributes.get("current_activity") if remote else None
    states = {d: snapshot(hass, l["entity"]) for d, l in links.items()}
    sources = {d: _sources(hass, l["entity"]) for d, l in links.items()}
    found = mismatch.check(activity, info.get("setup") or {}, links, states, sources)
    for item in found:
        item["can"] = directdev.OPS[item["fix"]] in caps(hass, links[item["device"]]["entity"])
    return found
