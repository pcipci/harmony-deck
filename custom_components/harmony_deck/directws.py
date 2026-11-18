"""Websocket commands for direct devices."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import direct
from .const import DOMAIN
from .directdev import clean_op
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
    data["direct_ws_registered"] = True


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/direct/overview"})
@websocket_api.async_response
async def ws_overview(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Linked direct devices with capabilities and state, suggestions and all candidate media players."""
    hubs, _ = collect_hubs(hass, await load_confs(hass))
    connection.send_result(msg["id"], direct.overview(hass, hubs))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/direct/check", vol.Required("hub"): str})
@websocket_api.async_response
async def ws_check(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Differences between the current activity and the linked devices of a hub (nothing is switched)."""
    hubs, _ = collect_hubs(hass, await load_confs(hass))
    connection.send_result(msg["id"], {"items": direct.check(hass, msg["hub"], hubs.get(msg["hub"]) or {})})


def _locked(hass: HomeAssistant, hub: str) -> bool:
    manager = hass.data[DOMAIN].get("lock")
    if manager is None:
        return False
    return any(v["remote"] == hub and manager.effective(k) for k, v in lock_hubs(hass).items())


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/direct/fix", vol.Required("hub"): str, vol.Required("device"): str,
     vol.Required("op"): vol.In(["on", "off", "source"]), vol.Optional("value"): str}
)
@websocket_api.async_response
async def ws_fix(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Carry out one fix the user tapped. While the lock is on, only switching off is allowed."""
    linked = direct.device_of(hass, msg["hub"], msg["device"])
    op = clean_op(msg["op"], msg.get("value"))
    if linked is None or op is None:
        connection.send_error(msg["id"], "invalid", "no direct device or no valid fix")
        return
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
