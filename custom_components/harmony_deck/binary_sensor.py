"""Binary sensors: is the card ready, and can the configuration of each hub be read."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .entity import AdbEntity, DeckEntity, HubEntity
from .lockent import LockActive, setup_platform as _lock_platform


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    await _lock_platform(LockActive, "lock_active")(hass, entry, async_add_entities)
    coordinator = entry.runtime_data
    async_add_entities([DeckReady(coordinator, entry, "ready")])
    known: set[str] = set()
    known_adb: set[str] = set()

    @callback
    def _add_hubs() -> None:
        new = [h for h in (coordinator.data or {}).get("hubs", {}) if h not in known]
        known.update(new)
        if new:
            async_add_entities([HubReadable(coordinator, entry, h, "hub_readable") for h in new])
        new_adb = [a for a in (coordinator.data or {}).get("adb", {}) if a not in known_adb]
        known_adb.update(new_adb)
        if new_adb:
            async_add_entities([AdbReachable(coordinator, entry, a, "adb_reachable") for a in new_adb])

    _add_hubs()
    entry.async_on_unload(coordinator.async_add_listener(_add_hubs))


class DeckReady(DeckEntity, BinarySensorEntity):
    """On while the card is registered with the frontend."""

    @property
    def is_on(self) -> bool:
        return bool(self.hass.data.get(DOMAIN, {}).get("card_url"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        data = self.hass.data.get(DOMAIN, {})
        return {"version": data.get("version"), "card_url": data.get("card_url")}


class HubReadable(HubEntity, BinarySensorEntity):
    """On while the hub configuration can be read from the Harmony integration."""

    @property
    def is_on(self) -> bool:
        return bool(self._hub.get("readable"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"error": self._hub.get("error")}


class AdbReachable(AdbEntity, BinarySensorEntity):
    """On while the Android TV (ADB) device answers."""

    @property
    def is_on(self) -> bool:
        return bool(self._adb.get("reachable"))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"entity_id": self._adb.get("entity")}
