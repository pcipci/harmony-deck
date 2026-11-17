"""Tests for the lock rules (run: python -m pytest tests, or python tests/test_lock.py)."""

import importlib.util
from datetime import datetime, timedelta
from pathlib import Path

_spec = importlib.util.spec_from_file_location(
    "lockrules", Path(__file__).parents[1] / "custom_components" / "harmony_deck" / "lockrules.py"
)
r = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(r)

NOW = datetime(2026, 11, 10, 18, 0, 0)


def test_nothing_when_not_effective():
    assert r.decide(effective=False, activity="Fire TV", adb_state="playing", adb_app="com.netflix.ninja", allowed=[]) == ()


def test_activity_running_is_switched_off():
    assert r.decide(effective=True, activity="XBOX", adb_state="off", adb_app="", allowed=[]) == ("hub",)
    assert r.decide(effective=True, activity="PowerOff", adb_state="standby", adb_app="", allowed=[]) == ()
    assert r.decide(effective=True, activity=None, adb_state="unavailable", adb_app=None, allowed=[]) == ()


def test_fire_tv_apps():
    run = lambda state, app, allowed=(): r.decide(effective=True, activity="PowerOff", adb_state=state, adb_app=app, allowed=allowed)
    assert run("playing", "com.netflix.ninja") == ("fire",)
    assert run("idle", "com.amazon.tv.launcher", ["com.amazon.tv.launcher"]) == ()   # start screen on the list (the default)
    assert run("idle", "com.amazon.tv.launcher") == ("fire",)    # taken off the list: blocked as well
    assert run("playing", "com.spotify.tv.android", ["com.spotify.tv.android"]) == ()
    assert run("on", "com.google.android.youtube.tv") == ("fire",)
    assert run("on", "") == ()                                    # unknown app: not touched
    assert run("playing", "") == ("fire",)                        # but something plays
    assert run("standby", "com.netflix.ninja") == ()


def test_both():
    assert r.decide(effective=True, activity="Fire TV", adb_state="playing", adb_app="x", allowed=[]) == ("hub", "fire")


def test_allowed_activities():
    run = lambda act, allowed=(): r.decide(effective=True, activity=act, adb_state="off", adb_app="", allowed=[], allowed_activities=allowed)
    assert run("SAT") == ("hub",)                                 # default: every activity is blocked
    assert run("SAT", ["SAT"]) == ()
    assert run("XBOX", ["SAT"]) == ("hub",)
    assert run("PowerOff", ["SAT"]) == ()


def test_effective_and_release():
    eff = lambda mode, until=None, schedule=(), local=NOW: r.is_effective(mode, schedule, until, NOW, local)
    assert eff("always")
    assert not eff("off")
    assert not eff("always", NOW + timedelta(minutes=5))
    assert eff("always", NOW - timedelta(seconds=1))
    assert not eff("schedule")                                    # no window: never
    assert not eff("nonsense")


def test_schedule_windows():
    week = [{"days": [0, 1, 2, 3, 4], "from": "19:00", "to": "07:00"}, {"days": [5], "from": "00:00", "to": "24:00"}]
    clean = r.clean_schedule(week)
    assert clean == [{"days": [0, 1, 2, 3, 4], "from": "19:00", "to": "07:00"}, {"days": [5], "from": "00:00", "to": "00:00"}]
    at = lambda d, h, m=0: r.in_schedule(clean, datetime(2026, 11, d, h, m))   # 2026-11-09 is a Monday
    assert at(9, 20)                    # Monday evening
    assert not at(9, 6)                 # Monday morning: Sunday is not in the window
    assert at(10, 6, 59)                # Tuesday morning: still Monday's window
    assert not at(10, 7)                # the end is not included
    assert not at(10, 12)
    assert at(14, 13)                   # Saturday: whole day
    assert at(14, 3)                    # also Friday's window
    assert not at(15, 13)               # Sunday
    assert r.is_effective("schedule", clean, None, NOW, datetime(2026, 11, 9, 20, 0))
    assert not r.is_effective("schedule", clean, NOW + timedelta(minutes=1), NOW, datetime(2026, 11, 9, 20, 0))


def test_schedule_cleaning():
    assert r.clean_schedule(None) == []
    assert r.clean_schedule([{"days": [], "from": "10:00", "to": "11:00"}]) == []
    assert r.clean_schedule([{"days": [7, -1, "x", True], "from": "10:00", "to": "11:00"}]) == []
    assert r.clean_schedule([{"days": [1], "from": "25:00", "to": "11:00"}, {"days": [1], "from": "10:61", "to": "11:00"}, "x"]) == []
    assert r.clean_schedule([{"days": [3, 1, 1], "from": "7:5", "to": "8:00"}]) == [{"days": [1, 3], "from": "07:05", "to": "08:00"}]
    assert len(r.clean_schedule([{"days": [1], "from": "10:00", "to": "11:00"}] * 50)) == r.MAX_WINDOWS
    assert r.parse_hhmm("24:00") == 1440 and r.parse_hhmm("24:01") is None and r.parse_hhmm("-1:00") is None


def test_log_keeps_newest():
    log = []
    for i in range(130):
        log = r.add_log(log, NOW + timedelta(seconds=i), "hub", str(i))
    assert len(log) == r.MAX_LOG and log[-1]["what"] == "129" and log[0]["what"] == "30"


def test_migrate_from_0_2_0():
    old = r.migrate_hub({"enabled": True, "minutes": 30, "released_until": None, "last_at": "x", "last_what": "y", "count": {"date": "d", "n": 2}})
    assert old["mode"] == "always" and old["minutes"] == 30 and old["activities"] == [] and "apps" not in old and old["log"] == []
    assert r.migrate_hub({"enabled": False})["mode"] == "off"
    assert r.migrate_hub(None)["mode"] == "off"
    new = r.migrate_hub({"mode": "schedule", "apps": ["a", "a", " b "], "activities": ["SAT", 3], "schedule": [{"days": [0], "from": "1:00", "to": "2:00"}]})
    assert new["mode"] == "schedule" and new["last_mode"] == "schedule" and new["apps"] == ["com.amazon.tv.launcher", "a", "b"] and new["activities"] == ["SAT"] and len(new["schedule"]) == 1


def test_minutes():
    assert r.clamp_minutes(1) == 5
    assert r.clamp_minutes(9999) == 480
    assert r.clamp_minutes("30") == 30
    assert r.clamp_minutes(None) == 60
    assert r.clamp_minutes(float("inf")) == 60
    assert r.release_end(NOW, 60) == NOW + timedelta(minutes=60)


def test_grace_and_cooldown():
    assert not r.ready_to_act(None, NOW, None)
    assert not r.ready_to_act(NOW - timedelta(seconds=2), NOW, None)
    assert r.ready_to_act(NOW - timedelta(seconds=3), NOW, None)
    assert not r.ready_to_act(NOW - timedelta(seconds=30), NOW, NOW + timedelta(seconds=5))
    assert r.ready_to_act(NOW - timedelta(seconds=30), NOW, NOW - timedelta(seconds=1))


def test_start_screen_rule():
    assert r.clean_apps(["com.amazon.tv.launcher", "com.netflix.ninja"]) == ["com.amazon.tv.launcher", "com.netflix.ninja"]
    assert r.clean_apps(["com.netflix.ninja"]) == []              # without the start screen nothing else is allowed
    assert r.clean_apps([]) == []
    # 0.3.4 and older: the start screen was always allowed, it is put on the stored list once.
    old = r.migrate_hub({"mode": "always", "apps": ["com.netflix.ninja"]})
    assert old["apps"] == ["com.amazon.tv.launcher", "com.netflix.ninja"] and old["launcher_listed"]
    assert r.migrate_hub({"apps": [], "launcher_listed": False})["apps"] == ["com.amazon.tv.launcher"]
    # Once listed, the choice of the user stays (also an empty list).
    assert r.migrate_hub({"apps": [], "launcher_listed": True})["apps"] == []
    assert r.migrate_hub(r.migrate_hub({"apps": ["x"]}))["apps"] == ["com.amazon.tv.launcher", "x"]
    assert "apps" not in r.migrate_hub(None)                     # never set: the default list applies


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)

