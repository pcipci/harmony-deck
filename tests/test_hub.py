"""Tests for the hub configuration parser (run: python -m pytest tests, or python tests/test_hub.py)."""

import importlib.util
import json
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "hub", Path(__file__).parents[1] / "custom_components" / "harmony_deck" / "hub.py"
)
hub = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(hub)


def _fn(name, device_id):
    return {"name": name, "action": json.dumps({"command": name, "type": "IRCommand", "deviceId": device_id})}


CONFIG = {
    "device": [
        {"id": "1", "label": "Amplifier", "controlGroup": [{"name": "Volume", "function": [_fn("VolumeUp", "1"), _fn("Mute", "1")]}]},
        {"id": "2", "label": "Player", "controlGroup": [
            {"name": "NavigationBasic", "function": [_fn("DirectionUp", "2"), _fn("OK", "2")]},
            {"name": "TransportBasic", "function": [_fn("Play", "2")]}]},
    ],
    "activity": [
        {"id": "-1", "label": "PowerOff"},
        {"id": "10", "label": "Movie", "controlGroup": [
            {"name": "Volume", "function": [_fn("VolumeUp", "1")]},
            {"name": "NavigationBasic", "function": [_fn("DirectionUp", "2")]},
            {"name": "TransportBasic", "function": [_fn("Play", "2")]},
            {"name": "Unknown", "function": [_fn("X", "2")]}]},
        {"id": "11", "label": "Empty"},
    ],
}


def test_device_commands():
    assert hub.device_commands(CONFIG) == {
        "Amplifier": ["VolumeUp", "Mute"],
        "Player": ["DirectionUp", "OK", "Play"],
    }


def test_activity_roles():
    roles = hub.activity_roles(CONFIG)
    assert roles["Movie"] == {"volume": "Amplifier", "nav": "Player", "transport": "Player"}
    assert roles["Empty"] == {}
    assert "PowerOff" not in roles


def test_bad_action_is_ignored():
    cfg = {"device": [{"id": "1", "label": "A"}], "activity": [{"label": "X", "controlGroup": [
        {"name": "Volume", "function": [{"name": "VolumeUp", "action": "not json"}]}]}]}
    assert hub.activity_roles(cfg) == {"X": {}}


def _load_status():
    """Load status.py as part of a stub package (the real __init__ needs Home Assistant)."""
    import sys
    import types

    pkg = types.ModuleType("hd_stub")
    pkg.__path__ = [str(Path(__file__).parents[1] / "custom_components" / "harmony_deck")]
    sys.modules["hd_stub"] = pkg
    import importlib

    return importlib.import_module("hd_stub.status")


def test_status_summary():
    status = _load_status()
    ok = status.summarize_hub("WZ", CONFIG)
    assert ok["activity_names"] == sorted(ok["activity_names"], key=str.casefold) and len(ok["activity_names"]) == ok["activities"] and len(ok["device_names"]) == ok["devices"]
    bad = status.summarize_hub("SZ", None)
    assert ok["readable"] and ok["activities"] == 2 and ok["devices"] == 2
    assert not bad["readable"] and bad["error"]
    total = status.summarize({"a": ok, "b": bad})
    assert total["entries"] == 2 and total["readable"] == 1
    print("ok test_status_summary")


def test_unreachable_fire_tvs():
    status = _load_status()

    class S:
        def __init__(self, state, name):
            self.state, self.name = state, name

    direct = {"hub1": {"entity": "media_player.a"}, "hub2": {"entity": "media_player.b"}, "hub3": {"entity": "media_player.gone"}, "hub4": {}}
    states = {"media_player.a": S("playing", "A"), "media_player.b": S("unavailable", "B")}
    assert status.unreachable_fire_tvs(direct, states) == {"media_player.b": "B", "media_player.gone": "media_player.gone"}
    assert status.unreachable_fire_tvs(None, {}) == {}
    print("ok test_unreachable_fire_tvs")


def test_conf_commands_and_merge():
    raw = {"Activities": {"-1": "PowerOff"}, "Devices": {"TV": {"commands": ["OK", "Mute"], "id": "1"}, "Bad": "x", "Empty": {"commands": []}}}
    conf = hub.conf_commands(raw)
    assert conf == {"TV": ["OK", "Mute"], "Empty": []}
    live = {"TV": ["Select", "Mute", "Extra"], "Amp": ["VolumeUp"], "Empty": ["A"]}
    merged = hub.merge_conf_commands(live, conf)
    assert merged["TV"] == ["OK", "Mute"]        # names HA accepts win
    assert merged["Amp"] == ["VolumeUp"]         # not in the file: live names
    assert merged["Empty"] == ["A"]              # empty list in the file: live names
    assert hub.merge_conf_commands({}, {"X": ["a"]}) == {"X": ["a"]}
    assert hub.conf_commands(None) == {} and hub.conf_commands({"Devices": []}) == {}


def test_match_conf():
    confs = {"/config/harmony_111.conf": {"TV": ["OK"], "Amp": []}, "/config/harmony_222.conf": {"Mac": [], "Box": []}}
    assert hub.match_conf({"Mac", "Box"}, confs, "111") == "/config/harmony_111.conf"   # by file name
    assert hub.match_conf({"Mac", "Box"}, confs, None) == "/config/harmony_222.conf"    # by overlap
    assert hub.match_conf({"Mac", "Other", "More", "Zip"}, confs, None) is None         # less than half in common
    assert hub.match_conf({"Nope"}, confs, "999") is None


def test_activity_setup_needs_explicit_power_on():
    cfg = {
        "device": [{"id": "1", "label": "TV"}, {"id": "2", "label": "Candles"}, {"id": "3", "label": "Amp"}, {"id": "4", "label": "Box"}],
        "activity": [{"id": "10", "label": "Movie", "fixit": {
            "1": {"id": "1", "Power": "On", "Input": "HDMI 1"},
            "2": {"id": "2", "isManualPower": True},
            "3": {"id": "3", "Power": "Off"},
            "4": {"id": "4"}}},
            {"id": "11", "label": "Candles", "fixit": {"2": {"id": "2", "isManualPower": True}}}],
    }
    setup = hub.activity_setup(cfg)
    assert [i["device"] for i in setup["Movie"] if i["power"]] == ["TV"]
    assert setup["Movie"][0]["input"] == "HDMI 1"
    assert [i["device"] for i in setup["Movie"] if i.get("manual")] == ["Candles"]   # reported separately, never as "on"
    assert all(not i["power"] for i in setup["Candles"])                              # nothing to switch on, still listed as known


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
