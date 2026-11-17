"""Lock manager with a real Home Assistant core (skipped when homeassistant is not installed)."""

import asyncio
import sys
import tempfile
from datetime import timedelta
from pathlib import Path

try:
    from homeassistant.core import HomeAssistant
    from homeassistant.util import dt as dt_util
except ImportError:  # pragma: no cover
    HomeAssistant = None

sys.path.insert(0, str(Path(__file__).parents[1] / "custom_components"))

def _run(coro):
    """Run in a loop of its own without touching the current one (other tests keep theirs)."""
    loop = asyncio.new_event_loop()
    try:
        loop.run_until_complete(coro)
    finally:
        loop.close()


HUB = "entry_wz"            # config entry id of the Harmony hub
REMOTE = "remote.wz"
FIRE = "media_player.fire"


async def _setup(folder, stored=None, direct=None):
    from harmony_deck import lock as lock_mod
    from harmony_deck.const import DOMAIN

    hass = HomeAssistant(folder)
    calls = []

    async def svc(call):
        calls.append((call.service, dict(call.data)))

    hass.services.async_register("remote", "turn_off", svc)
    hass.services.async_register("androidtv", "adb_command", svc)
    hass.data[DOMAIN] = {"settings": {"direct": {REMOTE: direct or {"entity": FIRE}}}}
    lock_mod.lock_hubs = lambda _hass: {HUB: {"remote": REMOTE, "title": "Wohnzimmer"}}
    manager = lock_mod.LockManager(hass)
    if stored is not None:
        await manager._store.async_save(stored)
    await manager.async_load()
    return hass, manager, calls


def test_manager_switches_off_after_grace_and_respects_release():
    if HomeAssistant is None:
        return

    async def run():
        with tempfile.TemporaryDirectory() as folder:
            hass, manager, calls = await _setup(folder)
            await manager.async_set_lists(HUB, apps=["com.amazon.tv.launcher", "com.spotify.tv.android"])
            hass.states.async_set(REMOTE, "on", {"current_activity": "XBOX"})
            hass.states.async_set(FIRE, "playing", {"app_id": "com.netflix.ninja"})
            now = dt_util.utcnow()
            await manager._check(HUB, now)
            assert not calls                                   # lock is off by default
            await manager.async_set_enabled(HUB, True)
            assert manager.mode(HUB) == "always"
            await manager._check(HUB, now)
            assert not calls                                   # grace time
            await manager._check(HUB, now + timedelta(seconds=3))
            await asyncio.sleep(0.05)
            assert {c[0] for c in calls} == {"turn_off", "adb_command"}
            assert [e["kind"] for e in manager.hub(HUB)["log"]] == ["on", "fire", "hub"]
            assert manager.today_count(HUB, now) == 1
            calls.clear()
            await manager._check(HUB, now + timedelta(seconds=6))
            assert not calls                                   # pause after an intervention
            await manager.async_release(HUB)
            assert not manager.effective(HUB)
            assert manager.hub(HUB)["log"][-1]["kind"] == "release"
            await manager._check(HUB, now + timedelta(seconds=60))
            assert not calls                                   # released
            await manager.async_end_release(HUB)
            assert manager.effective(HUB) and manager.hub(HUB)["log"][-1] ["kind"] == "on"
            hass.states.async_set(REMOTE, "off", {"current_activity": "PowerOff"})
            hass.states.async_set(FIRE, "playing", {"app_id": "com.spotify.tv.android"})
            await manager._check(HUB, now + timedelta(seconds=100))
            await manager._check(HUB, now + timedelta(seconds=110))
            assert not calls                                   # allowed app
            await hass.async_stop(force=True)

    _run(run())


def test_allowed_activity_and_starting_activity():
    if HomeAssistant is None:
        return

    async def run():
        with tempfile.TemporaryDirectory() as folder:
            hass, manager, calls = await _setup(folder)
            await manager.async_set_mode(HUB, "always")
            await manager.async_set_lists(HUB, activities=["SAT"])
            now = dt_util.utcnow()
            hass.states.async_set(REMOTE, "on", {"current_activity": "SAT"})
            await manager._check(HUB, now)
            await manager._check(HUB, now + timedelta(seconds=5))
            assert not calls                                   # allowed activity
            hass.states.async_set(REMOTE, "on", {"current_activity": "SAT", "activity_starting": "XBOX"})
            await manager._check(HUB, now + timedelta(seconds=20))
            await manager._check(HUB, now + timedelta(seconds=24))
            await asyncio.sleep(0.05)
            assert [c[0] for c in calls] == ["turn_off"]       # the activity that is starting is not allowed
            assert manager.hub(HUB)["log"][-1] == {"at": (now + timedelta(seconds=24)).isoformat(), "kind": "hub", "what": "XBOX"}
            await hass.async_stop(force=True)

    _run(run())


def test_fire_intervention_switches_off_chosen_devices_and_remembers_apps():
    if HomeAssistant is None:
        return

    async def run():
        with tempfile.TemporaryDirectory() as folder:
            hass, manager, calls = await _setup(folder)

            async def send(call):
                calls.append(("send_command", dict(call.data)))

            hass.services.async_register("remote", "send_command", send)
            await manager.async_set_mode(HUB, "always")
            await manager.async_set_lists(HUB, activities=["Fire TV"], off_devices=["LG-Fernseher", "Yamaha", "LG-Fernseher", ""])
            assert manager.hub(HUB)["off_devices"] == ["LG-Fernseher", "Yamaha"]
            # no Harmony activity, the Fire TV shows an app that is not allowed (and one the installed list does not know)
            hass.states.async_set(REMOTE, "off", {"current_activity": "PowerOff"})
            hass.states.async_set(FIRE, "playing", {"app_id": "com.amazon.aria"})
            now = dt_util.utcnow()
            await manager._tick(now)
            assert "com.amazon.aria" in manager.hub(HUB)["seen"] and "com.amazon.aria" in manager.snapshot(HUB)["seen"]
            await manager._check(HUB, now + timedelta(seconds=5))
            await asyncio.sleep(1.4)
            assert [c[0] for c in calls].count("adb_command") == 1
            sent = [c[1] for c in calls if c[0] == "send_command"]
            assert [(c["device"], c["command"], c["entity_id"]) for c in sent] == [("LG-Fernseher", "PowerOff", REMOTE), ("Yamaha", "PowerOff", REMOTE)]
            assert "LG-Fernseher" in manager.hub(HUB)["last_what"]
            # something that is not a package name is not remembered
            hass.states.async_set(FIRE, "playing", {"app_id": "not a package"})
            await manager._tick(now + timedelta(seconds=20))
            assert manager.hub(HUB)["seen"] == ["com.amazon.aria"]
            await hass.async_stop(force=True)

    _run(run())


def test_stale_poweroff_in_starting_does_not_hide_running_activity():
    if HomeAssistant is None:
        return

    async def run():
        with tempfile.TemporaryDirectory() as folder:
            hass, manager, calls = await _setup(folder)
            await manager.async_set_mode(HUB, "always")
            await manager.async_set_lists(HUB, activities=["SAT"])
            hass.states.async_set(REMOTE, "on", {"current_activity": "XBOX", "activity_starting": "PowerOff"})
            now = dt_util.utcnow()
            await manager._check(HUB, now)
            await manager._check(HUB, now + timedelta(seconds=5))
            await asyncio.sleep(0.05)
            assert [c[0] for c in calls] == ["turn_off"]       # XBOX is running and not allowed
            await hass.async_stop(force=True)

    _run(run())


def test_release_end_and_restart_and_migration():
    if HomeAssistant is None:
        return

    async def run():
        with tempfile.TemporaryDirectory() as folder:
            # stored by 0.2.0: key = entity id of the remote, allowed apps in the card settings
            stored = {"hubs": {REMOTE: {"enabled": True, "minutes": 30}, "remote.gone": {"enabled": True}}}
            hass, manager, calls = await _setup(folder, stored, {"entity": FIRE, "lockApps": ["com.spotify.tv.android"]})
            assert list(manager.data) == [HUB]
            assert manager.mode(HUB) == "always" and manager.minutes(HUB) == 30
            assert manager.allowed_apps(HUB) == ["com.amazon.tv.launcher", "com.spotify.tv.android"]   # start screen added by the migration
            await manager.async_release(HUB, 5)
            # a restart keeps the release
            from harmony_deck.lock import LockManager
            again = LockManager(hass)
            await again.async_load()
            assert not again.effective(HUB) and again.released_until(HUB) is not None
            # the release ends: the tick notes it and the lock works again
            again.hub(HUB)["released_until"] = (dt_util.utcnow() - timedelta(seconds=1)).isoformat()
            again._was[HUB] = False
            seen = []
            again.async_add_listener(lambda: seen.append(1))
            await again._tick(dt_util.utcnow())
            assert again.effective(HUB) and seen
            assert again.hub(HUB)["log"][-1]["kind"] == "on" and again.hub(HUB)["log"][-1]["what"] == "release_end"
            snap = again.snapshot(HUB)
            assert snap["mode"] == "always" and snap["effective"] and snap["released_until"] is None and snap["apps"] == ["com.amazon.tv.launcher", "com.spotify.tv.android"]
            await hass.async_stop(force=True)

    _run(run())


def test_fire_app_list_reader():
    if HomeAssistant is None:
        return
    from harmony_deck.fireapps import FireApps, parse_packages

    assert parse_packages("package:b.c\npackage:a.b\r\npackage:a.b") == ["a.b", "b.c"]
    assert parse_packages(None) == []

    async def run():
        with tempfile.TemporaryDirectory() as folder:
            hass = HomeAssistant(folder)

            async def svc(call):
                extra = "\npackage:com.amazon.tv.launcher\npackage:com.amazon.firebat" if call.data["command"] == "pm list packages" else ""
                hass.states.async_set(FIRE, "idle", {"adb_response": "package:com.netflix.ninja\npackage:com.plexapp.android" + extra})

            hass.services.async_register("androidtv", "adb_command", svc)
            hass.states.async_set(FIRE, "idle", {})
            apps = FireApps(hass)
            await apps.async_load()
            res = await apps.async_read(FIRE)
            assert res["ok"] and res["list"] == ["com.netflix.ninja", "com.plexapp.android"]
            assert apps.cached()[FIRE]["list"] == res["list"]
            assert "com.amazon.firebat" in res["all"] and "com.netflix.ninja" in res["all"] and len(res["all"]) == 4
            hass.services.async_remove("androidtv", "adb_command")
            res = await apps.async_read(FIRE)                    # service gone: cached list, ok False
            assert not res["ok"] and res["list"] == ["com.netflix.ninja", "com.plexapp.android"]
            await hass.async_stop(force=True)

    _run(run())


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok" if HomeAssistant else "skipped (no homeassistant)", name)
