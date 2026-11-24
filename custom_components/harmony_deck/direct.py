"""Direct devices in Home Assistant: capabilities, current state and carrying out an op.

The generic adapter covers every ``media_player`` with what Home Assistant offers. An extension (a module in
``extensions/``, registered in EXTENSIONS) may add capabilities for devices it recognises; consumers never see
which adapter answered. Version 0.7 ships no extension yet; the list is the place where e.g. LG Netcast goes.
"""

from __future__ import annotations

import asyncio
import logging
import time
from typing import Any, Protocol

from homeassistant.core import Context, HomeAssistant
from homeassistant.helpers import area_registry as ar, device_registry as dr, entity_registry as er
from homeassistant.helpers.storage import Store

from . import directdev, mismatch
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)
_TIMEOUT = 30


class Extension(Protocol):
    """Extra capabilities for some kind of device, on top of what its entity offers."""

    name: str

    def applies(self, hass: HomeAssistant, entity: str) -> bool: ...

    def caps(self, hass: HomeAssistant, entity: str) -> list[str]: ...

    def snapshot(self, hass: HomeAssistant, entity: str) -> dict[str, Any]: ...

    async def run(self, hass: HomeAssistant, entity: str, op: str, value: Any) -> bool:
        """Carry out the op if the extension handles it (True), else leave it to the generic adapter (False)."""


class FireTvAdapter:
    """Fire TV (and other Android TV devices) over ADB: knows the running app and can list the installed apps.

    The apps, text input and extra keys themselves stay in the Fire TV part (fireapps.py, settings "direct"); this
    adapter only tells the network control what such a device can do, so the lock and the card can ask for the
    capability instead of for "Fire TV".
    """

    name = "androidtv"

    def applies(self, hass: HomeAssistant, entity: str) -> bool:
        return platform(hass, entity) == "androidtv"

    def caps(self, hass: HomeAssistant, entity: str) -> list[str]:
        state = hass.states.get(entity)
        if state is None or state.state in ("unavailable", "unknown"):
            return ["app_list"]
        return ["app_read", "app_list"]

    def snapshot(self, hass: HomeAssistant, entity: str) -> dict[str, Any]:
        state = hass.states.get(entity)
        app = (state.attributes.get("app_name") or state.attributes.get("app_id")) if state else None
        return {"app": app if isinstance(app, str) else None}

    async def run(self, hass: HomeAssistant, entity: str, op: str, value: Any) -> bool:
        return False


EXTENSIONS: list[Extension] = [FireTvAdapter()]

# Settings page the card opens for a linked device, by platform ("generic" for all others).
PAGES = {"androidtv": "firetv"}


def config(hass: HomeAssistant) -> dict[str, dict[str, dict[str, Any]]]:
    return directdev.clean_config(((hass.data.get(DOMAIN) or {}).get("settings") or {}).get("directDevices"))


def fire_all(hass: HomeAssistant) -> dict[str, dict[str, Any]]:
    """{hub remote: {"entity", "device", ...Fire TV settings}}: the Fire TV of every hub.

    From the link that carries Fire TV settings, else the old settings "direct", else a linked Android TV player
    whose page was never saved (then without settings, i.e. defaults).
    """
    settings = (hass.data.get(DOMAIN) or {}).get("settings") or {}
    out = directdev.fire_configs(settings.get("direct"), settings.get("directDevices"))
    for hub, devices in config(hass).items():
        if hub in out:
            continue
        for label in sorted(devices):
            if PAGES.get(platform(hass, devices[label]["entity"]) or "") == "firetv":
                out[hub] = {"entity": devices[label]["entity"], "device": label}
                break
    return out


def device_of(hass: HomeAssistant, hub: str, device: str) -> dict[str, Any] | None:
    return directdev.device_of(config(hass), hub, device)


def _extensions(hass: HomeAssistant, entity: str) -> list[Extension]:
    return [ext for ext in EXTENSIONS if ext.applies(hass, entity)]


async def load_seen_caps(hass: HomeAssistant) -> dict[str, list[str]]:
    """Capabilities seen per player while it was on (a player that is off reports fewer); loaded once."""
    data = hass.data.setdefault(DOMAIN, {})
    if "seen_caps" not in data:
        store = _SEEN_STORE(hass, 1, f"{DOMAIN}.seen_caps")
        loaded = await store.async_load()
        data["seen_caps_store"] = store
        data["seen_caps"] = dict(loaded) if isinstance(loaded, dict) else {}
    return data["seen_caps"]


def known_caps(hass: HomeAssistant, entity: str, fresh: bool = False) -> list[str]:
    """What a player can do as far as known: the live capabilities plus those seen earlier (kept across restarts).

    ``fresh`` (button "Read again") forgets the earlier ones first. Carrying out an op still asks the live ones.
    """
    data = hass.data.setdefault(DOMAIN, {})
    seen = data.setdefault("seen_caps", {})
    live = caps(hass, entity)
    old = [] if fresh else list(seen.get(entity) or [])
    both = [c for c in directdev.CAPS if c in live or c in old]
    if set(live) - {"state"} and seen.get(entity) != both:
        seen[entity] = both
        if (store := data.get("seen_caps_store")) is not None:
            store.async_delay_save(lambda: dict(seen), 5)
    return both


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
    if op == "volume" and platform(hass, entity) in directdev.STEP_PLATFORMS and _volume_by_steps(hass, entity, value, context):
        return
    domain, service, data = directdev.service_call(entity, op, value)
    async with asyncio.timeout(_TIMEOUT):
        await hass.services.async_call(domain, service, data, blocking=True, context=context)


_STEP_GAP = 0.1      # seconds between two volume steps sent to a step-only player
_SETTLE = 2.5        # seconds to wait after the last step before the real level is read again
_ROUNDS = 6          # one pass plus up to five corrections (each one smaller)
_STEP_TIMEOUT = 5    # seconds one step may take


async def _refresh(hass: HomeAssistant, entity: str) -> None:
    """Ask the player for its current state now (a polled player like LG Netcast reports changes only every few seconds)."""
    try:
        async with asyncio.timeout(_STEP_TIMEOUT):
            await hass.services.async_call("homeassistant", "update_entity", {"entity_id": entity}, blocking=True)
    except Exception:  # noqa: BLE001 - then the last known state is used
        _LOGGER.debug("volume steps: %s could not be read again", entity)


def _volume_by_steps(hass: HomeAssistant, entity: str, value: Any, context: Context | None) -> bool:
    """Step-only player (LG Netcast): reach the level with single "louder" / "quieter" steps, then check and correct.

    Each step waits for the player's answer (sent too fast, the TV drops some). After the last step the real level is
    read again after a short pause; if the TV did not get there, the missing steps follow (at most five corrections).
    Runs in the background so the card gets its answer at once; a newer level replaces the run that is still going.
    False if the player does not report its level (then the normal "set volume" is tried).
    """
    if snapshot(hass, entity).get("volume") is None or not isinstance(value, (int, float)):
        return False
    target = round(value)
    tasks = hass.data[DOMAIN].setdefault("_volume_steps", {})
    if (old := tasks.pop(entity, None)) is not None:
        old.cancel()

    async def adjust() -> None:
        try:
            for attempt in range(_ROUNDS):
                await _refresh(hass, entity)
                current = snapshot(hass, entity).get("volume")
                if current is None:
                    return
                service, count = directdev.steps_between(current, target)
                if count == 0:
                    return
                _LOGGER.debug("volume steps: %s %s -> %s, %s x %s (round %s)", entity, current, target, count, service, attempt + 1)
                for _ in range(count):
                    async with asyncio.timeout(_STEP_TIMEOUT):
                        await hass.services.async_call("media_player", service, {"entity_id": entity}, blocking=True, context=context)
                    await asyncio.sleep(_STEP_GAP)
                await asyncio.sleep(_SETTLE)
            _LOGGER.debug("volume steps: %s did not reach %s", entity, target)
        except asyncio.CancelledError:
            raise
        except Exception as err:  # noqa: BLE001 - a step failed (TV off, no answer): stop quietly
            _LOGGER.debug("volume steps: %s stopped: %s", entity, err)
        finally:
            if tasks.get(entity) is asyncio.current_task():
                tasks.pop(entity, None)

    tasks[entity] = hass.async_create_background_task(adjust(), f"{DOMAIN} volume steps {entity}")
    return True


def platform(hass: HomeAssistant, entity: str) -> str | None:
    """Integration an entity comes from (entity registry), e.g. "lg_netcast", "webostv"; None if not registered."""
    entry = er.async_get(hass).async_get(entity)
    return entry.platform if entry else None


def host_of(hass: HomeAssistant, entity: str) -> str | None:
    """Network address of the device behind an entity (host or IP of its config entry); None if unknown."""
    entry = er.async_get(hass).async_get(entity)
    conf = hass.config_entries.async_get_entry(entry.config_entry_id) if entry and entry.config_entry_id else None
    if conf is None:
        return None
    for key in ("host", "ip_address", "ip"):
        value = conf.data.get(key)
        if isinstance(value, str) and value:
            return value
    return None


def summary(hass: HomeAssistant) -> list[dict[str, Any]]:
    """Every linked device with what was found about it (for the sensor "Network control" and diagnostics)."""
    out = []
    for hub, devices in config(hass).items():
        for device, link in devices.items():
            entity = link["entity"]
            found = known_caps(hass, entity)
            remember_sources(hass, entity)       # read again whenever the watcher sees a change (e.g. switched on)
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
                found = known_caps(hass, entity)
                plat = platform(hass, entity)
                item.update(linked[label], caps=found, state=snapshot(hass, entity), known=hass.states.get(entity) is not None,
                            platform=plat, host=host_of(hass, entity), quirks=directdev.quirks(plat, found), page=PAGES.get(plat or "", "generic"),
                            capsLive=caps(hass, entity), sources=remember_sources(hass, entity),
                            sourcesLive=bool(_sources(hass, entity)))
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


_SEEN_STORE = Store  # alias kept for tests that replace it


async def load_seen(hass: HomeAssistant) -> dict[str, list[str]]:
    """Last source lists seen per player (a player that is off publishes none); loaded once, then kept in memory."""
    data = hass.data.setdefault(DOMAIN, {})
    if "seen_sources" not in data:
        store = _SEEN_STORE(hass, 1, f"{DOMAIN}.seen_sources")
        loaded = await store.async_load()
        data["seen_sources_store"] = store
        data["seen_sources"] = dict(loaded) if isinstance(loaded, dict) else {}
    return data["seen_sources"]


def _remember(hass: HomeAssistant, entity: str, live: list[str]) -> list[str]:
    """Live list wins and is remembered when it changed; empty live list (player off) falls back to the remembered one."""
    data = hass.data.setdefault(DOMAIN, {})
    seen = data.setdefault("seen_sources", {})
    if live:
        if seen.get(entity) != live:
            seen[entity] = list(live)
            store = data.get("seen_sources_store")
            if store is not None:
                store.async_delay_save(lambda: dict(seen), 5)
        return live
    return list(seen.get(entity) or [])


def remember_sources(hass: HomeAssistant, entity: str) -> list[str]:
    """Sources to show: live or the last seen ones, inputs first (apps and "Live TV" after them)."""
    return sorted(_remember(hass, entity, _sources(hass, entity)), key=lambda x: not directdev.input_like(x))


def _sources(hass: HomeAssistant, entity: str) -> list[str]:
    """Sources of a player worth showing and comparing (only the inputs where the list is a channel list)."""
    state = hass.states.get(entity)
    found = state.attributes.get("source_list") if state else None
    return directdev.usable_sources(platform(hass, entity), [str(s) for s in found] if isinstance(found, list) else [])


def _inputs(hass: HomeAssistant, info: dict[str, Any], device: str, link: dict[str, Any]) -> list[dict[str, Any]]:
    """Harmony inputs the activities use on a device, each with the chosen source, a guess and the player's sources."""
    sources = remember_sources(hass, link["entity"])     # also while the player is off (last seen list)
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


def activity_changed(hass: HomeAssistant, hub: str) -> None:
    """Remember when the activity of a hub changed (for the grace time of the check)."""
    hass.data.setdefault(DOMAIN, {}).setdefault("activity_changed", {})[hub] = time.monotonic()


def since_change(hass: HomeAssistant, hub: str) -> float | None:
    """Seconds since the activity of a hub changed, None if not seen since the start."""
    stamp = ((hass.data.get(DOMAIN) or {}).get("activity_changed") or {}).get(hub)
    return None if stamp is None else time.monotonic() - stamp


def grace_left(hass: HomeAssistant, hub: str) -> float:
    """Seconds until "should be off" is checked again after an activity change (0 = now)."""
    since = since_change(hass, hub)
    return 0.0 if since is None else max(0.0, mismatch.GRACE - since)


def _check_state(hass: HomeAssistant, entity: str) -> dict[str, Any]:
    snap = snapshot(hass, entity)
    state = hass.states.get(entity)
    if state is not None and mismatch.standby_like(state.state, dict(state.attributes)):
        snap["standby"] = True
    return snap


def check(hass: HomeAssistant, hub: str, info: dict[str, Any]) -> list[dict[str, Any]]:
    """Differences between what the current activity needs and what the linked devices report."""
    links = config(hass).get(hub) or {}
    remote = hass.states.get(hub)
    activity = remote.attributes.get("current_activity") if remote else None
    states = {d: _check_state(hass, l["entity"]) for d, l in links.items()}
    sources = {d: _sources(hass, l["entity"]) for d, l in links.items()}
    found = mismatch.check(activity, info.get("setup") or {}, links, states, sources, since_change(hass, hub))
    for item in found:
        item["can"] = directdev.OPS[item["fix"]] in caps(hass, links[item["device"]]["entity"])
    return found
