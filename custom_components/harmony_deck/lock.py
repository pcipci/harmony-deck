"""The lock: switches off activities and the Fire TV of a hub while it is locked (works without an open card).

One entry per Harmony hub, keyed by the config entry id of the hub (stable, unlike the entity id of its remote).
Settings, the release and the list of interventions are kept in their own store.
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
import logging
from typing import Any, Callable

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import entity_registry as er
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import DOMAIN, HARMONY_DOMAIN
from .lockrules import (
    COOLDOWN_SECONDS,
    LAUNCHER,
    activity_running,
    MODE_ALWAYS,
    MODE_OFF,
    MODE_SCHEDULE,
    MAX_SEEN,
    MODES,
    add_log,
    clamp_minutes,
    clean_apps,
    clean_names,
    clean_schedule,
    decide,
    is_effective,
    migrate_hub,
    package_name,
    ready_to_act,
    release_end,
)

_LOGGER = logging.getLogger(__name__)
STORAGE_KEY = f"{DOMAIN}.lock"
CHECK_EVERY = timedelta(seconds=2)


def lock_hubs(hass: HomeAssistant) -> dict[str, dict[str, str]]:
    """{config entry id of the Harmony hub: {"remote": entity id of its remote, "title": name}} for every hub."""
    registry = er.async_get(hass)
    out: dict[str, dict[str, str]] = {}
    for entry in hass.config_entries.async_entries(HARMONY_DOMAIN):
        for ent in er.async_entries_for_config_entry(registry, entry.entry_id):
            if ent.domain == "remote":
                out[entry.entry_id] = {"remote": ent.entity_id, "title": entry.title}
                break
    return out


class LockManager:
    """State and enforcement of the lock for every hub."""

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass
        self._store: Store[dict] = Store(hass, 1, STORAGE_KEY)
        self.data: dict[str, dict[str, Any]] = {}
        self._listeners: list[Callable[[], None]] = []
        self._intervention_listeners: list[Callable[[str, str, str], None]] = []
        self._pending: dict[str, datetime] = {}
        self._cooldown: dict[str, datetime] = {}
        self._was: dict[str, bool] = {}
        self._unsub: Callable[[], None] | None = None

    async def async_load(self) -> None:
        stored = await self._store.async_load()
        raw = stored.get("hubs", {}) if isinstance(stored, dict) else {}
        by_remote = {info["remote"]: hub_id for hub_id, info in lock_hubs(self.hass).items()}
        self.data = {}
        for key, value in raw.items():
            hub_id = by_remote.get(key, key)  # 0.2.0 used the entity id of the remote as key
            if hub_id.startswith("remote."):
                continue  # hub no longer exists
            self.data[hub_id] = migrate_hub(value)

    @callback
    def async_start(self) -> None:
        self._unsub = async_track_time_interval(self.hass, self._tick, CHECK_EVERY)

    @callback
    def async_stop(self) -> None:
        if self._unsub:
            self._unsub()
            self._unsub = None

    # ---- state ---------------------------------------------------------------------------
    def hub(self, hub_id: str) -> dict[str, Any]:
        if hub_id not in self.data:
            self.data[hub_id] = migrate_hub(None)
        return self.data[hub_id]

    def remote(self, hub_id: str) -> str | None:
        """Entity id of the hub's remote (None if the hub is gone)."""
        return lock_hubs(self.hass).get(hub_id, {}).get("remote")

    def mode(self, hub_id: str) -> str:
        return self.hub(hub_id)["mode"]

    def enabled(self, hub_id: str) -> bool:
        return self.mode(hub_id) != MODE_OFF

    def minutes(self, hub_id: str) -> int:
        return clamp_minutes(self.hub(hub_id).get("minutes"))

    def _time(self, hub_id: str, key: str) -> datetime | None:
        raw = self.hub(hub_id).get(key)
        parsed = dt_util.parse_datetime(raw) if isinstance(raw, str) and raw else None
        return dt_util.as_utc(parsed) if parsed else None

    def released_until(self, hub_id: str, now: datetime | None = None) -> datetime | None:
        """End of the running release, None if there is none (any more)."""
        until = self._time(hub_id, "released_until")
        return until if until and until > (now or dt_util.utcnow()) else None

    def last_action(self, hub_id: str) -> datetime | None:
        return self._time(hub_id, "last_at")

    def effective(self, hub_id: str, now: datetime | None = None) -> bool:
        now = now or dt_util.utcnow()
        entry = self.hub(hub_id)
        return is_effective(entry["mode"], entry["schedule"], self._time(hub_id, "released_until"), now, dt_util.as_local(now))

    def _direct(self, hub_id: str) -> dict[str, Any]:
        """Fire TV link of the hub from the card settings ({entity, ...})."""
        remote = self.remote(hub_id)
        cfg = (self.hass.data.get(DOMAIN, {}).get("settings", {}).get("direct") or {}).get(remote) if remote else None
        return cfg if isinstance(cfg, dict) else {}

    def fire_entity(self, hub_id: str) -> str | None:
        return self._direct(hub_id).get("entity") or None

    def app_device(self, hub_id: str) -> str | None:
        """Harmony device whose apps the lock watches: the device of the network control that reports apps
        (the Fire TV of the hub). None if the hub has no such device."""
        from . import direct
        from .netent import link_of_entity

        entity = self.fire_entity(hub_id)
        try:
            if not entity or not {"app_read", "app_list"} & set(direct.caps(self.hass, entity)):
                return None
            link = link_of_entity(self.hass, entity)
            return link[1] if link and link[0] == self.remote(hub_id) else None
        except Exception:  # noqa: BLE001 - only a label for the card; registries may not be loaded yet
            return None

    def allowed_apps(self, hub_id: str) -> list[str]:
        entry = self.hub(hub_id)
        if "apps" in entry:
            return entry["apps"]
        old = clean_names(self._direct(hub_id).get("lockApps"))  # list made with 0.2.0 in the main card
        return [LAUNCHER, *(a for a in old if a != LAUNCHER)]

    def allowed_activities(self, hub_id: str) -> list[str]:
        return self.hub(hub_id)["activities"]

    def today_count(self, hub_id: str, now: datetime | None = None) -> int:
        count = self.hub(hub_id).get("count") or {}
        today = dt_util.as_local(now or dt_util.utcnow()).date().isoformat()
        return int(count.get("n", 0)) if count.get("date") == today else 0

    def snapshot(self, hub_id: str) -> dict[str, Any]:
        """Everything a card shows about the lock of one hub."""
        now = dt_util.utcnow()
        entry = self.hub(hub_id)
        until = self.released_until(hub_id, now)
        return {
            "mode": entry["mode"],
            "effective": self.effective(hub_id, now),
            "minutes": self.minutes(hub_id),
            "released_until": until.isoformat() if until else None,
            "activities": list(entry["activities"]),
            "apps": list(self.allowed_apps(hub_id)),
            "app_device": self.app_device(hub_id),
            "off_devices": list(entry["off_devices"]),
            "seen": list(entry["seen"]),
            "schedule": list(entry["schedule"]),
            "log": list(entry["log"]),
            "today": self.today_count(hub_id, now),
        }

    # ---- changes (entities, websocket) ----------------------------------------------------
    async def async_set_mode(self, hub_id: str, mode: str) -> None:
        if mode not in MODES:
            raise ValueError("invalid_mode")
        entry = self.hub(hub_id)
        entry["mode"] = mode
        if mode != MODE_OFF:
            entry["last_mode"] = mode
            entry["released_until"] = None  # switching the lock on (again) ends a release
        await self._changed(hub_id, "manual")

    async def async_set_enabled(self, hub_id: str, value: bool) -> None:
        """The simple switch: on = the mode used last (always, if none), off = off."""
        entry = self.hub(hub_id)
        last = entry.get("last_mode")
        await self.async_set_mode(hub_id, (last if last in (MODE_ALWAYS, MODE_SCHEDULE) else MODE_ALWAYS) if value else MODE_OFF)

    async def async_set_minutes(self, hub_id: str, value: Any) -> None:
        self.hub(hub_id)["minutes"] = clamp_minutes(value)
        await self._changed(hub_id)

    async def async_release(self, hub_id: str, minutes: Any = None) -> None:
        now = dt_util.utcnow()
        entry = self.hub(hub_id)
        length = clamp_minutes(minutes) if minutes is not None else self.minutes(hub_id)
        entry["released_until"] = release_end(now, length).isoformat()
        self._pending.pop(hub_id, None)
        entry["log"] = add_log(entry["log"], now, "release", str(length))
        self._was[hub_id] = self.effective(hub_id, now)
        await self._changed(hub_id)

    async def async_end_release(self, hub_id: str) -> None:
        self.hub(hub_id)["released_until"] = None
        await self._changed(hub_id, "manual")

    async def async_set_lists(
        self, hub_id: str, *, activities: Any = None, apps: Any = None, schedule: Any = None, off_devices: Any = None
    ) -> None:
        entry = self.hub(hub_id)
        if off_devices is not None:
            entry["off_devices"] = clean_names(off_devices)
        if activities is not None:
            entry["activities"] = clean_names(activities)
        if apps is not None:
            entry["apps"] = clean_apps(apps)
        if schedule is not None:
            entry["schedule"] = clean_schedule(schedule)
        await self._changed(hub_id, "manual")

    async def async_clear_log(self, hub_id: str) -> None:
        self.hub(hub_id)["log"] = []
        await self._changed(hub_id)

    def _note_effective(self, hub_id: str, now: datetime, reason: str) -> bool:
        """Write "lock starts / stops working" into the list when that changed. Returns True on a change."""
        now_eff = self.effective(hub_id, now)
        before = self._was.get(hub_id)
        self._was[hub_id] = now_eff
        if before is None or before == now_eff:
            return False
        entry = self.hub(hub_id)
        entry["log"] = add_log(entry["log"], now, "on" if now_eff else "off", reason)
        if not now_eff:
            self._pending.pop(hub_id, None)
        return True

    async def _changed(self, hub_id: str | None = None, reason: str | None = None) -> None:
        if hub_id and reason:
            self._note_effective(hub_id, dt_util.utcnow(), reason)
        await self._store.async_save({"hubs": self.data})
        self._notify()

    # ---- listeners ------------------------------------------------------------------------
    @callback
    def async_add_listener(self, listener: Callable[[], None]) -> Callable[[], None]:
        self._listeners.append(listener)

        def remove() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return remove

    @callback
    def async_add_intervention_listener(self, listener: Callable[[str, str, str], None]) -> Callable[[], None]:
        """Called as listener(hub_id, kind, what) for every intervention of the lock ("fire" or "hub")."""
        self._intervention_listeners.append(listener)

        def remove() -> None:
            if listener in self._intervention_listeners:
                self._intervention_listeners.remove(listener)

        return remove

    @callback
    def _fire_intervention(self, hub_id: str, kind: str, what: str) -> None:
        for listener in list(self._intervention_listeners):
            listener(hub_id, kind, what)

    @callback
    def _notify(self) -> None:
        for listener in list(self._listeners):
            listener()

    # ---- enforcement ----------------------------------------------------------------------
    def _decision(self, hub_id: str, now: datetime) -> tuple[tuple[str, ...], dict[str, Any]]:
        remote_id = self.remote(hub_id)
        remote = self.hass.states.get(remote_id) if remote_id else None
        fire = self.fire_entity(hub_id)
        adb = self.hass.states.get(fire) if fire else None
        activity = None
        if remote and remote.state not in ("off", "unavailable", "unknown"):
            # An activity that is just starting counts as well, so it is stopped early.
            # "PowerOff" can stay in activity_starting after a switch-off; only a real activity counts as starting.
            starting = remote.attributes.get("activity_starting")
            activity = starting if activity_running(starting) else remote.attributes.get("current_activity")
        info = {"remote": remote_id, "activity": activity, "app": adb.attributes.get("app_id") if adb else None, "adb": fire}
        actions = decide(
            effective=self.effective(hub_id, now),
            activity=activity,
            adb_state=adb.state if adb else None,
            adb_app=info["app"],
            allowed=self.allowed_apps(hub_id),
            allowed_activities=self.allowed_activities(hub_id),
        )
        return actions, info

    def check_now(self, hub_id: str) -> dict[str, Any]:
        """What the lock would do at this moment, without doing it (for the test button of the security card)."""
        now = dt_util.utcnow()
        actions, info = self._decision(hub_id, now)
        adb = self.hass.states.get(info["adb"]) if info["adb"] else None
        return {
            "effective": self.effective(hub_id, now),
            "mode": self.mode(hub_id),
            "activity": info["activity"],
            "activity_blocked": "hub" in actions,
            "fire_state": adb.state if adb else None,
            "fire_app": info["app"],
            "fire_blocked": "fire" in actions,
            "has_remote": bool(info["remote"] and self.hass.states.get(info["remote"])),
            "has_fire": bool(info["adb"]),
        }

    async def _tick(self, _now: datetime) -> None:
        now = dt_util.utcnow()
        changed = False
        for hub_id in lock_hubs(self.hass):
            self.hub(hub_id)  # every hub is watched, also before its lock was ever set
        for hub_id in list(self.data):
            try:
                if self._note_seen(hub_id):
                    changed = True
                released = self._time(hub_id, "released_until")
                reason = "release_end" if released and released <= now and self.mode(hub_id) != MODE_OFF else "schedule"
                if self._note_effective(hub_id, now, reason):
                    changed = True
                    if reason == "release_end":
                        self.hub(hub_id)["released_until"] = None
                await self._check(hub_id, now)
            except Exception:  # noqa: BLE001 - the lock must never stop on one error
                _LOGGER.exception("Lock check failed for %s", hub_id)
        if changed:
            await self._changed()

    def _note_seen(self, hub_id: str) -> bool:
        """Remember an app that the Fire TV shows (the installed list lacks pre-installed apps). True if it is new."""
        fire = self.fire_entity(hub_id)
        state = self.hass.states.get(fire) if fire else None
        if state is None or str(state.state).lower() in ("off", "standby", "unavailable", "unknown", ""):
            return False
        package = package_name(state.attributes.get("app_id"))
        entry = self.hub(hub_id)
        if not package or package in entry["seen"]:
            return False
        entry["seen"] = (entry["seen"] + [package])[-MAX_SEEN:]
        return True

    async def _power_off_devices(self, hub_id: str, remote: str) -> None:
        """PowerOff for the devices chosen in the security card (they were switched on by the Fire TV itself, not by the hub)."""
        for device in list(self.hub(hub_id)["off_devices"]):
            try:
                await self.hass.services.async_call(
                    "remote", "send_command", {"entity_id": remote, "device": device, "command": "PowerOff"}, blocking=True
                )
            except Exception:  # noqa: BLE001 - one device must not stop the others
                _LOGGER.warning("Lock %s: PowerOff for %s failed", hub_id, device, exc_info=True)
            await asyncio.sleep(0.5)

    async def _check(self, hub_id: str, now: datetime) -> None:
        actions, info = self._decision(hub_id, now)
        if not actions:
            self._pending.pop(hub_id, None)
            return
        since = self._pending.setdefault(hub_id, now)
        if not ready_to_act(since, now, self._cooldown.get(hub_id)):
            return
        self._pending.pop(hub_id, None)
        self._cooldown[hub_id] = now + timedelta(seconds=COOLDOWN_SECONDS)
        entry = self.hub(hub_id)
        what = []
        if "fire" in actions and info["adb"]:
            await self.hass.services.async_call(
                "androidtv", "adb_command", {"entity_id": info["adb"], "command": "input keyevent 223"}, blocking=False
            )
            what.append(f"Fire TV: {info['app'] or 'playing'}")
            entry["log"] = add_log(entry["log"], now, "fire", str(info["app"] or ""))
            self._fire_intervention(hub_id, "fire", str(info["app"] or ""))
            if entry["off_devices"] and info["remote"]:
                self.hass.async_create_task(self._power_off_devices(hub_id, info["remote"]))
                what.append("+ " + ", ".join(entry["off_devices"]))
        if "hub" in actions and info["remote"]:
            await self.hass.services.async_call("remote", "turn_off", {"entity_id": info["remote"]}, blocking=False)
            what.append(f"Harmony: {info['activity']}")
            entry["log"] = add_log(entry["log"], now, "hub", str(info["activity"] or ""))
            self._fire_intervention(hub_id, "hub", str(info["activity"] or ""))
        if not what:
            return
        today = dt_util.as_local(now).date().isoformat()
        entry["count"] = {"date": today, "n": self.today_count(hub_id, now) + 1}
        entry["last_at"] = now.isoformat()
        entry["last_what"] = ", ".join(what)
        _LOGGER.info("Lock %s: switched off (%s)", hub_id, entry["last_what"])
        await self._changed()
