"""Shared base for the status entities."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DOMAIN
from .coordinator import DeckCoordinator


def deck_device(entry: ConfigEntry, version: str | None) -> DeviceInfo:
    return DeviceInfo(
        identifiers={(DOMAIN, entry.entry_id)},
        name="Harmony Deck",
        manufacturer="Harmony Deck",
        model="Dashboard card",
        sw_version=version,
        entry_type=DeviceEntryType.SERVICE,
    )


class DeckEntity(CoordinatorEntity[DeckCoordinator]):
    """Entity of the Harmony Deck device itself."""

    _attr_has_entity_name = True
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator: DeckCoordinator, entry: ConfigEntry, key: str) -> None:
        super().__init__(coordinator)
        self._entry = entry
        self._attr_unique_id = f"{entry.entry_id}_{key}"
        self._attr_translation_key = key
        self._attr_device_info = deck_device(entry, coordinator.hass.data.get(DOMAIN, {}).get("version"))


class HubEntity(CoordinatorEntity[DeckCoordinator]):
    """Entity of one Harmony hub as seen by Harmony Deck."""

    _attr_has_entity_name = True
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator: DeckCoordinator, entry: ConfigEntry, hub_id: str, key: str) -> None:
        super().__init__(coordinator)
        self._hub_id = hub_id
        self._attr_unique_id = f"{entry.entry_id}_{hub_id}_{key}"
        self._attr_translation_key = key
        title = (coordinator.data or {}).get("hubs", {}).get(hub_id, {}).get("title") or "Harmony hub"
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{entry.entry_id}_{hub_id}")},
            name=f"{title} (Harmony Deck)",
            manufacturer="Harmony Deck",
            model="Harmony hub",
            via_device=(DOMAIN, entry.entry_id),
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def _hub(self) -> dict:
        return (self.coordinator.data or {}).get("hubs", {}).get(self._hub_id, {})

    @property
    def available(self) -> bool:
        return super().available and self._hub_id in (self.coordinator.data or {}).get("hubs", {})


class AdbEntity(CoordinatorEntity[DeckCoordinator]):
    """Entity for one Android TV (ADB) connection, e.g. a Fire TV."""

    _attr_has_entity_name = True
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, coordinator: DeckCoordinator, entry: ConfigEntry, adb_id: str, key: str) -> None:
        super().__init__(coordinator)
        self._adb_id = adb_id
        self._attr_unique_id = f"{entry.entry_id}_adb_{adb_id}_{key}"
        self._attr_translation_key = key
        title = (coordinator.data or {}).get("adb", {}).get(adb_id, {}).get("title") or "Fire TV"
        from .netent import link_of_entity, network_device_info
        from .lock import lock_hubs

        link = link_of_entity(coordinator.hass, (coordinator.data or {}).get("adb", {}).get(adb_id, {}).get("entity"))
        if link:
            # 0.12: a Fire TV linked in the network control is one device, "Name (Network)".
            hub_ids = {i["remote"]: h for h, i in lock_hubs(coordinator.hass).items()}
            self._attr_device_info = network_device_info(entry.entry_id, link[0], link[1], hub_ids.get(link[0]))
            return
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, f"{entry.entry_id}_adb_{adb_id}")},
            name=f"{title} (ADB)",
            manufacturer="Harmony Deck",
            model="Android TV connection",
            via_device=(DOMAIN, entry.entry_id),
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def _adb(self) -> dict:
        return (self.coordinator.data or {}).get("adb", {}).get(self._adb_id, {})

    @property
    def available(self) -> bool:
        return super().available and self._adb_id in (self.coordinator.data or {}).get("adb", {})
