"""Settings of a linked LG Netcast TV as entities on its network device (0.27, "Configuration" on the device page).

Volume steps: gap between two steps (ms), corrections, longest wait before the check (s). TV picture: on/off, new
picture on change or every few seconds, poll interval (s), time without picture before "not available" (s).
The values live on the link of the TV (as since 0.24.1, so older values carry over); see direct.set_tech.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.components.select import SelectEntity
from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import EntityCategory, UnitOfTime

from . import direct, directdev, screen
from .screenent import _ScreenEntity


class _TechEntity(_ScreenEntity):
    _attr_entity_category = EntityCategory.CONFIG
    _key = ""

    def __init__(self, mgr: screen.ScreenManager, entry: ConfigEntry, entity: str, hub: str, device: str, hub_id: str | None) -> None:
        super().__init__(mgr, entry, entity, hub, device, hub_id, self._key)

    @property
    def _value(self) -> Any:
        return direct.device_tech(self._mgr.hass, self._player)[self._key]

    async def _set(self, value: Any) -> None:
        await direct.set_tech(self._mgr.hass, self._player, {self._key: value})


class _TechNumber(_TechEntity, NumberEntity):
    _attr_mode = NumberMode.BOX

    @property
    def native_value(self) -> float:
        return self._value

    async def async_set_native_value(self, value: float) -> None:
        await self._set(value)


def _number(key: str, low: float, high: float, step: float, unit: str | None, icon: str) -> type[_TechNumber]:
    return type(f"Tech_{key}", (_TechNumber,), {"_key": key, "_attr_native_min_value": low, "_attr_native_max_value": high,
                                                 "_attr_native_step": step, "_attr_native_unit_of_measurement": unit,
                                                 "_attr_icon": icon})


class PictureSwitch(_TechEntity, SwitchEntity):
    """Fetch the TV picture (and its main colour)."""

    _key = "picture"
    _attr_icon = "mdi:television-shimmer"

    @property
    def is_on(self) -> bool:
        return bool(self._value)

    async def async_turn_on(self, **kwargs: Any) -> None:
        await self._set(True)

    async def async_turn_off(self, **kwargs: Any) -> None:
        await self._set(False)


class PictureMode(_TechEntity, SelectEntity):
    """New picture when the TV reports one ("change") or every few seconds ("poll")."""

    _key = "picture_mode"
    _attr_icon = "mdi:image-refresh"
    _attr_options = list(directdev.SCREEN_MODES)

    @property
    def current_option(self) -> str:
        return self._value

    async def async_select_option(self, option: str) -> None:
        await self._set(option)


CLASSES: dict[str, type[_TechEntity]] = {
    "step_gap_ms": _number("step_gap_ms", 50, 1000, 10, UnitOfTime.MILLISECONDS, "mdi:timer-outline"),
    "corrections": _number("corrections", 0, 5, 1, None, "mdi:counter"),
    "settle_s": _number("settle_s", 0.5, 10, 0.5, UnitOfTime.SECONDS, "mdi:timer-sand"),
    "picture": PictureSwitch,
    "picture_mode": PictureMode,
    "picture_interval_s": _number("picture_interval_s", 1, 10, 0.5, UnitOfTime.SECONDS, "mdi:timer-refresh-outline"),
    "picture_timeout_s": _number("picture_timeout_s", 2, 120, 1, UnitOfTime.SECONDS, "mdi:timer-off-outline"),
}

PLATFORM_KEYS = {
    "number": ("step_gap_ms", "corrections", "settle_s", "picture_interval_s", "picture_timeout_s"),
    "switch": ("picture",),
    "select": ("picture_mode",),
}


def setup_platform(platform: str):
    """async_setup_entry part: the manager adds these settings for each linked TV."""

    async def _setup(hass, entry, async_add_entities) -> None:
        mgr = screen.manager(hass, entry)
        for key in PLATFORM_KEYS[platform]:
            mgr.register(key, async_add_entities)

    return _setup
