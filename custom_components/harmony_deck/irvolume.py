"""Volume over infrared (pure functions, no Home Assistant imports).

An infrared device does not tell its volume. To reach a level anyway, Harmony Deck first sends "volume down"
often enough that the device is surely at 0, then "volume up" as often as the level needs. Going down first
means there is never a loud jump. Per device the user sets the highest level, how much one press changes it and
how fast the device takes presses; stored globally as {hub: {device: {"max", "step", "delay"}}}.
"""

from __future__ import annotations

import math
import re
from typing import Any

DEFAULTS = {"max": 100, "step": 1.0, "delay": 0.4}
CHUNK = 10              # presses per service call, so a stop takes effect within a few seconds
_UP = re.compile(r"^vol(ume)?[\s_-]*(up|\+)$", re.I)
_DOWN = re.compile(r"^vol(ume)?[\s_-]*(down|-)$", re.I)


def _num(value: Any, lo: float, hi: float, default: float) -> float:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return default
    return default if math.isnan(v) else min(max(v, lo), hi)


def clean_device(raw: Any) -> dict[str, float]:
    raw = raw if isinstance(raw, dict) else {}
    return {
        "max": int(_num(raw.get("max"), 1, 200, DEFAULTS["max"])),
        "step": round(_num(raw.get("step"), 0.5, 20, DEFAULTS["step"]), 1),
        "delay": round(_num(raw.get("delay"), 0.1, 2, DEFAULTS["delay"]), 1),
    }


def clean_config(raw: Any) -> dict[str, dict[str, dict[str, float]]]:
    out: dict[str, dict[str, dict[str, float]]] = {}
    for hub, devices in (raw.items() if isinstance(raw, dict) else []):
        if isinstance(hub, str) and isinstance(devices, dict):
            kept = {str(d)[:120]: clean_device(c) for d, c in devices.items() if isinstance(d, str) and d}
            if kept:
                out[hub] = kept
    return out


def device_config(config: Any, hub: str, device: str) -> dict[str, float]:
    return clean_device(((config or {}).get(hub) or {}).get(device) if isinstance(config, dict) else None)


def commands(cmds: list[str]) -> tuple[str | None, str | None]:
    """(up, down) command names of a device, as the hub calls them."""
    up = next((c for c in cmds if _UP.match(c)), None)
    down = next((c for c in cmds if _DOWN.match(c)), None)
    return up, down


def plan(cfg: dict[str, float], level: float) -> tuple[int, int]:
    """Presses (down, up): down a little more than the whole range, then up to the level."""
    full = math.ceil(cfg["max"] / cfg["step"])
    down = full + max(2, math.ceil(full * 0.1))
    up = round(min(level, cfg["max"]) / cfg["step"])
    return down, up


def duration(cfg: dict[str, float], level: float) -> float:
    down, up = plan(cfg, level)
    return round((down + up) * cfg["delay"], 1)


def chunks(presses: int) -> list[int]:
    return [CHUNK] * (presses // CHUNK) + ([presses % CHUNK] if presses % CHUNK else [])
