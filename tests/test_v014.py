"""0.14: volume slider of the running activity (server decides device, limit, rights; allowed while locked)."""

from __future__ import annotations

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er

from custom_components.harmony_deck import directdev as dd
from test_integration_ha import DOMAIN, REMOTE, _setup


@pytest.fixture(autouse=True)
def _custom(enable_custom_integrations):
    yield


ACTS = {"TV": {"volume": "LG", "nav": "Box"}, "Radio": {"volume": "Amp"}}


def test_slider_device():
    links = {"LG": {"entity": "media_player.tv", "volumeDirect": True}, "Amp": {"entity": "media_player.amp", "volumeDirect": False}}
    assert dd.slider_device(ACTS, "TV", links) == "LG"
    assert dd.slider_device(ACTS, "Radio", links) is None          # switch "Set volume directly" off
    assert dd.slider_device(ACTS, "PowerOff", links) is None
    assert dd.slider_device(ACTS, None, links) is None
    assert dd.slider_device({"X": {}}, "X", links) is None         # activity without volume device
    assert dd.slider_device(ACTS, "TV", {}) is None                # not linked
    assert "volume_on_release" in dd.quirks("lg_netcast", []) and "volume_on_release" not in dd.quirks("webostv", [])


async def test_volume_slider_ws(hass: HomeAssistant, hass_ws_client, hass_read_only_access_token, monkeypatch):
    await _setup(hass)
    from custom_components.harmony_deck import directws

    async def confs(_hass):
        return {}

    monkeypatch.setattr(directws, "load_confs", confs)
    monkeypatch.setattr(directws, "collect_hubs", lambda _h, _c=None: ({REMOTE: {"activities": ACTS}}, {}))
    sent = []

    async def rec(call):
        sent.append(call.data["volume_level"])

    hass.services.async_register("media_player", "volume_set", rec)
    er.async_get(hass).async_get_or_create("media_player", "webostv", "tv1", suggested_object_id="tv")
    hass.states.async_set("media_player.tv", "on", {"supported_features": 4 | 8 | 2048, "volume_level": 0.2})
    hass.states.async_set(REMOTE, "on", {"current_activity": "TV", "activity_list": ["TV", "Radio"]})
    settings = hass.data[DOMAIN]["settings"]
    settings["directDevices"] = {REMOTE: {"LG": {"entity": "media_player.tv", "volumeDirect": True}}}
    settings["volumeCap"] = 50

    user = await hass_ws_client(hass, hass_read_only_access_token)     # not an administrator

    async def call(**kw):
        await user.send_json_auto_id(kw)
        return await user.receive_json()

    res = await call(type="harmony_deck/direct/sliders")
    one = {"device": "LG", "entity": "media_player.tv", "cap": 50, "release": False}
    assert res["result"][REMOTE] == {"activity": {"activity": "TV", **one}, "devices": {"LG": one}}
    assert (await call(type="harmony_deck/direct/volume", hub=REMOTE, value=30))["success"]
    assert (await call(type="harmony_deck/direct/volume", hub=REMOTE, value=99))["result"]["value"] == 50   # held to the limit
    assert sent == [0.3, 0.5]

    # allowed while the lock is on (like the volume keys)
    admin = await hass_ws_client(hass)
    await admin.send_json_auto_id({"type": "harmony_deck/lock/set", "hub": REMOTE, "mode": "always"})
    await admin.receive_json()
    assert (await call(type="harmony_deck/direct/volume", hub=REMOTE, value=10))["success"]

    # another activity, or the switch off: refused, the card keeps +/-
    hass.states.async_set(REMOTE, "on", {"current_activity": "Radio"})
    assert (await call(type="harmony_deck/direct/volume", hub=REMOTE, value=10))["error"]["code"] == "invalid"
    hass.states.async_set(REMOTE, "on", {"current_activity": "TV"})
    settings["directDevices"][REMOTE]["LG"]["volumeDirect"] = False
    assert (await call(type="harmony_deck/direct/volume", hub=REMOTE, value=10))["error"]["code"] == "invalid"
    assert (await call(type="harmony_deck/direct/sliders"))["result"][REMOTE] == {"activity": None, "devices": {}}
    assert sent == [0.3, 0.5, 0.1]


async def test_volume_slider_device_view(hass: HomeAssistant, hass_ws_client, hass_read_only_access_token, monkeypatch):
    """Device view (0.15): any linked device with "Set volume directly" gets a slider, whatever activity runs."""
    await _setup(hass)
    from custom_components.harmony_deck import directws

    async def confs(_hass):
        return {}

    monkeypatch.setattr(directws, "load_confs", confs)
    monkeypatch.setattr(directws, "collect_hubs", lambda _h, _c=None: ({REMOTE: {"activities": ACTS}}, {}))
    sent = []

    async def rec(call):
        sent.append(call.data["volume_level"])

    hass.services.async_register("media_player", "volume_set", rec)
    er.async_get(hass).async_get_or_create("media_player", "webostv", "tv1", suggested_object_id="tv")
    er.async_get(hass).async_get_or_create("media_player", "webostv", "amp1", suggested_object_id="amp")
    for e in ("tv", "amp"):
        hass.states.async_set(f"media_player.{e}", "on", {"supported_features": 4 | 8 | 2048, "volume_level": 0.2})
    hass.states.async_set(REMOTE, "on", {"current_activity": "Radio", "activity_list": ["TV", "Radio"]})
    settings = hass.data[DOMAIN]["settings"]
    settings["directDevices"] = {REMOTE: {"LG": {"entity": "media_player.tv", "volumeDirect": True},
                                          "Amp": {"entity": "media_player.amp", "volumeDirect": False}}}
    settings["volumeCap"] = 40
    user = await hass_ws_client(hass, hass_read_only_access_token)

    async def call(**kw):
        await user.send_json_auto_id(kw)
        return await user.receive_json()

    res = (await call(type="harmony_deck/direct/sliders"))["result"][REMOTE]
    assert list(res["devices"]) == ["LG"] and res["activity"] is None          # Amp: switch off
    assert (await call(type="harmony_deck/direct/volume", hub=REMOTE, device="LG", value=90))["result"]["value"] == 40
    assert (await call(type="harmony_deck/direct/volume", hub=REMOTE, device="Amp", value=10))["error"]["code"] == "invalid"
    assert (await call(type="harmony_deck/direct/volume", hub=REMOTE, device="Nope", value=10))["error"]["code"] == "invalid"
    admin = await hass_ws_client(hass)
    await admin.send_json_auto_id({"type": "harmony_deck/lock/set", "hub": REMOTE, "mode": "always"})
    await admin.receive_json()
    assert (await call(type="harmony_deck/direct/volume", hub=REMOTE, device="LG", value=10))["success"]   # like the keys
    assert sent == [0.4, 0.1]
