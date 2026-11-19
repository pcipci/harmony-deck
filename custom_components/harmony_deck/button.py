"""Buttons: release the lock for a while, and one per stored action."""

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .actionbtn import async_setup_action_buttons
from .lockent import ReleaseButton, setup_platform

_release = setup_platform(ReleaseButton, "release")


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    await _release(hass, entry, async_add_entities)
    await async_setup_action_buttons(hass, entry, async_add_entities)
