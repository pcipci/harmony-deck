"""Websocket commands for direct devices."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import direct, directdev
from .const import DOMAIN
from .directdev import clean_op, slider_device
from .lock import lock_hubs
from .websocket import collect_hubs, load_confs


@callback
def async_register_direct_websocket(hass: HomeAssistant) -> None:
    data = hass.data[DOMAIN]
    if data.get("direct_ws_registered"):
        return
    websocket_api.async_register_command(hass, ws_overview)
    websocket_api.async_register_command(hass, ws_check)
    websocket_api.async_register_command(hass, ws_fix)
    websocket_api.async_register_command(hass, ws_sliders)
    websocket_api.async_register_command(hass, ws_volume)
    websocket_api.async_register_command(hass, ws_rescan)
    data["direct_ws_registered"] = True


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/direct/overview"})
@websocket_api.async_response
async def ws_overview(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Linked direct devices with capabilities and state, suggestions and all candidate media players."""
    hubs, _ = collect_hubs(hass, await load_confs(hass))
    await direct.load_seen(hass)
    await direct.load_seen_caps(hass)
    result = direct.overview(hass, hubs)
    if not (connection.user and connection.user.is_admin):
        for devices in result["hubs"].values():      # addresses only for administrators
            for item in devices.values():
                item.pop("host", None)
    connection.send_result(msg["id"], result)


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/direct/check", vol.Required("hub"): str})
@websocket_api.async_response
async def ws_check(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Differences between the current activity and the linked devices of a hub (nothing is switched)."""
    hubs, _ = collect_hubs(hass, await load_confs(hass))
    items = direct.check(hass, msg["hub"], hubs.get(msg["hub"]) or {})
    left = direct.grace_left(hass, msg["hub"])
    # "recheck": seconds until the grace time after an activity change is over, so the card asks once more.
    connection.send_result(msg["id"], {"items": items, **({"recheck": round(left, 1)} if left > 0 else {})})


def _locked(hass: HomeAssistant, hub: str) -> bool:
    manager = hass.data[DOMAIN].get("lock")
    if manager is None:
        return False
    return any(v["remote"] == hub and manager.effective(k) for k, v in lock_hubs(hass).items())


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/direct/fix", vol.Required("hub"): str, vol.Required("device"): str,
     vol.Required("op"): vol.In(["on", "off", "source", "volume", "mute"]), vol.Optional("value"): vol.Any(str, int, float, bool)}
)
@websocket_api.async_response
async def ws_fix(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Carry out one fix the user tapped, or a control of the device page (volume, mute: administrators only).

    While the lock is on, only switching off is allowed. The volume is held to the limit of the settings.
    """
    linked = direct.device_of(hass, msg["hub"], msg["device"])
    op = clean_op(msg["op"], msg.get("value"))
    if linked is None or op is None:
        connection.send_error(msg["id"], "invalid", "no direct device or no valid fix")
        return
    if op[0] in ("volume", "mute") and not (connection.user and connection.user.is_admin):
        connection.send_error(msg["id"], "unauthorized", "administrators only")
        return
    if op[0] == "volume":
        cap = (hass.data[DOMAIN].get("settings") or {}).get("volumeCap") or 80
        op = ("volume", min(op[1], int(cap)))
    if op[0] != "off" and _locked(hass, msg["hub"]):
        connection.send_error(msg["id"], "locked", "the lock is on")
        return
    try:
        await direct.run(hass, linked["entity"], op[0], op[1], connection.context(msg))
    except TimeoutError:
        connection.send_error(msg["id"], "failed", f"{msg['device']}: no answer")
        return
    except Exception as err:  # noqa: BLE001 - the message goes to the card
        connection.send_error(msg["id"], "failed", str(err))
        return
    connection.send_result(msg["id"], {"ok": True})


def _slider(hass: HomeAssistant, hub: str, info: dict[str, Any]) -> dict[str, Any] | None:
    """The volume slider of the running activity of a hub: device, entity, level, limit, or None."""
    remote = hass.states.get(hub)
    activity = remote.attributes.get("current_activity") if remote else None
    links = direct.config(hass).get(hub) or {}
    device = slider_device(info.get("activities") or {}, activity, links)
    if device is None:
        return None
    found = _device_slider(hass, links, device)
    return {"activity": activity, **found} if found else None


def _device_slider(hass: HomeAssistant, links: dict[str, Any], device: str) -> dict[str, Any] | None:
    """Slider data of one linked device (device view): "Set volume directly" on and the player takes a level."""
    link = links.get(device)
    if not isinstance(link, dict) or link.get("volumeDirect") is not True:
        return None
    entity = link["entity"]
    if "volume_set" not in direct.known_caps(hass, entity):
        return None
    cap = int((hass.data[DOMAIN].get("settings") or {}).get("volumeCap") or 80)
    plat = direct.platform(hass, entity)
    return {"device": device, "entity": entity, "cap": cap, "release": "volume_on_release" in directdev.quirks(plat, [])}


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/direct/sliders"})
@websocket_api.async_response
async def ws_sliders(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Per hub: the slider of the running activity ("activity") and of every linked device ("devices", device view)."""
    hubs, _ = collect_hubs(hass, await load_confs(hass))
    await direct.load_seen_caps(hass)
    out = {}
    for hub, info in hubs.items():
        links = direct.config(hass).get(hub) or {}
        out[hub] = {"activity": _slider(hass, hub, info),
                    "devices": {d: s for d in links if (s := _device_slider(hass, links, d))}}
    connection.send_result(msg["id"], out)


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/direct/volume", vol.Required("hub"): str, vol.Required("value"): vol.Any(int, float),
     vol.Optional("device"): str}
)
@websocket_api.async_response
async def ws_volume(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Volume slider, for every user (like the volume keys, also while the lock is on).

    Without "device": the volume device of the running activity. With "device": that linked device (device view).
    Only with "Set volume directly" on, always held to the limit of the settings; anything else is refused.
    """
    hubs, _ = collect_hubs(hass, await load_confs(hass))
    if msg.get("device") is not None:
        slider = _device_slider(hass, direct.config(hass).get(msg["hub"]) or {}, msg["device"])
    else:
        slider = _slider(hass, msg["hub"], hubs.get(msg["hub"]) or {})
    op = clean_op("volume", msg["value"])
    if slider is None or op is None:
        connection.send_error(msg["id"], "invalid", "no volume slider for this device")
        return
    target = min(op[1], slider["cap"])
    before = direct.snapshot(hass, slider["entity"]).get("volume")
    try:
        await direct.run(hass, slider["entity"], "volume", target, connection.context(msg))
    except TimeoutError:
        connection.send_error(msg["id"], "failed", f"{slider['device']}: no answer")
        return
    except Exception as err:  # noqa: BLE001 - the message goes to the card
        connection.send_error(msg["id"], "failed", str(err))
        return
    # Step-only TV: the steps run in the background; the card keeps its slider on the target for up to "hold" ms.
    hold = directdev.step_hold_ms(direct.step_options(hass), before, target) if direct.platform(hass, slider["entity"]) in directdev.STEP_PLATFORMS else 0
    connection.send_result(msg["id"], {"ok": True, "value": target, **({"hold": hold} if hold else {})})


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/direct/rescan", vol.Required("hub"): str, vol.Required("device"): str})
@websocket_api.require_admin
@websocket_api.async_response
async def ws_rescan(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Button "Read again": forget what was remembered about the player and read capabilities and inputs now."""
    linked = direct.device_of(hass, msg["hub"], msg["device"])
    if linked is None:
        connection.send_error(msg["id"], "invalid", "no direct device")
        return
    await direct.load_seen(hass)
    await direct.load_seen_caps(hass)
    entity = linked["entity"]
    found = direct.known_caps(hass, entity, fresh=True)
    sources = direct.remember_sources(hass, entity)
    state = hass.states.get(entity)
    connection.send_result(msg["id"], {"caps": found, "count": len(found), "total": len(directdev.CAPS), "sources": sources,
                                       "on": state is not None and state.state not in ("off", "unavailable", "unknown", "standby")})
