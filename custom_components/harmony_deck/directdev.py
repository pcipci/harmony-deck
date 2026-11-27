"""Direct devices: data model and capabilities (pure functions, no Home Assistant imports).

A direct device is a Home Assistant entity that belongs to a Harmony device and that Harmony Deck can talk to
without the hub, for example the TV as a ``media_player``. The hub keeps sending the keys; the direct device adds
what infrared cannot do (read the state, set a volume level, pick a source). Stored globally as::

    {"remote.living_room": {"LG TV": {"entity": "media_player.tv", "volumeDirect": false,
                                      "inputs": {"InputHdmi2": "Fire TV"}}}}

"inputs" says which source of the player belongs to a Harmony input (for the input check in mismatch.py);
"offCheck" ("quiet" / "ignore", 0.19.1) how the check treats the device when it should be off.

Everything else in Harmony Deck (card, step "Device", infrared volume) asks only for capabilities (CAPS) and
never for a kind of device. Which capabilities an entity has is read here from what Home Assistant reports;
extensions (direct.py) may add more on top.
"""

from __future__ import annotations

import math
import re
from collections.abc import Mapping
from typing import Any

CAPS = ("state", "power_on", "power_off", "volume_set", "volume_read", "mute", "source_select", "source_read", "app_read", "app_list")

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
    return [c for c in CAPS if found.get(c)]


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
    if raw.get("offCheck") in ("quiet", "ignore"):     # "watch" is the default and not stored
        out["offCheck"] = raw["offCheck"]
    fire = clean_fire(raw.get("fire"))
    if fire is not None:
        out["fire"] = fire
    if isinstance(raw.get("tech"), dict):      # 0.24.1: technical values of a step-only TV (LG Netcast), see device_options
        out["tech"] = {**clean_step_options(raw["tech"]), **clean_screen_options(raw["tech"])}
    return out


# Settings of a Fire TV page (apps, keys, connection), kept on its link since 0.13 (before: settings "direct").
FIRE_KEYS = ("model", "prefer", "irVolume", "keymap", "hiddenApps", "hiddenKeys", "inActivities", "lockOffline", "pkgs", "customApps")
_FIRE_LIMIT = 20000  # characters of JSON; a page holds a few dozen apps


def clean_fire(raw: Any) -> dict[str, Any] | None:
    """The Fire TV settings of a link: only the known keys, plain JSON values, bounded size; None if there are none."""
    if not isinstance(raw, dict):
        return None
    import json

    out = {k: raw[k] for k in FIRE_KEYS if k in raw and isinstance(raw[k], (str, bool, list, dict))}
    try:
        if len(json.dumps(out)) > _FIRE_LIMIT:
            return None
    except (TypeError, ValueError):
        return None
    return out


def fire_configs(direct: Any, links: Any) -> dict[str, dict[str, Any]]:
    """{hub: {"entity", "device", ...Fire TV settings}} for every hub with a Fire TV, in the shape used up to 0.12.

    The link that carries Fire TV settings wins (0.13); a hub without one keeps its old entry of settings "direct".
    """
    out: dict[str, dict[str, Any]] = {}
    for hub, cfg in (direct.items() if isinstance(direct, dict) else []):
        if isinstance(hub, str) and isinstance(cfg, dict) and _ENTITY.match(str(cfg.get("entity") or "")):
            out[hub] = dict(cfg)
    for hub, devices in clean_config(links).items():
        for label in sorted(devices):
            link = devices[label]
            if "fire" in link:
                old = out.get(hub) or {}
                base = {k: v for k, v in old.items() if k not in ("entity", "device")} if old.get("entity") == link["entity"] else {}
                out[hub] = {**base, **link["fire"], "entity": link["entity"], "device": label}
                break
    return out


def move_fire_settings(direct: Any, links: Any) -> tuple[dict[str, Any], dict[str, dict[str, dict[str, Any]]]]:
    """0.13: the Fire TV settings of a hub move onto the link of its Harmony device (once, at start).

    Only where that device is linked to the same player; anything else stays in "direct" and keeps working.
    Returns (rest of "direct", links).
    """
    rest = dict(direct) if isinstance(direct, dict) else {}
    out = clean_config(links)
    for hub, cfg in list(rest.items()):
        if not isinstance(cfg, dict):
            continue
        link = (out.get(hub) or {}).get(str(cfg.get("device") or ""))
        if link and link["entity"] == cfg.get("entity") and "fire" not in link:
            link["fire"] = clean_fire(cfg) or {}
            del rest[hub]
    return rest, out


def clean_config(raw: Any) -> dict[str, dict[str, dict[str, Any]]]:
    """{hub: {device label: {"entity", "volumeDirect", "inputs"?, "fire"?}}}; invalid entries dropped."""
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
        if shared - _words(meta.get("manufacturer")) - _words(cand.get("manufacturer")) - _words(area) - _words(cand.get("area")):
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




def _evident(parts: dict[str, int]) -> bool:
    """Real evidence: the same model or kind, or a shared name word that is not the maker or the room.

    The room alone is not enough (nearly everything in a living room is in the living room); it only adds points.
    """
    return "model" in parts or "named" in parts or parts.get("kind", 0) > 0


def room_player(cand: dict[str, Any], area: str | None) -> bool:
    """A player named only after a room ("Wohnzimmer", "Living room speaker" is not): stands for a room, not a device."""
    name = _alnum(cand.get("name"))
    return bool(name) and (name == _alnum(cand.get("area")) or (area is not None and name == _alnum(area)))


def suggest(meta: dict[str, Any], candidates: list[dict[str, Any]], area: str | None = None) -> str | None:
    """Entity that fits a Harmony device clearly better than all others, else None (the user picks).

    The best one needs at least 3 points, real evidence (room, model or kind; a maker alone is not enough,
    many makers build TVs, players and speakers; the room alone neither), must not be a player named only after the
    room, must be able to switch or pick a source (not only play), and must be ahead of the second.
    """
    scored = sorted(((_score_parts(meta, c, area), c) for c in candidates), key=lambda x: -sum(x[0].values()))
    if not scored:
        return None
    parts, best = scored[0]
    top = sum(parts.values())
    if top < 3 or not _evident(parts) or room_player(best, area) or ("caps" in best and only_plays(best["caps"])):
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
    "lg_netcast": ("source_is_channel_list", "mute_toggle_only", "volume_on_release"),
}


# Players that only know "one level up / down" and no target level: the volume is reached by sending that many steps.
STEP_PLATFORMS = ("lg_netcast",)
MAX_STEPS = 60


STEP_DEFAULTS = {"step_gap_ms": 100, "corrections": 3, "settle_s": 2.5}

# Players whose own settings sit in the options of the integration (per device): volume steps and the TV picture.
OPTION_PLATFORMS = ("lg_netcast",)

SCREEN_MODES = ("change", "poll")
SCREEN_DEFAULTS = {"picture": False, "picture_mode": "change", "picture_interval_s": 2.0, "picture_timeout_s": 10}


def clean_screen_options(raw: Any) -> dict[str, Any]:
    """TV picture options of one device: on/off, new picture on change or polled, poll gap (s), time without picture
    before "not available" (s); held to sane ranges, missing or broken values take the default."""
    raw = dict(raw) if isinstance(raw, Mapping) else {}

    def num(key: str, low: float, high: float) -> float:
        try:
            value = float(raw.get(key, SCREEN_DEFAULTS[key]))
        except (TypeError, ValueError):
            return float(SCREEN_DEFAULTS[key])
        if not math.isfinite(value):
            return float(SCREEN_DEFAULTS[key])
        return min(max(value, low), high)

    mode = raw.get("picture_mode")
    return {"picture": raw.get("picture") is True,
            "picture_mode": mode if mode in SCREEN_MODES else SCREEN_DEFAULTS["picture_mode"],
            "picture_interval_s": round(num("picture_interval_s", 1, 10) * 2) / 2,
            "picture_timeout_s": int(round(num("picture_timeout_s", 2, 120)))}


def device_options(options: Any, entity: str | None) -> dict[str, Any]:
    """Volume step and picture values of one player.

    `options` is {"devices": {entity: values}, "lg_netcast": values}: since 0.24.1 the card's device page stores them on
    the link (direct.device_tech puts them under "devices"); 0.24.0 kept them in the options of the integration, 0.23.6
    globally under "lg_netcast". Whatever is found first counts; missing values take the defaults.
    """
    options = dict(options) if isinstance(options, Mapping) else {}
    devices = options.get("devices")
    own = devices.get(entity) if isinstance(devices, Mapping) else None
    if not isinstance(own, Mapping):
        own = None
    return {**clean_step_options(own if own is not None else options.get("lg_netcast")), **clean_screen_options(own)}


def clean_step_options(raw: Any) -> dict[str, Any]:
    """Options of the integration for step-only TVs, held to sane ranges; missing or broken values take the default."""
    raw = dict(raw) if isinstance(raw, Mapping) else {}

    def num(key: str, low: float, high: float, cast: Any) -> Any:
        try:
            value = cast(raw.get(key, STEP_DEFAULTS[key]))
        except (TypeError, ValueError):
            return STEP_DEFAULTS[key]
        if isinstance(value, float) and not math.isfinite(value):
            return STEP_DEFAULTS[key]
        return min(max(value, low), high)

    return {"step_gap_ms": num("step_gap_ms", 50, 1000, int), "corrections": num("corrections", 0, 5, int),
            "settle_s": round(num("settle_s", 0.5, 10, float), 1)}


def step_hold_ms(options: Any, current: Any, target: Any) -> int:
    """How long the card keeps its slider on the target while the steps run and are checked (it lets go earlier once the
    TV reports the target). Each step: the gap plus about a quarter second for the TV's answer."""
    if not isinstance(current, (int, float)) or not isinstance(target, (int, float)):
        return 0
    opt = clean_step_options(options)
    count = min(abs(round(target) - round(current)), MAX_STEPS)
    if count == 0:
        return 0
    return int(count * (opt["step_gap_ms"] + 250) + opt["settle_s"] * 1000 * (1 + opt["corrections"]))


def steps_between(current: int, target: int) -> tuple[str, int]:
    """("volume_up" | "volume_down", number of steps) to get from the current level to the target (percent)."""
    diff = int(target) - int(current)
    return ("volume_up" if diff > 0 else "volume_down", min(abs(diff), MAX_STEPS))


def slider_device(activities: Any, activity: Any, links: Any) -> str | None:
    """Harmony device whose volume the slider of the running activity sets, or None (then the card keeps +/-).

    The activity's volume device (role "volume") must be linked with "Set volume directly" switched on.
    Whether the player can take a level ("volume_set") is checked by the caller, who knows the entity.
    """
    if not isinstance(activities, dict) or not isinstance(activity, str):
        return None
    device = (activities.get(activity) or {}).get("volume") if isinstance(activities.get(activity), dict) else None
    link = (links or {}).get(device) if isinstance(device, str) and isinstance(links, dict) else None
    return device if isinstance(link, dict) and link.get("volumeDirect") is True else None


def quirks(platform: str | None, caps: list[str]) -> list[str]:
    """What a user should know about a linked player: its platform's peculiarities, and a missing switch-on."""
    out = list(PLATFORM_QUIRKS.get(platform or "", ()))
    if "state" in caps and "power_on" not in caps:
        out.append("no_power_on")
    return out


# Names in a source list that are inputs of the device, not channels or apps (for players whose source list is
# mostly a channel list, e.g. LG Netcast: "HDMI1" among 65 satellite channels).
_INPUT_NAME = re.compile(
    r"^(?:input|eingang|вход)?\s*(?:hdmi|av|component|komponente|scart|rgb|pc|vga|dvi|usb|ext|optical|optisch|toslink|"
    r"coax|koax|aux|line|tv|antenna|antenne|dtv|atv|sat|cable|kabel)(?:\s*[-_]?\s*\d{0,2})$",
    re.IGNORECASE,
)


def input_like(name: Any) -> bool:
    """True for a source name that looks like an input ("HDMI 1", "AV2", "Component", "Eingang HDMI2")."""
    text = " ".join(str(name or "").replace("_", " ").split())
    if text.casefold().startswith(("input ", "eingang ", "вход ")):
        text = text.split(" ", 1)[1]
    return bool(_INPUT_NAME.match(text))


def usable_sources(platform: str | None, sources: list[str]) -> list[str]:
    """Sources worth showing and comparing: all of them, but only the inputs where the list is a channel list."""
    if "source_is_channel_list" in PLATFORM_QUIRKS.get(platform or "", ()):
        return [s for s in sources if input_like(s)]
    return list(sources)


def link_fire_tvs(direct: Any, links: Any) -> dict[str, dict[str, dict[str, Any]]]:
    """Network control links with the Fire TV of each hub added (0.12: the Fire TV is a linked device like any other).

    Up to 0.11 the Fire TV was set up apart from the network control (settings "direct": {hub: {entity, device}}).
    A hub whose Fire TV names its Harmony device gets that device linked to the Fire TV's player, unless the device
    is linked already. Nothing else changes; the Fire TV settings themselves stay where they are.
    """
    out = clean_config(links)
    for hub, cfg in (direct.items() if isinstance(direct, dict) else []):
        if not isinstance(hub, str) or not isinstance(cfg, dict):
            continue
        entity, device = str(cfg.get("entity") or ""), cfg.get("device")
        if not isinstance(device, str) or not device or not _ENTITY.match(entity):
            continue
        out.setdefault(hub, {}).setdefault(device[:120], {"entity": entity, "volumeDirect": False})
    return out
