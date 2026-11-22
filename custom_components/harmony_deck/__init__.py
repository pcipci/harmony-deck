"""Harmony Deck: a remote control card for Logitech Harmony hubs."""

from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url, remove_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.storage import Store

from .coordinator import DeckCoordinator
from .fireapps import FireApps
from .lock import LockManager
from .lockent import remove_legacy_entities
from .lockws import async_register_lock_websocket
from .directdev import link_fire_tvs, move_fire_settings
from .const import CARD_FILE, CARD_URL, DOMAIN, SETTING_KEYS, STORAGE_KEY, STORAGE_VERSION, TRANSLATIONS_URL
from .profiles import migrate
from .actionws import async_register_action_api
from .directws import async_register_direct_websocket
from .websocket import async_register_websocket

_LOGGER = logging.getLogger(__name__)
_VERSION_KEY = "card_url"
PLATFORMS = [Platform.BINARY_SENSOR, Platform.BUTTON, Platform.EVENT, Platform.NUMBER, Platform.SELECT, Platform.SENSOR, Platform.SWITCH]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Serve the card, register it as a frontend module and start the websocket API."""
    domain_data = hass.data.setdefault(DOMAIN, {})

    store: Store[dict] = Store(hass, STORAGE_VERSION, STORAGE_KEY)
    domain_data["store"] = store
    stored = migrate(await store.async_load(), SETTING_KEYS)
    glob = stored["global"]
    if not glob.get("fireLinked"):
        # 0.12: the Fire TV of a hub becomes a device of the network control (once; later the card keeps both in step).
        if linked := link_fire_tvs(glob.get("direct"), glob.get("directDevices")):
            glob["directDevices"] = linked
        glob["fireLinked"] = True
    if not glob.get("fireMoved"):
        # 0.13: the Fire TV settings live on the link of the Fire TV (once; what cannot move stays and still works).
        glob["direct"], glob["directDevices"] = move_fire_settings(glob.get("direct"), glob.get("directDevices"))
        glob["fireMoved"] = True
    domain_data["settings"] = stored["global"]  # hardware related part (read by the coordinator)
    from . import direct

    await direct.load_seen(hass)        # last seen sources and capabilities of the linked players
    await direct.load_seen_caps(hass)
    domain_data["profiles"] = stored["profiles"]
    domain_data["assign"] = stored["assign"]

    version = (await _manifest_version(hass)) or "0"
    path = Path(__file__).parent / "frontend" / CARD_FILE
    if not domain_data.get("static_registered"):
        await hass.http.async_register_static_paths([StaticPathConfig(CARD_URL, str(path), False)])
        await hass.http.async_register_static_paths(
            [StaticPathConfig(TRANSLATIONS_URL, str(Path(__file__).parent / "frontend" / "translations"), False)]
        )
        domain_data["static_registered"] = True
    url = f"{CARD_URL}?v={version}"
    add_extra_js_url(hass, url)
    domain_data[_VERSION_KEY] = url
    domain_data["version"] = version

    domain_data["entry_id"] = entry.entry_id
    from . import traffic

    traffic.setup(hass)
    async_register_websocket(hass)
    async_register_action_api(hass)
    async_register_direct_websocket(hass)
    if not domain_data.get("lock_ws_registered"):
        async_register_lock_websocket(hass)
        domain_data["lock_ws_registered"] = True

    # The lock works on its own (also without an open card) and is optional: if it fails, the card keeps working.
    try:
        fire_apps = FireApps(hass)
        await fire_apps.async_load()
        domain_data["fire_apps"] = fire_apps
        manager = LockManager(hass)
        await manager.async_load()
        manager.async_start()
        domain_data["lock"] = manager
        remove_legacy_entities(hass, entry)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("Harmony Deck lock could not be started; the card keeps working")

    # The status entities are optional: if they fail, the card itself keeps working.
    try:
        coordinator = DeckCoordinator(hass, entry)
        await coordinator.async_refresh()
        entry.runtime_data = coordinator
        _ensure_devices(hass, entry, coordinator)
        await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    except Exception:  # noqa: BLE001
        _LOGGER.exception("Harmony Deck status entities could not be set up; the card keeps working")
        entry.runtime_data = None
    return True


def _ensure_devices(hass: HomeAssistant, entry: ConfigEntry, coordinator: DeckCoordinator) -> None:
    """Create the parent devices first (Harmony Deck, then the hubs), so the ones below can point to them by id."""
    from .devinfo import ensure_parent
    from .entity import deck_device, hub_device
    from .lock import lock_hubs

    version = hass.data.get(DOMAIN, {}).get("version")
    ensure_parent(hass, entry.entry_id, deck_device(entry, version))
    hubs = {h: i["title"] for h, i in lock_hubs(hass).items()}
    for hub_id, hub in ((coordinator.data or {}).get("hubs") or {}).items():
        hubs.setdefault(hub_id, hub.get("title") or "Harmony hub")
    for hub_id, title in hubs.items():
        ensure_parent(hass, entry.entry_id, hub_device(hass, entry, hub_id, title))


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Remove the card module from the frontend (the static path stays until restart)."""
    domain_data = hass.data.get(DOMAIN, {})
    unloaded = True
    if run := domain_data.get("runner"):
        run.async_stop_all()
    if lock := domain_data.pop("lock", None):
        lock.async_stop()
    if watch := domain_data.pop("direct_watch", None):
        watch.stop()
    if log := domain_data.pop("traffic", None):
        log.stop()
    if getattr(entry, "runtime_data", None):
        unloaded = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
        entry.runtime_data.clear_issues()
    if url := domain_data.pop(_VERSION_KEY, None):
        remove_extra_js_url(hass, url)
    return unloaded


async def _manifest_version(hass: HomeAssistant) -> str | None:
    from homeassistant.loader import async_get_integration

    integration = await async_get_integration(hass, DOMAIN)
    return str(integration.version) if integration.version else None
