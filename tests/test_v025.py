"""0.25: one media player per activity (chosen by the user), media bar control, jumps by seeking or Fire TV keys."""

from datetime import timedelta

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.util import dt as dt_util

from custom_components.harmony_deck import media

from test_integration_ha import DOMAIN, REMOTE, _setup


@pytest.fixture(autouse=True)
def _custom(enable_custom_integrations):
    yield


FULL = media.F_PAUSE | media.F_SEEK | media.F_STOP | media.F_PLAY


def test_clean_players():
    raw = {REMOTE: {"Chromecast": {"entity": "media_player.cc", "bar": False}, "Fire TV": "media_player.fire",
                    "Bad": {"entity": "light.x"}, "": {"entity": "media_player.y"}, "X" * 200: "media_player.z"},
           "remote.empty": {}, 5: {"A": "media_player.a"}}
    assert media.clean_players(raw) == {REMOTE: {"Chromecast": {"entity": "media_player.cc", "bar": False},
                                                 "Fire TV": {"entity": "media_player.fire", "bar": True}}}
    assert media.clean_players("x") == {}


def test_jump_plan_seek_and_adb():
    now = dt_util.utcnow()

    class S:
        def __init__(self, state, **attrs):
            self.state, self.attributes = state, attrs

    cast = S("playing", supported_features=FULL, media_position=100, media_duration=200,
             media_position_updated_at=(now - timedelta(seconds=20)).isoformat())
    kind, target = media.jump_plan(cast, "cast", 30)
    assert kind == "seek" and 149 <= target <= 151                 # counted on: 100 + 20 s + 30 s
    assert media.jump_plan(cast, "cast", -500) == ("seek", 0.0)
    assert media.jump_plan(cast, "cast", 500)[1] == 199.0          # not past the end
    fire = S("playing", supported_features=media.F_PAUSE | media.F_PLAY)
    assert media.jump_plan(fire, "androidtv", 30) == ("adb", "input keyevent 90 90 90")
    assert media.jump_plan(fire, "androidtv", -10) == ("adb", "input keyevent 89")
    assert media.jump_plan(fire, "webostv", 10) is None


async def test_media_control(hass: HomeAssistant, hass_ws_client, hass_read_only_access_token):
    _entry, _harmony, calls = await _setup(hass)
    sent = []

    async def rec(call):
        sent.append((call.service, dict(call.data)))

    for svc in ("media_play", "media_pause", "media_stop", "media_seek", "media_play_pause"):
        hass.services.async_register("media_player", svc, rec)
    er.async_get(hass).async_get_or_create("media_player", "cast", "cc1", suggested_object_id="cc")
    er.async_get(hass).async_get_or_create("media_player", "androidtv", "ft1", suggested_object_id="ft")
    hass.states.async_set("media_player.cc", "playing", {"supported_features": FULL, "media_position": 60, "media_duration": 600,
                                                         "media_position_updated_at": dt_util.utcnow().isoformat()})
    hass.states.async_set("media_player.ft", "playing", {"supported_features": media.F_PAUSE | media.F_PLAY})
    hass.states.async_set(REMOTE, "on", {"current_activity": "Chromecast", "activity_list": ["PowerOff", "Chromecast", "Fire TV"]})

    admin = await hass_ws_client(hass)
    await admin.send_json_auto_id({"type": "harmony_deck/save_settings", "settings": {"activityPlayers": {
        REMOTE: {"Chromecast": {"entity": "media_player.cc"}, "Fire TV": {"entity": "media_player.ft", "bar": False}, "Bad": "switch.x"}}}})
    res = await admin.receive_json()
    assert res["success"]
    assert res["result"]["settings"]["activityPlayers"] == {REMOTE: {"Chromecast": {"entity": "media_player.cc", "bar": True},
                                                                      "Fire TV": {"entity": "media_player.ft", "bar": False}}}
    assert hass.data[DOMAIN]["settings"]["activityPlayers"][REMOTE]["Chromecast"]["entity"] == "media_player.cc"   # global, not per profile

    user = await hass_ws_client(hass, hass_read_only_access_token)     # every user, like the volume slider

    async def call(**kw):
        await user.send_json_auto_id({"type": "harmony_deck/media/control", "hub": REMOTE, **kw})
        return await user.receive_json()

    assert (await call(action="pause"))["success"]
    assert (await call(action="play"))["success"]
    assert (await call(action="seek_to", value=300))["success"]
    assert (await call(action="seek_by", value=-10))["success"]
    assert [s for s, _ in sent] == ["media_pause", "media_play", "media_seek", "media_seek"]
    assert sent[2][1]["seek_position"] == 300 and 49 <= sent[3][1]["seek_position"] <= 52

    # Fire TV activity: no seeking, so a jump goes as fast-forward key presses over ADB; stop is not offered by this player
    hass.states.async_set(REMOTE, "on", {"current_activity": "Fire TV"})
    assert (await call(action="seek_by", value=30))["success"]
    assert ("androidtv", "adb_command", {"entity_id": "media_player.ft", "command": "input keyevent 90 90 90"}) in calls
    assert not (await call(action="stop"))["success"]

    # no player for the running activity, or nothing runs: refused
    hass.states.async_set(REMOTE, "on", {"current_activity": "SAT"})
    assert not (await call(action="play"))["success"]
    hass.states.async_set(REMOTE, "off", {"current_activity": "PowerOff"})
    assert not (await call(action="play"))["success"]
