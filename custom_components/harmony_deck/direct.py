"""Direct devices in Home Assistant: capabilities, current state and carrying out an op.

The generic adapter covers every ``media_player`` with what Home Assistant offers. An extension (a module in
``extensions/``, registered in EXTENSIONS) may add capabilities for devices it recognises; consumers never see
which adapter answered. Version 0.7 ships no extension yet; the list is the place where e.g. LG Netcast goes.
"""

from __future__ import annotations

import asyncio
from typing import Any, Protocol

from homeassistant.core import Context, HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er

from . import directdev
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
    for ext in _extensions(hass, entity):
        if await ext.run(hass, entity, op, value):
            return
    domain, service, data = directdev.service_call(entity, op, value)
    async with asyncio.timeout(_TIMEOUT):
        await hass.services.async_call(domain, service, data, blocking=True, context=context)


def candidates(hass: HomeAssistant) -> list[dict[str, Any]]:
    """All media players that can do something useful, with maker and model from the device registry."""
    ents, devs = er.async_get(hass), dr.async_get(hass)
    out = []
    for state in hass.states.async_all("media_player"):
        found = caps(hass, state.entity_id)
        if not set(found) - {"state"}:
            continue
        item: dict[str, Any] = {"entity": state.entity_id, "name": state.attributes.get("friendly_name") or state.entity_id, "caps": found}
        entry = ents.async_get(state.entity_id)
        device = devs.async_get(entry.device_id) if entry and entry.device_id else None
        if device:
            item["manufacturer"], item["model"] = device.manufacturer, device.model
        out.append(item)
    return sorted(out, key=lambda c: str(c["name"]).casefold())


def overview(hass: HomeAssistant, hubs: dict[str, Any]) -> dict[str, Any]:
    """Per hub and Harmony device: the linked entity (with capabilities and state) or a suggestion; plus all candidates."""
    cands = candidates(hass)
    cfg = config(hass)
    out: dict[str, Any] = {}
    for hub, info in hubs.items():
        meta = info.get("deviceMeta") or {}
        linked = cfg.get(hub) or {}
        taken = {d["entity"] for d in linked.values()}
        free = [c for c in cands if c["entity"] not in taken]
        devices = {}
        for label in info.get("devices") or {}:
            item: dict[str, Any] = {**(meta.get(label) or {})}
            if label in linked:
                entity = linked[label]["entity"]
                item.update(linked[label], caps=caps(hass, entity), state=snapshot(hass, entity), known=hass.states.get(entity) is not None)
            elif (pick := directdev.suggest({**item, "label": label}, free)) is not None:
                item["suggest"] = pick
            devices[label] = item
        out[hub] = devices
    return {"hubs": out, "candidates": cands, "extensions": [ext.name for ext in EXTENSIONS]}
