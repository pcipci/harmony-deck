"""Actions in Home Assistant: one button per stored action and a sensor "Actions" per hub.

The buttons sit on the hub's Harmony Deck device. Pressing one starts the action like a tap on the card; while
another action runs on the hub the press is refused. Buttons follow the actions saved in the card: a new action
adds one, a deleted action removes it (unique id = hub and action id, so renaming keeps the entity).
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.button import ButtonEntity
from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.exceptions import HomeAssistantError, ServiceValidationError
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .actionsmodel import find_action
from .actionws import runner, start, stored_actions
from .const import DOMAIN, SIGNAL_ACTIONS
from .lock import lock_hubs
from .lockent import LockEntity, lock_unique_id
from .sequences import BusyError
from .steps import StepError

ACTION_PREFIX = "action_"
SIGNAL_BUTTONS = f"{DOMAIN}_action_buttons_changed"      # a button was added or removed (the sensor lists them)


def _remote(hass: HomeAssistant, hub_id: str) -> str | None:
    return (lock_hubs(hass).get(hub_id) or {}).get("remote")


class ActionButton(LockEntity, ButtonEntity):
    """Starts one stored action of a hub."""

    def __init__(self, manager: Any, entry: ConfigEntry, hub_id: str, info: dict[str, str], action: dict[str, Any]) -> None:
        super().__init__(manager, entry, hub_id, info, ACTION_PREFIX + action["id"])
        self._attr_translation_key = None
        self._action_id = action["id"]
        self._remote_id = info["remote"]
        self._take(action)

    def _take(self, action: dict[str, Any]) -> None:
        self._attr_name = action["name"]
        self._attr_icon = action.get("icon") or "mdi:flash"

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(async_dispatcher_connect(self.hass, SIGNAL_ACTIONS, self._actions_changed))
        async_dispatcher_send(self.hass, SIGNAL_BUTTONS)

    async def async_will_remove_from_hass(self) -> None:
        async_dispatcher_send(self.hass, SIGNAL_BUTTONS)

    @callback
    def _actions_changed(self) -> None:
        action = find_action(stored_actions(self.hass), self._remote_id, self._action_id)
        if action and action["id"] == self._action_id:
            self._take(action)
            self.async_write_ha_state()

    async def async_press(self) -> None:
        action = find_action(stored_actions(self.hass), self._remote_id, self._action_id)
        if action is None or action["id"] != self._action_id:
            raise ServiceValidationError(f"Harmony Deck: the action {self._action_id} no longer exists")
        if runner(self.hass).running(self._remote_id):
            raise HomeAssistantError("Harmony Deck: another action runs on this hub")
        try:
            await start(self.hass, self._remote_id, action, context=self._context)
        except BusyError as err:
            raise HomeAssistantError("Harmony Deck: another action runs on this hub") from err
        except StepError as err:
            raise ServiceValidationError(f"Harmony Deck: {err}") from err


class ActionsSensor(LockEntity, SensorEntity):
    """Stored actions of a hub: their names as the state, id, name, steps and button per action in the attributes."""

    def __init__(self, manager: Any, entry: ConfigEntry, hub_id: str, info: dict[str, str], key: str) -> None:
        super().__init__(manager, entry, hub_id, info, key)
        self._remote_id = info["remote"]
        self._entry_id = entry.entry_id

    async def async_added_to_hass(self) -> None:
        for signal in (SIGNAL_ACTIONS, SIGNAL_BUTTONS):
            self.async_on_remove(async_dispatcher_connect(self.hass, signal, self.async_write_ha_state))

    @property
    def _actions(self) -> list[dict[str, Any]]:
        return stored_actions(self.hass).get(self._remote_id) or []

    @property
    def native_value(self) -> str:
        from .sensor import short_list

        return short_list([a["name"] for a in self._actions], self.hass.config.language)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        reg = er.async_get(self.hass)
        items = []
        for action in self._actions:
            button = reg.async_get_entity_id("button", DOMAIN, lock_unique_id(self._entry_id, self._hub_id, ACTION_PREFIX + action["id"]))
            items.append({"id": action["id"], "name": action["name"], "steps": len(action["steps"]), "button": button})
        return {"count": len(items), "actions": items}


async def async_setup_action_buttons(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    """Buttons for the stored actions of every hub; added and removed when the actions are saved or hubs appear."""
    manager = hass.data.get(DOMAIN, {}).get("lock")
    if manager is None:
        return
    added: set[str] = set()

    @callback
    def _sync() -> None:
        stored = stored_actions(hass)
        wanted: dict[str, tuple[str, dict[str, str], dict[str, Any]]] = {}
        for hub_id, info in lock_hubs(hass).items():
            for action in stored.get(info["remote"]) or []:
                wanted[lock_unique_id(entry.entry_id, hub_id, ACTION_PREFIX + action["id"])] = (hub_id, info, action)
        new = [ActionButton(manager, entry, h, i, a) for uid, (h, i, a) in wanted.items() if uid not in added]
        added.update(wanted)
        if new:
            async_add_entities(new)
        reg = er.async_get(hass)
        for ent in er.async_entries_for_config_entry(reg, entry.entry_id):
            if ent.domain == "button" and f"_{ACTION_PREFIX}" in ent.unique_id and ent.unique_id not in wanted:
                reg.async_remove(ent.entity_id)
        added.intersection_update(wanted)

    _sync()
    entry.async_on_unload(async_dispatcher_connect(hass, SIGNAL_ACTIONS, _sync))
    if coordinator := getattr(entry, "runtime_data", None):
        entry.async_on_unload(coordinator.async_add_listener(_sync))
