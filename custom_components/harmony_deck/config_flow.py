"""Config flow: a single confirmation step; options hold technical timings for step-only TVs (LG Netcast)."""

from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.data_entry_flow import section
from homeassistant.helpers.selector import NumberSelector, NumberSelectorConfig, NumberSelectorMode

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


class HarmonyDeckOptionsFlow(OptionsFlow):
    """Technical options: how the volume of an LG Netcast TV (only steps, no target level) is reached and checked."""

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            return self.async_create_entry(data={"lg_netcast": directdev.clean_step_options(user_input.get("lg_netcast"))})
        cur = directdev.clean_step_options((self.config_entry.options or {}).get("lg_netcast"))
        schema = vol.Schema({
            vol.Required("lg_netcast"): section(vol.Schema({
                vol.Required("step_gap_ms", default=cur["step_gap_ms"]): _number(50, 1000, 10, "ms"),
                vol.Required("corrections", default=cur["corrections"]): _number(0, 5, 1, "x"),
                vol.Required("settle_s", default=cur["settle_s"]): _number(0.5, 10, 0.5, "s"),
            }), {"collapsed": False}),
        })
        return self.async_show_form(step_id="init", data_schema=schema)
