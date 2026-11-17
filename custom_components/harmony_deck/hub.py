"""Reads activities, devices and key routing from the Harmony hub configuration.

The Harmony integration keeps the complete hub configuration in memory
(``HarmonyData._client.config``). For every activity it lists control groups
("Volume", "NavigationBasic", ...) whose functions point to the device that
receives the key. That routing is what the remote card needs.
"""

from __future__ import annotations

from collections.abc import Mapping
import json
from typing import Any

# control group name (hub config) -> role used by the card
GROUP_ROLES: dict[str, str] = {
    "Volume": "volume",
    "NavigationBasic": "nav",
    "NavigationDvd": "nav",
    "NavigationDVD": "nav",
    "Channel": "channel",
    "TransportBasic": "transport",
    "TransportExtended": "transport",
}

ACTIVITY_POWER_OFF = "PowerOff"


def _device_id(function: Mapping[str, Any]) -> str | None:
    """Return the device a hub function sends to (its action is a JSON string)."""
    action = function.get("action")
    if isinstance(action, str):
        try:
            action = json.loads(action)
        except ValueError:
            return None
    if isinstance(action, Mapping):
        device_id = action.get("deviceId")
        return str(device_id) if device_id is not None else None
    return None


def device_commands(config: Mapping[str, Any]) -> dict[str, list[str]]:
    """Return {device label: [command names]} from the hub configuration."""
    result: dict[str, list[str]] = {}
    for device in config.get("device", []) or []:
        label = device.get("label")
        if not label:
            continue
        commands: list[str] = []
        for group in device.get("controlGroup", []) or []:
            for function in group.get("function", []) or []:
                name = function.get("name")
                if name and name not in commands:
                    commands.append(name)
        result[label] = commands
    return result


def conf_commands(raw: Any) -> dict[str, list[str]]:
    """Command names per device from a ``harmony_*.conf`` file of the Harmony integration.

    These are the names ``remote.send_command`` accepts. They can differ from the function names in the live hub
    configuration (for example the OK key of a TV is ``OK`` here but ``Select`` there).
    """
    result: dict[str, list[str]] = {}
    devices = raw.get("Devices") if isinstance(raw, Mapping) else None
    if not isinstance(devices, Mapping):
        return result
    for label, device in devices.items():
        commands = device.get("commands") if isinstance(device, Mapping) else None
        if isinstance(commands, list):
            result[str(label)] = [str(c) for c in commands if isinstance(c, str)]
    return result


def match_conf(labels: set[str], confs: Mapping[str, Mapping[str, list[str]]], unique_id: str | None = None) -> str | None:
    """Key of the conf file that belongs to a hub: ``harmony_<unique id>.conf`` or the best overlap of device names."""
    if unique_id:
        for key in confs:
            if key.rsplit("/", 1)[-1] == f"harmony_{unique_id}.conf":
                return key
    best, score = None, 0
    for key, devices in confs.items():
        common = len(labels & set(devices))
        if common > score and common * 2 >= len(labels):
            best, score = key, common
    return best


def merge_conf_commands(live: Mapping[str, list[str]], conf: Mapping[str, list[str]]) -> dict[str, list[str]]:
    """Command names from the conf file where it knows the device, else the live names; devices only in the file are added."""
    result = {label: list(conf[label]) if conf.get(label) else list(commands) for label, commands in live.items()}
    for label, commands in conf.items():
        result.setdefault(label, list(commands))
    return result


def activity_roles(config: Mapping[str, Any]) -> dict[str, dict[str, str]]:
    """Return {activity label: {role: device label}} from the hub configuration."""
    labels = {str(d.get("id")): d.get("label") for d in config.get("device", []) or []}
    result: dict[str, dict[str, str]] = {}
    for activity in config.get("activity", []) or []:
        label = activity.get("label")
        if not label or label == ACTIVITY_POWER_OFF:
            continue
        roles: dict[str, str] = {}
        for group in activity.get("controlGroup", []) or []:
            role = GROUP_ROLES.get(group.get("name", ""))
            if not role or role in roles:
                continue
            for function in group.get("function", []) or []:
                device = labels.get(_device_id(function) or "")
                if device:
                    roles[role] = device
                    break
        result[label] = roles
    return result


def activity_setup(config: Mapping[str, Any]) -> dict[str, list[dict[str, Any]]]:
    """Return {activity label: [{device, power, input}]}: what each activity needs.

    Read from the hub's ``fixit`` section (target state per device). Entries
    without that section are simply left out; the card then falls back to the
    devices the activity uses.
    """
    labels = {str(d.get("id")): d.get("label") for d in config.get("device", []) or []}
    result: dict[str, list[dict[str, Any]]] = {}
    for activity in config.get("activity", []) or []:
        label = activity.get("label")
        fixit = activity.get("fixit")
        if not label or label == ACTIVITY_POWER_OFF or not isinstance(fixit, Mapping):
            continue
        items: list[dict[str, Any]] = []
        for device_id, state in fixit.items():
            device = labels.get(str(device_id))
            if not device or not isinstance(state, Mapping):
                continue
            if str(state.get("Power", "")).lower() != "on":
                # Devices without an explicit "On" are not switched by the activity; "isManualPower" ones are switched by hand.
                if state.get("isManualPower") and "Power" not in state:
                    items.append({"device": device, "power": False, "manual": True, "input": None})
                continue
            value = state.get("Input")
            items.append({"device": device, "power": True, "input": str(value) if value else None})
        result[label] = items
    return result


def fixit_raw(config: Mapping[str, Any]) -> dict[str, Any]:
    """Raw target states per activity (device ids replaced by labels), for diagnostics in the card."""
    labels = {str(d.get("id")): d.get("label") for d in config.get("device", []) or []}
    result: dict[str, Any] = {}
    for activity in config.get("activity", []) or []:
        label = activity.get("label")
        fixit = activity.get("fixit")
        if not label or not isinstance(fixit, Mapping):
            continue
        result[label] = {labels.get(str(k), str(k)): v for k, v in fixit.items()}
    return result


def hub_info(config: Mapping[str, Any]) -> dict[str, Any]:
    """Everything the card needs to know about one hub."""
    return {
        "devices": device_commands(config),
        "activities": activity_roles(config),
        "setup": activity_setup(config),
        "fixit": fixit_raw(config),
    }
