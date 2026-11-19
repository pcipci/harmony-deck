"""0.15.1: capabilities and inputs remembered while a player is off, button "Read again", translated attributes."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from test_integration_ha import DOMAIN, REMOTE, _setup

COMP = Path(__file__).parent.parent / "custom_components" / "harmony_deck"


@pytest.fixture(autouse=True)
def _custom(enable_custom_integrations):
    yield


async def test_caps_and_sources_remembered_when_off(hass: HomeAssistant, hass_ws_client, hass_read_only_access_token):
    await _setup(hass)
    from custom_components.harmony_deck import direct

    er.async_get(hass).async_get_or_create("media_player", "webostv", "tv1", suggested_object_id="tv")
    on = {"supported_features": 4 | 8 | 128 | 256 | 2048, "volume_level": 0.2, "source_list": ["Netflix", "HDMI 1", "Live TV"], "source": "HDMI 1"}
    hass.states.async_set("media_player.tv", "off", {"supported_features": 128})            # off: hardly anything
    hass.data[DOMAIN]["settings"]["directDevices"] = {REMOTE: {"LG": {"entity": "media_player.tv", "volumeDirect": True}}}
    assert "volume_set" not in direct.known_caps(hass, "media_player.tv")

    hass.states.async_set("media_player.tv", "on", on)                                     # switched on: read and kept
    assert {"volume_set", "source_select"} <= set(direct.known_caps(hass, "media_player.tv"))
    assert direct.remember_sources(hass, "media_player.tv") == ["HDMI 1", "Netflix", "Live TV"]

    hass.states.async_set("media_player.tv", "off", {"supported_features": 128})           # off again: still known
    assert "volume_set" in direct.known_caps(hass, "media_player.tv")
    assert direct.remember_sources(hass, "media_player.tv")[0] == "HDMI 1"
    item = direct.overview(hass, {REMOTE: {"devices": {"LG": []}}})["hubs"][REMOTE]["LG"]
    assert "volume_set" in item["caps"] and "volume_set" not in item["capsLive"] and item["sourcesLive"] is False

    # button "Read again" (administrators): forgets the remembered ones and reads now
    admin = await hass_ws_client(hass)
    await admin.send_json_auto_id({"type": "harmony_deck/direct/rescan", "hub": REMOTE, "device": "LG"})
    res = (await admin.receive_json())["result"]
    assert "volume_set" not in res["caps"] and res["total"] == 10 and res["on"] is False
    hass.states.async_set("media_player.tv", "on", on)
    await admin.send_json_auto_id({"type": "harmony_deck/direct/rescan", "hub": REMOTE, "device": "LG"})
    res = (await admin.receive_json())["result"]
    assert "volume_set" in res["caps"] and res["on"] is True and res["sources"][0] == "HDMI 1"
    user = await hass_ws_client(hass, hass_read_only_access_token)
    await user.send_json_auto_id({"type": "harmony_deck/direct/rescan", "hub": REMOTE, "device": "LG"})
    assert (await user.receive_json())["error"]["code"] == "unauthorized"


def test_capability_attributes_translated():
    codes = ["state", "power_on", "power_off", "volume_set", "volume_read", "mute", "source_select", "source_read", "app_read", "app_list"]
    for f in ("strings.json", "translations/en.json", "translations/de.json", "translations/ru.json"):
        sa = json.loads((COMP / f).read_text())["entity"]["sensor"]["net_capabilities"]["state_attributes"]
        for c in codes:
            assert sa[f"cap_{c}"]["name"] and set(sa[f"cap_{c}"]["state"]) == {"yes", "no"}
