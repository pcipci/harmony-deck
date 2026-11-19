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

from . import directdev
from .const import DOMAIN
from .direct_watch import watcher
from .lock import lock_hubs

KEYS = ("net_platform", "net_capabilities", "net_state")
_SEP = "::"

# Capabilities in words, in the language Home Assistant runs in (the codes stay in the attributes).
CAP_WORDS: dict[str, dict[str, str]] = {
    "en": {"state": "state", "power_on": "switch on", "power_off": "switch off", "volume_set": "set volume",
           "volume_read": "read volume", "mute": "mute", "source_select": "pick source", "source_read": "read source",
           "app_read": "read app", "app_list": "list apps", "of": "of", "yes": "yes", "no": "no"},
    "de": {"state": "Zustand", "power_on": "einschalten", "power_off": "ausschalten", "volume_set": "Lautstärke setzen",
           "volume_read": "Lautstärke lesen", "mute": "stumm", "source_select": "Quelle wählen", "source_read": "Quelle lesen",
           "app_read": "App lesen", "app_list": "Apps auflisten", "of": "von", "yes": "ja", "no": "nein"},
    "ru": {"state": "состояние", "power_on": "включить", "power_off": "выключить", "volume_set": "задать громкость",
           "volume_read": "читать громкость", "mute": "без звука", "source_select": "выбрать источник", "source_read": "читать источник",
           "app_read": "читать приложение", "app_list": "список приложений", "of": "из", "yes": "да", "no": "нет"},
}


def link_id(entry_id: str, hub: str, device: str) -> str:
    """Identifier of the device of one link (also the start of its entities' unique ids)."""
    return f"{entry_id}_net_{hub}_{device}"


def network_device_info(entry_id: str, hub: str, device: str, hub_id: str | None) -> DeviceInfo:
    """The Home Assistant device of one linked network device (also home of a linked Fire TV's ADB entities)."""
    via = (DOMAIN, f"{entry_id}_{hub_id}") if hub_id else (DOMAIN, entry_id)
    return DeviceInfo(
        identifiers={(DOMAIN, link_id(entry_id, hub, device))},
        translation_key="network_device",
        translation_placeholders={"name": device},
        name=f"{device} (Network)",
        manufacturer="Harmony Deck",
        model="Network device",
        via_device=via,
        entry_type=DeviceEntryType.SERVICE,
    )


def link_of_entity(hass: HomeAssistant, entity: str | None) -> tuple[str, str] | None:
    """(hub, device) of the first link to this player, or None."""
    from . import direct

    for hub, devices in direct.config(hass).items():
        for device, link in devices.items():
            if link["entity"] == entity:
                return hub, device
    return None


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
        self._attr_device_info = network_device_info(entry.entry_id, hub, device, hub_id)

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
        return f"{len([c for c in caps if c in directdev.CAPS])} {words['of']} {len(directdev.CAPS)}"

    @property
    def extra_state_attributes(self) -> dict[str, Any]:
        caps = list(self._item.get("capabilities") or [])
        # One attribute per capability (fixed key, name and yes/no translated by Home Assistant), so all can be compared.
        out: dict[str, Any] = {f"cap_{c}": "yes" if c in caps else "no" for c in directdev.CAPS}
        out["count"] = len(caps)
        return out


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
        _merge_adb(hass, entry, ents, devs, hubs)
        for dev in dr.async_entries_for_config_entry(devs, entry.entry_id):
            ids = [i for d, i in dev.identifiers if d == DOMAIN]
            if ids and all(i.startswith(prefix) and i not in wanted for i in ids):
                devs.async_remove_device(dev.id)
        added.intersection_update(wanted)

    entry.async_on_unload(watch.add_listener(_sync))
    watch.refresh()


def _merge_adb(hass: HomeAssistant, entry: ConfigEntry, ents: er.EntityRegistry, devs: dr.DeviceRegistry,
               hubs: dict[str, str]) -> None:
    """A linked Fire TV has one device: its ADB entities move onto "Name (Network)", the empty "(ADB)" device goes.

    Unlinked again, they move back to their own "(ADB)" device (created on the next start; until then they keep
    their entities and history either way: only the device they are shown under changes).
    """
    coordinator = getattr(entry, "runtime_data", None)
    adb = ((coordinator.data or {}).get("adb") or {}) if coordinator else {}
    for adb_id, info in adb.items():
        link = link_of_entity(hass, info.get("entity"))
        if link is None:
            continue
        hub, device = link
        target = devs.async_get_or_create(config_entry_id=entry.entry_id,
                                          **network_device_info(entry.entry_id, hub, device, hubs.get(hub)))
        for ent in er.async_entries_for_config_entry(ents, entry.entry_id):
            if ent.unique_id.startswith(f"{entry.entry_id}_adb_{adb_id}_") and ent.device_id != target.id:
                ents.async_update_entity(ent.entity_id, device_id=target.id)
        old = devs.async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_adb_{adb_id}")})
        if old and not er.async_entries_for_device(ents, old.id, include_disabled_entities=True):
            devs.async_remove_device(old.id)
