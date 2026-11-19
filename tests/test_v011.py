"""0.11: stricter suggestions, a device per network device, hub lists as text, a button per action."""

import asyncio

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import HomeAssistantError
from homeassistant.helpers import device_registry as dr, entity_registry as er
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.harmony_deck import directdev as dd
from custom_components.harmony_deck.sensor import short_list

from test_integration_ha import DOMAIN, REMOTE, _lock_entities, _setup


@pytest.fixture(autouse=True)
def _custom(enable_custom_integrations):
    yield


def test_maker_alone_is_no_suggestion():
    # An LG Blu-ray player and an LG player that only plays (AirPlay): same maker, nothing else.
    cands = [{"entity": "media_player.lg_airplay", "name": "Wohnzimmer AirPlay", "manufacturer": "LG", "caps": ["state", "volume_set", "mute"]}]
    assert dd.suggest({"label": "LG Blu-ray", "manufacturer": "LG"}, cands) is None
    # Same maker and same room: a suggestion, but not for a player that only plays.
    cands[0]["area"] = "Wohnzimmer"
    assert dd.suggest({"label": "LG Blu-ray", "manufacturer": "LG"}, cands, "Wohnzimmer") is None
    cands[0]["caps"].append("power_off")
    assert dd.suggest({"label": "LG Blu-ray", "manufacturer": "LG"}, cands, "Wohnzimmer") is None      # room + maker: not enough (0.12)
    cands[0]["kind"] = "player"
    assert dd.suggest({"label": "LG Blu-ray", "manufacturer": "LG"}, cands, "Wohnzimmer") == "media_player.lg_airplay"


def test_playback_targets():
    assert dd.playback_target("dlna_dmr") and dd.playback_target("music_assistant")
    assert dd.playback_target("apple_tv", "Küche AirPlay") and dd.playback_target(None, None, "media_player.tv_airplay")
    assert not dd.playback_target("webostv", "LG TV") and not dd.playback_target("lg_netcast")


def test_clean_suggest():
    assert dd.clean_suggest(None) == {"off": False, "never": {}}
    assert dd.clean_suggest({"off": True, "never": {REMOTE: ["LG", "", 3, "LG"], "x": "bad"}}) == {"off": True, "never": {REMOTE: ["LG"]}}


def test_short_list():
    assert short_list([], "de") == "-"
    assert short_list(["Bluray", "Games"], "de") == "Bluray, Games"
    names = [f"Activity number {n}" for n in range(20)]
    text = short_list(names, "de")
    assert text.endswith("und 14 weitere") and len(text) < 255
    assert short_list(names, "en-GB").endswith("and 14 more") and short_list(names, "ru").endswith("и ещё 14")


async def test_overview_respects_suggestion_settings(hass: HomeAssistant, hass_ws_client):
    await _setup(hass)
    er.async_get(hass).async_get_or_create("media_player", "dlna_dmr", "r1", suggested_object_id="renderer")
    hass.states.async_set("media_player.renderer", "on", {"supported_features": 4 | 8})
    hass.states.async_set("media_player.lg_tv", "on", {"supported_features": 4 | 256, "device_class": "tv"})
    hubs = {REMOTE: {"devices": {"LG TV": [], "Bluray": []}, "deviceMeta": {"LG TV": {"type": "Television"}}}}
    client = await hass_ws_client(hass)

    async def overview():
        from custom_components.harmony_deck import direct
        return direct.overview(hass, hubs)

    res = await overview()
    assert [c["entity"] for c in res["candidates"]] == ["media_player.lg_tv"]      # the DLNA renderer is hidden
    assert res["hubs"][REMOTE]["LG TV"]["suggest"] == "media_player.lg_tv" and res["suggestOff"] is False

    await client.send_json_auto_id({"type": "harmony_deck/save_settings", "settings": {"directSuggest": {"never": {REMOTE: ["LG TV"]}}}})
    assert (await client.receive_json())["success"]
    item = (await overview())["hubs"][REMOTE]["LG TV"]
    assert "suggest" not in item and item["noSuggest"] is True

    await client.send_json_auto_id({"type": "harmony_deck/save_settings", "settings": {"directSuggest": {"off": True}}})
    assert (await client.receive_json())["success"]
    res = await overview()
    assert res["suggestOff"] is True and "suggest" not in res["hubs"][REMOTE]["LG TV"]


async def test_hub_lists_are_text(hass: HomeAssistant, monkeypatch):
    entry, harmony, _ = await _setup(hass)
    coordinator = entry.runtime_data
    data = dict(coordinator.data or {})
    data["hubs"] = {harmony.entry_id: {"title": "Wohnzimmer", "readable": True, "activities": 2, "devices": 1,
                                       "activity_names": ["Fernsehen", "Spielen"], "device_names": ["LG TV"]}}
    coordinator.async_set_updated_data(data)
    await hass.async_block_till_done()
    ents = _lock_entities(hass, entry)
    act = hass.states.get(ents["hub_activities"].entity_id)
    assert act.state == "Fernsehen, Spielen" and act.attributes["count"] == 2 and act.attributes["names"] == ["Fernsehen", "Spielen"]
    assert ents["hub_activities"].unique_id == f"{entry.entry_id}_{harmony.entry_id}_hub_activities"     # same entity as before
    assert hass.states.get(ents["hub_devices"].entity_id).state == "LG TV"


async def test_button_per_action(hass: HomeAssistant, hass_ws_client):
    entry, harmony, _ = await _setup(hass)
    client = await hass_ws_client(hass)

    async def save(actions):
        await client.send_json_auto_id({"type": "harmony_deck/save_settings", "settings": {"actions": {REMOTE: actions}}})
        assert (await client.receive_json())["success"]
        await hass.async_block_till_done()

    def buttons():
        reg = er.async_get(hass)
        return {e.unique_id.rsplit("_action_", 1)[1]: e.entity_id for e in er.async_entries_for_config_entry(reg, entry.entry_id)
                if e.domain == "button" and "_action_" in e.unique_id}

    await save([{"id": "long", "name": "Lang", "icon": "mdi:timer", "steps": [{"type": "pause", "secs": 30}]},
                {"id": "kurz", "name": "Kurz", "steps": [{"type": "pause", "secs": 0.1}]}])
    found = buttons()
    assert set(found) == {"long", "kurz"}
    st = hass.states.get(found["long"])
    assert st.attributes["friendly_name"].endswith("Lang") and st.attributes["icon"] == "mdi:timer"
    actions = hass.states.get(_lock_entities(hass, entry)["actions"].entity_id)
    assert actions.state == "Lang, Kurz" and actions.attributes["count"] == 2
    assert actions.attributes["actions"][0] == {"id": "long", "name": "Lang", "steps": 1, "button": found["long"]}

    await hass.services.async_call("button", "press", {"entity_id": found["long"]}, blocking=True)
    seq = _lock_entities(hass, entry)["sequence"].entity_id
    assert hass.states.get(seq).state == "running"
    with pytest.raises(HomeAssistantError):
        await hass.services.async_call("button", "press", {"entity_id": found["kurz"]}, blocking=True)
    await hass.services.async_call(DOMAIN, "stop_action", {"hub": REMOTE}, blocking=True)
    await asyncio.sleep(0)
    await hass.async_block_till_done()

    await save([{"id": "kurz", "name": "Ganz kurz", "steps": [{"type": "pause", "secs": 0.1}]}])
    found = buttons()
    assert set(found) == {"kurz"}
    assert hass.states.get(found["kurz"]).attributes["friendly_name"].endswith("Ganz kurz")       # renamed, same entity
    assert hass.states.get(_lock_entities(hass, entry)["actions"].entity_id).state == "Ganz kurz"


async def test_device_per_network_device(hass: HomeAssistant, hass_ws_client, monkeypatch, freezer):
    from custom_components.harmony_deck import direct_watch

    monkeypatch.setattr(direct_watch, "QUIET", 0.01)
    entry, harmony, _ = await _setup(hass)
    er.async_get(hass).async_get_or_create("media_player", "lg_netcast", "tv1", suggested_object_id="tv")
    hass.states.async_set("media_player.tv", "on", {"supported_features": 4 | 8 | 256, "volume_level": 0.2, "source": "HDMI 1"})
    client = await hass_ws_client(hass)

    async def link(devices):
        await client.send_json_auto_id({"type": "harmony_deck/save_settings", "settings": {"directDevices": devices}})
        assert (await client.receive_json())["success"]
        await hass.async_block_till_done()
        freezer.tick(1)
        async_fire_time_changed(hass)
        await hass.async_block_till_done()

    await link({REMOTE: {"LG": {"entity": "media_player.tv"}}})
    devs = dr.async_get(hass)
    dev = devs.async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_net_{REMOTE}_LG")})
    assert dev is not None and dev.name == "LG (Network)"
    hub_dev = devs.async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_{harmony.entry_id}")})
    assert dev.via_device_id == hub_dev.id
    ents = {e.translation_key: e.entity_id for e in er.async_entries_for_device(er.async_get(hass), dev.id)}
    assert set(ents) == {"net_platform", "net_capabilities", "net_state"}
    assert hass.states.get(ents["net_platform"]).state == "lg_netcast"
    caps = hass.states.get(ents["net_capabilities"])
    assert caps.state == "6 of 10" and caps.attributes["set volume"] == "yes" and caps.attributes["pick source"] == "no"
    state = hass.states.get(ents["net_state"])
    assert state.state == "on" and state.attributes["volume"] == 20 and state.attributes["source"] == "HDMI 1"

    await link({})
    assert devs.async_get_device(identifiers={(DOMAIN, f"{entry.entry_id}_net_{REMOTE}_LG")}) is None
    assert not [e for e in er.async_entries_for_config_entry(er.async_get(hass), entry.entry_id) if "_net_" in e.unique_id]
