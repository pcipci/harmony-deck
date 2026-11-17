"""Entities of the lock: one set per Harmony hub, on the hub's Harmony Deck device."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Callable

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.components.button import ButtonEntity
from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.components.select import SelectEntity
from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import Entity, EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .lock import LockManager, lock_hubs
from .lockrules import MAX_RELEASE, MIN_RELEASE, MODES

# key of each lock entity -> its platform (used to find the entity ids for the cards)
LOCK_KEYS = {
    "lock": "switch",
    "lock_mode": "select",
    "release_minutes": "number",
    "release": "button",
    "lock_active": "binary_sensor",
    "released_until": "sensor",
    "last_action": "sensor",
}


def lock_unique_id(entry_id: str, hub_id: str, key: str) -> str:
    return f"{entry_id}_{hub_id}_{key}"


def lock_entity_ids(hass: HomeAssistant, entry_id: str, hub_id: str) -> dict[str, str]:
    """{key: entity id} of the lock entities of one hub (those that exist)."""
    registry = er.async_get(hass)
    out: dict[str, str] = {}
    for key, platform in LOCK_KEYS.items():
        entity_id = registry.async_get_entity_id(platform, DOMAIN, lock_unique_id(entry_id, hub_id, key))
        if entity_id:
            out[key] = entity_id
    return out


@callback
def remove_legacy_entities(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """0.2.0 named the lock entities after the entity id of the remote; they are replaced by ones named after the hub."""
    registry = er.async_get(hass)
    for ent in er.async_entries_for_config_entry(registry, entry.entry_id):
        if ent.unique_id.startswith(f"{entry.entry_id}_remote."):
            registry.async_remove(ent.entity_id)


class LockEntity(Entity):
    """Base: belongs to the hub's Harmony Deck device and follows the lock manager."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, manager: LockManager, entry: ConfigEntry, hub_id: str, info: dict[str, str], key: str) -> None:
        self._manager = manager
        self._hub_id = hub_id
        self._attr_unique_id = lock_unique_id(entry.entry_id, hub_id, key)
        self._attr_translation_key = key
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{entry.entry_id}_{hub_id}")},
            name=f"{info['title']} (Harmony Deck)",
            manufacturer="Harmony Deck",
            model="Harmony hub",
            via_device=(DOMAIN, entry.entry_id),
            entry_type=DeviceEntryType.SERVICE,
        )

    async def async_added_to_hass(self) -> None:
        # The manager tells about every change, also when a release or a time window ends.
        self.async_on_remove(self._manager.async_add_listener(self._changed))

    @callback
    def _changed(self) -> None:
        self.async_write_ha_state()


class LockSwitch(LockEntity, SwitchEntity):
    """On = the lock of this hub is switched on (mode "always" or "schedule")."""

    _attr_entity_category = EntityCategory.CONFIG

    @property
    def is_on(self) -> bool:
        return self._manager.enabled(self._hub_id)

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self._manager.async_set_enabled(self._hub_id, True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._manager.async_set_enabled(self._hub_id, False)


class LockMode(LockEntity, SelectEntity):
    """Off, always, or by the schedule."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_options = list(MODES)

    @property
    def current_option(self) -> str:
        return self._manager.mode(self._hub_id)

    async def async_select_option(self, option: str) -> None:
        await self._manager.async_set_mode(self._hub_id, option)


class ReleaseMinutes(LockEntity, NumberEntity):
    """How long a release lasts."""

    _attr_entity_category = EntityCategory.CONFIG
    _attr_native_min_value = MIN_RELEASE
    _attr_native_max_value = MAX_RELEASE
    _attr_native_step = 5
    _attr_native_unit_of_measurement = "min"
    _attr_mode = NumberMode.BOX

    @property
    def native_value(self) -> float:
        return self._manager.minutes(self._hub_id)

    async def async_set_native_value(self, value: float) -> None:
        await self._manager.async_set_minutes(self._hub_id, value)


class ReleaseButton(LockEntity, ButtonEntity):
    """Pauses the lock for the set time."""

    async def async_press(self) -> None:
        await self._manager.async_release(self._hub_id)


class LockActive(LockEntity, BinarySensorEntity):
    """On while the lock works: switched on, inside a time window if a schedule is used, and not released."""

    @property
    def is_on(self) -> bool:
        return self._manager.effective(self._hub_id)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        until = self._manager.released_until(self._hub_id) if self._manager.enabled(self._hub_id) else None
        return {
            "mode": self._manager.mode(self._hub_id),
            "released_until": until.isoformat() if until else None,
            # The main card locks every activity that is not on this list while the lock works.
            "allowed_activities": list(self._manager.allowed_activities(self._hub_id)),
        }


class ReleasedUntil(LockEntity, SensorEntity):
    """End of the current release, empty otherwise."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP

    @property
    def native_value(self) -> datetime | None:
        return self._manager.released_until(self._hub_id)


class LastAction(LockEntity, SensorEntity):
    """When the lock last switched something off, and what."""

    _attr_device_class = SensorDeviceClass.TIMESTAMP
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    @property
    def native_value(self) -> datetime | None:
        return self._manager.last_action(self._hub_id)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"what": self._manager.hub(self._hub_id).get("last_what"), "today": self._manager.today_count(self._hub_id)}


def setup_platform(factory: Callable[..., Entity], *keys: str):
    """Build an async_setup_entry for a platform: one entity per key and hub, added as hubs show up."""

    async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
        manager: LockManager | None = hass.data.get(DOMAIN, {}).get("lock")
        coordinator = getattr(entry, "runtime_data", None)
        if manager is None:
            return
        known: set[str] = set()

        @callback
        def _add() -> None:
            hubs = {h: i for h, i in lock_hubs(hass).items() if h not in known}
            known.update(hubs)
            if hubs:
                async_add_entities([factory(manager, entry, h, i, k) for h, i in hubs.items() for k in keys])

        _add()
        if coordinator:
            entry.async_on_unload(coordinator.async_add_listener(_add))

    return async_setup_entry
