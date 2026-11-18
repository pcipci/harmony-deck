"""Starting and stopping actions: websocket commands for the card and services for automations."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, ServiceCall, callback
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import config_validation as cv

from .actionsmodel import clean_action, clean_actions, find_action
from .const import DOMAIN
from .sequences import BusyError, SequenceRunner
from .steps import StepError
from .websocket import collect_hubs, load_confs

SERVICE_RUN = "run_action"
SERVICE_STOP = "stop_action"


def runner(hass: HomeAssistant) -> SequenceRunner:
    data = hass.data[DOMAIN]
    if "runner" not in data:
        data["runner"] = SequenceRunner(hass)
    return data["runner"]


def stored_actions(hass: HomeAssistant) -> dict[str, list[dict[str, Any]]]:
    return clean_actions((hass.data[DOMAIN].get("settings") or {}).get("actions"))


async def _devices(hass: HomeAssistant, hub: str) -> dict[str, list[str]] | None:
    """Commands per device of a hub, to check key steps before anything is sent (None if the hub cannot be read)."""
    hubs, _ = collect_hubs(hass, await load_confs(hass))
    return (hubs.get(hub) or {}).get("devices")


async def start(hass: HomeAssistant, hub: str, action: dict[str, Any], **kwargs: Any) -> None:
    await runner(hass).async_start(hub, action, devices=await _devices(hass, hub), **kwargs)


@callback
def async_register_action_api(hass: HomeAssistant) -> None:
    """Websocket commands and services, once."""
    data = hass.data[DOMAIN]
    if data.get("action_api_registered"):
        return
    websocket_api.async_register_command(hass, ws_run)
    websocket_api.async_register_command(hass, ws_stop)

    async def run_service(call: ServiceCall) -> None:
        hub, key = call.data["hub"], call.data["action"]
        action = find_action(stored_actions(hass), hub, key)
        if action is None:
            raise ServiceValidationError(f"Harmony Deck: no action '{key}' for {hub}")
        try:
            await start(hass, hub, action, context=call.context)
        except BusyError as err:
            raise HomeAssistantError(f"Harmony Deck: another action runs on {hub}") from err
        except StepError as err:
            raise ServiceValidationError(f"Harmony Deck: {err}") from err

    async def stop_service(call: ServiceCall) -> None:
        runner(hass).async_stop(call.data["hub"])

    hass.services.async_register(DOMAIN, SERVICE_RUN, run_service, vol.Schema({vol.Required("hub"): cv.entity_id, vol.Required("action"): cv.string}))
    hass.services.async_register(DOMAIN, SERVICE_STOP, stop_service, vol.Schema({vol.Required("hub"): cv.entity_id}))
    data["action_api_registered"] = True


@websocket_api.websocket_command(
    {
        vol.Required("type"): f"{DOMAIN}/action/run",
        vol.Required("hub"): str,
        vol.Optional("action_id"): str,
        vol.Optional("draft"): dict,         # unsaved action from the editor (administrators only)
        vol.Optional("from_step"): vol.All(int, vol.Range(min=0)),
        vol.Optional("only_step"): vol.All(int, vol.Range(min=0)),
    }
)
@websocket_api.async_response
async def ws_run(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Start a stored action (every logged-in user, like a tap on the card) or a draft (administrators)."""
    hub = msg["hub"]
    draft = "draft" in msg
    if draft:
        if not (connection.user and connection.user.is_admin):
            connection.send_error(msg["id"], "unauthorized", "only administrators can test unsaved actions")
            return
        action = clean_action({"name": "draft", **msg["draft"]})
    else:
        action = find_action(stored_actions(hass), hub, msg.get("action_id", ""))
    if action is None:
        connection.send_error(msg["id"], "not_found", "no such action")
        return
    try:
        await start(hass, hub, action, from_step=msg.get("from_step", 0), only_step=msg.get("only_step"),
                    context=connection.context(msg), draft=draft)
    except BusyError:
        connection.send_error(msg["id"], "busy", "another action runs on this hub")
        return
    except StepError as err:
        connection.send_error(msg["id"], "invalid", str(err))
        return
    connection.send_result(msg["id"], runner(hass).status(hub))


@websocket_api.websocket_command({vol.Required("type"): f"{DOMAIN}/action/stop", vol.Required("hub"): str})
@callback
def ws_stop(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    connection.send_result(msg["id"], {"stopped": runner(hass).async_stop(msg["hub"])})
