"""Keeps the status of the integration up to date and raises Repairs issues."""

from __future__ import annotations

from datetime import timedelta
import logging
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import Event, HomeAssistant, callback
from homeassistant.helpers import issue_registry as ir
from homeassistant.helpers.event import async_track_state_change_event
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator

from .const import DOMAIN
from .status import collect_status, unreachable_fire_tvs

_LOGGER = logging.getLogger(__name__)
_MISSING = "harmony_missing"
# A Fire TV that sleeps is often unreachable for ADB; only report it after this many refreshes in a row (3 x 2 minutes).
_FIRE_STREAK = 3


def _translation_key(issue_id: str) -> str:
    if issue_id == _MISSING:
        return "harmony_missing"
    return "fire_unreachable" if issue_id.startswith("fire_unreachable_") else "hub_unreadable"


class DeckCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Polls the Harmony config entries every two minutes (cheap, in memory)."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        super().__init__(hass, _LOGGER, config_entry=entry, name=DOMAIN, update_interval=timedelta(minutes=2))
        self._issues: set[str] = set()
        self._fire_down: dict[str, int] = {}
        self._watched: tuple[str, ...] = ()
        self._unwatch = None

    async def _async_update_data(self) -> dict[str, Any]:
        status = collect_status(self.hass)
        self._update_issues(status)
        return status

    def _update_issues(self, status: dict[str, Any]) -> None:
        wanted: dict[str, dict[str, str]] = {}
        if status["entries"] == 0:
            wanted[_MISSING] = {}
        for hub_id, hub in status["hubs"].items():
            if not hub["readable"]:
                wanted[f"hub_unreadable_{hub_id}"] = {"hub": hub["title"]}
        from .direct import fire_all

        direct = fire_all(self.hass)
        entities = [cfg["entity"] for cfg in (direct or {}).values() if isinstance(cfg, dict) and cfg.get("entity")]
        self._watch_fire(entities)
        down = unreachable_fire_tvs(direct, {e: s for e in entities if (s := self.hass.states.get(e))})
        # unreachable now: count the streak; reachable again: forget it
        self._fire_down = {e: self._fire_down.get(e, 0) + 1 for e in down}
        for entity, count in self._fire_down.items():
            if count >= _FIRE_STREAK:
                wanted[f"fire_unreachable_{entity}"] = {"name": down[entity]}
        for issue_id, placeholders in wanted.items():
            ir.async_create_issue(
                self.hass,
                DOMAIN,
                issue_id,
                is_fixable=False,
                severity=ir.IssueSeverity.WARNING,
                translation_key=_translation_key(issue_id),
                translation_placeholders=placeholders or None,
            )
        for issue_id in self._issues - wanted.keys():
            ir.async_delete_issue(self.hass, DOMAIN, issue_id)
        self._issues = set(wanted)

    def _watch_fire(self, entities: list[str]) -> None:
        """Follow the Fire TV entities, so the repair hint goes away the moment the device is back."""
        key = tuple(sorted(set(entities)))
        if key == self._watched:
            return
        if self._unwatch:
            self._unwatch()
        self._watched = key
        self._unwatch = async_track_state_change_event(self.hass, list(key), self._fire_changed) if key else None

    @callback
    def _fire_changed(self, event: Event) -> None:
        new = event.data.get("new_state")
        if new is None or new.state in ("unavailable", "unknown"):
            return
        entity = event.data["entity_id"]
        self._fire_down.pop(entity, None)
        issue_id = f"fire_unreachable_{entity}"
        if issue_id in self._issues:
            ir.async_delete_issue(self.hass, DOMAIN, issue_id)
            self._issues.discard(issue_id)

    def clear_issues(self) -> None:
        if self._unwatch:
            self._unwatch()
            self._unwatch = None
            self._watched = ()
        for issue_id in self._issues:
            ir.async_delete_issue(self.hass, DOMAIN, issue_id)
        self._issues = set()
