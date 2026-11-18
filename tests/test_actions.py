"""Actions: data model (pure) and step checks."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "custom_components"))

from harmony_deck.actionsmodel import MAX_PAUSE, MAX_STEPS, clean_action, clean_actions, find_action  # noqa: E402
from harmony_deck.profiles import migrate  # noqa: E402

HUB = "remote.wz"


def test_old_action_becomes_one_step():
    a = clean_action({"id": "x1", "name": "Kerzen", "entity": "light.kerzen", "op": "toggle", "icon": "mdi:candle", "scope": ""})
    assert a["steps"] == [{"type": "ha", "entity": "light.kerzen", "op": "toggle"}]
    assert a["tile"] is False and a["icon"] == "mdi:candle"
    assert clean_action({"name": "Film", "entity": "scene.film", "op": "activate"})["steps"][0]["op"] == "run"


def test_steps_are_cleaned():
    a = clean_action({"id": "s", "name": "DVD", "tile": 1, "steps": [
        {"type": "key", "device": "Panasonic", "command": "Input", "repeat": 99, "label": "  HDMI   1 "},
        {"type": "pause", "secs": 9999},
        {"type": "pause", "secs": 0},
        {"type": "ha", "entity": "not an entity"},
        {"type": "unknown"},
        "junk",
    ]})
    assert a["tile"] is True
    assert a["steps"] == [
        {"type": "key", "device": "Panasonic", "command": "Input", "repeat": 10, "label": "HDMI 1"},
        {"type": "pause", "secs": MAX_PAUSE},
    ]
    many = clean_action({"name": "n", "steps": [{"type": "pause", "secs": 1}] * 80})
    assert len(many["steps"]) == MAX_STEPS


def test_invalid_actions_dropped_and_ids_unique():
    out = clean_actions({HUB: [{"id": "a", "name": "A", "steps": [{"type": "pause", "secs": 1}]},
                               {"id": "a", "name": "B", "steps": [{"type": "pause", "secs": 1}]},
                               {"name": "", "steps": [{"type": "pause", "secs": 1}]},
                               {"name": "no steps", "steps": []}],
                         "remote.empty": [], 5: []})
    assert [a["id"] for a in out[HUB]] == ["a", "ax"] and list(out) == [HUB]


def test_find_by_id_or_name():
    acts = clean_actions({HUB: [{"id": "k1", "name": "DVD freischalten", "steps": [{"type": "pause", "secs": 1}]}]})
    assert find_action(acts, HUB, "k1")["name"] == "DVD freischalten"
    assert find_action(acts, HUB, "dvd FREISCHALTEN")["id"] == "k1"
    assert find_action(acts, HUB, "nope") is None and find_action(acts, "remote.x", "k1") is None


def test_actions_move_from_profile_to_global():
    keys = ("skin", "actions", "names")
    data = migrate({"global": {}, "profiles": {"Standard": {"actions": {HUB: []}, "skin": "x"}, "Papa": {"actions": {"o": 1}}}}, keys)
    assert data["global"]["actions"] == {HUB: []}
    assert "actions" not in data["profiles"]["Standard"] and "actions" not in data["profiles"]["Papa"]
    flat = migrate({"skin": "x", "actions": {HUB: []}}, keys)
    assert flat["global"]["actions"] == {HUB: []} and "actions" not in flat["profiles"]["Standard"]


def test_key_check_and_service_mapping():
    from harmony_deck.steps import KeyStep, RunContext, StepError, ha_service

    ctx = RunContext(hass=None, hub=HUB, devices={"Panasonic": ["Input", "PowerOn"]})
    KeyStep().check(ctx, {"device": "Panasonic", "command": "Input"})
    for step, word in (({"device": "Sony", "command": "Input"}, "device"), ({"device": "Panasonic", "command": "Eject"}, "key")):
        try:
            KeyStep().check(ctx, step)
        except StepError as err:
            assert word in str(err)
        else:
            raise AssertionError("expected StepError")
    KeyStep().check(RunContext(hass=None, hub=HUB, devices=None), {"device": "x", "command": "y"})  # hub unreadable: no check
    assert ha_service("button.bell", "toggle") == ("button", "press")
    assert ha_service("script.film", "toggle") == ("script", "turn_on")
    assert ha_service("automation.x", "run") == ("automation", "trigger")
    assert ha_service("light.x", "off") == ("homeassistant", "turn_off")
    assert ha_service("light.x", "toggle") == ("homeassistant", "toggle")


def test_favs_are_cleaned():
    a = clean_action({"id": "f", "name": "DVD", "steps": [{"type": "pause", "secs": 1}], "favs": [
        {"d": "Panasonic", "c": "Play"}, {"d": "Panasonic", "c": "Play"}, {"d": "", "c": "x"}, "junk", {"d": "TV", "c": "Mute"}]})
    assert a["favs"] == [{"d": "Panasonic", "c": "Play"}, {"d": "TV", "c": "Mute"}]
    assert clean_action({"name": "x", "steps": [{"type": "pause", "secs": 1}], "favs": "no"})["favs"] == []
    many = [{"d": "D", "c": f"c{i}"} for i in range(100)]
    assert len(clean_action({"name": "x", "steps": [{"type": "pause", "secs": 1}], "favs": many})["favs"]) == 40
