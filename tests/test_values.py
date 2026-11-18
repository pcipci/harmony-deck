"""Values of Home Assistant steps and volume over infrared (pure)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "custom_components"))

from harmony_deck import irvolume  # noqa: E402
from harmony_deck.actionsmodel import clean_step  # noqa: E402
from harmony_deck.values import calls, clean_values, out_of_range, unsupported  # noqa: E402


def test_values_cleaned_per_kind():
    assert clean_values("light.k", {"brightness": 160, "kelvin": 2700, "color": [30, 100], "volume": 3}) == {"brightness": 100, "color": [30, 100]}
    assert clean_values("media_player.avr", {"volume": "35", "source": " HDMI  2 ", "mute": "yes"}) == {"volume": 35, "source": "HDMI 2"}
    assert clean_values("switch.x", {"brightness": 5}) == {}
    assert clean_values("climate.wz", {"temperature": 21.26}) == {"temperature": 21.3}
    assert clean_values("light.k", {"brightness": float("nan")}) == {}


def test_step_keeps_values_only_where_they_apply():
    assert clean_step({"type": "ha", "entity": "light.k", "op": "on", "values": {"brightness": 60}})["values"] == {"brightness": 60}
    assert "values" not in clean_step({"type": "ha", "entity": "light.k", "op": "toggle", "values": {"brightness": 60}})
    assert clean_step({"type": "ha", "entity": "number.x", "op": "on", "values": {"value": 3}})["op"] == "set"
    assert clean_step({"type": "ha", "entity": "media_player.avr", "op": "set", "values": {}}) is None   # nothing to set
    assert clean_step({"type": "irvol", "device": "LG", "level": "20"}) == {"type": "irvol", "device": "LG", "level": 20.0}
    assert clean_step({"type": "irvol", "device": "LG", "level": -1}) is None


def test_support_by_features():
    mp = {"supported_features": 4 | 2048}
    assert unsupported("media_player.avr", {"volume": 30, "source": "TV"}, mp) is None
    assert unsupported("media_player.avr", {"mute": True}, mp) == "mute"
    assert unsupported("light.k", {"brightness": 50}, {"supported_color_modes": ["onoff"]}) == "brightness"
    assert unsupported("light.k", {"kelvin": 2700}, {"supported_color_modes": ["hs"]}) == "kelvin"
    assert unsupported("light.k", {"color": [0, 100]}, {"supported_color_modes": ["xy", "color_temp"]}) is None
    assert unsupported("cover.r", {"position": 50}, {"supported_features": 3}) == "position"


def test_ranges_and_cap():
    assert out_of_range("media_player.avr", {"volume": 90}, {}, 80) == "volume above the limit (80 %)"
    assert "unknown source" in out_of_range("media_player.avr", {"source": "X"}, {"source_list": ["TV"]})
    assert out_of_range("media_player.avr", {"source": "X"}, {}) is None      # off: no list yet, the player decides
    assert out_of_range("climate.wz", {"temperature": 40}, {"min_temp": 7, "max_temp": 35}) == "temperature outside 7-35"


def test_service_calls():
    assert calls("light.k", "on", {"brightness": 60, "color": [30, 100]}) == [("light", "turn_on", {"entity_id": "light.k", "brightness_pct": 60, "hs_color": [30, 100]})]
    mp = calls("media_player.avr", "on", {"volume": 35, "source": "HDMI 2"})
    assert [c[1] for c in mp] == ["turn_on", "select_source", "volume_set"] and mp[2][2]["volume_level"] == 0.35
    assert [c[1] for c in calls("media_player.avr", "set", {"volume": 35})] == ["volume_set"]
    assert calls("cover.r", "on", {"position": 40}) == [("cover", "set_cover_position", {"entity_id": "cover.r", "position": 40})]
    assert calls("input_number.x", "set", {"value": 2}) == [("input_number", "set_value", {"entity_id": "input_number.x", "value": 2})]


def test_ir_volume_plan():
    cfg = irvolume.clean_device({"max": 100, "step": 1, "delay": 0.3})
    assert irvolume.plan(cfg, 20) == (110, 20)
    assert irvolume.plan(irvolume.clean_device({"max": 80, "step": 2}), 81) == (44, 40)   # level capped at max
    assert irvolume.chunks(25) == [10, 10, 5] and irvolume.chunks(0) == []
    assert irvolume.commands(["PowerOn", "VolumeDown", "VolumeUp", "Mute"]) == ("VolumeUp", "VolumeDown")
    assert irvolume.commands(["Volume Up", "Vol-"]) == ("Volume Up", "Vol-")
    assert irvolume.clean_device({"max": "x", "delay": 9}) == {"max": 100, "step": 1.0, "delay": 2.0}
    assert irvolume.device_config({"remote.wz": {"LG": {"max": 60}}}, "remote.wz", "LG")["max"] == 60
    assert irvolume.duration(cfg, 20) == 39.0
