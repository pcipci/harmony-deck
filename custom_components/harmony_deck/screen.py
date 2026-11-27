"""TV picture of a linked network TV (LG Netcast) and its main colour, for automations (e.g. coloured lamps).

Optional per device (card: device page > Technical, off by default). The picture comes from the media player itself
(its entity_picture, the same one Home Assistant shows), so there is no own connection to the TV and no token is kept.
Per device: "TV picture" (image), "Main colour" (sensor, #rrggbb with rgb_color) and "Picture available" (binary sensor).

New picture either when the player reports one (mode "change": its entity_picture changes) or every few seconds
(mode "poll"). Without a picture for longer than the timeout, "Picture available" goes off and the colour unknown;
until then the colour keeps its last value, so short gaps do not make lamps jump.
"""

from __future__ import annotations

import asyncio
import colorsys
import io
import logging
from datetime import datetime, timedelta
from typing import Any, Callable

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import CALLBACK_TYPE, Event, HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_call_later, async_track_state_change_event, async_track_time_interval
from homeassistant.util import dt as dt_util

from . import directdev
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

KEYS = ("tv_picture", "main_color", "picture_available")
_SEP = "::"
_FETCH_TIMEOUT = 10     # seconds one picture may take
_SMOOTH = 0.5           # share of the new colour (the rest is the last one), against flicker
_OFF = ("off", "unavailable", "unknown", "standby")


def main_color(data: bytes) -> tuple[int, int, int] | None:
    """The colour that stands out in the picture: frequent and coloured wins over dark or grey; None if unreadable.

    The picture is made small first (cheap), then reduced to a few colours; each one scores by its share and its
    saturation. Very dark colours (black bars, dark scenes) only count when nothing else is there.
    """
    try:
        from PIL import Image

        with Image.open(io.BytesIO(data)) as img:
            small = img.convert("RGB")
            small.thumbnail((64, 64))
            pal = small.quantize(colors=6)
            palette = pal.getpalette() or []
            counts = pal.getcolors() or []
    except Exception:  # noqa: BLE001 - not a picture, or Pillow missing
        return None
    best, best_score, fallback = None, -1.0, None
    for count, idx in sorted(counts, reverse=True):
        rgb = tuple(palette[idx * 3: idx * 3 + 3])
        if len(rgb) != 3:
            continue
        if fallback is None:
            fallback = rgb
        _h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
        if v < 0.15:
            continue
        score = count * (0.2 + s) * (0.5 + v)
        if score > best_score:
            best, best_score = rgb, score
    out = best or fallback
    return None if out is None else (int(out[0]), int(out[1]), int(out[2]))


def blend(old: tuple[int, int, int] | None, new: tuple[int, int, int], share: float = _SMOOTH) -> tuple[int, int, int]:
    """Smooth the colour: part new, part last (so one odd picture does not make the lamps jump)."""
    if old is None:
        return new
    return tuple(int(round(o + (n - o) * share)) for o, n in zip(old, new))  # type: ignore[return-value]


def hex_color(rgb: tuple[int, int, int] | None) -> str | None:
    return None if rgb is None else "#{:02x}{:02x}{:02x}".format(*rgb)


class Feed:
    """Pictures of one player: fetches them, keeps the last one and its colour, and tells its listeners."""

    def __init__(self, hass: HomeAssistant, entity: str, opts: dict[str, Any]) -> None:
        self.hass, self.entity, self.opts = hass, entity, opts
        self.image: bytes | None = None
        self.content_type = "image/jpeg"
        self.updated: datetime | None = None       # time of the last picture
        self.color: tuple[int, int, int] | None = None
        self._ok_at: datetime | None = None
        self._listeners: list[Callable[[], None]] = []
        self._unsubs: list[CALLBACK_TYPE] = []
        self._expire: CALLBACK_TYPE | None = None
        self._busy = False

    @property
    def available(self) -> bool:
        if self._ok_at is None:
            return False
        return dt_util.utcnow() - self._ok_at <= timedelta(seconds=self.opts["picture_timeout_s"])

    def add_listener(self, listener: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(listener)

        def remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)
        return remove

    @callback
    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener()

    @callback
    def start(self) -> None:
        if self.opts["picture_mode"] == "poll":
            self._unsubs.append(async_track_time_interval(
                self.hass, self._tick, timedelta(seconds=self.opts["picture_interval_s"]), name=f"{DOMAIN} picture {self.entity}"))
        else:
            self._unsubs.append(async_track_state_change_event(self.hass, [self.entity], self._changed))
        self._tick()

    @callback
    def stop(self) -> None:
        for unsub in self._unsubs:
            unsub()
        self._unsubs.clear()
        if self._expire:
            self._expire()
            self._expire = None

    @callback
    def _changed(self, event: Event) -> None:
        old, new = event.data.get("old_state"), event.data.get("new_state")
        if new is None:
            return
        if old is None or old.attributes.get("entity_picture") != new.attributes.get("entity_picture"):
            self._tick()

    @callback
    def _tick(self, _now: Any = None) -> None:
        if self._busy:
            return      # the last picture is still coming: skip, the next one follows
        self._busy = True
        self.hass.async_create_task(self._fetch(), f"{DOMAIN} picture {self.entity}", eager_start=False)

    async def _fetch(self) -> None:
        try:
            state = self.hass.states.get(self.entity)
            if state is None or state.state in _OFF or not state.attributes.get("entity_picture"):
                return
            player = _player(self.hass, self.entity)
            if player is None:
                return
            async with asyncio.timeout(_FETCH_TIMEOUT):
                data, ctype = await player.async_get_media_image()
            if not data:
                return
            rgb = await self.hass.async_add_executor_job(main_color, data)
            self.image, self.content_type = data, ctype or "image/jpeg"
            self.updated = self._ok_at = dt_util.utcnow()
            if rgb is not None:
                self.color = blend(self.color, rgb)
            if self._expire:
                self._expire()
            self._expire = async_call_later(self.hass, self.opts["picture_timeout_s"] + 0.1, self._expired)
            self._notify()
        except Exception as err:  # noqa: BLE001 - no picture this time (TV busy or off): the timeout decides
            _LOGGER.debug("picture: %s gave none: %s", self.entity, err)
        finally:
            self._busy = False

    @callback
    def _expired(self, _now: Any) -> None:
        self._expire = None
        self._notify()


def _player(hass: HomeAssistant, entity: str) -> Any:
    """The media player entity object (it can fetch its own picture), or None."""
    try:
        from homeassistant.components.media_player import DATA_COMPONENT

        component = hass.data.get(DATA_COMPONENT)
    except ImportError:     # older Home Assistant
        component = hass.data.get("media_player")
    return component.get_entity(entity) if component is not None else None


def picture_devices(hass: HomeAssistant, entry: ConfigEntry) -> dict[str, dict[str, Any]]:
    """Linked players with the TV picture switched on: entity -> their technical values."""
    from . import direct

    out: dict[str, dict[str, Any]] = {}
    for devices in direct.config(hass).values():
        for link in devices.values():
            entity = link["entity"]
            if entity in out or direct.platform(hass, entity) not in directdev.OPTION_PLATFORMS:
                continue
            opts = direct.device_tech(hass, entity)
            if opts["picture"]:
                out[entity] = opts
    return out


class ScreenManager:
    """Keeps one feed per player with the picture on, and the three entities of each on its network device."""

    def __init__(self, hass: HomeAssistant, entry: ConfigEntry) -> None:
        self.hass, self.entry = hass, entry
        self.feeds: dict[str, Feed] = {}
        self._adders: dict[str, Callable[[list[Any]], None]] = {}
        self._added: set[tuple[str, str]] = set()

    @callback
    def register(self, key: str, adder: Callable[[list[Any]], None]) -> None:
        self._adders[key] = adder
        self.sync()

    @callback
    def sync(self) -> None:
        """Options or links changed: start, restart or stop feeds; add the entities of new ones, remove the old ones."""
        from .lock import lock_hubs
        from .netent import link_of_entity, link_id

        wanted = picture_devices(self.hass, self.entry)
        for entity in list(self.feeds):
            feed = self.feeds[entity]
            if entity not in wanted or feed.opts != wanted[entity]:
                feed.stop()
                if entity in wanted:        # options changed: same feed, new timing (entities keep pointing at it)
                    feed.opts = wanted[entity]
                    feed.start()
                else:
                    del self.feeds[entity]
        for entity, opts in wanted.items():
            if entity not in self.feeds:
                self.feeds[entity] = Feed(self.hass, entity, opts)
                self.feeds[entity].start()
        hubs = {info["remote"]: hub_id for hub_id, info in lock_hubs(self.hass).items()}
        bases: dict[str, str] = {}
        for entity in wanted:
            link = link_of_entity(self.hass, entity)
            if link is None:
                continue
            hub, device = link
            bases[entity] = link_id(self.entry.entry_id, hub, device)
            for key, adder in self._adders.items():
                if (key, entity) not in self._added:
                    self._added.add((key, entity))
                    adder([_make(key, self, self.entry, entity, hub, device, hubs.get(hub))])
        # entities of players whose picture was switched off (or whose link is gone) go
        keep = {f"{b}{_SEP}{k}" for b in bases.values() for k in KEYS}
        ents = er.async_get(self.hass)
        for ent in er.async_entries_for_config_entry(ents, self.entry.entry_id):
            if ent.unique_id.split(_SEP, 1)[-1] in KEYS and _SEP in ent.unique_id and ent.unique_id not in keep:
                ents.async_remove(ent.entity_id)
        self._added = {(k, e) for k, e in self._added if e in bases}

    @callback
    def stop(self) -> None:
        for feed in self.feeds.values():
            feed.stop()
        self.feeds.clear()


def manager(hass: HomeAssistant, entry: ConfigEntry) -> ScreenManager:
    data = hass.data.setdefault(DOMAIN, {})
    if (mgr := data.get("screen")) is None or mgr.entry is not entry:
        mgr = data["screen"] = ScreenManager(hass, entry)
        from .direct_watch import watcher

        entry.async_on_unload(watcher(hass).add_listener(mgr.sync))
        entry.async_on_unload(mgr.stop)
    return mgr


def _make(key: str, mgr: ScreenManager, entry: ConfigEntry, entity: str, hub: str, device: str, hub_id: str | None) -> Any:
    from . import screenent

    return screenent.CLASSES[key](mgr, entry, entity, hub, device, hub_id)
