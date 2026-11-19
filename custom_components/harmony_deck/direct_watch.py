"""Watches the linked direct devices without the card: keeps the summary and the differences per hub up to date.

Listens to the hubs' remotes and the linked media players. After a change it waits until things stayed the same
for a moment (as the card does), then works out the summary (direct.summary) and the differences per hub
(direct.check) and tells its listeners (the sensors "Network control" and "Differences").
"""

from __future__ import annotations

from typing import Any, Callable

from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers.event import async_call_later, async_track_state_change_event

from . import direct
from .const import DOMAIN

QUIET = 4.0     # seconds without a change before checking


class DirectWatcher:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self.summary: list[dict[str, Any]] = []
        self.differences: dict[str, list[dict[str, Any]]] = {}     # remote entity id -> items
        self._listeners: list[Callable[[], None]] = []
        self._watched: tuple[str, ...] = ()
        self._unwatch: CALLBACK_TYPE | None = None
        self._timer: CALLBACK_TYPE | None = None

    def add_listener(self, listener: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(listener)

        def remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)
        return remove

    @callback
    def refresh(self) -> None:
        """Settings may have changed: watch the right entities and check now."""
        links = direct.config(self.hass)
        entities = sorted({l["entity"] for devs in links.values() for l in devs.values()} | set(links))
        if tuple(entities) != self._watched:
            if self._unwatch:
                self._unwatch()
            self._unwatch = async_track_state_change_event(self.hass, entities, self._changed) if entities else None
            self._watched = tuple(entities)
        self._schedule(0)

    @callback
    def _changed(self, _event: Event) -> None:
        self._schedule(QUIET)

    @callback
    def _schedule(self, delay: float) -> None:
        if self._timer:
            self._timer()
        self._timer = async_call_later(self.hass, delay, self._run)

    async def _run(self, _now: Any = None) -> None:
        from .websocket import collect_hubs

        self._timer = None
        links = direct.config(self.hass)
        hubs, _ = collect_hubs(self.hass) if links else ({}, None)
        self.summary = direct.summary(self.hass)
        self.differences = {hub: direct.check(self.hass, hub, hubs.get(hub) or {}) for hub in links}
        for listener in list(self._listeners):
            listener()

    @callback
    def stop(self) -> None:
        if self._unwatch:
            self._unwatch()
        if self._timer:
            self._timer()
        self._unwatch = self._timer = None
        self._watched = ()


def watcher(hass: HomeAssistant) -> DirectWatcher:
    data = hass.data[DOMAIN]
    if "direct_watch" not in data:
        data["direct_watch"] = DirectWatcher(hass)
    return data["direct_watch"]
