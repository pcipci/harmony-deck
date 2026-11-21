"""Websocket API of the lock and of the Fire TV app list (used by the security card and the main card).

The cards only show and send; everything is read and decided here. Hubs are addressed by the entity id of their
remote (as in the main card); changes need an administrator.
"""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN
from . import profiles as prof
from .fireapps import FireApps
from .hub import device_commands
from .lock import LockManager, lock_hubs
from .lockent import lock_entity_ids
from .lockrules import MODES

_HUB = vol.Required("hub")


@callback
def async_register_lock_websocket(hass: HomeAssistant) -> None:
    for command in (ws_lock_get, ws_lock_set, ws_lock_release, ws_lock_clear_log, ws_lock_test, ws_fire_apps, ws_fire_test):
        websocket_api.async_register_command(hass, command)


def _manager(hass: HomeAssistant) -> LockManager | None:
    return hass.data.get(DOMAIN, {}).get("lock")


def _fire_apps(hass: HomeAssistant) -> FireApps | None:
    return hass.data.get(DOMAIN, {}).get("fire_apps")


def _hub_id(hass: HomeAssistant, remote: str) -> str | None:
    """Config entry id of the hub whose remote has this entity id."""
    for hub_id, info in lock_hubs(hass).items():
        if info["remote"] == remote:
            return hub_id
    return None


def _app_names(direct: Any) -> dict[str, str]:
    """{package: name} of the apps named by the user in the main card (own apps and assigned packages)."""
    names: dict[str, str] = {}
    if not isinstance(direct, dict):
        return names
    for name, package in (direct.get("pkgs") or {}).items():
        if isinstance(package, str) and isinstance(name, str):
            names[package] = name
    for app in direct.get("customApps") or []:
        if isinstance(app, dict) and isinstance(app.get("pkg"), str) and isinstance(app.get("name"), str):
            names[app["pkg"]] = app["name"]
    return names


def _power_devices(hass: HomeAssistant, hub_id: str) -> list[str]:
    """Devices of the hub that have their own PowerOff command (read from the running Harmony integration)."""
    entry = hass.config_entries.async_get_entry(hub_id)
    client = getattr(getattr(entry, "runtime_data", None), "_client", None)
    config = getattr(client, "config", None)
    if not isinstance(config, dict):
        return []
    try:
        return sorted((d for d, cmds in device_commands(config).items() if "PowerOff" in cmds), key=str.casefold)
    except Exception:  # noqa: BLE001 - unusual configuration: just offer nothing
        return []


def lock_overview(hass: HomeAssistant) -> dict[str, Any]:
    """{entity id of the remote: state and settings of its lock, activities of the hub, its Fire TV and lock entities}."""
    manager = _manager(hass)
    if manager is None:
        return {}
    data = hass.data.get(DOMAIN, {})
    names = data.get("settings", {}).get("names") or {}
    entry_id = data.get("entry_id")
    out: dict[str, Any] = {}
    for hub_id, info in lock_hubs(hass).items():
        remote = info["remote"]
        state = hass.states.get(remote)
        activities = [a for a in (state.attributes.get("activity_list") or [] if state else []) if a != "PowerOff"]
        out[remote] = {
            **manager.snapshot(hub_id),
            "hub": hub_id,
            "name": names.get(remote) or info["title"],
            "all_activities": activities,
            "fire_entity": manager.fire_entity(hub_id),
            "power_devices": _power_devices(hass, hub_id),
            "activity_icons": (data.get("settings", {}).get("activityIcons") or {}).get(remote) or {},
            "app_names": _app_names(manager._direct(hub_id)),
            "entities": lock_entity_ids(hass, entry_id, hub_id) if entry_id else {},
        }
    return out


def _result(hass: HomeAssistant, connection: websocket_api.ActiveConnection) -> dict[str, Any]:
    data = hass.data.get(DOMAIN, {})
    fire = _fire_apps(hass)
    stored = {"global": data.get("settings", {}), "profiles": data.get("profiles", {}), "assign": data.get("assign", {})}
    user_id = connection.user.id if connection.user else None
    profile = prof.resolve(stored, user_id, None) if stored["profiles"] else None
    settings = (prof.merged(stored, profile) if profile else stored["global"]) or {}
    return {
        "hubs": lock_overview(hass),
        "packages": fire.cached() if fire else {},
        "skin": settings.get("skin"),
        "roomSkins": settings.get("roomSkins") or {},
        "glassLook": settings.get("glassLook"),
        "glassBg": settings.get("glassBg"),
        "glassActColors": settings.get("glassActColors"),
        "admin": bool(connection.user and connection.user.is_admin),
        "available": _manager(hass) is not None,
    }


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/lock/test", _HUB: str})
@websocket_api.async_response
async def ws_lock_test(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """What the lock would switch off right now. Changes nothing."""
    manager = _manager(hass)
    hub_id = _hub_id(hass, msg["hub"])
    if manager is None or hub_id is None:
        connection.send_error(msg["id"], "not_found", "Unknown hub or lock not running")
        return
    connection.send_result(msg["id"], manager.check_now(hub_id))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/lock/get"})
@websocket_api.async_response
async def ws_lock_get(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """State of the lock of every hub."""
    connection.send_result(msg["id"], _result(hass, connection))


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/lock/set",
        _HUB: str,
        vol.Optional("mode"): vol.In(MODES),
        vol.Optional("minutes"): vol.Coerce(float),
        vol.Optional("activities"): [str],
        vol.Optional("apps"): [str],
        vol.Optional("off_devices"): [str],
        vol.Optional("schedule"): [dict],
    }
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_lock_set(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Change the settings of one hub's lock: mode, release duration, allowed activities and apps, schedule."""
    manager = _manager(hass)
    hub_id = _hub_id(hass, msg["hub"])
    if manager is None or hub_id is None:
        connection.send_error(msg["id"], "not_found", "Unknown hub or lock not running")
        return
    if "minutes" in msg:
        await manager.async_set_minutes(hub_id, msg["minutes"])
    if any(k in msg for k in ("activities", "apps", "schedule", "off_devices")):
        await manager.async_set_lists(
            hub_id, activities=msg.get("activities"), apps=msg.get("apps"), schedule=msg.get("schedule"), off_devices=msg.get("off_devices")
        )
    if "mode" in msg:
        await manager.async_set_mode(hub_id, msg["mode"])
    connection.send_result(msg["id"], _result(hass, connection))


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/lock/release", _HUB: str, vol.Optional("minutes"): vol.Coerce(float), vol.Optional("end"): bool}
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_lock_release(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Pause the lock for some minutes (default: the set duration), or end a running release (`end: true`)."""
    manager = _manager(hass)
    hub_id = _hub_id(hass, msg["hub"])
    if manager is None or hub_id is None:
        connection.send_error(msg["id"], "not_found", "Unknown hub or lock not running")
        return
    if msg.get("end"):
        await manager.async_end_release(hub_id)
    else:
        await manager.async_release(hub_id, msg.get("minutes"))
    connection.send_result(msg["id"], _result(hass, connection))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/lock/clear_log", _HUB: str})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_lock_clear_log(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Empty the list of interventions of one hub."""
    manager = _manager(hass)
    hub_id = _hub_id(hass, msg["hub"])
    if manager is None or hub_id is None:
        connection.send_error(msg["id"], "not_found", "Unknown hub or lock not running")
        return
    await manager.async_clear_log(hub_id)
    connection.send_result(msg["id"], _result(hass, connection))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/fire_apps", vol.Required("entity_id"): str, vol.Optional("refresh"): bool})
@websocket_api.async_response
async def ws_fire_apps(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Installed apps (package names) of a Fire TV: from the cache, or freshly read with `refresh: true` (administrators)."""
    fire = _fire_apps(hass)
    if fire is None:
        connection.send_error(msg["id"], "not_found", "Not available")
        return
    entity_id = msg["entity_id"]
    if msg.get("refresh"):
        if not (connection.user and connection.user.is_admin):
            connection.send_error(msg["id"], "unauthorized", "Administrator required")
            return
        if not entity_id.startswith("media_player.") or hass.states.get(entity_id) is None:
            connection.send_error(msg["id"], "not_found", "Unknown media player")
            return
        connection.send_result(msg["id"], await fire.async_read(entity_id))
        return
    connection.send_result(msg["id"], {**fire.cached().get(entity_id, {"list": [], "at": None}), "ok": True})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/fire_test", vol.Required("entity_id"): str})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_fire_test(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Connection test of a Fire TV (ADB): {"ok", "answer"}."""
    fire = _fire_apps(hass)
    entity_id = msg["entity_id"]
    if fire is None or not entity_id.startswith("media_player.") or hass.states.get(entity_id) is None:
        connection.send_error(msg["id"], "not_found", "Unknown media player")
        return
    connection.send_result(msg["id"], await fire.async_test(entity_id))
