"""Profiles: named sets of card settings (pure functions, no Home Assistant imports).

Storage layout::

    {"global": {...}, "profiles": {"Standard": {...}, "Papa": {...}}, "assign": {"<user id>": "Papa"}}

Hardware related settings (hub names, Fire TV connection, links) are global. Everything about looks,
favourites, icons and visibility belongs to the profile, so each profile can look and behave differently.
"""

from __future__ import annotations

import copy
from typing import Any

DEFAULT_PROFILE = "Standard"
MAX_NAME = 40

# Not part of a profile: describe the installation, not a person's taste.
# Actions belong here too: they send keys to the devices of a room, whoever looks at the card.
GLOBAL_KEYS = ("names", "devices", "links", "direct", "actions", "irVolume", "volumeCap", "directDevices", "directSuggest", "trafficLog", "activityPlayers")


def _clean(settings: dict[str, Any], keys: tuple[str, ...]) -> dict[str, Any]:
    return {k: v for k, v in settings.items() if k in keys}


def split(settings: dict[str, Any], all_keys: tuple[str, ...]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Split flat settings into (global part, profile part); unknown keys are dropped."""
    glob = _clean(settings, tuple(k for k in all_keys if k in GLOBAL_KEYS))
    prof = _clean(settings, tuple(k for k in all_keys if k not in GLOBAL_KEYS))
    return glob, prof


def migrate(raw: dict[str, Any] | None, all_keys: tuple[str, ...]) -> dict[str, Any]:
    """Bring stored data into the profile layout (flat settings of older versions become profile "Standard")."""
    raw = raw or {}
    if "profiles" in raw:
        data = {
            "global": dict(raw.get("global") or {}),
            "profiles": {n: dict(p) for n, p in (raw.get("profiles") or {}).items()},
            "assign": dict(raw.get("assign") or {}),
        }
    else:
        glob, prof = split(raw, all_keys)
        data = {"global": glob, "profiles": {DEFAULT_PROFILE: prof}, "assign": {}}
    data["profiles"].setdefault(DEFAULT_PROFILE, {})
    # Up to 0.4 actions belonged to a profile: keep those of the default profile (else the first that has some).
    found = [p.pop("actions") for p in (data["profiles"][n] for n in names(data)) if "actions" in p]
    if found and "actions" not in data["global"]:
        data["global"]["actions"] = found[0]
    data["assign"] = {u: n for u, n in data["assign"].items() if n in data["profiles"]}
    return data


def names(data: dict[str, Any]) -> list[str]:
    """Profile names, the default first, the rest alphabetical."""
    rest = sorted((n for n in data["profiles"] if n != DEFAULT_PROFILE), key=str.casefold)
    return [DEFAULT_PROFILE, *rest]


def resolve(data: dict[str, Any], user_id: str | None, requested: str | None) -> str:
    """Profile that applies: explicit choice, else the one assigned to the user, else the default."""
    if requested and requested in data["profiles"]:
        return requested
    assigned = data["assign"].get(user_id or "")
    if assigned in data["profiles"]:
        return assigned
    return DEFAULT_PROFILE


def merged(data: dict[str, Any], name: str) -> dict[str, Any]:
    """Settings as the card sees them: global part plus the profile."""
    return {**data["global"], **data["profiles"].get(name, {})}


def users_of(data: dict[str, Any], name: str) -> list[str]:
    """User ids assigned to a profile."""
    return sorted(u for u, n in data["assign"].items() if n == name)


def save(data: dict[str, Any], name: str, settings: dict[str, Any], all_keys: tuple[str, ...]) -> None:
    """Store flat settings: global keys into the global part, the rest into the profile."""
    if name not in data["profiles"]:
        raise ValueError("unknown_profile")
    glob, prof = split(settings, all_keys)
    data["global"] = glob
    data["profiles"][name] = prof


def valid_name(name: Any) -> str:
    """Trimmed profile name or ValueError."""
    if not isinstance(name, str):
        raise ValueError("invalid_name")
    name = " ".join(name.split())
    if not name or len(name) > MAX_NAME:
        raise ValueError("invalid_name")
    return name


def create(data: dict[str, Any], name: Any, copy_from: str | None = None) -> str:
    """New profile as a copy of another one (default: empty)."""
    name = valid_name(name)
    if name.casefold() in {n.casefold() for n in data["profiles"]}:
        raise ValueError("name_exists")
    src = data["profiles"].get(copy_from or "", {})
    data["profiles"][name] = copy.deepcopy(src)
    return name


def rename(data: dict[str, Any], old: str, new: Any) -> str:
    """Rename a profile (not the default); assignments follow."""
    if old == DEFAULT_PROFILE or old not in data["profiles"]:
        raise ValueError("unknown_profile")
    new = valid_name(new)
    if new != old and new.casefold() in {n.casefold() for n in data["profiles"]}:
        raise ValueError("name_exists")
    data["profiles"][new] = data["profiles"].pop(old)
    data["assign"] = {u: (new if n == old else n) for u, n in data["assign"].items()}
    return new


def delete(data: dict[str, Any], name: str) -> list[str]:
    """Delete a profile (not the default); returns the users that fall back to automatic."""
    if name == DEFAULT_PROFILE or name not in data["profiles"]:
        raise ValueError("unknown_profile")
    affected = users_of(data, name)
    del data["profiles"][name]
    data["assign"] = {u: n for u, n in data["assign"].items() if n != name}
    return affected


def assign(data: dict[str, Any], user_id: str, name: str | None) -> None:
    """Assign a profile to a user (None = automatic: the default)."""
    if name is None or name == "":
        data["assign"].pop(user_id, None)
        return
    if name not in data["profiles"]:
        raise ValueError("unknown_profile")
    data["assign"][user_id] = name


def visible_users(users: list[dict[str, str]], person_ids: set[str], assigned: set[str] | None = None) -> list[dict[str, str]]:
    """Users shown in the profile assignment: those linked to a person (real people), plus anyone already assigned.

    Technical accounts (MQTT, integrations) normally have no person. Without any person all users are shown.
    """
    if not person_ids:
        return list(users)
    keep = set(person_ids) | set(assigned or ())
    return [u for u in users if u["id"] in keep]
