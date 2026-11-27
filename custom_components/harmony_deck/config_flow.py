"""Config flow: a single confirmation step; the options hold technical settings per linked network TV (LG Netcast)."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.data_entry_flow import section
from homeassistant.helpers.selector import (
    BooleanSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    SelectOptionDict,
    SelectSelector,
    SelectSelectorConfig,
    SelectSelectorMode,
)

from . import directdev
from .const import DOMAIN


class HarmonyDeckConfigFlow(ConfigFlow, domain=DOMAIN):
    """Set up Harmony Deck."""

    VERSION = 1

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")
        if user_input is not None:
            return self.async_create_entry(title="Harmony Deck", data={})
        return self.async_show_form(step_id="user")

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return HarmonyDeckOptionsFlow()


def _number(low: float, high: float, step: float, unit: str) -> NumberSelector:
    return NumberSelector(NumberSelectorConfig(min=low, max=high, step=step, unit_of_measurement=unit, mode=NumberSelectorMode.BOX))


def option_devices(hass: Any) -> dict[str, str]:
    """Linked network players that have options here (LG Netcast): entity -> name (as Home Assistant shows it)."""
    from . import direct

    out: dict[str, str] = {}
    for devices in direct.config(hass).values():
        for device, link in devices.items():
            entity = link["entity"]
            if entity in out or direct.platform(hass, entity) not in directdev.OPTION_PLATFORMS:
                continue
            state = hass.states.get(entity)
            out[entity] = (state.attributes.get("friendly_name") if state else None) or device
    return out


class HarmonyDeckOptionsFlow(OptionsFlow):
    """Technical options per linked network TV (LG Netcast): how its volume is reached with steps, and the TV picture."""

    def __init__(self) -> None:
        self._entity: str | None = None

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        devices = option_devices(self.hass)
        if not devices:
            return self.async_abort(reason="no_devices")
        if len(devices) == 1:
            self._entity = next(iter(devices))
            return await self.async_step_device()
        if user_input is not None and user_input.get("device") in devices:
            self._entity = user_input["device"]
            return await self.async_step_device()
        schema = vol.Schema({vol.Required("device"): SelectSelector(SelectSelectorConfig(
            options=[SelectOptionDict(value=e, label=n) for e, n in devices.items()], mode=SelectSelectorMode.LIST))})
        return self.async_show_form(step_id="init", data_schema=schema)

    async def async_step_device(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        entity = self._entity
        options = dict(self.config_entry.options or {})
        if user_input is not None and entity:
            flat = {**(user_input.get("volume") or {}), **(user_input.get("picture") or {})}
            own = {**directdev.clean_step_options(flat), **directdev.clean_screen_options(flat)}
            options["devices"] = {**(options.get("devices") or {}), entity: own}
            return self.async_create_entry(data=options)
        cur = directdev.device_options(options, entity)
        schema = vol.Schema({
            vol.Required("volume"): section(vol.Schema({
                vol.Required("step_gap_ms", default=cur["step_gap_ms"]): _number(50, 1000, 10, "ms"),
                vol.Required("corrections", default=cur["corrections"]): _number(0, 5, 1, "x"),
                vol.Required("settle_s", default=cur["settle_s"]): _number(0.5, 10, 0.5, "s"),
            }), {"collapsed": False}),
            vol.Required("picture"): section(vol.Schema({
                vol.Required("picture", default=cur["picture"]): BooleanSelector(),
                vol.Required("picture_mode", default=cur["picture_mode"]): SelectSelector(SelectSelectorConfig(
                    options=list(directdev.SCREEN_MODES), translation_key="picture_mode", mode=SelectSelectorMode.LIST)),
                vol.Required("picture_interval_s", default=cur["picture_interval_s"]): _number(1, 10, 0.5, "s"),
                vol.Required("picture_timeout_s", default=cur["picture_timeout_s"]): _number(2, 120, 1, "s"),
            }), {"collapsed": False}),
        })
        name = option_devices(self.hass).get(entity or "", entity or "")
        return self.async_show_form(step_id="device", data_schema=schema, description_placeholders={"name": name})
