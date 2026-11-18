"""Values of Home Assistant steps (pure functions, no Home Assistant imports).

A Home Assistant step can carry values ("brightness 60 %", "volume 35 %", "source HDMI 2"). Only values that are
set are sent. Everything about a kind of entity is in one entry of FIELDS (how a value is cleaned), SUPPORT (what
the entity must be able to do) and in _calls (which services carry it out). A new kind is one entry in each.
"""

from __future__ import annotations

import math
from typing import Any, Callable

DEFAULT_VOLUME_CAP = 80          # percent; a stored action never turns a player up further
COLOR_MODES = ("hs", "xy", "rgb", "rgbw", "rgbww")

# Feature bits as Home Assistant defines them (MediaPlayerEntityFeature, CoverEntityFeature, ...).
_MP_VOLUME_SET, _MP_VOLUME_MUTE, _MP_SELECT_SOURCE = 4, 8, 2048
_COVER_SET_POSITION = 4
_CLIMATE_TARGET_TEMPERATURE = 1
_FAN_SET_SPEED = 1


def _num(lo: float, hi: float, digits: int = 0) -> Callable[[Any], float | int | None]:
    def clean(value: Any) -> float | int | None:
        try:
            v = float(value)
        except (TypeError, ValueError):
            return None
        if math.isnan(v) or math.isinf(v):
            return None
        v = round(min(max(v, lo), hi), digits)
        return int(v) if digits == 0 else v
    return clean


def _bool(value: Any) -> bool | None:
    return value if isinstance(value, bool) else None


def _text(value: Any) -> str | None:
    text = " ".join(str(value).split())[:80] if isinstance(value, (str, int, float)) else ""
    return text or None


def _hs(value: Any) -> list[float] | None:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        return None
    hue, sat = _num(0, 360)(value[0]), _num(0, 100)(value[1])
    return None if hue is None or sat is None else [hue, sat]


FIELDS: dict[str, dict[str, Callable[[Any], Any]]] = {
    "light": {"brightness": _num(1, 100), "kelvin": _num(1000, 12000), "color": _hs},
    "media_player": {"volume": _num(0, 100), "mute": _bool, "source": _text},
    "cover": {"position": _num(0, 100)},
    "climate": {"temperature": _num(-50, 100, 1)},
    "fan": {"percentage": _num(0, 100)},
    "number": {"value": _num(-1e9, 1e9, 3)},
    "input_number": {"value": _num(-1e9, 1e9, 3)},
}

# Domains that can only be set (no on / off of their own).
SET_ONLY = ("number", "input_number")


def domain_of(entity: str) -> str:
    return entity.split(".", 1)[0]


def clean_values(entity: str, raw: Any) -> dict[str, Any]:
    """Known values of the entity's kind, each in its range; white (kelvin) and colour exclude each other."""
    fields = FIELDS.get(domain_of(entity))
    if not fields or not isinstance(raw, dict):
        return {}
    out = {k: v for k, clean in fields.items() if k in raw and (v := clean(raw[k])) is not None}
    if "color" in out:
        out.pop("kelvin", None)
    return out


def _light_modes(attrs: dict[str, Any]) -> set[str]:
    return set(attrs.get("supported_color_modes") or [])


def unsupported(entity: str, values: dict[str, Any], attrs: dict[str, Any]) -> str | None:
    """First value the entity cannot take (by what it reports it can do), else None."""
    domain = domain_of(entity)
    feats = int(attrs.get("supported_features") or 0)
    for key in values:
        if domain == "light":
            modes = _light_modes(attrs)
            ok = {"brightness": bool(modes - {"onoff"}), "kelvin": "color_temp" in modes, "color": bool(modes & set(COLOR_MODES))}[key]
        elif domain == "media_player":
            ok = bool(feats & {"volume": _MP_VOLUME_SET, "mute": _MP_VOLUME_MUTE, "source": _MP_SELECT_SOURCE}[key])
        elif domain == "cover":
            ok = bool(feats & _COVER_SET_POSITION)
        elif domain == "climate":
            ok = bool(feats & _CLIMATE_TARGET_TEMPERATURE)
        elif domain == "fan":
            ok = bool(feats & _FAN_SET_SPEED)
        else:
            ok = True
        if not ok:
            return key
    return None


def out_of_range(entity: str, values: dict[str, Any], attrs: dict[str, Any], volume_cap: int = DEFAULT_VOLUME_CAP) -> str | None:
    """Why a value does not fit the entity right now (short, English), else None."""
    domain = domain_of(entity)
    if domain == "media_player":
        if "volume" in values and values["volume"] > volume_cap:
            return f"volume above the limit ({volume_cap} %)"
        if "source" in values:
            sources = attrs.get("source_list")
            if isinstance(sources, list) and values["source"] not in sources:
                return f"unknown source: {values['source']}"
    if domain == "light" and "kelvin" in values:
        lo, hi = attrs.get("min_color_temp_kelvin"), attrs.get("max_color_temp_kelvin")
        if isinstance(lo, (int, float)) and isinstance(hi, (int, float)) and not lo <= values["kelvin"] <= hi:
            return f"colour temperature outside {lo}-{hi} K"
    if domain == "climate" and "temperature" in values:
        lo, hi = attrs.get("min_temp"), attrs.get("max_temp")
        if isinstance(lo, (int, float)) and isinstance(hi, (int, float)) and not lo <= values["temperature"] <= hi:
            return f"temperature outside {lo}-{hi}"
    if domain in SET_ONLY and "value" in values:
        lo, hi = attrs.get("min"), attrs.get("max")
        if isinstance(lo, (int, float)) and isinstance(hi, (int, float)) and not lo <= values["value"] <= hi:
            return f"value outside {lo}-{hi}"
    return None


def calls(entity: str, op: str, values: dict[str, Any]) -> list[tuple[str, str, dict[str, Any]]]:
    """Service calls for a step with values. op "on" switches on first where needed, "set" only sets."""
    domain = domain_of(entity)
    target = {"entity_id": entity}
    out: list[tuple[str, str, dict[str, Any]]] = []
    if domain == "light":
        data = dict(target)
        if "brightness" in values:
            data["brightness_pct"] = values["brightness"]
        if "kelvin" in values:
            data["color_temp_kelvin"] = values["kelvin"]
        if "color" in values:
            data["hs_color"] = values["color"]
        return [("light", "turn_on", data)]
    if domain == "fan" and "percentage" in values:
        return [("fan", "turn_on" if op == "on" else "set_percentage", {**target, "percentage": values["percentage"]})]
    # A cover moves by its position and a thermostat does not need to be "on" for a temperature
    # (many cannot be switched on at all), so only players and the rest are switched on first.
    if op == "on" and domain not in ("cover", "climate", *SET_ONLY):
        out.append((domain if domain == "media_player" else "homeassistant", "turn_on", dict(target)))
    if domain == "media_player":
        if "source" in values:
            out.append(("media_player", "select_source", {**target, "source": values["source"]}))
        if "volume" in values:
            out.append(("media_player", "volume_set", {**target, "volume_level": round(values["volume"] / 100, 2)}))
        if "mute" in values:
            out.append(("media_player", "volume_mute", {**target, "is_volume_muted": values["mute"]}))
    elif domain == "cover" and "position" in values:
        out.append(("cover", "set_cover_position", {**target, "position": values["position"]}))
    elif domain == "climate" and "temperature" in values:
        out.append(("climate", "set_temperature", {**target, "temperature": values["temperature"]}))
    elif domain in SET_ONLY and "value" in values:
        out.append((domain, "set_value", {**target, "value": values["value"]}))
    return out
