"""Helpers around the device registry that work on old and new Home Assistant versions.

New Home Assistant wants `via_device_id` (the registry id of the parent device) instead of `via_device`
(the identifier of the parent) and no longer wants `async_get_device` (identifiers are not unique across entries).
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr


def find_device(hass: HomeAssistant, entry_id: str, identifier: tuple[str, str]) -> dr.DeviceEntry | None:
    """The device of this config entry that has this identifier (without the deprecated async_get_device)."""
    registry = dr.async_get(hass)
    for device in dr.async_entries_for_config_entry(registry, entry_id):
        if identifier in device.identifiers:
            return device
    return None


def _wants_id() -> bool:
    return "via_device_id" in getattr(dr.DeviceInfo, "__annotations__", {})


def via(hass: HomeAssistant | None, entry_id: str, identifier: tuple[str, str]) -> dict[str, Any]:
    """The keyword that links a device to its parent, in the form this Home Assistant version wants."""
    if not _wants_id():
        return {"via_device": identifier}
    if hass is None:
        return {}
    parent = find_device(hass, entry_id, identifier)
    return {"via_device_id": parent.id} if parent else {}


def ensure_parent(hass: HomeAssistant, entry_id: str, info: dict[str, Any]) -> None:
    """Create the parent device first, so the devices below it can point to it by id."""
    dr.async_get(hass).async_get_or_create(config_entry_id=entry_id, **info)
