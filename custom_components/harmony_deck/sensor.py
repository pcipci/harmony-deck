"""Sensors: number of hubs found and counts per hub."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .actionent import SequenceSensor
from .direct_watch import watcher
from .entity import DeckEntity, HubEntity
from .lock import lock_hubs
from .lockent import InterventionsToday, LastAction, ReleasedUntil, setup_platform as _lock_platform


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    await _lock_platform(ReleasedUntil, "released_until")(hass, entry, async_add_entities)
    await _lock_platform(LastAction, "last_action")(hass, entry, async_add_entities)
    await _lock_platform(InterventionsToday, "interventions_today")(hass, entry, async_add_entities)
    await _lock_platform(SequenceSensor, "sequence")(hass, entry, async_add_entities)
    coordinator = entry.runtime_data
    async_add_entities([HubsFound(coordinator, entry, "hubs_found"), AdbFound(coordinator, entry, "adb_found"),
                        NetworkControl(coordinator, entry, "network_control")])
    known: set[str] = set()

    @callback
    def _add_hubs() -> None:
        new = [h for h in (coordinator.data or {}).get("hubs", {}) if h not in known]
        known.update(new)
        if new:
            async_add_entities(
                [HubCount(coordinator, entry, h, key) for h in new for key in ("hub_activities", "hub_devices")]
                + [Differences(coordinator, entry, h, "differences") for h in new]
            )

    _add_hubs()
    entry.async_on_unload(coordinator.async_add_listener(_add_hubs))


class HubsFound(DeckEntity, SensorEntity):
    """Number of hubs whose configuration could be read."""

    @property
    def native_value(self) -> int:
        return (self.coordinator.data or {}).get("readable", 0)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"harmony_entries": (self.coordinator.data or {}).get("entries", 0)}


class HubCount(HubEntity, SensorEntity):
    """Activities or devices of a hub."""

    @property
    def native_value(self) -> int | None:
        key = "activities" if self._attr_translation_key == "hub_activities" else "devices"
        return self._hub.get(key) if self._hub.get("readable") else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        """The names behind the number (the state stays the count)."""
        key = "activity_names" if self._attr_translation_key == "hub_activities" else "device_names"
        return {"names": list(self._hub.get(key) or [])}


class AdbFound(DeckEntity, SensorEntity):
    """Number of Android TV (ADB) connections Home Assistant knows, with their state."""

    @property
    def native_value(self) -> int:
        return len((self.coordinator.data or {}).get("adb", {}))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        adb = (self.coordinator.data or {}).get("adb", {})
        return {"connections": [{"name": a["title"], "entity": a["entity"], "reachable": a["reachable"]} for a in adb.values()]}


class _Watching:
    """Updates when the direct device watcher has new results."""

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        watch = watcher(self.hass)
        self.async_on_remove(watch.add_listener(self.async_write_ha_state))
        watch.refresh()


class NetworkControl(_Watching, DeckEntity, SensorEntity):
    """Linked network devices (settings tab "Network control"), with platform, capabilities, state and peculiarities."""

    @property
    def native_value(self) -> int:
        return len(watcher(self.hass).summary)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"devices": watcher(self.hass).summary}


class Differences(_Watching, HubEntity, SensorEntity):
    """What the linked devices of a hub do differently from what the current activity needs (0 = all fine)."""

    @property
    def _remote(self) -> str | None:
        return (lock_hubs(self.hass).get(self._hub_id) or {}).get("remote")

    @property
    def native_value(self) -> int:
        return len(watcher(self.hass).differences.get(self._remote or "", []))

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"remote": self._remote, "items": watcher(self.hass).differences.get(self._remote or "", [])}
