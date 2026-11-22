"""Optional log of what Harmony Deck's world sends to the hubs and to the linked network devices.

Switched on with the setting "trafficLog" (off by default). Writes into the normal Home Assistant log, logger
`custom_components.harmony_deck.traffic`, one line per service call that targets a hub or a linked network device
(from the card, an action, the lock or any automation), and one line per state change of those devices
(for example a hub going "unavailable"). Service calls have no result: errors show up in the log as usual.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from homeassistant.const import EVENT_CALL_SERVICE, EVENT_STATE_CHANGED
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback

from .const import DOMAIN

TRAFFIC = logging.getLogger("custom_components.harmony_deck.traffic")
_CACHE_SECS = 30.0
_MAX_VALUE = 120


def watched_entities(hass: HomeAssistant) -> set[str]:
    """Remotes of the hubs and the players linked in the network control (and the Fire TV of a hub)."""
    from . import direct
    from .lock import lock_hubs

    out = {info["remote"] for info in lock_hubs(hass).values()}
    links = direct.config(hass)
    out |= set(links)
    out |= {link["entity"] for devices in links.values() for link in devices.values()}
    out |= {cfg["entity"] for cfg in direct.fire_all(hass).values() if cfg.get("entity")}
    return out


def _short(value: Any) -> str:
    text = str(value)
    return text if len(text) <= _MAX_VALUE else text[: _MAX_VALUE - 1] + "…"


def _targets(data: dict[str, Any]) -> list[str]:
    raw = data.get("entity_id")
    if raw is None:
        raw = (data.get("target") or {}).get("entity_id")
    if isinstance(raw, str):
        return [raw]
    return [e for e in (raw or []) if isinstance(e, str)]


def origin(event: Event) -> str:
    ctx = event.context
    if ctx.user_id:
        return "user/card"
    return "automation" if ctx.parent_id else "integration"


class TrafficLog:
    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._unsubs: list[CALLBACK_TYPE] = []
        self._cache: tuple[float, set[str]] = (0.0, set())

    @property
    def running(self) -> bool:
        return bool(self._unsubs)

    def _entities(self) -> set[str]:
        now = time.monotonic()
        if now - self._cache[0] > _CACHE_SECS:
            self._cache = (now, watched_entities(self.hass))
        return self._cache[1]

    @callback
    def set_enabled(self, enabled: bool) -> None:
        self._cache = (0.0, set())
        if enabled and not self._unsubs:
            self._unsubs = [
                self.hass.bus.async_listen(EVENT_CALL_SERVICE, self._service),
                self.hass.bus.async_listen(EVENT_STATE_CHANGED, self._state),
            ]
            TRAFFIC.info("Traffic log on")
        elif not enabled and self._unsubs:
            self.stop()
            TRAFFIC.info("Traffic log off")

    @callback
    def stop(self) -> None:
        for unsub in self._unsubs:
            unsub()
        self._unsubs = []

    @callback
    def _service(self, event: Event) -> None:
        data = event.data.get("service_data") or {}
        hit = [e for e in _targets(data) if e in self._entities()]
        if not hit:
            return
        rest = {k: _short(v) for k, v in data.items() if k not in ("entity_id", "target")}
        TRAFFIC.info("send %s.%s -> %s %s (%s)", event.data.get("domain"), event.data.get("service"), ", ".join(hit), rest or "", origin(event))

    @callback
    def _state(self, event: Event) -> None:
        entity = event.data.get("entity_id")
        if entity not in self._entities():
            return
        old, new = event.data.get("old_state"), event.data.get("new_state")
        old_s, new_s = (old.state if old else None), (new.state if new else None)
        if old_s != new_s:
            TRAFFIC.info("state %s: %s -> %s", entity, old_s, new_s)
        elif old and new and old.attributes.get("current_activity") != new.attributes.get("current_activity"):
            TRAFFIC.info("activity %s: %s -> %s", entity, old.attributes.get("current_activity"), new.attributes.get("current_activity"))


def setup(hass: HomeAssistant) -> TrafficLog:
    log = hass.data[DOMAIN].get("traffic")
    if log is None:
        log = hass.data[DOMAIN]["traffic"] = TrafficLog(hass)
    log.set_enabled(bool((hass.data[DOMAIN].get("settings") or {}).get("trafficLog")))
    return log
