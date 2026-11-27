"""Config flow: a single confirmation step. Technical values of a TV are set on its device page in the card (0.24.1)."""

from __future__ import annotations

from typing import Any

from homeassistant.config_entries import ConfigFlow, ConfigFlowResult

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
