"""Installed apps of a Fire TV (Android TV over ADB): the only reader, used by both cards through the websocket API.

The package list is read with `pm list packages -3` (plus `pm list packages` as "all" for the debug view) through the Home Assistant `androidtv` integration and kept
(with its time) so the cards can show names and states without asking the device again.
"""

from __future__ import annotations

import asyncio
import re
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN

STORAGE_KEY = f"{DOMAIN}.fire_apps"
COMMAND = "pm list packages -3"
COMMAND_ALL = "pm list packages"
_PACKAGE = re.compile(r"package:([\w.]+)")
_WAIT_STEPS = 6
_WAIT_SECONDS = 0.5


def parse_packages(raw: Any) -> list[str]:
    """Package names from the answer of `pm list packages` (sorted, without duplicates)."""
    return sorted(set(_PACKAGE.findall(str(raw or ""))))


class FireApps:
    """Cache of the package lists per media_player entity."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict] = Store(hass, 1, STORAGE_KEY)
        self.data: dict[str, dict[str, Any]] = {}

    async def async_load(self) -> None:
        stored = await self._store.async_load()
        if isinstance(stored, dict):
            self.data = {k: v for k, v in stored.items() if isinstance(v, dict) and isinstance(v.get("list"), list)}

    def cached(self) -> dict[str, dict[str, Any]]:
        """{entity id: {"list": [packages], "at": ISO time}}."""
        return self.data

    async def async_test(self, entity_id: str) -> dict[str, Any]:
        """Connection test: sends `echo` and returns {"ok", "answer"}."""
        answer = ""
        try:
            await self.hass.services.async_call(
                "androidtv", "adb_command", {"entity_id": entity_id, "command": "echo harmony-deck-ok"}, blocking=True
            )
            for _ in range(_WAIT_STEPS):
                state = self.hass.states.get(entity_id)
                answer = str(state.attributes.get("adb_response") or "").strip() if state else ""
                if answer:
                    break
                await asyncio.sleep(_WAIT_SECONDS)
        except Exception:  # noqa: BLE001
            answer = ""
        return {"ok": bool(answer), "answer": answer}

    async def _run(self, entity_id: str, command: str, stale: list[str] | None = None) -> list[str]:
        """Send an ADB command and wait for a package list different from `stale` (the previous answer)."""
        packages: list[str] = []
        await self.hass.services.async_call("androidtv", "adb_command", {"entity_id": entity_id, "command": command}, blocking=True)
        for _ in range(_WAIT_STEPS):
            state = self.hass.states.get(entity_id)
            packages = parse_packages(state.attributes.get("adb_response") if state else "")
            if packages and packages != stale:
                break
            await asyncio.sleep(_WAIT_SECONDS)
        return packages

    async def async_read(self, entity_id: str) -> dict[str, Any]:
        """Ask the device. Returns {"list", "all", "at", "ok"}; on failure the cached list (if any) with ok False."""
        packages: list[str] = []
        everything: list[str] = []
        try:
            packages = await self._run(entity_id, COMMAND)
            if packages:
                try:
                    everything = await self._run(entity_id, COMMAND_ALL, packages)
                except Exception:  # noqa: BLE001 - the full list is optional
                    everything = []
        except Exception:  # noqa: BLE001 - device asleep, service missing ...: the caller gets ok False
            packages = []
        if not packages:
            return {**self.data.get(entity_id, {"list": [], "at": None}), "ok": False}
        everything = sorted(set(everything) | set(packages))
        self.data[entity_id] = {"list": packages, "all": everything, "at": dt_util.utcnow().isoformat()}
        await self._store.async_save(self.data)
        return {**self.data[entity_id], "ok": True}
