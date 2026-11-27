"""Media bar of an activity (0.25): one media player per activity, chosen by the user (never automatically).

Setting "activityPlayers" (global, describes the installation): {hub: {activity: {"entity": "media_player.x", "bar": bool}}}.
The card shows the bar from the player's attributes; the controls go through `harmony_deck/media/control`, which
only acts on the player assigned to the activity that is running right now.

Jumps (-30/-10/+10/+30 s): by seeking relative to the position where the player can seek; a Fire TV (androidtv,
no seeking) gets fast-forward / rewind key presses over ADB instead (about 10 s each, depends on the app).
"""

from __future__ import annotations

import math
from typing import Any

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, State
from homeassistant.util import dt as dt_util

from .const import DOMAIN

# media_player supported_features bits
F_PAUSE, F_SEEK, F_STOP, F_PLAY = 1, 2, 4096, 16384
ACTIONS = ("play", "pause", "stop", "seek_to", "seek_by")
ADB_PLATFORMS = ("androidtv",)
_KEY_FF, _KEY_RW = 90, 89
_ADB_STEP_S = 10            # one fast-forward press of the Fire TV apps
_MAX_PRESSES = 6
_MAX_HUB, _MAX_ACT = 80, 120


def clean_players(raw: Any) -> dict[str, dict[str, dict[str, Any]]]:
    """Setting "activityPlayers": one media_player per activity plus the switch "Show media bar" (default on)."""
    out: dict[str, dict[str, dict[str, Any]]] = {}
    if not isinstance(raw, dict):
        return out
    for hub, acts in raw.items():
        if not isinstance(hub, str) or not hub or len(hub) > _MAX_HUB or not isinstance(acts, dict):
            continue
        kept: dict[str, dict[str, Any]] = {}
        for act, item in acts.items():
            if not isinstance(act, str) or not act or len(act) > _MAX_ACT:
                continue
            if isinstance(item, str):           # short form: only the entity
                item = {"entity": item}
            if not isinstance(item, dict):
                continue
            ent = item.get("entity")
            if not isinstance(ent, str) or not ent.startswith("media_player.") or len(ent) > 255:
                continue
            kept[act] = {"entity": ent, "bar": item.get("bar") is not False}
        if kept:
            out[hub] = kept
    return out


def players(hass: HomeAssistant) -> dict[str, dict[str, dict[str, Any]]]:
    return clean_players(((hass.data.get(DOMAIN) or {}).get("settings") or {}).get("activityPlayers"))


def assigned(hass: HomeAssistant, hub: str) -> tuple[str | None, str | None]:
    """(running activity, its assigned player) of a hub; (activity, None) without an assignment."""
    remote = hass.states.get(hub)
    activity = remote.attributes.get("current_activity") if remote else None
    if not activity or activity == "PowerOff":
        return None, None
    item = (players(hass).get(hub) or {}).get(activity)
    return activity, item["entity"] if item else None


def position(state: State, now: Any = None) -> float | None:
    """Position in seconds right now: the reported one plus the time since, while playing."""
    pos = state.attributes.get("media_position")
    if not isinstance(pos, (int, float)) or not math.isfinite(pos):
        return None
    if state.state == "playing":
        at = state.attributes.get("media_position_updated_at")
        if isinstance(at, str):
            at = dt_util.parse_datetime(at)
        if at is not None:
            pos += max(0.0, ((now or dt_util.utcnow()) - at).total_seconds())
    dur = state.attributes.get("media_duration")
    if isinstance(dur, (int, float)) and dur > 0:
        pos = min(pos, float(dur))
    return float(pos)


def jump_plan(state: State, platform: str | None, secs: float) -> tuple[str, Any] | None:
    """How a jump by secs is done: ("seek", target position) or ("adb", key command); None if the player cannot."""
    feats = int(state.attributes.get("supported_features") or 0)
    if feats & F_SEEK:
        pos = position(state)
        if pos is None:
            return None
        target = max(0.0, pos + secs)
        dur = state.attributes.get("media_duration")
        if isinstance(dur, (int, float)) and dur > 0:
            target = min(target, max(0.0, float(dur) - 1))
        return ("seek", round(target, 1))
    if platform in ADB_PLATFORMS:
        presses = max(1, min(_MAX_PRESSES, round(abs(secs) / _ADB_STEP_S)))
        code = _KEY_FF if secs > 0 else _KEY_RW
        return ("adb", "input keyevent " + " ".join([str(code)] * presses))
    return None


@websocket_api.websocket_command(
    {vol.Required("type"): f"{DOMAIN}/media/control", vol.Required("hub"): str, vol.Required("action"): vol.In(ACTIONS),
     vol.Optional("value"): vol.Any(int, float)}
)
@websocket_api.async_response
async def ws_media(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict[str, Any]) -> None:
    """Media bar of the running activity, for every user (like the volume slider)."""
    from . import direct

    _activity, entity = assigned(hass, msg["hub"])
    state = hass.states.get(entity) if entity else None
    if state is None:
        connection.send_error(msg["id"], "invalid", "no media player for the running activity")
        return
    action, value = msg["action"], msg.get("value")
    feats = int(state.attributes.get("supported_features") or 0)
    ctx = connection.context(msg)
    plat = direct.platform(hass, entity)
    service: tuple[str, str, dict[str, Any]] | None = None
    if action == "play" and feats & (F_PLAY | F_PAUSE):
        service = ("media_player", "media_play" if feats & F_PLAY else "media_play_pause", {})
    elif action == "pause" and feats & F_PAUSE:
        service = ("media_player", "media_pause", {})
    elif action == "stop" and feats & F_STOP:
        service = ("media_player", "media_stop", {})
    elif action == "seek_to" and feats & F_SEEK and isinstance(value, (int, float)) and math.isfinite(value):
        service = ("media_player", "media_seek", {"seek_position": max(0.0, float(value))})
    elif action == "seek_by" and isinstance(value, (int, float)) and math.isfinite(value) and value:
        plan = jump_plan(state, plat, float(value))
        if plan and plan[0] == "seek":
            service = ("media_player", "media_seek", {"seek_position": plan[1]})
        elif plan:
            service = ("androidtv", "adb_command", {"command": plan[1]})
    if service is None:
        connection.send_error(msg["id"], "invalid", f"{action}: not possible with this player")
        return
    domain, name, data = service
    try:
        await hass.services.async_call(domain, name, {"entity_id": entity, **data}, blocking=True, context=ctx)
    except Exception as err:  # noqa: BLE001 - the message goes to the card
        connection.send_error(msg["id"], "failed", str(err))
        return
    connection.send_result(msg["id"], {"ok": True})
