"""Sensor "Sequence": what the actions of a hub are doing (one per Harmony hub, next to the lock entities)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import callback

from .actionws import runner
from .lock import LockManager
from .lockent import LockEntity

STATES = ["idle", "running", "done", "stopped", "error"]


class SequenceSensor(LockEntity, SensorEntity):
    """State of the action run of a hub; the card reads step and progress from the attributes."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = STATES

    def __init__(self, manager: LockManager, entry: ConfigEntry, hub_id: str, info: dict[str, str], key: str) -> None:
        super().__init__(manager, entry, hub_id, info, key)
        self._remote = info["remote"]

    async def async_added_to_hass(self) -> None:
        # Only the runner matters here, not the lock.
        self.async_on_remove(runner(self.hass).async_add_listener(self._run_changed))

    @callback
    def _run_changed(self, hub: str) -> None:
        if hub == self._remote:
            self.async_write_ha_state()

    @property
    def native_value(self) -> str:
        return runner(self.hass).status(self._remote).get("state", "idle")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        st = runner(self.hass).status(self._remote)
        st.pop("state", None)
        return st
