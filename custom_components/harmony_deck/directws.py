"""Websocket commands for direct devices."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback

from . import direct
from .const import DOMAIN
from .websocket import collect_hubs, load_confs


@callback
def async_register_direct_websocket(hass: HomeAssistant) -> None:
    data = hass.data[DOMAIN]
    if data.get("direct_ws_registered"):
        return
    websocket_api.async_register_command(hass, ws_overview)
    data["direct_ws_registered"] = True


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/direct/overview"})
@websocket_api.async_response
async def ws_overview(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Linked direct devices with capabilities and state, suggestions and all candidate media players."""
    hubs, _ = collect_hubs(hass, await load_confs(hass))
    connection.send_result(msg["id"], direct.overview(hass, hubs))
