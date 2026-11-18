"""Actions: data model (pure functions, no Home Assistant imports).

An action is something Harmony Deck itself starts: a name, a symbol and a list of steps. An action with more
than one step is called a sequence. Stored per hub (remote entity id) in the global settings::

    {"remote.living_room": [{"id": "k3f9", "name": "Unlock DVD", "icon": "mdi:disc", "scope": "", "tile": false, "favs": [{"d": "Panasonic", "c": "Play"}],
                             "steps": [{"type": "key", "device": "Panasonic", "command": "Input", "repeat": 1},
                                       {"type": "pause", "secs": 2},
                                       {"type": "ha", "entity": "script.candles", "op": "run"}]}]}

Every step type cleans its own fields (see STEP_CLEANERS); a new type adds one cleaner here and one runner in
steps.py, nothing else changes. Actions of older versions ({"entity", "op"}) become one "ha" step.
"""

from __future__ import annotations

import re
from typing import Any, Callable

MAX_ACTIONS = 60          # per hub
MAX_STEPS = 50            # per action
MAX_PAUSE = 300.0         # seconds, one pause
MAX_RUNTIME = 600.0       # seconds, a whole run
MAX_REPEAT = 10
MAX_TEXT = 60
MAX_FAVS = 40            # favourite keys per action
HA_OPS = ("toggle", "on", "off", "run")
_ENTITY = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")
_ID = re.compile(r"^[A-Za-z0-9_-]{1,40}$")


def _text(value: Any, limit: int = MAX_TEXT) -> str:
    return " ".join(str(value).split())[:limit] if isinstance(value, (str, int, float)) else ""


def _key(step: dict[str, Any]) -> dict[str, Any] | None:
    device, command = _text(step.get("device"), 120), _text(step.get("command"), 120)
    if not device or not command:
        return None
    try:
        repeat = int(step.get("repeat") or 1)
    except (TypeError, ValueError):
        repeat = 1
    return {"type": "key", "device": device, "command": command, "repeat": min(max(repeat, 1), MAX_REPEAT)}


def _pause(step: dict[str, Any]) -> dict[str, Any] | None:
    try:
        secs = float(step.get("secs"))
    except (TypeError, ValueError):
        return None
    if secs != secs or secs <= 0:  # NaN or nothing to wait
        return None
    return {"type": "pause", "secs": round(min(secs, MAX_PAUSE), 1)}


def _ha(step: dict[str, Any]) -> dict[str, Any] | None:
    entity = str(step.get("entity") or "").strip()
    if not _ENTITY.match(entity):
        return None
    op = step.get("op") if step.get("op") in HA_OPS else "toggle"
    if op == "toggle" and step.get("op") == "activate":  # name used by 0.4
        op = "run"
    return {"type": "ha", "entity": entity, "op": op}


STEP_CLEANERS: dict[str, Callable[[dict[str, Any]], dict[str, Any] | None]] = {"key": _key, "pause": _pause, "ha": _ha}


def clean_step(step: Any) -> dict[str, Any] | None:
    """A valid step of a known type, or None. An own label (optional) is kept on every type."""
    if not isinstance(step, dict):
        return None
    cleaner = STEP_CLEANERS.get(step.get("type"))
    out = cleaner(step) if cleaner else None
    if out is not None and (label := _text(step.get("label"))):
        out["label"] = label
    return out


def clean_steps(steps: Any) -> list[dict[str, Any]]:
    out = [s for s in (clean_step(x) for x in (steps if isinstance(steps, list) else [])) if s]
    return out[:MAX_STEPS]


def clean_favs(raw: Any) -> list[dict[str, str]]:
    """Favourite keys of an action: [{"d": device, "c": command}], unique, at most MAX_FAVS."""
    out: list[dict[str, str]] = []
    seen: set[tuple[str, str]] = set()
    for fav in raw if isinstance(raw, list) else []:
        if not isinstance(fav, dict):
            continue
        key = (_text(fav.get("d"), 120), _text(fav.get("c"), 120))
        if key[0] and key[1] and key not in seen:
            seen.add(key)
            out.append({"d": key[0], "c": key[1]})
    return out[:MAX_FAVS]


def clean_action(action: Any, index: int = 0) -> dict[str, Any] | None:
    """One action in the current form; an action of 0.4 ({entity, op}) becomes a single "ha" step."""
    if not isinstance(action, dict):
        return None
    steps = action.get("steps")
    if steps is None and action.get("entity"):
        steps = [{"type": "ha", "entity": action.get("entity"), "op": action.get("op")}]
    steps = clean_steps(steps)
    name = _text(action.get("name"))
    if not steps or not name:
        return None
    ident = str(action.get("id") or "")
    return {
        "id": ident if _ID.match(ident) else f"a{index}",
        "name": name,
        "icon": _text(action.get("icon"), 80) or "mdi:flash",
        "scope": _text(action.get("scope"), 120),
        "tile": bool(action.get("tile")),
        "favs": clean_favs(action.get("favs")),
        "steps": steps,
    }


def clean_actions(raw: Any) -> dict[str, list[dict[str, Any]]]:
    """All actions as stored: {remote entity id: [action, ...]}; ids unique per hub, invalid entries dropped."""
    out: dict[str, list[dict[str, Any]]] = {}
    for hub, actions in (raw.items() if isinstance(raw, dict) else []):
        if not isinstance(hub, str) or not isinstance(actions, list):
            continue
        seen: set[str] = set()
        kept = []
        for n, action in enumerate(actions):
            clean = clean_action(action, n)
            if clean is None:
                continue
            while clean["id"] in seen:
                clean["id"] += "x"
            seen.add(clean["id"])
            kept.append(clean)
        if kept:
            out[hub] = kept[:MAX_ACTIONS]
    return out


def find_action(actions: dict[str, list[dict[str, Any]]], hub: str, key: str) -> dict[str, Any] | None:
    """Action of a hub by id, else by name (case does not matter)."""
    items = actions.get(hub) or []
    for action in items:
        if action["id"] == key:
            return action
    folded = str(key).casefold()
    return next((a for a in items if a["name"].casefold() == folded), None)


def runtime(steps: list[dict[str, Any]]) -> float:
    """Sum of the pauses (the least a run takes)."""
    return sum(s.get("secs", 0) for s in steps if s.get("type") == "pause")
