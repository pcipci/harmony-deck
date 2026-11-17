"""Status of the Harmony Deck integration: which hubs were found and whether their configuration is readable."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from .hub import activity_roles, device_commands


def summarize_hub(title: str, config: Mapping[str, Any] | None, error: str | None = None) -> dict[str, Any]:
    """Status of one hub: readable flag, counts and the reason if it is not readable."""
    if config is None:
        return {"title": title, "readable": False, "activities": 0, "devices": 0, "error": error or "hub configuration not available"}
    try:
        activity_names = sorted(activity_roles(config), key=str.casefold)
        device_names = sorted(device_commands(config), key=str.casefold)
    except Exception as err:  # noqa: BLE001 - status must never break the integration
        return {"title": title, "readable": False, "activities": 0, "devices": 0, "error": repr(err)}
    return {
        "title": title,
        "readable": True,
        "activities": len(activity_names),
        "devices": len(device_names),
        "activity_names": activity_names,
        "device_names": device_names,
        "error": None,
    }


def summarize(hubs: Mapping[str, dict[str, Any]], adb: Mapping[str, dict[str, Any]] | None = None) -> dict[str, Any]:
    """Overall status from the per-hub statuses ({harmony entry id: hub status})."""
    return {
        "entries": len(hubs),
        "readable": sum(1 for h in hubs.values() if h["readable"]),
        "hubs": dict(hubs),
        "adb": dict(adb or {}),
    }


def unreachable_fire_tvs(direct: Mapping[str, Any] | None, states: Mapping[str, Any]) -> dict[str, str]:
    """Fire TV entities set up in the card (settings `direct`) that are unavailable or unknown, mapped to a display name.

    `states` maps entity_id to an object with `.state` and `.name` (Home Assistant State objects work).
    A missing entity counts as unreachable too: it was configured but the integration is gone.
    """
    bad: dict[str, str] = {}
    for cfg in (direct or {}).values():
        entity = (cfg or {}).get("entity") if isinstance(cfg, Mapping) else None
        if not entity:
            continue
        state = states.get(entity)
        if state is None or state.state in ("unavailable", "unknown"):
            bad[entity] = getattr(state, "name", None) or entity
    return bad


def collect_status(hass: Any) -> dict[str, Any]:
    """Look at every Harmony config entry of this Home Assistant."""
    from .const import HARMONY_DOMAIN
    from .websocket import _hub_config

    hubs: dict[str, dict[str, Any]] = {}
    for entry in hass.config_entries.async_entries(HARMONY_DOMAIN):
        try:
            hubs[entry.entry_id] = summarize_hub(entry.title, _hub_config(entry))
        except Exception as err:  # noqa: BLE001
            hubs[entry.entry_id] = summarize_hub(entry.title, None, repr(err))
    return summarize(hubs, collect_adb(hass))


def collect_adb(hass: Any) -> dict[str, dict[str, Any]]:
    """Android TV (ADB) connections known to Home Assistant, e.g. Fire TV devices."""
    from homeassistant.helpers import entity_registry as er

    out: dict[str, dict[str, Any]] = {}
    try:
        registry = er.async_get(hass)
        for entry in hass.config_entries.async_entries("androidtv"):
            players = [e for e in er.async_entries_for_config_entry(registry, entry.entry_id) if e.domain == "media_player"]
            entity = players[0].entity_id if players else None
            state = hass.states.get(entity) if entity else None
            out[entry.entry_id] = {
                "title": entry.title,
                "entity": entity,
                "reachable": bool(state) and state.state not in ("unavailable", "unknown"),
            }
    except Exception:  # noqa: BLE001 - optional information
        return out
    return out
