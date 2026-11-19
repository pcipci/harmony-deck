"""Direct devices: data model and capabilities (pure functions, no Home Assistant imports).

A direct device is a Home Assistant entity that belongs to a Harmony device and that Harmony Deck can talk to
without the hub, for example the TV as a ``media_player``. The hub keeps sending the keys; the direct device adds
what infrared cannot do (read the state, set a volume level, pick a source). Stored globally as::

    {"remote.living_room": {"LG TV": {"entity": "media_player.tv", "volumeDirect": false,
                                      "inputs": {"InputHdmi2": "Fire TV"}}}}

"inputs" says which source of the player belongs to a Harmony input (for the input check in mismatch.py).

Everything else in Harmony Deck (card, step "Device", infrared volume) asks only for capabilities (CAPS) and
never for a kind of device. Which capabilities an entity has is read here from what Home Assistant reports;
extensions (direct.py) may add more on top.
"""

from __future__ import annotations

import math
import re
from typing import Any

CAPS = ("state", "power_on", "power_off", "volume_set", "volume_read", "mute", "source_select", "source_read")

MAX_INPUTS = 20         # Harmony inputs mapped to sources, per device

# What a step "Device" can do and which capability it needs.
OPS: dict[str, str] = {"on": "power_on", "off": "power_off", "volume": "volume_set", "mute": "mute", "source": "source_select"}

# MediaPlayerEntityFeature bits as Home Assistant defines them.
_VOLUME_SET, _VOLUME_MUTE, _TURN_ON, _TURN_OFF, _SELECT_SOURCE = 4, 8, 128, 256, 2048
_OFF = ("off", "standby")
_UNKNOWN = ("unavailable", "unknown")
_ENTITY = re.compile(r"^media_player\.[a-z0-9_]+$")
_WORD = re.compile(r"[a-z0-9]+")


def media_caps(state: str | None, attrs: dict[str, Any] | None) -> list[str]:
    """Capabilities of a media_player by its state and attributes (in the order of CAPS)."""
    if state is None:
        return []
    attrs = attrs or {}
    try:
        feats = int(attrs.get("supported_features") or 0)
    except (TypeError, ValueError):
        feats = 0
    found = {
        "state": state not in _UNKNOWN,
        "power_on": bool(feats & _TURN_ON),
        "power_off": bool(feats & _TURN_OFF),
        "volume_set": bool(feats & _VOLUME_SET),
        "volume_read": isinstance(attrs.get("volume_level"), (int, float)),
        "mute": bool(feats & _VOLUME_MUTE),
        "source_select": bool(feats & _SELECT_SOURCE),
        "source_read": isinstance(attrs.get("source"), str),
    }
    return [c for c in CAPS if found[c]]


def snapshot(state: str | None, attrs: dict[str, Any] | None) -> dict[str, Any]:
    """What the device reports now: on (True / False / None = unknown), volume in percent, mute, source, app."""
    attrs = attrs or {}
    on = None if state is None or state in _UNKNOWN else state not in _OFF
    level = attrs.get("volume_level")
    volume = round(level * 100) if isinstance(level, (int, float)) and not isinstance(level, bool) and math.isfinite(level) else None
    muted = attrs.get("is_volume_muted")
    out: dict[str, Any] = {"on": on, "volume": volume, "muted": muted if isinstance(muted, bool) else None,
                           "source": attrs.get("source") if isinstance(attrs.get("source"), str) else None}
    if isinstance(attrs.get("app_name"), str):
        out["app"] = attrs["app_name"]
    return out


def clean_device(raw: Any) -> dict[str, Any] | None:
    if not isinstance(raw, dict):
        return None
    entity = str(raw.get("entity") or "").strip()
    if not _ENTITY.match(entity):
        return None
    out: dict[str, Any] = {"entity": entity, "volumeDirect": raw.get("volumeDirect") is True}
    inputs = raw.get("inputs")
    if isinstance(inputs, dict):
        kept = {k[:60]: " ".join(v.split())[:80] for k, v in list(inputs.items())[:MAX_INPUTS]
                if isinstance(k, str) and k and isinstance(v, str) and v.strip()}
        if kept:
            out["inputs"] = kept
    return out


def clean_config(raw: Any) -> dict[str, dict[str, dict[str, Any]]]:
    """{hub: {device label: {"entity", "volumeDirect", "inputs"?}}}; invalid entries dropped."""
    out: dict[str, dict[str, dict[str, Any]]] = {}
    for hub, devices in (raw.items() if isinstance(raw, dict) else []):
        if not isinstance(hub, str) or not isinstance(devices, dict):
            continue
        kept = {}
        for label, cfg in devices.items():
            clean = clean_device(cfg)
            if isinstance(label, str) and label and clean:
                kept[label[:120]] = clean
        if kept:
            out[hub] = kept
    return out


def device_of(config: Any, hub: str, device: str) -> dict[str, Any] | None:
    """The direct device of a Harmony device, or None."""
    if not isinstance(config, dict):
        return None
    return clean_device((config.get(hub) or {}).get(device) if isinstance(config.get(hub), dict) else None)


def _words(text: Any) -> set[str]:
    return {w for w in _WORD.findall(str(text or "").casefold()) if len(w) >= 2}


def _alnum(text: Any) -> str:
    return "".join(_WORD.findall(str(text or "").casefold()))


# Kinds of devices, by Harmony's device type, by words in a name, and by a player's device_class.
_KIND_WORDS = {
    "tv": {"tv", "television", "fernseher", "fernsehgerat", "телевизор", "lcd", "oled"},
    "receiver": {"receiver", "avr", "verstarker", "amplifier", "amp", "stereoreceiver", "audiovideoreceiver", "усилитель", "ресивер"},
    "speaker": {"speaker", "soundbar", "lautsprecher", "колонка"},
    "player": {"bluray", "blu", "dvd", "dvr", "recorder", "player", "плеер"},
    "streamer": {"fire", "firetv", "chromecast", "shield", "apple", "roku", "stick", "cube"},
}
_UMLAUT = str.maketrans({"ä": "a", "ö": "o", "ü": "u", "ß": "ss"})


def kind_of(*texts: Any) -> str | None:
    """"tv", "receiver", "speaker", "player" or "streamer" if a text (type, name, device_class) says so clearly, else None."""
    found = set()
    for text in texts:
        words = {w.translate(_UMLAUT) for w in re.findall(r"\w+", str(text or "").casefold())}
        for kind, known in _KIND_WORDS.items():
            if words & known:
                found.add(kind)
    return found.pop() if len(found) == 1 else None


def _score_parts(meta: dict[str, Any], cand: dict[str, Any], area: str | None = None) -> dict[str, int]:
    """Points of a candidate for a Harmony device, by reason (room, kind, maker, model, name)."""
    parts: dict[str, int] = {}
    if area and cand.get("area") and _alnum(area) == _alnum(cand["area"]):
        parts["room"] = 3
    mine, theirs = kind_of(meta.get("type"), meta.get("label")), kind_of(cand.get("kind"))
    if mine and theirs:
        parts["kind"] = 2 if mine == theirs else -6
    maker_a, maker_b = _alnum(meta.get("manufacturer")), _alnum(cand.get("manufacturer"))
    if maker_a and maker_b and (maker_a in maker_b or maker_b in maker_a):
        parts["maker"] = 2
    model_a, model_b = _alnum(meta.get("model")), _alnum(cand.get("model"))
    if len(model_a) >= 3 and len(model_b) >= 3 and (model_a in model_b or model_b in model_a):
        parts["model"] = 3
    names = _words(cand.get("name")) | _words(str(cand.get("entity", "")).split(".", 1)[-1].replace("_", " "))
    shared = _words(meta.get("label")) & names
    if shared:
        parts["name"] = len(shared)
        if shared - _words(meta.get("manufacturer")) - _words(cand.get("manufacturer")):
            parts["named"] = 0      # a shared word that is not the maker (e.g. the room in the name): evidence, no points
    return parts


def match_score(meta: dict[str, Any], cand: dict[str, Any], area: str | None = None) -> int:
    """How well an entity fits a Harmony device.

    Same room as the hub 3, same model 3, same maker 2, same kind (TV, receiver, speaker) 2, every shared name word 1;
    a different kind costs 6, so a Blu-ray player of the same maker does not win over the TV.
    """
    return sum(_score_parts(meta, cand, area).values())


def ranked(meta: dict[str, Any], candidates: list[dict[str, Any]], area: str | None = None) -> list[tuple[int, str]]:
    """(score, entity), best first; equal scores keep the order of the candidates."""
    return sorted(((match_score(meta, c, area), c["entity"]) for c in candidates), key=lambda x: -x[0])


# Evidence a suggestion needs besides the maker: the same room, model or kind, or a shared name word that is not the maker.
_EVIDENCE = ("room", "model", "named")


def _evident(parts: dict[str, int]) -> bool:
    return any(k in parts for k in _EVIDENCE) or parts.get("kind", 0) > 0


def suggest(meta: dict[str, Any], candidates: list[dict[str, Any]], area: str | None = None) -> str | None:
    """Entity that fits a Harmony device clearly better than all others, else None (the user picks).

    The best one needs at least 3 points, real evidence (room, model or kind; a maker alone is not enough,
    many makers build TVs, players and speakers), must be able to switch or pick a source (not only play),
    and must be ahead of the second.
    """
    scored = sorted(((_score_parts(meta, c, area), c) for c in candidates), key=lambda x: -sum(x[0].values()))
    if not scored:
        return None
    parts, best = scored[0]
    top = sum(parts.values())
    if top < 3 or not _evident(parts) or ("caps" in best and only_plays(best["caps"])):
        return None
    if len(scored) > 1 and sum(scored[1][0].values()) == top:
        return None
    return best["entity"]


# Integrations whose players only play something (AirPlay, DLNA, multiroom audio): never a Harmony device's player.
PLAYBACK_PLATFORMS = frozenset({"airplay", "dlna_dmr", "music_assistant", "mass", "snapcast", "squeezebox", "slimproto",
                                "forked_daapd", "mpd", "vlc", "vlc_telnet", "spotify", "plex", "jellyfin", "emby"})
_PLAYBACK_WORDS = {"airplay", "dlna", "upnp", "spotify", "snapcast"}


def playback_target(platform: str | None, name: Any = None, entity: Any = None) -> bool:
    """True for a player that only plays something (an AirPlay or DLNA target, a music server), by integration or name."""
    if (platform or "") in PLAYBACK_PLATFORMS:
        return True
    words = _words(name) | _words(str(entity or "").split(".", 1)[-1].replace("_", " "))
    return bool(words & _PLAYBACK_WORDS)


def only_plays(caps: list[str]) -> bool:
    """Neither switches nor picks a source: such a player is not suggested (it may still be picked by hand)."""
    return not {"power_on", "power_off", "source_select"} & set(caps)


def clean_suggest(raw: Any) -> dict[str, Any]:
    """Setting "directSuggest": {"off": bool, "never": {hub: [device label, ...]}} (suggestions on unless "off")."""
    raw = raw if isinstance(raw, dict) else {}
    never: dict[str, list[str]] = {}
    for hub, labels in (raw.get("never") or {}).items() if isinstance(raw.get("never"), dict) else []:
        if isinstance(hub, str) and isinstance(labels, list):
            kept = sorted({l[:120] for l in labels if isinstance(l, str) and l})[:200]
            if kept:
                never[hub] = kept
    return {"off": raw.get("off") is True, "never": never}


def clean_op(op: Any, value: Any) -> tuple[str, Any] | None:
    """A valid (op, value) of the step "Device", or None. Volume in percent 0-100, mute True/False, source a text."""
    if op not in OPS:
        return None
    if op == "volume":
        try:
            v = float(value)
        except (TypeError, ValueError):
            return None
        return None if not math.isfinite(v) else (op, int(round(min(max(v, 0), 100))))
    if op == "mute":
        return (op, value) if isinstance(value, bool) else None
    if op == "source":
        text = " ".join(str(value).split())[:80] if isinstance(value, (str, int, float)) else ""
        return (op, text) if text else None
    return (op, None)


def service_call(entity: str, op: str, value: Any) -> tuple[str, str, dict[str, Any]]:
    """Home Assistant service for an op on a media_player."""
    target = {"entity_id": entity}
    if op == "on":
        return "media_player", "turn_on", target
    if op == "off":
        return "media_player", "turn_off", target
    if op == "volume":
        return "media_player", "volume_set", {**target, "volume_level": round(value / 100, 2)}
    if op == "mute":
        return "media_player", "volume_mute", {**target, "is_volume_muted": value}
    return "media_player", "select_source", {**target, "source": value}


# Known peculiarities of some Home Assistant integrations, by platform (codes; the card and docs explain them).
PLATFORM_QUIRKS: dict[str, tuple[str, ...]] = {
    "lg_netcast": ("source_is_channel_list", "mute_toggle_only"),
}


def quirks(platform: str | None, caps: list[str]) -> list[str]:
    """What a user should know about a linked player: its platform's peculiarities, and a missing switch-on."""
    out = list(PLATFORM_QUIRKS.get(platform or "", ()))
    if "state" in caps and "power_on" not in caps:
        out.append("no_power_on")
    return out
