"""Target against actual state of direct devices (pure)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "custom_components"))

from harmony_deck.directdev import clean_device  # noqa: E402
from harmony_deck.mismatch import check, guess_source  # noqa: E402

SETUP = {
    "Fire TV": [{"device": "LG TV", "power": True, "input": "InputHdmi2"}, {"device": "Amazon Fire TV Cube", "power": True, "input": None},
                {"device": "Yamaha", "power": True, "input": None}],
    "Bluray": [{"device": "LG TV", "power": True, "input": "InputHdmi1"}, {"device": "LG Blu-ray Player", "power": True, "input": None}],
    "Radio": [{"device": "Yamaha", "power": True, "input": "Tuner"}, {"device": "Lamp", "power": False, "manual": True, "input": None}],
}
WEBOS = ["Blu-ray-Player", "Fire TV", "Live TV"]
LINKS = {"LG TV": {"entity": "media_player.tv"}, "Yamaha": {"entity": "media_player.avr"}, "Lamp": {"entity": "media_player.x"},
         "Sonos": {"entity": "media_player.sonos"}}


def test_guess_by_name_then_by_device():
    assert guess_source("InputHdmi2", ["HDMI 1", "HDMI 2", "TV"], []) == "HDMI 2"
    assert guess_source("InputHdmi2", WEBOS, ["Amazon Fire TV Cube", "Yamaha"]) == "Fire TV"
    assert guess_source("InputHdmi1", WEBOS, ["LG Blu-ray Player"]) == "Blu-ray-Player"
    assert guess_source("InputHdmi3", WEBOS, ["Yamaha"]) is None
    assert guess_source("Hdmi1", ["HDMI1", "hdmi 1"], []) is None                  # two hits: not clear


def test_power_against_activity():
    states = {"LG TV": {"on": False}, "Yamaha": {"on": True}, "Lamp": {"on": True}, "Sonos": {"on": True}}
    found = check("Radio", SETUP, LINKS, states)
    assert found == []                       # TV off is right for Radio; lamp manual; Sonos never switched by Harmony
    found = check("Fire TV", SETUP, LINKS, states)
    assert found == [{"device": "LG TV", "kind": "power", "want": True, "fix": "on"}]
    found = check("PowerOff", SETUP, LINKS, states)
    assert [(f["device"], f["fix"]) for f in found] == [("Yamaha", "off")]
    assert check(None, SETUP, LINKS, {"LG TV": {"on": True}})[0]["fix"] == "off"
    assert check("Fire TV", SETUP, LINKS, {"LG TV": {"on": None}}) == []    # unknown state: nothing said


def test_input_against_activity():
    on = {"LG TV": {"on": True, "source": "Blu-ray-Player"}, "Yamaha": {"on": True}}
    found = check("Fire TV", SETUP, LINKS, on, {"LG TV": WEBOS})
    assert found == [{"device": "LG TV", "kind": "input", "input": "InputHdmi2", "source": "Blu-ray-Player", "want": "Fire TV", "fix": "source", "value": "Fire TV"}]
    right = {**on, "LG TV": {"on": True, "source": "Fire TV"}}
    assert check("Fire TV", SETUP, LINKS, right, {"LG TV": WEBOS}) == []
    # the user's choice wins over the guess
    own = {**LINKS, "LG TV": {"entity": "media_player.tv", "inputs": {"InputHdmi2": "Live TV"}}}
    assert check("Fire TV", SETUP, own, right, {"LG TV": WEBOS})[0]["want"] == "Live TV"
    # no guess possible and nothing chosen: no item
    assert check("Fire TV", SETUP, LINKS, on, {"LG TV": ["A", "B"]}) == []


def test_inputs_kept_in_link():
    assert clean_device({"entity": "media_player.tv", "inputs": {"InputHdmi2": " Fire  TV ", "x": "", "": "y", "z": 3}}) == \
        {"entity": "media_player.tv", "volumeDirect": False, "inputs": {"InputHdmi2": "Fire TV"}}
