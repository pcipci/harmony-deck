"""Entities of the TV picture (see screen.py): picture, main colour, picture available; on the network device of the link."""

from __future__ import annotations

from typing import Any

from homeassistant.components.binary_sensor import BinarySensorEntity
from homeassistant.components.image import ImageEntity
from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.entity import Entity
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import screen
from .netent import link_id, network_device_info


class _ScreenEntity(Entity):
    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, mgr: screen.ScreenManager, entry: ConfigEntry, entity: str, hub: str, device: str,
                 hub_id: str | None, key: str) -> None:
        self._mgr, self._player = mgr, entity
        self._attr_unique_id = f"{link_id(entry.entry_id, hub, device)}{screen._SEP}{key}"
        self._attr_translation_key = key
        self._attr_device_info = network_device_info(entry.entry_id, hub, device, hub_id, mgr.hass)

    @property
    def _feed(self) -> screen.Feed | None:
        return self._mgr.feeds.get(self._player)

    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        if feed := self._feed:
            self.async_on_remove(feed.add_listener(self._update))

    @callback
    def _update(self) -> None:
        self.async_write_ha_state()


class TvPicture(_ScreenEntity, ImageEntity):
    """The last picture of the TV screen (as the media player shows it)."""

    def __init__(self, mgr: screen.ScreenManager, entry: ConfigEntry, entity: str, hub: str, device: str, hub_id: str | None) -> None:
        ImageEntity.__init__(self, mgr.hass)
        _ScreenEntity.__init__(self, mgr, entry, entity, hub, device, hub_id, "tv_picture")

    @callback
    def _update(self) -> None:
        feed = self._feed
        if feed is not None and feed.updated is not None:
            self._attr_image_last_updated = feed.updated
            self._attr_content_type = feed.content_type
        self.async_write_ha_state()

    @property
    def available(self) -> bool:
        feed = self._feed
        return feed is not None and feed.image is not None

    async def async_image(self) -> bytes | None:
        feed = self._feed
        return feed.image if feed is not None else None

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        return {"entity": self._player}


class MainColor(_ScreenEntity, SensorEntity):
    """Main colour of the picture as #rrggbb; rgb_color, hs_color and brightness for light.turn_on.

    Unknown once there was no picture for longer than the timeout (see "Picture available")."""

    def __init__(self, mgr: screen.ScreenManager, entry: ConfigEntry, entity: str, hub: str, device: str, hub_id: str | None) -> None:
        super().__init__(mgr, entry, entity, hub, device, hub_id, "main_color")

    @property
    def _rgb(self) -> tuple[int, int, int] | None:
        feed = self._feed
        return feed.color if feed is not None and feed.available else None

    @property
    def native_value(self) -> str | None:
        return screen.hex_color(self._rgb)

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        import colorsys

        rgb = self._rgb
        if rgb is None:
            return {"entity": self._player, "rgb_color": None, "hs_color": None, "brightness": None}
        h, s, v = colorsys.rgb_to_hsv(*(c / 255 for c in rgb))
        return {"entity": self._player, "rgb_color": list(rgb), "hs_color": [round(h * 360, 1), round(s * 100, 1)],
                "brightness": int(round(v * 255))}


class PictureAvailable(_ScreenEntity, BinarySensorEntity):
    """On while the TV delivers pictures (the last one is younger than the timeout of the options)."""

    def __init__(self, mgr: screen.ScreenManager, entry: ConfigEntry, entity: str, hub: str, device: str, hub_id: str | None) -> None:
        super().__init__(mgr, entry, entity, hub, device, hub_id, "picture_available")

    @property
    def is_on(self) -> bool:
        feed = self._feed
        return feed is not None and feed.available

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        feed = self._feed
        return {"entity": self._player, "last_picture": feed.updated.isoformat() if feed and feed.updated else None,
                "mode": feed.opts["picture_mode"] if feed else None}


CLASSES = {"tv_picture": TvPicture, "main_color": MainColor, "picture_available": PictureAvailable}


def setup_platform(key: str):
    """async_setup_entry part for one platform: the manager adds the entity of each player with the picture on."""

    async def _setup(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
        screen.manager(hass, entry).register(key, async_add_entities)

    return _setup
