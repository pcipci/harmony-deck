"""Rules of the lock (pure functions, no Home Assistant imports, so they can be tested alone)."""

from __future__ import annotations

from datetime import datetime, timedelta
import re
from typing import Any, Iterable

# The Fire TV start screen: allowed by default (on the list), but the user may take it off.
# Without it no other app can be allowed (the Fire TV cannot be used without its start screen).
LAUNCHER = "com.amazon.tv.launcher"
DEFAULT_ALLOWED = (LAUNCHER,)
GRACE_SECONDS = 3
COOLDOWN_SECONDS = 10
MIN_RELEASE = 5
MAX_RELEASE = 480
DEFAULT_RELEASE = 60

MODE_OFF = "off"
MODE_ALWAYS = "always"
MODE_SCHEDULE = "schedule"
MODES = (MODE_OFF, MODE_ALWAYS, MODE_SCHEDULE)

MAX_WINDOWS = 20
MAX_LOG = 100
MAX_NAMES = 200
MAX_SEEN = 100

_OFF_ACTIVITIES = {"", "poweroff", "unknown", "unavailable", "none"}
_OFF_STATES = {"off", "standby", "unavailable", "unknown", "", "none"}


def activity_running(activity: Any) -> bool:
    """True if the hub reports a running activity (anything but PowerOff / unknown)."""
    return str(activity or "").strip().lower() not in _OFF_ACTIVITIES


def activity_violation(activity: Any, allowed: Iterable[str] = ()) -> bool:
    """True if an activity runs that is not on the allowed list (the default: every activity is blocked)."""
    return activity_running(activity) and str(activity).strip() not in set(allowed)


def fire_violation(adb_state: Any, adb_app: Any, allowed: Iterable[str]) -> bool:
    """True if the Fire TV shows or plays something that is not on the allowed list.

    Off or standby is fine. An unknown app while it is on is not touched (we do not guess).
    Playing or paused without a known app counts as a violation.
    """
    state = str(adb_state or "").strip().lower()
    if state in _OFF_STATES:
        return False
    app = str(adb_app or "").strip()
    if app:
        return app not in set(allowed)
    return state in ("playing", "paused")


def decide(
    *, effective: bool, activity: Any, adb_state: Any, adb_app: Any, allowed: Iterable[str], allowed_activities: Iterable[str] = ()
) -> tuple[str, ...]:
    """What to switch off right now: () nothing, ("hub",), ("fire",) or both."""
    if not effective:
        return ()
    actions = []
    if activity_violation(activity, allowed_activities):
        actions.append("hub")
    if fire_violation(adb_state, adb_app, allowed):
        actions.append("fire")
    return tuple(actions)


# ---- schedule ------------------------------------------------------------------------------
def parse_hhmm(value: Any) -> int | None:
    """Minutes since midnight for "HH:MM" (also "24:00"), else None."""
    try:
        hours, minutes = str(value).strip().split(":")[:2]
        hours, minutes = int(hours), int(minutes)
    except (ValueError, TypeError):
        return None
    total = hours * 60 + minutes
    if hours < 0 or not 0 <= minutes < 60 or total > 24 * 60:
        return None
    return total


def _hhmm(total: int) -> str:
    return f"{total // 60:02d}:{total % 60:02d}"


def clean_schedule(raw: Any) -> list[dict[str, Any]]:
    """Valid time windows only: [{"days": [0..6] (0 = Monday), "from": "HH:MM", "to": "HH:MM"}].

    A window whose end is not after its start runs over midnight into the next day; equal times mean the whole day.
    """
    out: list[dict[str, Any]] = []
    if not isinstance(raw, list):
        return out
    for item in raw[:MAX_WINDOWS]:
        if not isinstance(item, dict):
            continue
        start, end = parse_hhmm(item.get("from")), parse_hhmm(item.get("to"))
        days = item.get("days")
        if start is None or end is None or not isinstance(days, (list, tuple)):
            continue
        clean_days = sorted({int(d) for d in days if isinstance(d, (int, float)) and not isinstance(d, bool) and 0 <= int(d) <= 6})
        if not clean_days:
            continue
        out.append({"days": clean_days, "from": _hhmm(start % (24 * 60)), "to": _hhmm(end % (24 * 60))})
    return out


def in_schedule(schedule: Iterable[dict[str, Any]], local: datetime) -> bool:
    """True if the local time lies in one of the windows."""
    minute = local.hour * 60 + local.minute
    day = local.weekday()
    before = (day - 1) % 7
    for window in schedule or ():
        start, end = parse_hhmm(window.get("from")), parse_hhmm(window.get("to"))
        days = window.get("days") or ()
        if start is None or end is None:
            continue
        if start < end:
            if day in days and start <= minute < end:
                return True
        else:  # over midnight (or the whole day when both are equal)
            if day in days and minute >= start:
                return True
            if before in days and minute < end:
                return True
    return False


def is_effective(mode: Any, schedule: Iterable[dict[str, Any]], released_until: datetime | None, now: datetime, local: datetime) -> bool:
    """The lock works while its mode says so (always, or inside a time window) and it is not released."""
    if released_until is not None and released_until > now:
        return False
    if mode == MODE_ALWAYS:
        return True
    return mode == MODE_SCHEDULE and in_schedule(schedule, local)


def clean_mode(value: Any, default: str = MODE_OFF) -> str:
    return value if value in MODES else default


def clean_names(raw: Any) -> list[str]:
    """List of distinct non-empty strings (activity names or package names), order kept."""
    out: list[str] = []
    if not isinstance(raw, (list, tuple)):
        return out
    for item in raw:
        if isinstance(item, str) and item.strip() and item.strip() not in out:
            out.append(item.strip())
    return out[:MAX_NAMES]


def package_name(value: Any) -> str | None:
    """The app id if it looks like an Android package name, else None."""
    text = str(value or "").strip()
    return text if re.fullmatch(r"[A-Za-z][\w]*(\.[\w]+)+", text) else None


def clamp_minutes(value: Any) -> int:
    try:
        minutes = int(round(float(value)))
    except (TypeError, ValueError, OverflowError):
        return DEFAULT_RELEASE
    return max(MIN_RELEASE, min(MAX_RELEASE, minutes))


def release_end(now: datetime, minutes: Any) -> datetime:
    return now + timedelta(minutes=clamp_minutes(minutes))


def ready_to_act(pending_since: datetime | None, now: datetime, cooldown_until: datetime | None) -> bool:
    """Act only after the grace time and outside of the pause that follows an intervention."""
    if pending_since is None:
        return False
    if cooldown_until is not None and now < cooldown_until:
        return False
    return (now - pending_since).total_seconds() >= GRACE_SECONDS


# ---- list of interventions ------------------------------------------------------------------
LOG_KINDS = ("on", "off", "release", "hub", "fire")


def add_log(log: list[dict[str, Any]] | None, at: datetime, kind: str, what: str = "") -> list[dict[str, Any]]:
    """Append an entry and keep the newest MAX_LOG. Kinds: on / off (lock starts / stops working), release, hub, fire."""
    entries = list(log or [])
    entries.append({"at": at.isoformat(), "kind": kind, "what": what})
    return entries[-MAX_LOG:]


def clean_apps(apps: Any) -> list[str]:
    """Allowed apps as stored: without the start screen nothing else can be allowed."""
    names = clean_names(apps)
    return names if LAUNCHER in names else []


def migrate_hub(raw: Any) -> dict[str, Any]:
    """Bring one stored hub entry into the current layout (0.2.0 stored only enabled / minutes)."""
    raw = dict(raw) if isinstance(raw, dict) else {}
    mode = raw.get("mode")
    if mode not in MODES:
        mode = MODE_ALWAYS if raw.get("enabled") else MODE_OFF
    last = raw.get("last_mode")
    out = {
        "mode": mode,
        "last_mode": last if last in (MODE_ALWAYS, MODE_SCHEDULE) else (mode if mode != MODE_OFF else MODE_ALWAYS),
        "minutes": clamp_minutes(raw.get("minutes", DEFAULT_RELEASE)),
        "released_until": raw.get("released_until") or None,
        "activities": clean_names(raw.get("activities")),
        "off_devices": clean_names(raw.get("off_devices")),
        "seen": clean_names(raw.get("seen"))[-MAX_SEEN:],
        "schedule": clean_schedule(raw.get("schedule")),
        "log": [e for e in (raw.get("log") or []) if isinstance(e, dict) and e.get("at") and e.get("kind") in LOG_KINDS][-MAX_LOG:],
        "last_at": raw.get("last_at"),
        "last_what": raw.get("last_what"),
        "count": raw.get("count") if isinstance(raw.get("count"), dict) else None,
    }
    if isinstance(raw.get("apps"), list):  # absent = not set yet (taken over once from the card settings of 0.2.0)
        apps = clean_names(raw["apps"])
        # Up to 0.3.4 the start screen was always allowed and never stored: put it on the list once.
        out["apps"] = apps if raw.get("launcher_listed") else [LAUNCHER, *(a for a in apps if a != LAUNCHER)]
    out["launcher_listed"] = True
    return out
