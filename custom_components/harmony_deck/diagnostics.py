"""Download diagnostics for Harmony Deck (Settings > Devices & services > Harmony Deck)."""

from __future__ import annotations

from typing import Any

from homeassistant.components.diagnostics import async_redact_data
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

from . import direct
from .const import DOMAIN
from .websocket import collect_hubs, load_confs

TO_REDACT = {"host", "macs"}


async def async_get_config_entry_diagnostics(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, Any]:
    hubs, diag = collect_hubs(hass, await load_confs(hass))
    coordinator = getattr(entry, "runtime_data", None)
    return async_redact_data(
        {
            "status": getattr(coordinator, "data", None),
            "diagnostics": diag,
            "hubs": hubs,
            "settings": hass.data.get(DOMAIN, {}).get("settings", {}),
            "network_control": direct.summary(hass),
            "profiles": {n: sorted(p) for n, p in hass.data.get(DOMAIN, {}).get("profiles", {}).items()},
        },
        TO_REDACT,
    )
