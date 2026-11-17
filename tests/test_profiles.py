"""Tests for the profile storage logic (run: python3 tests/test_profiles.py)."""

import importlib.util
from pathlib import Path

_base = Path(__file__).parents[1] / "custom_components" / "harmony_deck"
_spec = importlib.util.spec_from_file_location("profiles", _base / "profiles.py")
profiles = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(profiles)

KEYS = ("skin", "names", "favorites", "direct", "links", "devices", "glow", "hidden")


def _raises(fn, code):
    try:
        fn()
    except ValueError as err:
        assert str(err) == code, (str(err), code)
    else:
        raise AssertionError(f"expected {code}")


def test_migrate_flat_settings():
    data = profiles.migrate({"skin": "pebble", "names": {"a": "WZ"}, "direct": {"x": 1}, "junk": 1}, KEYS)
    assert data["global"] == {"names": {"a": "WZ"}, "direct": {"x": 1}}
    assert data["profiles"] == {"Standard": {"skin": "pebble"}}
    assert data["assign"] == {}


def test_migrate_empty_and_existing():
    assert profiles.migrate(None, KEYS)["profiles"] == {"Standard": {}}
    again = profiles.migrate(profiles.migrate({"skin": "x"}, KEYS), KEYS)
    assert again["profiles"]["Standard"] == {"skin": "x"}
    stale = profiles.migrate({"profiles": {"Standard": {}}, "assign": {"u": "Gone"}}, KEYS)
    assert stale["assign"] == {}


def test_resolve_order():
    data = profiles.migrate({}, KEYS)
    profiles.create(data, "Papa")
    profiles.create(data, "Kinder")
    profiles.assign(data, "u1", "Papa")
    assert profiles.resolve(data, "u1", None) == "Papa"
    assert profiles.resolve(data, "u1", "Kinder") == "Kinder"  # explicit choice wins
    assert profiles.resolve(data, "u1", "Nope") == "Papa"  # unknown choice is ignored
    assert profiles.resolve(data, "u2", None) == "Standard"
    assert profiles.resolve(data, None, None) == "Standard"


def test_save_splits_and_merges():
    data = profiles.migrate({}, KEYS)
    profiles.create(data, "Papa", copy_from="Standard")
    profiles.save(data, "Papa", {"skin": "light", "names": {"a": "WZ"}, "glow": "ring", "bogus": 1}, KEYS)
    assert data["global"] == {"names": {"a": "WZ"}}
    assert data["profiles"]["Papa"] == {"skin": "light", "glow": "ring"}
    assert profiles.merged(data, "Papa") == {"names": {"a": "WZ"}, "skin": "light", "glow": "ring"}
    assert profiles.merged(data, "Standard") == {"names": {"a": "WZ"}}  # global shared, profile part separate
    _raises(lambda: profiles.save(data, "Nope", {}, KEYS), "unknown_profile")


def test_create_rename_delete():
    data = profiles.migrate({"skin": "pebble"}, KEYS)
    profiles.create(data, "  Mama  ", copy_from="Standard")
    assert data["profiles"]["Mama"] == {"skin": "pebble"}
    data["profiles"]["Mama"]["skin"] = "light"
    assert data["profiles"]["Standard"]["skin"] == "pebble"  # copy, not alias
    _raises(lambda: profiles.create(data, "mama"), "name_exists")
    _raises(lambda: profiles.create(data, "   "), "invalid_name")
    _raises(lambda: profiles.create(data, "x" * 41), "invalid_name")
    profiles.assign(data, "u1", "Mama")
    assert profiles.rename(data, "Mama", "Mutter") == "Mutter"
    assert data["assign"] == {"u1": "Mutter"}
    _raises(lambda: profiles.rename(data, "Standard", "X"), "unknown_profile")
    assert profiles.delete(data, "Mutter") == ["u1"]
    assert data["assign"] == {} and "Mutter" not in data["profiles"]
    _raises(lambda: profiles.delete(data, "Standard"), "unknown_profile")


def test_assign_and_names_order():
    data = profiles.migrate({}, KEYS)
    for n in ("zebra", "Alpha", "beta"):
        profiles.create(data, n)
    assert profiles.names(data) == ["Standard", "Alpha", "beta", "zebra"]
    profiles.assign(data, "u", "beta")
    assert profiles.users_of(data, "beta") == ["u"]
    profiles.assign(data, "u", None)
    assert profiles.users_of(data, "beta") == []
    _raises(lambda: profiles.assign(data, "u", "Nope"), "unknown_profile")


def test_visible_users():
    users = [{"id": "a", "name": "A"}, {"id": "b", "name": "B"}, {"id": "mqtt", "name": "mqtt"}]
    assert [u["id"] for u in profiles.visible_users(users, {"a", "b"})] == ["a", "b"]
    assert [u["id"] for u in profiles.visible_users(users, {"a"}, {"mqtt"})] == ["a", "mqtt"]
    assert profiles.visible_users(users, set()) == users


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
