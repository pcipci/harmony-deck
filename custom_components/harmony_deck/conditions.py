"""Conditions of the steps "Wait until" and "If" (pure functions, no Home Assistant imports).

A condition looks at one Home Assistant entity, its state or one of its attributes, and compares it with a
value. Nothing here knows any kind of device: "the TV is on", "Harmony runs Fire TV" (attribute
current_activity of the hub) or "the volume is above 30" are all the same form::

    {"entity": "media_player.tv", "attr": "", "op": "is", "value": "on"}
    {"entity": "remote.living_room", "attr": "current_activity", "op": "is", "value": "Fire TV"}
    {"entity": "media_player.avr", "attr": "volume_level", "op": "gt", "value": 0.3}
"""

from __future__ import annotations

import math
import re
from typing import Any

OPS = ("is", "not", "gt", "lt", "ge", "le")
NUMERIC = ("gt", "lt", "ge", "le")
_ENTITY = re.compile(r"^[a-z_]+\.[a-z0-9_]+$")
_ATTR = re.compile(r"^[A-Za-z0-9_]{1,60}$")


def _number(value: Any) -> float | None:
    if isinstance(value, bool):
        return None
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(v) or math.isinf(v) else v


def clean_condition(raw: Any) -> dict[str, Any] | None:
    """A valid condition, or None. Numeric comparisons keep a number, the others a short text."""
    if not isinstance(raw, dict):
        return None
    entity = str(raw.get("entity") or "").strip()
    attr = str(raw.get("attr") or "").strip()
    op = raw.get("op") if raw.get("op") in OPS else "is"
    if not _ENTITY.match(entity) or (attr and not _ATTR.match(attr)):
        return None
    if op in NUMERIC:
        value: Any = _number(raw.get("value"))
        if value is None:
            return None
    else:
        raw_value = raw.get("value")
        value = _text(raw_value) if isinstance(raw_value, (str, int, float)) else ""
        value = " ".join(value.split())[:80]
    return {"entity": entity, "attr": attr, "op": op, "value": value}


def _text(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, float) and value.is_integer():
        return str(int(value))
    return str(value)


def holds(cond: dict[str, Any], state: str | None, attrs: dict[str, Any] | None) -> bool:
    """Whether the condition is true for an entity with this state and these attributes.

    A missing entity or attribute is "nothing": "is" is false, "is not" is true, a comparison is false.
    Texts are compared without regard to case ("On" is "on").
    """
    if state is None:
        current: Any = None
    elif cond["attr"]:
        current = (attrs or {}).get(cond["attr"])
    else:
        current = state
    op = cond["op"]
    if op in NUMERIC:
        num = _number(current)
        if num is None:
            return False
        ref = float(cond["value"])
        return {"gt": num > ref, "lt": num < ref, "ge": num >= ref, "le": num <= ref}[op]
    if current is None:
        return op == "not"
    same = _text(current).casefold() == _text(cond["value"]).casefold()
    return same if op == "is" else not same
