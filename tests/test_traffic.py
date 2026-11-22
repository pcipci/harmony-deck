"""The optional traffic log: hands off by default, one line per call to a hub, silent for others."""

from __future__ import annotations

import logging
from types import SimpleNamespace

from custom_components.harmony_deck import traffic


class _Bus:
    def __init__(self) -> None:
        self.listeners: list = []

    def async_listen(self, event_type, cb):
        self.listeners.append((event_type, cb))
        return lambda: self.listeners.remove((event_type, cb))


def _log(monkeypatch):
    hass = SimpleNamespace(bus=_Bus(), data={})
    monkeypatch.setattr(traffic, "watched_entities", lambda h: {"remote.wz"})
    return hass, traffic.TrafficLog(hass)


def _event(data, user=None, parent=None):
    return SimpleNamespace(data=data, context=SimpleNamespace(user_id=user, parent_id=parent))


def test_off_by_default_and_toggle(monkeypatch):
    hass, log = _log(monkeypatch)
    assert not log.running and not hass.bus.listeners
    log.set_enabled(True)
    assert log.running and len(hass.bus.listeners) == 2
    log.set_enabled(False)
    assert not log.running and not hass.bus.listeners


def test_logs_only_watched_calls(monkeypatch, caplog):
    hass, log = _log(monkeypatch)
    caplog.set_level(logging.INFO, logger="custom_components.harmony_deck.traffic")
    log._service(_event({"domain": "remote", "service": "send_command", "service_data": {"entity_id": ["remote.wz"], "device": "TV", "command": "VolumeUp"}}, user="u1"))
    log._service(_event({"domain": "light", "service": "turn_on", "service_data": {"entity_id": "light.x"}}))
    lines = [r.getMessage() for r in caplog.records]
    assert len(lines) == 1
    assert "remote.send_command" in lines[0] and "remote.wz" in lines[0] and "VolumeUp" in lines[0] and "user/card" in lines[0]


def test_logs_state_change(monkeypatch, caplog):
    hass, log = _log(monkeypatch)
    caplog.set_level(logging.INFO, logger="custom_components.harmony_deck.traffic")
    new, old = SimpleNamespace(state="unavailable", attributes={}), SimpleNamespace(state="on", attributes={})
    log._state(_event({"entity_id": "remote.wz", "old_state": old, "new_state": new}))
    log._state(_event({"entity_id": "remote.other", "old_state": old, "new_state": new}))
    assert [r.getMessage() for r in caplog.records] == ["state remote.wz: on -> unavailable"]
