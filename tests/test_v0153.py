"""0.15.3: one diagnostic sensor per capability (off by default), translated."""
import json
from pathlib import Path

from custom_components.harmony_deck import directdev, netent

COMP = Path(__file__).parent.parent / "custom_components" / "harmony_deck"


def test_capability_sensors_exist_and_are_translated():
    for c in directdev.CAPS:
        assert f"net_cap_{c}" in netent.KEYS and f"net_cap_{c}" in netent._CLASSES
    for f in ("strings.json", "translations/en.json", "translations/de.json", "translations/ru.json"):
        sensors = json.loads((COMP / f).read_text())["entity"]["sensor"]
        for c in directdev.CAPS:
            ent = sensors[f"net_cap_{c}"]
            assert ent["name"] and set(ent["state"]) == {"yes", "no"}


def test_capability_sensor_is_disabled_by_default_and_reads_caps():
    class Fake(netent.NetCapability):
        _item = {"capabilities": ["mute", "state"]}

    ent = Fake.__new__(Fake)
    ent._code = "mute"
    assert ent.entity_registry_enabled_default is False
    assert ent.native_value == "yes"
    ent._code = "power_on"
    assert ent.native_value == "no"


def test_fire_configs_keeps_old_settings_under_an_empty_link_block():
    """0.15.4: linking the Fire TV made an empty block that hid the old settings of the same player."""
    direct = {"remote.sz": {"entity": "media_player.fire", "device": "", "prefer": "adb", "model": "cube"}}
    links = {"remote.sz": {"Cube": {"entity": "media_player.fire", "fire": {}}}}
    out = directdev.fire_configs(direct, links)["remote.sz"]
    assert out["prefer"] == "adb" and out["model"] == "cube" and out["device"] == "Cube"
    other = {"remote.sz": {"entity": "media_player.other", "prefer": "adb"}}
    assert "prefer" not in directdev.fire_configs(other, links)["remote.sz"]
