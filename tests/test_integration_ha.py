"""The integration inside a real Home Assistant (needs pytest-homeassistant-custom-component).

Sets up Harmony Deck next to a Harmony hub entry (not connected: only its registry entries exist) and checks the
entities of the lock, their names, the websocket API and the enforcement through the entities.
"""

from datetime import timedelta

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from homeassistant.setup import async_setup_component
from pytest_homeassistant_custom_component.common import MockConfigEntry, async_fire_time_changed

DOMAIN = "harmony_deck"
REMOTE = "remote.wohnzimmer"
FIRE = "media_player.fire_tv"


@pytest.fixture(autouse=True)
def _custom(enable_custom_integrations):
    yield


async def _setup(hass: HomeAssistant):
    harmony = MockConfigEntry(domain="harmony", title="Wohnzimmer", unique_id="hub1")
    harmony.add_to_hass(hass)
    er.async_get(hass).async_get_or_create("remote", "harmony", "hub1", config_entry=harmony, suggested_object_id="wohnzimmer")
    hass.states.async_set(REMOTE, "off", {"activity_list": ["PowerOff", "SAT", "XBOX"], "current_activity": "PowerOff"})
    calls = []

    async def svc(call):
        calls.append((call.domain, call.service, dict(call.data)))
        if call.service == "adb_command" and call.data["command"].startswith("pm list"):
            hass.states.async_set(FIRE, "idle", {"adb_response": "package:com.netflix.ninja\npackage:com.plexapp.android"})

    hass.services.async_register("remote", "turn_off", svc)
    hass.services.async_register("androidtv", "adb_command", svc)
    assert await async_setup_component(hass, "http", {})
    entry = MockConfigEntry(domain=DOMAIN, title="Harmony Deck")
    entry.add_to_hass(hass)
    assert await hass.config_entries.async_setup(entry.entry_id)
    await hass.async_block_till_done()
    return entry, harmony, calls


def _lock_entities(hass, entry):
    registry = er.async_get(hass)
    return {e.translation_key: e for e in er.async_entries_for_config_entry(registry, entry.entry_id) if e.translation_key}


async def test_lock_entities_exist_with_names(hass: HomeAssistant):
    entry, harmony, _ = await _setup(hass)
    ents = _lock_entities(hass, entry)
    for key in ("lock", "lock_mode", "release_minutes", "release", "lock_active", "released_until", "last_action", "interventions_today", "intervention", "sequence"):
        assert key in ents, f"missing entity {key}"
        assert ents[key].unique_id == f"{entry.entry_id}_{harmony.entry_id}_{key}"
    assert hass.states.get(ents["lock"].entity_id).state == "off"
    assert hass.states.get(ents["lock_mode"].entity_id).state == "off"
    assert hass.states.get(ents["lock_mode"].entity_id).attributes["options"] == ["off", "always", "schedule"]
    assert hass.states.get(ents["lock_active"].entity_id).state == "off"
    assert hass.states.get(ents["release_minutes"].entity_id).state in ("60", "60.0")
    # names come from the translations (a wrong format there leaves the entities without a name)
    assert hass.states.get(ents["lock"].entity_id).attributes["friendly_name"].endswith("Lock")
    assert hass.states.get(ents["lock_active"].entity_id).attributes["friendly_name"].endswith("Lock active")


async def test_switch_locks_and_switches_off(hass: HomeAssistant, freezer):
    entry, _, calls = await _setup(hass)
    ents = _lock_entities(hass, entry)
    await hass.services.async_call("switch", "turn_on", {"entity_id": ents["lock"].entity_id}, blocking=True)
    assert hass.states.get(ents["lock_active"].entity_id).state == "on"
    assert hass.states.get(ents["lock_mode"].entity_id).state == "always"
    hass.states.async_set(REMOTE, "on", {"activity_list": ["PowerOff", "SAT", "XBOX"], "current_activity": "XBOX"})
    for _ in range(4):
        freezer.tick(timedelta(seconds=2))
        async_fire_time_changed(hass)
        await hass.async_block_till_done()
    assert ("remote", "turn_off", {"entity_id": REMOTE}) in calls
    last = hass.states.get(ents["last_action"].entity_id)
    assert last.attributes["what"] == "Harmony: XBOX" and last.attributes["today"] >= 1
    # the same intervention as an event and in the daily count
    event = hass.states.get(ents["intervention"].entity_id)
    assert event.attributes["event_type"] == "hub" and event.attributes["what"] == "XBOX"
    assert hass.states.get(ents["interventions_today"].entity_id).state == "1"
    # release: the lock stops working, the entities follow
    await hass.services.async_call("button", "press", {"entity_id": ents["release"].entity_id}, blocking=True)
    assert hass.states.get(ents["lock_active"].entity_id).state == "off"
    assert hass.states.get(ents["lock_active"].entity_id).attributes["released_until"]
    assert hass.states.get(ents["released_until"].entity_id).state not in ("unknown", "unavailable")
    await hass.services.async_call("select", "select_option", {"entity_id": ents["lock_mode"].entity_id, "option": "off"}, blocking=True)
    assert hass.states.get(ents["lock"].entity_id).state == "off"


async def test_websocket_api(hass: HomeAssistant, hass_ws_client):
    entry, harmony, _ = await _setup(hass)
    hass.states.async_set(FIRE, "idle", {})
    client = await hass_ws_client(hass)

    async def call(**msg):
        await client.send_json_auto_id(msg)
        return await client.receive_json()

    res = await call(type="harmony_deck/lock/get")
    assert res["success"], res
    hub = res["result"]["hubs"][REMOTE]
    assert hub["hub"] == harmony.entry_id and hub["mode"] == "off" and hub["all_activities"] == ["SAT", "XBOX"]
    assert set(hub["entities"]) == {"lock", "lock_mode", "release_minutes", "release", "lock_active", "released_until", "last_action", "interventions_today", "intervention", "sequence"}
    assert res["result"]["admin"] is True

    window = {"days": [0, 1], "from": "19:00", "to": "07:00"}
    res = await call(type="harmony_deck/lock/set", hub=REMOTE, mode="schedule", minutes=30, activities=["SAT"], apps=["com.amazon.tv.launcher", "com.netflix.ninja"], schedule=[window])
    hub = res["result"]["hubs"][REMOTE]
    assert hub["mode"] == "schedule" and hub["minutes"] == 30 and hub["activities"] == ["SAT"] and hub["apps"] == ["com.amazon.tv.launcher", "com.netflix.ninja"] and hub["schedule"] == [window]

    # The main card reads the allowed activities from the attribute of "Lock active" (not from the info call).
    await hass.async_block_till_done()
    assert hass.states.get(hub["entities"]["lock_active"]).attributes["allowed_activities"] == ["SAT"]

    res = await call(type="harmony_deck/lock/set", hub=REMOTE, mode="always")
    assert res["result"]["hubs"][REMOTE]["effective"] is True
    res = await call(type="harmony_deck/lock/release", hub=REMOTE, minutes=10)
    hub = res["result"]["hubs"][REMOTE]
    assert hub["effective"] is False and hub["released_until"] and [e["kind"] for e in hub["log"]][-2:] == ["on", "release"]
    res = await call(type="harmony_deck/lock/release", hub=REMOTE, end=True)
    assert res["result"]["hubs"][REMOTE]["effective"] is True
    res = await call(type="harmony_deck/lock/clear_log", hub=REMOTE)
    assert res["result"]["hubs"][REMOTE]["log"] == []
    # Test button: says what the lock would do, changes nothing.
    hass.states.async_set(REMOTE, "on", {"activity_list": ["PowerOff", "SAT", "XBOX"], "current_activity": "XBOX"})
    res = await call(type="harmony_deck/lock/test", hub=REMOTE)
    assert res["success"] and res["result"]["effective"] is True and res["result"]["activity"] == "XBOX" and res["result"]["activity_blocked"] is True
    assert hass.states.get(REMOTE).attributes["current_activity"] == "XBOX"
    res = await call(type="harmony_deck/lock/set", hub=REMOTE, activities=["XBOX"])
    res = await call(type="harmony_deck/lock/test", hub=REMOTE)
    assert res["result"]["activity_blocked"] is False
    res = await call(type="harmony_deck/lock/test", hub="remote.unknown")
    assert not res["success"]
    res = await call(type="harmony_deck/lock/set", hub="remote.unknown", mode="off")
    assert not res["success"]

    res = await call(type="harmony_deck/fire_apps", entity_id=FIRE, refresh=True)
    assert res["result"]["ok"] and res["result"]["list"] == ["com.netflix.ninja", "com.plexapp.android"]
    res = await call(type="harmony_deck/fire_apps", entity_id=FIRE)
    assert res["result"]["list"] == ["com.netflix.ninja", "com.plexapp.android"]

    info = await call(type="harmony_deck/info")
    assert info["success"], info
    assert info["result"]["lock"][REMOTE]["entities"]["lock_active"].startswith("binary_sensor.")
    assert info["result"]["packages"] == {FIRE: ["com.netflix.ninja", "com.plexapp.android"]}


async def test_changes_need_an_administrator(hass: HomeAssistant, hass_ws_client, hass_read_only_access_token):
    await _setup(hass)
    client = await hass_ws_client(hass, hass_read_only_access_token)
    await client.send_json_auto_id({"type": "harmony_deck/lock/get"})
    res = await client.receive_json()
    assert res["success"] and res["result"]["admin"] is False
    for msg in ({"type": "harmony_deck/lock/set", "hub": REMOTE, "mode": "off"}, {"type": "harmony_deck/lock/release", "hub": REMOTE}, {"type": "harmony_deck/fire_apps", "entity_id": FIRE, "refresh": True}):
        await client.send_json_auto_id(msg)
        res = await client.receive_json()
        assert not res["success"] and res["error"]["code"] == "unauthorized"


async def test_reload_and_legacy_cleanup(hass: HomeAssistant):
    entry, harmony, _ = await _setup(hass)
    registry = er.async_get(hass)
    old = registry.async_get_or_create("switch", DOMAIN, f"{entry.entry_id}_{REMOTE}_lock", config_entry=entry)
    assert await hass.config_entries.async_reload(entry.entry_id)
    await hass.async_block_till_done()
    assert registry.async_get(old.entity_id) is None            # entity of 0.2.0 is gone
    assert "lock" in _lock_entities(hass, entry)
    assert await hass.config_entries.async_unload(entry.entry_id)


async def test_fire_issue_after_short_wait_and_gone_when_back(hass: HomeAssistant):
    from homeassistant.helpers import issue_registry as ir

    entry, _, _ = await _setup(hass)
    coordinator = entry.runtime_data
    hass.data[DOMAIN]["settings"]["direct"] = {REMOTE: {"entity": FIRE}}
    hass.states.async_set(FIRE, "unavailable")
    issue_id = f"fire_unreachable_{FIRE}"
    issues = ir.async_get(hass)
    for _ in range(2):
        await coordinator.async_refresh()
    assert issues.async_get_issue(DOMAIN, issue_id) is None      # a sleeping Fire TV is not reported at once
    await coordinator.async_refresh()
    assert issues.async_get_issue(DOMAIN, issue_id) is not None  # third refresh in a row (about 6 minutes)
    hass.states.async_set(FIRE, "idle")                          # back: the hint goes away without waiting for the next refresh
    await hass.async_block_till_done()
    assert issues.async_get_issue(DOMAIN, issue_id) is None


async def _with_actions(hass, actions):
    hass.data[DOMAIN]["settings"]["actions"] = {REMOTE: actions}


async def test_action_runs_steps_in_order_and_reports(hass: HomeAssistant, hass_ws_client):
    entry, _, calls = await _setup(hass)
    sent = []

    async def send(call):
        sent.append((call.data["device"], call.data["command"], call.data.get("num_repeats")))

    hass.services.async_register("remote", "send_command", send)
    hass.states.async_set("light.kerzen", "off")
    hass.services.async_register("homeassistant", "toggle", lambda call: sent.append(("toggle", call.data["entity_id"], None)))
    await _with_actions(hass, [{"id": "dvd", "name": "DVD", "steps": [
        {"type": "key", "device": "Panasonic", "command": "Input", "repeat": 2},
        {"type": "pause", "secs": 0.1},
        {"type": "ha", "entity": "light.kerzen", "op": "toggle"},
    ]}])
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "harmony_deck/action/run", "hub": REMOTE, "action_id": "dvd"})
    res = await client.receive_json()
    assert res["success"] and res["result"]["state"] == "running" and res["result"]["total"] == 3
    ent = _lock_entities(hass, entry)["sequence"].entity_id
    for _ in range(50):
        await hass.async_block_till_done()
        if hass.states.get(ent).state != "running":
            break
        import asyncio
        await asyncio.sleep(0.02)
    st = hass.states.get(ent)
    assert st.state == "done" and st.attributes["step"] == 3 and st.attributes["name"] == "DVD"
    assert sent == [("Panasonic", "Input", 2), ("toggle", "light.kerzen", None)]


async def test_action_busy_stop_and_service(hass: HomeAssistant, hass_ws_client):
    import asyncio

    entry, _, _ = await _setup(hass)
    await _with_actions(hass, [{"id": "long", "name": "Lang", "steps": [{"type": "pause", "secs": 30}]}])
    client = await hass_ws_client(hass)
    await hass.services.async_call(DOMAIN, "run_action", {"hub": REMOTE, "action": "lang"}, blocking=True)
    ent = _lock_entities(hass, entry)["sequence"].entity_id
    assert hass.states.get(ent).state == "running"
    await client.send_json_auto_id({"type": "harmony_deck/action/run", "hub": REMOTE, "action_id": "long"})
    res = await client.receive_json()
    assert not res["success"] and res["error"]["code"] == "busy"          # second start is refused, not queued
    await client.send_json_auto_id({"type": "harmony_deck/action/stop", "hub": REMOTE})
    assert (await client.receive_json())["result"] == {"stopped": True}
    await asyncio.sleep(0)
    await hass.async_block_till_done()
    assert hass.states.get(ent).state == "stopped"


async def test_action_errors_before_and_during(hass: HomeAssistant, hass_ws_client, hass_read_only_access_token):
    import asyncio

    entry, _, _ = await _setup(hass)
    await _with_actions(hass, [{"id": "bad", "name": "Bad", "steps": [{"type": "ha", "entity": "light.missing", "op": "on"}]},
                               {"id": "boom", "name": "Boom", "steps": [{"type": "key", "device": "TV", "command": "Off"}]}])
    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "harmony_deck/action/run", "hub": REMOTE, "action_id": "bad"})
    res = await client.receive_json()
    assert res["error"]["code"] == "invalid" and "light.missing" in res["error"]["message"]   # nothing was sent

    async def fail(call):
        raise RuntimeError("hub said no")

    hass.services.async_register("remote", "send_command", fail)
    await client.send_json_auto_id({"type": "harmony_deck/action/run", "hub": REMOTE, "action_id": "boom"})
    assert (await client.receive_json())["success"]
    await asyncio.sleep(0.05)
    await hass.async_block_till_done()
    st = hass.states.get(_lock_entities(hass, entry)["sequence"].entity_id)
    assert st.state == "error" and st.attributes["step"] == 1 and "hub said no" in st.attributes["error"]
    # a draft (unsaved) may only be tested by an administrator; starting a stored one is fine for everyone
    ro = await hass_ws_client(hass, hass_read_only_access_token)
    await ro.send_json_auto_id({"type": "harmony_deck/action/run", "hub": REMOTE, "draft": {"steps": [{"type": "pause", "secs": 1}]}})
    assert (await ro.receive_json())["error"]["code"] == "unauthorized"


async def test_action_values_and_ir_volume(hass: HomeAssistant, hass_ws_client):
    import asyncio

    entry, _, _ = await _setup(hass)
    sent = []

    async def rec(call):
        sent.append((call.domain, call.service, {k: v for k, v in call.data.items() if k != "entity_id"}))

    for dom, srv in (("remote", "send_command"), ("media_player", "turn_on"), ("media_player", "volume_set"), ("media_player", "select_source")):
        hass.services.async_register(dom, srv, rec)
    hass.states.async_set("media_player.avr", "on", {"supported_features": 4 | 2048, "source_list": ["HDMI 1", "HDMI 2"]})
    hass.data[DOMAIN]["settings"]["irVolume"] = {REMOTE: {"Panasonic": {"max": 12, "step": 1, "delay": 0.1}}}
    await _with_actions(hass, [
        {"id": "v", "name": "Vol", "steps": [{"type": "ha", "entity": "media_player.avr", "op": "on", "values": {"volume": 35, "source": "HDMI 2"}},
                                              {"type": "irvol", "device": "Panasonic", "level": 5}]},
        {"id": "loud", "name": "Loud", "steps": [{"type": "ha", "entity": "media_player.avr", "op": "set", "values": {"volume": 95}}]},
        {"id": "src", "name": "Src", "steps": [{"type": "ha", "entity": "media_player.avr", "op": "set", "values": {"source": "Tuner"}}]},
    ])
    client = await hass_ws_client(hass)
    ent = _lock_entities(hass, entry)["sequence"].entity_id

    async def run(action):
        await client.send_json_auto_id({"type": "harmony_deck/action/run", "hub": REMOTE, "action_id": action})
        res = await client.receive_json()
        for _ in range(100):
            await hass.async_block_till_done()
            if hass.states.get(ent).state != "running":
                break
            await asyncio.sleep(0.02)
        return res

    assert (await run("v"))["success"]
    assert hass.states.get(ent).state == "done"
    assert [s[1] for s in sent[:3]] == ["turn_on", "select_source", "volume_set"] and sent[2][2]["volume_level"] == 0.35
    ir = [s[2] for s in sent if s[0] == "remote"]
    assert ir[0]["command"] == "VolumeDown" and sum(c["num_repeats"] for c in ir if c["command"] == "VolumeDown") == 14
    assert sum(c["num_repeats"] for c in ir if c["command"] == "VolumeUp") == 5 and all(c["num_repeats"] <= 10 for c in ir)
    res = await run("loud")                       # above the volume limit (80 % by default): refused before anything is sent
    assert res["error"]["code"] == "invalid" and "limit" in res["error"]["message"]
    assert (await run("src"))["success"]          # unknown source: error in the step, nothing sent
    st = hass.states.get(ent)
    assert st.state == "error" and "unknown source" in st.attributes["error"]


async def test_action_wait_and_if(hass: HomeAssistant, hass_ws_client):
    import asyncio

    entry, _, _ = await _setup(hass)
    sent = []

    async def rec(call):
        sent.append(call.data["entity_id"])

    hass.services.async_register("homeassistant", "turn_on", rec)
    hass.states.async_set("media_player.tv", "off")
    for e in ("light.a", "light.b", "light.c"):
        hass.states.async_set(e, "off")
    on = {"entity": "media_player.tv", "value": "on"}
    await _with_actions(hass, [
        {"id": "w", "name": "Wait", "steps": [{"type": "wait", "cond": on, "timeout": 5}, {"type": "ha", "entity": "light.a", "op": "on"}]},
        {"id": "s", "name": "Skip", "steps": [{"type": "if", "cond": {**on, "op": "not"}, "else": "skip", "skip": 1},
                                              {"type": "ha", "entity": "light.a", "op": "on"}, {"type": "ha", "entity": "light.b", "op": "on"}]},
        {"id": "e", "name": "End", "steps": [{"type": "if", "cond": {**on, "value": "playing"}, "else": "end"},
                                             {"type": "ha", "entity": "light.c", "op": "on"}]},
        {"id": "t", "name": "Timeout", "steps": [{"type": "wait", "cond": {**on, "value": "playing"}, "timeout": 1}]},
        {"id": "f", "name": "Fail", "steps": [{"type": "if", "cond": {**on, "value": "playing"}, "else": "fail", "message": "TV not playing"}]},
    ])
    client = await hass_ws_client(hass)
    ent = _lock_entities(hass, entry)["sequence"].entity_id

    async def start(action):
        await client.send_json_auto_id({"type": "harmony_deck/action/run", "hub": REMOTE, "action_id": action})
        assert (await client.receive_json())["success"]

    async def finish():
        for _ in range(200):
            await hass.async_block_till_done()
            if hass.states.get(ent).state != "running":
                return hass.states.get(ent)
            await asyncio.sleep(0.02)
        return hass.states.get(ent)

    await start("w")                                  # waits until the TV is on, then goes on
    await asyncio.sleep(0.2)
    assert hass.states.get(ent).state == "running" and sent == []
    hass.states.async_set("media_player.tv", "on")
    st = await finish()
    assert st.state == "done" and sent == ["light.a"]

    sent.clear()
    await start("s")                                  # TV is on, so "if not on" fails -> skip one step
    st = await finish()
    assert st.state == "done" and sent == ["light.b"] and st.attributes["skipped"] == [2]

    sent.clear()
    await start("e")                                  # not playing -> end without the rest
    st = await finish()
    assert st.state == "done" and sent == [] and st.attributes["skipped"] == [2]

    await start("t")
    st = await finish()
    assert st.state == "error" and "condition not met" in st.attributes["error"]

    await start("f")
    st = await finish()
    assert st.state == "error" and st.attributes["error"] == "TV not playing"


async def test_direct_devices_overview_step_and_direct_volume(hass: HomeAssistant, hass_ws_client):
    import asyncio

    entry, _, _ = await _setup(hass)
    sent = []

    async def rec(call):
        sent.append((call.service, {k: v for k, v in call.data.items() if k != "entity_id"}))

    for srv in ("turn_on", "turn_off", "volume_set", "select_source", "volume_mute"):
        hass.services.async_register("media_player", srv, rec)
    hass.services.async_register("remote", "send_command", rec)
    hass.states.async_set("media_player.tv", "on", {"supported_features": 4 | 8 | 128 | 256 | 2048, "volume_level": 0.2,
                                                    "source": "HDMI 1", "source_list": ["HDMI 1", "HDMI 2"]})
    hass.states.async_set("media_player.radio", "off", {"supported_features": 128})
    hass.states.async_set("media_player.dumb", "on", {})
    settings = hass.data[DOMAIN]["settings"]
    settings["directDevices"] = {REMOTE: {"LG": {"entity": "media_player.tv", "volumeDirect": True}}}
    settings["irVolume"] = {REMOTE: {"LG": {"max": 50, "step": 1, "delay": 0.1}}}

    client = await hass_ws_client(hass)
    await client.send_json_auto_id({"type": "harmony_deck/direct/overview"})
    res = (await client.receive_json())["result"]
    assert [c["entity"] for c in res["candidates"]] == ["media_player.radio", "media_player.tv"]   # "dumb" can do nothing
    assert res["extensions"] == []

    await _with_actions(hass, [
        {"id": "d", "name": "Dev", "steps": [{"type": "dev", "device": "LG", "op": "source", "value": "HDMI 2"},
                                              {"type": "dev", "device": "LG", "op": "volume", "value": 30},
                                              {"type": "irvol", "device": "LG", "level": 10}]},
        {"id": "x", "name": "None", "steps": [{"type": "dev", "device": "Panasonic", "op": "on"}]},
        {"id": "bad", "name": "Bad", "steps": [{"type": "dev", "device": "LG", "op": "source", "value": "Tuner"}]},
    ])
    ent = _lock_entities(hass, entry)["sequence"].entity_id

    async def run(action):
        await client.send_json_auto_id({"type": "harmony_deck/action/run", "hub": REMOTE, "action_id": action})
        out = await client.receive_json()
        for _ in range(100):
            await hass.async_block_till_done()
            if hass.states.get(ent).state != "running":
                break
            await asyncio.sleep(0.02)
        return out

    assert (await run("d"))["success"]
    assert hass.states.get(ent).state == "done"
    assert sent == [("select_source", {"source": "HDMI 2"}), ("volume_set", {"volume_level": 0.3}), ("volume_set", {"volume_level": 0.2})]
    res = await run("x")
    assert res["error"]["code"] == "invalid" and "no direct device" in res["error"]["message"]
    assert (await run("bad"))["success"]
    assert "unknown source" in hass.states.get(ent).attributes["error"]
