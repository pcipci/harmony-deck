"""0.13: Fire TV settings on the link of the Fire TV; lock, repairs and app names read them from there."""

from __future__ import annotations

import pytest
from homeassistant.core import HomeAssistant

from custom_components.harmony_deck import directdev as dd
from test_integration_ha import DOMAIN, REMOTE
from test_v012 import _fire_setup



@pytest.fixture(autouse=True)
def _custom(enable_custom_integrations):
    yield


FIRE = {"entity": "media_player.fire", "device": "Cube", "model": "cube", "pkgs": {"Netflix": "com.netflix.ninja"},
        "customApps": [{"name": "Kodi", "pkg": "org.xbmc.kodi"}], "hiddenApps": ["Joyn"], "inActivities": True, "lockOffline": True}


def test_move_fire_settings_onto_link():
    rest, links = dd.move_fire_settings({REMOTE: FIRE}, {REMOTE: {"Cube": {"entity": "media_player.fire"}}})
    assert rest == {}
    fire = links[REMOTE]["Cube"]["fire"]
    assert fire["pkgs"] == {"Netflix": "com.netflix.ninja"} and fire["lockOffline"] is True
    assert "entity" not in fire and "device" not in fire           # those come from the link itself
    # read back in the old shape
    assert dd.fire_configs(rest, links)[REMOTE] == {**{k: v for k, v in FIRE.items()}, "entity": "media_player.fire", "device": "Cube"}


def test_move_fire_settings_keeps_what_cannot_move():
    # device linked to another player, or not linked at all: settings stay in "direct" and still work
    rest, links = dd.move_fire_settings({REMOTE: FIRE, "remote.sz": {**FIRE, "device": "Other"}},
                                        {REMOTE: {"Cube": {"entity": "media_player.other"}}})
    assert set(rest) == {REMOTE, "remote.sz"} and "fire" not in links[REMOTE]["Cube"]
    assert dd.fire_configs(rest, links)[REMOTE]["entity"] == "media_player.fire"
    # running twice changes nothing
    again = dd.move_fire_settings(*dd.move_fire_settings({REMOTE: FIRE}, {REMOTE: {"Cube": {"entity": "media_player.fire"}}}))
    assert again[1][REMOTE]["Cube"]["fire"]["model"] == "cube"


def test_clean_fire_drops_unknown_and_oversized():
    assert dd.clean_fire({"model": "cube", "evil": 1, "pkgs": {"a": "b"}}) == {"model": "cube", "pkgs": {"a": "b"}}
    assert dd.clean_fire({"customApps": [{"name": "x" * 100, "pkg": "y"}] * 500}) is None
    assert dd.clean_fire("nope") is None
    # a link keeps its Fire TV settings through cleaning (the card saves links with them)
    assert dd.clean_config({REMOTE: {"Cube": {"entity": "media_player.fire", "fire": {"model": "stick"}}}})[REMOTE]["Cube"]["fire"] == {"model": "stick"}


def test_link_wins_over_old_entry():
    links = {REMOTE: {"Cube": {"entity": "media_player.new", "fire": {"model": "stick"}}}}
    out = dd.fire_configs({REMOTE: {"entity": "media_player.old"}}, links)
    assert out[REMOTE] == {"model": "stick", "entity": "media_player.new", "device": "Cube"}


async def test_lock_and_app_names_read_the_link(hass: HomeAssistant, hass_storage):
    entry, harmony, _ = await _fire_setup(hass, True, hass_storage)
    settings = hass.data[DOMAIN]["settings"]
    link = settings["directDevices"][REMOTE]["Amazon Fire TV Cube"]
    link["fire"] = {"pkgs": {"Netflix": "com.netflix.ninja"}, "customApps": [{"name": "Kodi", "pkg": "org.xbmc.kodi"}]}
    manager = hass.data[DOMAIN]["lock"]
    assert manager.fire_entity(harmony.entry_id) == "media_player.fire"
    from custom_components.harmony_deck.lockws import _app_names

    assert _app_names(manager._direct(harmony.entry_id)) == {"com.netflix.ninja": "Netflix", "org.xbmc.kodi": "Kodi"}
    # a linked Android TV player whose page was never saved still counts as the hub's Fire TV
    del link["fire"]
    from custom_components.harmony_deck import direct

    assert direct.fire_all(hass)[REMOTE] == {"entity": "media_player.fire", "device": "Amazon Fire TV Cube"}
    assert manager.fire_entity(harmony.entry_id) == "media_player.fire"
