"""One Home Assistant device per linked network device ("LG TV (Network)"), like the "Fire TV (ADB)" devices.

Its diagnostic sensors tell what Harmony Deck found about the linked player: the integration it comes from
(platform), what it can do (capabilities) and what it reports now (state). The devices follow the links in the
settings tab "Network control": a new link adds one, a removed link removes it.
"""

from __future__ import annotations

from typing import Any

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import device_registry as dr, entity_registry as er
from homeassistant.helpers.device_registry import DeviceEntryType, DeviceInfo
from homeassistant.helpers.entity import EntityCategory
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN
from .direct_watch import watcher
from .lock import lock_hubs

KEYS = ("net_platform", "net_capabilities", "net_state")
_SEP = "::"

# Capabilities in words, in the language Home Assistant runs in (the codes stay in the attributes).
CAP_WORDS: dict[str, dict[str, str]] = {
    "en": {"state": "state", "power_on": "switch on", "power_off": "switch off", "volume_set": "set volume",
           "volume_read": "read volume", "mute": "mute", "source_select": "pick source", "source_read": "read source"},
    "de": {"state": "Zustand", "power_on": "einschalten", "power_off": "ausschalten", "volume_set": "Lautstärke setzen",
           "volume_read": "Lautstärke lesen", "mute": "stumm", "source_select": "Quelle wählen", "source_read": "Quelle lesen"},
    "ru": {"state": "состояние", "power_on": "включить", "power_off": "выключить", "volume_set": "задать громкость",
           "volume_read": "читать громкость", "mute": "без звука", "source_select": "выбрать источник", "source_read": "читать источник"},
}


def link_id(entry_id: str, hub: str, device: str) -> str:
    """Identifier of the device of one link (also the start of its entities' unique ids)."""
    return f"{entry_id}_net_{hub}_{device}"


def _lang(hass: HomeAssistant) -> str:
    lang = (hass.config.language or "en").split("-")[0]
    return lang if lang in CAP_WORDS else "en"


class NetEntity(SensorEntity):
    """Diagnostic sensor of a linked network device; reads the watcher's summary."""

    _attr_has_entity_name = True
    _attr_should_poll = False
    _attr_entity_category = EntityCategory.DIAGNOSTIC

    def __init__(self, entry: ConfigEntry, hub: str, device: str, hub_id: str | None, key: str) -> None:
        self._hub, self._device = hub, device
        base = link_id(entry.entry_id, hub, device)
        self._attr_unique_id = f"{base}{_SEP}{key}"
        self._attr_translation_key = key
        via = (DOMAIN, f"{entry.entry_id}_{hub_id}") if hub_id else (DOMAIN, entry.entry_id)
        self._attr_device_info = DeviceInfo(
            identifiers={(DOMAIN, base)},
            translation_key="network_device",
            translation_placeholders={"name": device},
            name=f"{device} (Network)",
            manufacturer="Harmony Deck",
            model="Network device",
            via_device=via,
            entry_type=DeviceEntryType.SERVICE,
        )

    @property
    def _item(self) -> dict[str, Any]:
        for item in watcher(self.hass).summary:
            if item["hub"] == self._hub and item["device"] == self._device:
                return item
        return {}

    @property
    def available(self) -> bool:
        return bool(self._item)

    async def async_added_to_hass(self) -> None:
        self.async_on_remove(watcher(self.hass).add_listener(self.async_write_ha_state))


class NetPlatform(NetEntity):
    """Integration the linked player comes from, e.g. "lg_netcast"; with the peculiarities known for it."""

    @property
    def native_value(self) -> str | None:
        return self._item.get("platform")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        item = self._item
        return {"entity": item.get("entity"), "quirks": list(item.get("quirks") or [])}


class NetCapabilities(NetEntity):
    """What the linked player can do, in words; the codes and their number in the attributes."""

    @property
    def native_value(self) -> str | None:
        caps = self._item.get("capabilities")
        if caps is None:
            return None
        words = CAP_WORDS[_lang(self.hass)]
        return ", ".join(words.get(c, c) for c in caps)[:255] or "-"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        caps = list(self._item.get("capabilities") or [])
        return {"capabilities": caps, "count": len(caps)}


class NetState(NetEntity):
    """On or off as the player reports it; volume, mute and source in the attributes."""

    _attr_device_class = SensorDeviceClass.ENUM
    _attr_options = ["on", "off"]

    @property
    def native_value(self) -> str | None:
        on = self._item.get("on")
        return None if on is None else ("on" if on else "off")

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        item = self._item
        return {"entity": item.get("entity"), "volume": item.get("volume"), "muted": item.get("muted"), "source": item.get("source")}


_CLASSES = {"net_platform": NetPlatform, "net_capabilities": NetCapabilities, "net_state": NetState}


async def async_setup_network_devices(hass: HomeAssistant, entry: ConfigEntry, async_add_entities: AddEntitiesCallback) -> None:
    """Add the sensors of new links and remove devices whose link is gone, each time the watcher has news."""
    watch = watcher(hass)
    added: set[str] = set()
    prefix = f"{entry.entry_id}_net_"

    @callback
    def _sync() -> None:
        hubs = {info["remote"]: hub_id for hub_id, info in lock_hubs(hass).items()}
        wanted = {link_id(entry.entry_id, i["hub"], i["device"]): i for i in watch.summary}
        new = []
        for base, item in wanted.items():
            if base not in added:
                added.add(base)
                new += [_CLASSES[k](entry, item["hub"], item["device"], hubs.get(item["hub"]), k) for k in KEYS]
        if new:
            async_add_entities(new)
        ents = er.async_get(hass)
        for ent in er.async_entries_for_config_entry(ents, entry.entry_id):
            if ent.unique_id.startswith(prefix) and ent.unique_id.split(_SEP, 1)[0] not in wanted:
                ents.async_remove(ent.entity_id)
        devs = dr.async_get(hass)
        for dev in dr.async_entries_for_config_entry(devs, entry.entry_id):
            ids = [i for d, i in dev.identifiers if d == DOMAIN]
            if ids and all(i.startswith(prefix) and i not in wanted for i in ids):
                devs.async_remove_device(dev.id)
        added.intersection_update(wanted)

    entry.async_on_unload(watch.add_listener(_sync))
    watch.refresh()
