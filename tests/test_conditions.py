"""Conditions and the steps "wait" and "if" (pure parts)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "custom_components"))

from harmony_deck.actionsmodel import clean_step  # noqa: E402
from harmony_deck.conditions import clean_condition, holds  # noqa: E402


def test_condition_cleaned():
    assert clean_condition({"entity": "media_player.tv", "value": "On "}) == {"entity": "media_player.tv", "attr": "", "op": "is", "value": "On"}
    assert clean_condition({"entity": "media_player.avr", "attr": "volume_level", "op": "gt", "value": "0.3"})["value"] == 0.3
    assert clean_condition({"entity": "media_player.avr", "op": "gt", "value": "loud"}) is None      # comparison needs a number
    assert clean_condition({"entity": "bad entity", "value": "on"}) is None
    assert clean_condition({"entity": "light.a", "attr": "x y", "value": "on"}) is None
    assert clean_condition({"entity": "light.a", "value": True})["value"] == "true"
    assert clean_condition("x") is None


def test_condition_holds():
    on = clean_condition({"entity": "media_player.tv", "value": "on"})
    assert holds(on, "ON", {}) and not holds(on, "off", {})
    act = clean_condition({"entity": "remote.wz", "attr": "current_activity", "value": "Fire TV"})
    assert holds(act, "on", {"current_activity": "fire tv"}) and not holds(act, "on", {"current_activity": "Bluray"})
    vol = clean_condition({"entity": "media_player.avr", "attr": "volume_level", "op": "ge", "value": 0.3})
    assert holds(vol, "on", {"volume_level": 0.35}) and not holds(vol, "on", {"volume_level": 0.2})
    assert not holds(vol, "on", {}) and not holds(vol, "on", {"volume_level": "x"})
    nope = clean_condition({"entity": "media_player.tv", "op": "not", "value": "on"})
    assert holds(nope, None, None) and not holds(on, None, None)          # missing entity: "is" false, "is not" true
    num_state = clean_condition({"entity": "sensor.t", "op": "lt", "value": 20})
    assert holds(num_state, "19.5", {}) and not holds(num_state, "unavailable", {})
    flag = clean_condition({"entity": "media_player.tv", "attr": "is_volume_muted", "value": "true"})
    assert holds(flag, "on", {"is_volume_muted": True})


def test_wait_and_if_steps_cleaned():
    cond = {"entity": "media_player.tv", "value": "on"}
    assert clean_step({"type": "wait", "cond": cond}) == {"type": "wait", "cond": {**cond, "attr": "", "op": "is"}, "timeout": 30.0, "onTimeout": "abort"}
    assert clean_step({"type": "wait", "cond": cond, "timeout": 9999, "onTimeout": "continue"})["timeout"] == 300
    assert clean_step({"type": "wait", "cond": {"entity": "x"}}) is None
    assert clean_step({"type": "if", "cond": cond, "else": "skip", "skip": 50})["skip"] == 10
    assert clean_step({"type": "if", "cond": cond, "else": "end", "skip": 3}) == {"type": "if", "cond": {**cond, "attr": "", "op": "is"}, "else": "end"}
    assert clean_step({"type": "if", "cond": cond, "else": "fail", "message": "TV aus"})["message"] == "TV aus"
    assert clean_step({"type": "if", "cond": cond, "else": "jump"})["else"] == "skip"
