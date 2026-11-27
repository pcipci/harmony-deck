"""0.27: settings of a linked LG Netcast TV as entities on its network device; the measurements are always there."""

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from test_integration_ha import DOMAIN, REMOTE, _setup
from test_v024 import _netcast, _seed


@pytest.fixture(autouse=True)
def _custom(enable_custom_integrations):
    yield


async def test_tech_entities(hass: HomeAssistant, hass_ws_client):
    await _setup(hass)
    from custom_components.harmony_deck import direct, screen

    _netcast(hass)
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    client = await hass_ws_client(hass)
    # a TV with values from 0.26 (stored by the card's old section "Technical")
    old = {"step_gap_ms": 150, "corrections": 2, "settle_s": 3.0, "picture": False, "picture_mode": "change",
           "picture_interval_s": 2.0, "picture_timeout_s": 10}
    links = {REMOTE: {"LG": {"entity": "media_player.tv", "tech": old}, "Box": {"entity": "media_player.other"}}}
    _seed(hass, links)
    await client.send_json_auto_id({"type": "harmony_deck/save_settings", "settings": {"directDevices": links}})
    assert (await client.receive_json())["success"]
    await hass.async_block_till_done()

    reg = er.async_get(hass)
    ids = {e.unique_id.split("::")[-1]: e for e in er.async_entries_for_config_entry(reg, entry.entry_id)
           if "::" in e.unique_id and e.unique_id.split("::")[-1] in screen.ALL_KEYS}
    assert set(ids) == set(screen.ALL_KEYS)                    # one TV: settings and measurements, nothing for the other player
    devices = {e.device_id for e in ids.values()}
    assert len(devices) == 1 and None not in devices         # all on the TV's network device
    assert all(ids[k].entity_category == "config" for k in screen.TECH_KEYS)
    st = lambda k: hass.states.get(ids[k].entity_id)  # noqa: E731
    assert float(st("step_gap_ms").state) == 150 and float(st("corrections").state) == 2   # old values carried over
    assert st("picture").state == "off" and st("picture_mode").state == "change"

    await hass.services.async_call("number", "set_value", {"entity_id": ids["step_gap_ms"].entity_id, "value": 200}, blocking=True)
    await hass.services.async_call("select", "select_option", {"entity_id": ids["picture_mode"].entity_id, "option": "poll"}, blocking=True)
    await hass.services.async_call("number", "set_value", {"entity_id": ids["picture_interval_s"].entity_id, "value": 3}, blocking=True)
    await hass.services.async_call("switch", "turn_on", {"entity_id": ids["picture"].entity_id}, blocking=True)
    await hass.async_block_till_done()
    tech = direct.config(hass)[REMOTE]["LG"]["tech"]
    assert tech == {**old, "step_gap_ms": 200, "picture_mode": "poll", "picture_interval_s": 3.0, "picture": True}
    assert direct.step_options(hass, "media_player.tv")["step_gap_ms"] == 200
    assert float(st("step_gap_ms").state) == 200 and st("picture").state == "on" and st("picture_mode").state == "poll"
    assert "media_player.tv" in hass.data[DOMAIN]["screen"].feeds
    assert hass.data[DOMAIN]["store"]          # kept
    assert direct.config(hass)[REMOTE]["Box"]["entity"] == "media_player.other" and "tech" not in direct.config(hass)[REMOTE]["Box"]       # other links untouched

    # a card that still holds the old values saves its links: the values of the entities stay
    await client.send_json_auto_id({"type": "harmony_deck/save_settings", "settings": {"directDevices": links}})
    assert (await client.receive_json())["success"]
    assert direct.config(hass)[REMOTE]["LG"]["tech"]["step_gap_ms"] == 200

    await hass.services.async_call("switch", "turn_off", {"entity_id": ids["picture"].entity_id}, blocking=True)
    await hass.async_block_till_done()
    assert not hass.data[DOMAIN]["screen"].feeds
    assert st("main_color").state == "unknown" and st("picture_available").state == "off"
