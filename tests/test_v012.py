"""0.12: Fire TV as a device of the network control, stricter room rule, inputs among channels, device page controls."""

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

from custom_components.harmony_deck import directdev as dd

from test_integration_ha import DOMAIN, REMOTE, _setup


@pytest.fixture(autouse=True)
def _custom(enable_custom_integrations):
    yield


def test_room_alone_is_no_suggestion():
    cands = [{"entity": "media_player.wohnzimmer", "name": "Wohnzimmer", "area": "Wohnzimmer", "caps": ["state", "power_on", "volume_set"]}]
    for label, meta in (("LG", {"manufacturer": "LG", "type": "Television"}), ("DVD-Player", {}), ("Yamaha", {"manufacturer": "Yamaha"})):
        assert dd.suggest({"label": label, **meta}, cands, "Wohnzimmer") is None
    # a player named after its room never stands for one device, not even with a fitting kind
    cands[0]["kind"] = "tv"
    assert dd.suggest({"label": "LG", "type": "Television"}, cands, "Wohnzimmer") is None
    # a real TV in the room with the kind: suggested
    tv = {"entity": "media_player.lg_tv", "name": "LG Fernseher", "area": "Wohnzimmer", "kind": "tv", "caps": ["state", "power_off"]}
    assert dd.suggest({"label": "LG", "type": "Television"}, cands + [tv], "Wohnzimmer") == "media_player.lg_tv"
    assert dd.room_player({"name": "Wohnzimmer"}, "Wohnzimmer") and not dd.room_player({"name": "Wohnzimmer TV"}, "Wohnzimmer")


def test_inputs_among_channels():
    channels = ["Das Erste HD", "ZDF HD", "SAT.1", "ProSieben", "HDMI1", "HDMI 2", "AV", "RTL", "Component"]
    assert dd.usable_sources("lg_netcast", channels) == ["HDMI1", "HDMI 2", "AV", "Component"]
    assert dd.usable_sources("lg_netcast", ["Das Erste", "ZDF"]) == []
    assert dd.usable_sources("webostv", channels) == channels            # a real source list stays as it is
    assert dd.input_like("Eingang HDMI2") and dd.input_like("InputHdmi3") and not dd.input_like("ProSieben")


def test_link_fire_tvs():
    direct = {REMOTE: {"entity": "media_player.fire", "device": "Amazon Fire TV Cube", "pkgs": {}},
              "remote.sz": {"entity": "media_player.fire_sz", "device": ""},          # no device chosen: nothing to link
              "remote.x": {"device": "Fire"}}                                          # no entity
    out = dd.link_fire_tvs(direct, {REMOTE: {"LG": {"entity": "media_player.tv"}}})
    assert out == {REMOTE: {"LG": {"entity": "media_player.tv", "volumeDirect": False},
                            "Amazon Fire TV Cube": {"entity": "media_player.fire", "volumeDirect": False}}}
    # a device linked already keeps its link
    keep = dd.link_fire_tvs(direct, {REMOTE: {"Amazon Fire TV Cube": {"entity": "media_player.other"}}})
    assert keep[REMOTE]["Amazon Fire TV Cube"]["entity"] == "media_player.other"


async def _fire_setup(hass: HomeAssistant, link: bool, hass_storage):
    hass_storage["harmony_deck.settings"] = {"version": 1, "key": "harmony_deck.settings", "data": {
        "global": {"direct": {REMOTE: {"entity": "media_player.fire", "device": "Amazon Fire TV Cube"} if link else {"entity": "media_player.fire"}}},
        "profiles": {"Standard": {}}, "assign": {}}}
    adb = MockConfigEntry(domain="androidtv", title="Fire TV Cube", entry_id="adb1")
    adb.add_to_hass(hass)
    er.async_get(hass).async_get_or_create("media_player", "androidtv", "fire1", config_entry=adb, suggested_object_id="fire")
    hass.states.async_set("media_player.fire", "playing", {"supported_features": 4 | 8 | 128 | 256 | 2048, "app_id": "com.netflix.ninja",
                                                           "app_name": "Netflix", "source_list": ["Netflix", "Prime Video"]})
    return await _setup(hass)


async def test_fire_tv_becomes_network_device(hass: HomeAssistant, hass_ws_client, hass_storage, monkeypatch, freezer):
    from custom_components.harmony_deck import direct_watch

    monkeypatch.setattr(direct_watch, "QUIET", 0.01)
    entry, harmony, _ = await _fire_setup(hass, True, hass_storage)
    settings = hass.data[DOMAIN]["settings"]
    assert settings["directDevices"] == {REMOTE: {"Amazon Fire TV Cube": {"entity": "media_player.fire", "volumeDirect": False}}}
    assert settings["fireLinked"] is True
    assert settings["direct"][REMOTE]["entity"] == "media_player.fire"            # the Fire TV settings stay where they are

    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "harmony_deck/direct/overview"})
    item = (await client.receive_json())["result"]["hubs"].get(REMOTE, {}).get("Amazon Fire TV Cube")
    if item is not None:          # only when the hub configuration is readable in the test
        assert item["page"] == "firetv" and "app_read" in item["caps"]
    from custom_components.harmony_deck import direct

    assert {"app_read", "app_list"} <= set(direct.caps(hass, "media_player.fire"))
    assert direct.snapshot(hass, "media_player.fire")["app"] == "Netflix"

    # one device: the ADB entity moves onto "Amazon Fire TV Cube (Network)", the "(ADB)" device goes
    entry.runtime_data.async_set_updated_data(entry.runtime_data.data)
    direct_watch.watcher(hass).refresh()
    await hass.async_block_till_done()
    freezer.tick(1)
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    devs, ents = dr.async_get(hass), er.async_get(hass)
    net = devs.async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_net_{REMOTE}_Amazon Fire TV Cube")})
    assert net is not None
    keys = {e.translation_key for e in er.async_entries_for_device(ents, net.id)}
    assert {"adb_reachable", "net_platform", "net_capabilities", "net_state"} <= keys
    assert devs.async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_adb_adb1")}) is None

    # the lock names the device whose apps it watches
    assert hass.data[DOMAIN]["lock"].snapshot(harmony.entry_id)["app_device"] == "Amazon Fire TV Cube"


async def test_fire_tv_without_device_stays_apart(hass: HomeAssistant, hass_storage):
    entry, harmony, _ = await _fire_setup(hass, False, hass_storage)
    assert not hass.data[DOMAIN]["settings"].get("directDevices")
    assert hass.data[DOMAIN]["lock"].snapshot(harmony.entry_id)["app_device"] is None
    assert dr.async_get(hass).async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_adb_adb1")}) is not None


async def test_device_page_controls(hass: HomeAssistant, hass_ws_client, hass_read_only_access_token):
    await _setup(hass)
    sent = []

    async def rec(call):
        sent.append((call.service, {k: v for k, v in call.data.items() if k != "entity_id"}))

    for srv in ("volume_set", "volume_mute", "select_source"):
        hass.services.async_register("media_player", srv, rec)
    er.async_get(hass).async_get_or_create("media_player", "lg_netcast", "tv1", suggested_object_id="tv")
    hass.states.async_set("media_player.tv", "on", {"supported_features": 4 | 8 | 2048, "volume_level": 0.2, "is_volume_muted": False,
                                                    "source_list": ["ZDF HD", "HDMI1", "Das Erste"], "source": "ZDF HD"})
    hass.data[DOMAIN]["settings"]["directDevices"] = {REMOTE: {"LG": {"entity": "media_player.tv"}}}
    hass.data[DOMAIN]["settings"]["volumeCap"] = 60
    client = await hass_ws_client(hass)

    async def fix(**kw):
        await client.send_json_auto_id({"type": "harmony_deck/direct/fix", "hub": REMOTE, "device": "LG", **kw})
        return await client.receive_json()

    assert (await fix(op="volume", value=95))["success"]
    assert (await fix(op="mute", value=True))["success"]
    assert sent == [("volume_set", {"volume_level": 0.6}), ("volume_mute", {"is_volume_muted": True})]   # held to the limit

    from custom_components.harmony_deck import direct

    item = direct.overview(hass, {REMOTE: {"devices": {"LG": []}}})["hubs"][REMOTE]["LG"]
    assert item["page"] == "generic" and item["sources"] == ["HDMI1"]          # only the input among the channels

    other = await hass_ws_client(hass, hass_read_only_access_token)
    await other.send_json_auto_id({"type": "harmony_deck/direct/fix", "hub": REMOTE, "device": "LG", "op": "volume", "value": 10})
    assert (await other.receive_json())["error"]["code"] == "unauthorized"


def test_source_cache_remembers_list_while_player_is_off():
    """A player that is off publishes no source list: the last one seen is shown (and input-like names come first)."""
    from types import SimpleNamespace
    from custom_components.harmony_deck import direct
    hass = SimpleNamespace(data={})
    live = ["Netflix", "HDMI 1", "Live TV", "HDMI 2"]
    assert direct._remember(hass, "media_player.tv", live) == live
    assert direct._remember(hass, "media_player.tv", []) == live
    assert direct._remember(hass, "media_player.other", []) == []
    assert sorted(live, key=lambda x: not direct.directdev.input_like(x))[:2] == ["HDMI 1", "HDMI 2"]
