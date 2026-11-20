"""Target against actual state of direct devices (pure functions, no Home Assistant imports).

Harmony knows what each activity needs (hub.activity_setup: device on, on which input). A linked direct device
says what it really does. Where both differ, the card offers a fix; nothing is switched by itself.

Rules:
- A device the current activity switches on should be on; one that only other activities switch on should be
  off (Harmony switches it off when it changes activities). Devices Harmony never switches, or switches by hand
  ("manual"), are left alone. With no activity (PowerOff) every device Harmony switches should be off.
- An input is compared only when the device should be on, is on, and the activity names an input. The source
  that belongs to that input is the user's choice (stored per device) or, failing that, a guess.
- 0.19.1, only for "should be off but is on": for GRACE seconds after an activity change nothing is said (the
  devices settle, Harmony switches them off itself); a player that only shows its home screen or screensaver
  counts as off (standby_like); per device "offCheck" says "watch" (default), "quiet" (shown as a calm note,
  item gets "quiet": True) or "ignore" (never said). "Should be on" and inputs stay as they were.
"""

from __future__ import annotations

import re
from typing import Any

POWER_OFF = "PowerOff"
_WORD = re.compile(r"[a-z0-9]+")
_NOISE = {"input", "eingang"}
GRACE = 60.0            # seconds after an activity change without "should be off"
# Home screens and screensavers of Fire TV / Android TV players: on, but nothing is used.
_IDLE_APPS = {"com.amazon.tv.launcher", "com.amazon.bueller.photos", "com.amazon.ftv.screensaver",
              "com.google.android.tvlauncher", "com.google.android.leanbacklauncher", "com.google.android.apps.tv.launcherx",
              "com.google.android.backdrop"}


def standby_like(state: Any, attrs: dict[str, Any] | None) -> bool:
    """True when a player is as good as off: "standby", or idle on its home screen / screensaver. When unsure, False."""
    if state == "standby":
        return True
    app = (attrs or {}).get("app_id")
    return state in ("idle", "on") and isinstance(app, str) and app in _IDLE_APPS


def _alnum(text: Any) -> str:
    """"InputHdmi2", "Input HDMI 2", "HDMI_2" and "hdmi 2" all become "hdmi2"."""
    key = "".join(_WORD.findall(str(text or "").casefold()))
    for noise in _NOISE:
        if key.startswith(noise) and len(key) > len(noise):
            key = key[len(noise):]
    return key


def _words(text: Any) -> set[str]:
    return {w for w in _WORD.findall(str(text or "").casefold()) if len(w) >= 2 and w not in _NOISE}


def guess_source(harmony_input: str, sources: list[str], others: list[str]) -> str | None:
    """Source of a player that belongs to a Harmony input, or None if it is not clear.

    First by name ("InputHdmi2" = "HDMI 2" = "hdmi_2"), then by the device the activity uses on that input
    ("Amazon Fire TV Cube" = the source a TV calls "Fire TV"). Only a single hit counts.
    """
    key = _alnum(harmony_input)
    if key:
        same = [s for s in sources if _alnum(s) == key]
        if len(same) == 1:
            return same[0]
    hits = [s for s in sources if any(_words(s) and _words(s) <= _words(o) for o in others)]
    return hits[0] if len(hits) == 1 else None


def _switched(setup: dict[str, list[dict[str, Any]]]) -> set[str]:
    """Devices that some activity switches on."""
    return {item["device"] for items in setup.values() for item in items if item.get("power")}


def check(activity: str | None, setup: dict[str, list[dict[str, Any]]], links: dict[str, dict[str, Any]],
          states: dict[str, dict[str, Any]], sources: dict[str, list[str]] | None = None,
          since_change: float | None = None) -> list[dict[str, Any]]:
    """Differences for the linked devices of one hub, each with the fix the card offers.

    links: {device: {"entity", "inputs": {harmony input: source}}}; states: {device: directdev.snapshot};
    sources: {device: source list of its player}; since_change: seconds since the activity changed (None = long ago).
    states may carry "standby": True (standby_like) and links "offCheck".
    Result items: {"device", "kind": "power", "want": bool, "fix": "on" | "off"} or
    {"device", "kind": "input", "input", "source", "want": source, "fix": "source", "value": source}.
    """
    sources = sources or {}
    items = [] if not activity or activity == POWER_OFF else (setup.get(activity) or [])
    wanted = {i["device"]: i for i in items if i.get("power")}
    manual = {i["device"] for i in items if i.get("manual")}
    switched = _switched(setup)
    out: list[dict[str, Any]] = []
    for device, link in links.items():
        snap = states.get(device) or {}
        on = snap.get("on")
        if on is None or device in manual or (device not in wanted and device not in switched):
            continue
        want = device in wanted
        if not want and on:
            mode = link.get("offCheck") or "watch"
            if mode == "ignore" or snap.get("standby") or (since_change is not None and since_change < GRACE):
                continue
            out.append({"device": device, "kind": "power", "want": False, "fix": "off", **({"quiet": True} if mode == "quiet" else {})})
            continue
        if on != want:
            out.append({"device": device, "kind": "power", "want": want, "fix": "on"})
            continue
        harmony_input = wanted.get(device, {}).get("input")
        current = snap.get("source")
        if not want or not harmony_input or not isinstance(current, str):
            continue
        target = (link.get("inputs") or {}).get(harmony_input)
        if target is None:
            others = [d for d in wanted if d != device]
            target = guess_source(harmony_input, sources.get(device) or [], others)
        if target and target != current:
            out.append({"device": device, "kind": "input", "input": harmony_input, "source": current,
                        "want": target, "fix": "source", "value": target})
    return out
