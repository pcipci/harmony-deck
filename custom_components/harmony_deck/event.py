"""Event entity of the lock: one "Intervention" per Harmony hub."""

from __future__ import annotations

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .lockent import Intervention, setup_platform as _lock_platform


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    await _lock_platform(Intervention, "intervention")(hass, entry, async_add_entities)
