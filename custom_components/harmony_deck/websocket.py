"""Websocket API used by the card."""

from __future__ import annotations

import glob
import json
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_send

from .actionsmodel import clean_actions
from .irvolume import clean_config
from .directdev import clean_config as clean_direct, clean_suggest
from .const import DOMAIN, HARMONY_DOMAIN, SETTING_KEYS, SIGNAL_ACTIONS
from . import profiles as prof, traffic
from .hub import conf_commands, hub_info, match_conf, merge_conf_commands
from .lockws import lock_overview

_REGISTERED = "ws_registered"


@callback
def async_register_websocket(hass: HomeAssistant) -> None:
    """Register the commands once."""
    data = hass.data[DOMAIN]
    if data.get(_REGISTERED):
        return
    websocket_api.async_register_command(hass, ws_info)
    websocket_api.async_register_command(hass, ws_save_settings)
    websocket_api.async_register_command(hass, ws_profiles)
    data[_REGISTERED] = True


def _hub_config(entry: Any) -> dict[str, Any] | None:
    """Full hub configuration from the running Harmony integration, if reachable."""
    data = getattr(entry, "runtime_data", None)
    client = getattr(data, "_client", None)
    config = getattr(client, "config", None)
    return config if isinstance(config, dict) else None


def _hub_meta(hass: HomeAssistant, entry: Any) -> dict[str, Any]:
    """Technical details of the hub for the info panel (all optional)."""
    meta: dict[str, Any] = {"host": entry.data.get("host"), "name": entry.title}
    devices = dr.async_entries_for_config_entry(dr.async_get(hass), entry.entry_id)
    if devices:
        device = devices[0]
        meta["firmware"] = device.sw_version
        meta["model"] = device.model
        meta["manufacturer"] = device.manufacturer
        meta["macs"] = sorted(mac for kind, mac in device.connections if kind == dr.CONNECTION_NETWORK_MAC)
    return meta


async def load_confs(hass: HomeAssistant) -> dict[str, dict[str, list[str]]]:
    """Command names from the ``harmony_*.conf`` files in the HA config folder (read in the executor)."""
    def read() -> dict[str, dict[str, list[str]]]:
        found: dict[str, dict[str, list[str]]] = {}
        for path in glob.glob(hass.config.path("harmony_*.conf")):
            try:
                with open(path, encoding="utf-8") as handle:
                    commands = conf_commands(json.load(handle))
            except (OSError, ValueError):
                continue
            if commands:
                found[path] = commands
        return found

    return await hass.async_add_executor_job(read)


def _area_info(hass: HomeAssistant, ent: Any) -> dict[str, Any] | None:
    """Area (room) of a hub entity, with its icon and floor: {name, icon, floor, level}. The entity's own area wins over the device's."""
    try:
        from homeassistant.helpers import area_registry as ar, floor_registry as fr
    except ImportError:  # old Home Assistant without floors
        return None
    area_id = ent.area_id
    if not area_id and ent.device_id:
        device = dr.async_get(hass).async_get(ent.device_id)
        area_id = device.area_id if device else None
    area = ar.async_get(hass).async_get_area(area_id) if area_id else None
    if not area:
        return None
    info: dict[str, Any] = {"name": area.name, "icon": area.icon}
    floor_id = getattr(area, "floor_id", None)
    floor = fr.async_get(hass).async_get_floor(floor_id) if floor_id else None
    if floor:
        info["floor"] = floor.name
        info["level"] = floor.level
    return info


def collect_hubs(hass: HomeAssistant, confs: dict[str, dict[str, list[str]]] | None = None) -> tuple[dict[str, Any], dict[str, Any]]:
    """Return ({remote entity id: hub info}, diagnostics). ``confs`` = result of load_confs (optional)."""
    registry = er.async_get(hass)
    hubs: dict[str, Any] = {}
    diag: dict[str, Any] = {"entries": 0, "readable": 0, "errors": [], "confFiles": len(confs or {})}
    for entry in hass.config_entries.async_entries(HARMONY_DOMAIN):
        diag["entries"] += 1
        try:
            config = _hub_config(entry)
            if config is None:
                diag["errors"].append(f"{entry.title}: hub configuration not available")
                continue
            info = hub_info(config)
            key = match_conf(set(info["devices"]), confs or {}, entry.unique_id) if confs else None
            if key:
                info["devices"] = merge_conf_commands(info["devices"], confs[key])
            info["commandSource"] = key.rsplit("/", 1)[-1] if key else "live"
        except Exception as err:  # noqa: BLE001 - diagnostics must not break the card
            diag["errors"].append(f"{entry.title}: {err!r}")
            continue
        diag["readable"] += 1
        info["meta"] = _hub_meta(hass, entry)
        for ent in er.async_entries_for_config_entry(registry, entry.entry_id):
            if ent.domain == "remote":
                area = _area_info(hass, ent)
                hubs[ent.entity_id] = {**info, "area": area} if area else info
    return hubs, diag


def _data(hass: HomeAssistant) -> dict[str, Any]:
    """Stored data in the profile layout (global part lives in hass.data[DOMAIN]["settings"])."""
    d = hass.data[DOMAIN]
    return {"global": d["settings"], "profiles": d["profiles"], "assign": d["assign"]}


async def _commit(hass: HomeAssistant, data: dict[str, Any]) -> None:
    """Keep the changed data (profiles.py may replace whole parts) and write it to the store."""
    d = hass.data[DOMAIN]
    d["settings"], d["profiles"], d["assign"] = data["global"], data["profiles"], data["assign"]
    await d["store"].async_save(data)


async def _users(hass: HomeAssistant) -> tuple[list[dict[str, str]], list[dict[str, str]]]:
    """Active, non-system users: (those linked to a person, all). For assigning profiles; administrators only."""
    users = await hass.auth.async_get_users()
    everyone = sorted(
        ({"id": u.id, "name": u.name or u.id} for u in users if u.is_active and not u.system_generated),
        key=lambda u: u["name"].casefold(),
    )
    person_ids = {s.attributes.get("user_id") for s in hass.states.async_all("person") if s.attributes.get("user_id")}
    shown = prof.visible_users(everyone, person_ids, set(_data(hass)["assign"]))
    return shown, everyone


def _overview(hass: HomeAssistant, user_id: str | None, requested: str | None) -> dict[str, Any]:
    data = _data(hass)
    active = prof.resolve(data, user_id, requested)
    return {
        "active": active,
        "names": prof.names(data),
        "assigned": data["assign"].get(user_id or ""),
        "usersOf": {n: prof.users_of(data, n) for n in data["profiles"]},
    }


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/info", vol.Optional("profile"): str})
@websocket_api.async_response
async def ws_info(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Hubs (devices, commands, key routing per activity), the settings of the active profile and the profile list."""
    hubs, diag = collect_hubs(hass, await load_confs(hass))
    user_id = connection.user.id if connection.user else None
    overview = _overview(hass, user_id, msg.get("profile"))
    fire_apps = hass.data[DOMAIN].get("fire_apps")
    result = {
        "hubs": hubs,
        # Lock: only what the main card shows (the lock symbol); everything else is in the security card.
        "lock": {remote: {"entities": hub["entities"]} for remote, hub in lock_overview(hass).items()},
        "packages": {entity: item["list"] for entity, item in fire_apps.cached().items()} if fire_apps else {},
        "settings": prof.merged(_data(hass), overview["active"]),
        "profile": overview,
        "diagnostics": diag,
        "version": hass.data[DOMAIN].get("version"),
    }
    if connection.user and connection.user.is_admin:
        result["users"], result["usersAll"] = await _users(hass)
        result["assign"] = dict(hass.data[DOMAIN]["assign"])
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/save_settings", vol.Required("settings"): dict, vol.Optional("profile"): str}
)
@websocket_api.require_admin
@websocket_api.async_response
async def ws_save_settings(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Store the settings edited in the card into the given profile (administrators only)."""
    data = _data(hass)
    name = prof.resolve(data, connection.user.id if connection.user else None, msg.get("profile"))
    settings = {k: v for k, v in msg["settings"].items() if k in SETTING_KEYS}
    if "actions" in settings:
        settings["actions"] = clean_actions(settings["actions"])
    if "irVolume" in settings:
        settings["irVolume"] = clean_config(settings["irVolume"])
    if "directDevices" in settings:
        settings["directDevices"] = clean_direct(settings["directDevices"])
    if "directSuggest" in settings:
        settings["directSuggest"] = clean_suggest(settings["directSuggest"])
    if "roomSkins" in settings:
        raw = settings["roomSkins"] if isinstance(settings["roomSkins"], dict) else {}
        settings["roomSkins"] = {k[:80]: v[:40] for k, v in raw.items() if isinstance(k, str) and isinstance(v, str) and v}
    if "volumeCap" in settings:
        try:
            settings["volumeCap"] = min(max(int(settings["volumeCap"]), 10), 100)
        except (TypeError, ValueError):
            settings.pop("volumeCap")
    if "volumeStep" in settings:
        try:
            settings["volumeStep"] = min(max(int(settings["volumeStep"]), 1), 10)
        except (TypeError, ValueError):
            settings.pop("volumeStep")
    prof.save(data, name, settings, SETTING_KEYS)
    await _commit(hass, data)
    if "directDevices" in settings and (watch := hass.data[DOMAIN].get("direct_watch")):
        watch.refresh()
    if "actions" in settings:
        async_dispatcher_send(hass, SIGNAL_ACTIONS)
    if "trafficLog" in settings:
        traffic.setup(hass)
    connection.send_result(msg["id"], {"settings": prof.merged(data, name), "profile": name})


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/profiles",
        vol.Required("action"): vol.In(["list", "create", "rename", "delete", "assign"]),
        vol.Optional("name"): str,
        vol.Optional("new_name"): str,
        vol.Optional("copy_from"): str,
        vol.Optional("user_id"): str,
        vol.Optional("profile"): vol.Any(str, None),
    }
)
@websocket_api.async_response
async def ws_profiles(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """List profile names (everyone) or change profiles (administrators only)."""
    user_id = connection.user.id if connection.user else None
    action = msg["action"]
    if action != "list" and not (connection.user and connection.user.is_admin):
        connection.send_error(msg["id"], "unauthorized", "Administrator required")
        return
    data = _data(hass)
    try:
        affected: list[str] = []
        created = None
        if action == "create":
            created = prof.create(data, msg.get("name"), msg.get("copy_from"))
        elif action == "rename":
            created = prof.rename(data, msg.get("name", ""), msg.get("new_name"))
        elif action == "delete":
            affected = prof.delete(data, msg.get("name", ""))
        elif action == "assign":
            prof.assign(data, msg.get("user_id", ""), msg.get("profile"))
    except ValueError as err:
        connection.send_error(msg["id"], str(err), str(err))
        return
    if action != "list":
        await _commit(hass, data)
    connection.send_result(msg["id"], {**_overview(hass, user_id, None), "name": created, "affected": affected})
