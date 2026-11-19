"""Direct devices: capabilities, state, cleaning, suggestions (pure)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "custom_components"))

from harmony_deck import directdev as dd  # noqa: E402
from harmony_deck.actionsmodel import clean_step  # noqa: E402
from harmony_deck.hub import device_meta  # noqa: E402

WEBOS = {"supported_features": 4 | 8 | 128 | 256 | 2048, "volume_level": 0.19, "is_volume_muted": False,
         "source": "Fire TV", "source_list": ["Blu-ray-Player", "Fire TV", "Live TV"]}


def test_caps_from_features_and_attributes():
    assert dd.media_caps("on", WEBOS) == list(dd.CAPS)
    assert dd.media_caps("off", {"supported_features": 128}) == ["state", "power_on"]
    assert dd.media_caps("unavailable", {}) == []
    assert dd.media_caps(None, WEBOS) == []
    assert dd.media_caps("on", {"supported_features": "x"}) == ["state"]


def test_snapshot():
    assert dd.snapshot("on", WEBOS) == {"on": True, "volume": 19, "muted": False, "source": "Fire TV"}
    assert dd.snapshot("standby", {})["on"] is False
    assert dd.snapshot("unavailable", {})["on"] is None
    assert dd.snapshot("playing", {"app_name": "Netflix", "volume_level": True})["app"] == "Netflix"
    assert dd.snapshot("playing", {"volume_level": True})["volume"] is None


def test_config_cleaned():
    raw = {"remote.wz": {"LG TV": {"entity": "media_player.tv", "volumeDirect": "yes"}, "Bad": {"entity": "light.x"}, "": {"entity": "media_player.a"}},
           "remote.empty": {}, 3: {}}
    assert dd.clean_config(raw) == {"remote.wz": {"LG TV": {"entity": "media_player.tv", "volumeDirect": False}}}
    assert dd.device_of(raw, "remote.wz", "LG TV")["entity"] == "media_player.tv"
    assert dd.device_of(raw, "remote.wz", "Bad") is None and dd.device_of(None, "x", "y") is None


def test_suggestion_needs_a_clear_winner():
    cands = [{"entity": "media_player.lg_webos_tv", "name": "LG webOS TV", "manufacturer": "LG", "model": "40LF6309"},
             {"entity": "media_player.kueche", "name": "Küche", "manufacturer": "Sonos", "model": "One"}]
    assert dd.suggest({"label": "LG TV", "manufacturer": "LG", "model": "40LF6309-ZA"}, cands) == "media_player.lg_webos_tv"
    assert dd.suggest({"label": "Yamaha Receiver", "manufacturer": "Yamaha"}, cands) is None
    two_lg = cands + [{"entity": "media_player.lg_schlafzimmer", "name": "Schlafzimmer", "manufacturer": "LG"}]
    assert dd.suggest({"label": "Fernseher", "manufacturer": "LG"}, two_lg) is None          # tie: the user picks
    assert dd.suggest({"label": "Fernseher Schlafzimmer", "manufacturer": "LG"}, two_lg) == "media_player.lg_schlafzimmer"
    assert dd.suggest({"label": "x"}, []) is None


def test_step_device_cleaned():
    assert clean_step({"type": "dev", "device": "LG TV", "op": "volume", "value": "130"}) == {"type": "dev", "device": "LG TV", "op": "volume", "value": 100}
    assert clean_step({"type": "dev", "device": "LG TV", "op": "on", "value": 3}) == {"type": "dev", "device": "LG TV", "op": "on"}
    assert clean_step({"type": "dev", "device": "LG TV", "op": "source", "value": " HDMI  2 "})["value"] == "HDMI 2"
    assert clean_step({"type": "dev", "device": "LG TV", "op": "mute", "value": "yes"}) is None
    assert clean_step({"type": "dev", "device": "LG TV", "op": "source", "value": ""}) is None
    assert clean_step({"type": "dev", "device": "", "op": "on"}) is None
    assert clean_step({"type": "dev", "device": "LG TV", "op": "explode"}) is None
    assert clean_step({"type": "dev", "device": "LG TV", "op": "volume", "value": float("inf")}) is None


def test_service_calls():
    assert dd.service_call("media_player.tv", "volume", 35) == ("media_player", "volume_set", {"entity_id": "media_player.tv", "volume_level": 0.35})
    assert dd.service_call("media_player.tv", "source", "Fire TV")[1] == "select_source"
    assert dd.service_call("media_player.tv", "off", None)[1] == "turn_off"


def test_device_meta_from_hub_config():
    config = {"device": [{"label": "LG TV", "manufacturer": "LG", "model": "40LF6309"}, {"label": "Fire TV"}, {"manufacturer": "x"}]}
    assert device_meta(config) == {"LG TV": {"manufacturer": "LG", "model": "40LF6309"}}


def test_kind_from_names_and_types():
    assert dd.kind_of("LG-Fernseher") == "tv" and dd.kind_of("Television") == "tv" and dd.kind_of("tv") == "tv"
    assert dd.kind_of("LG Blu-ray Player") == "player" and dd.kind_of("Yamaha-Verstärker") == "receiver"
    assert dd.kind_of("Amazon Fire TV Cube") is None          # streamer and TV words: not clear
    assert dd.kind_of("Panasonic") is None and dd.kind_of(None) is None


def test_room_and_kind_decide_between_two_tvs_and_a_player():
    cands = [{"entity": "media_player.tv_wz", "name": "LG webOS TV", "manufacturer": "LG", "kind": "tv", "area": "Wohnzimmer"},
             {"entity": "media_player.tv_sz", "name": "LG Smart TV", "manufacturer": "LG", "kind": "tv", "area": "Schlafzimmer"},
             {"entity": "media_player.bluray", "name": "Blu-ray", "manufacturer": "LG", "area": "Wohnzimmer"}]
    tv = {"label": "LG-Fernseher", "manufacturer": "LG"}
    assert dd.suggest(tv, cands) is None                                 # without the room: two equal TVs
    assert dd.suggest(tv, cands, "Wohnzimmer") == "media_player.tv_wz"
    assert dd.suggest(tv, cands, "Schlafzimmer") == "media_player.tv_sz"
    player = {"label": "LG Blu-ray Player", "manufacturer": "LG"}
    ranked = dd.ranked(player, cands, "Wohnzimmer")
    assert ranked[0][1] == "media_player.bluray" and all(s < 2 for s, e in ranked if e.startswith("media_player.tv"))
