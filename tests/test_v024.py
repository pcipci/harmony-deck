"""0.24: options per linked network TV (LG Netcast), volume check waits until the level stays, TV picture and main colour."""

import asyncio
import io
from datetime import timedelta

import pytest
from homeassistant.core import HomeAssistant
from homeassistant.helpers import entity_registry as er
from pytest_homeassistant_custom_component.common import async_fire_time_changed

from custom_components.harmony_deck import directdev as dd

from test_integration_ha import DOMAIN, REMOTE, _setup


@pytest.fixture(autouse=True)
def _custom(enable_custom_integrations):
    yield


def _picture(*parts):
    """A small JPEG of coloured stripes: parts = ((r, g, b), share), ..."""
    from PIL import Image

    img = Image.new("RGB", (100, 40))
    x = 0
    for rgb, share in parts:
        w = round(100 * share)
        img.paste(rgb, (x, 0, x + w, 40))
        x += w
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_device_options_fallback_and_ranges():
    # 0.24 defaults; nothing stored
    assert dd.device_options(None, "media_player.tv") == {"step_gap_ms": 100, "corrections": 3, "settle_s": 2.5, "picture": False,
                                                          "picture_mode": "change", "picture_interval_s": 2.0, "picture_timeout_s": 10}
    # a device without own values takes the earlier global ones (0.23.x dialog)
    old = {"lg_netcast": {"step_gap_ms": 150, "corrections": 2, "settle_s": 1.5}}
    assert dd.device_options(old, "media_player.tv")["step_gap_ms"] == 150
    own = {**old, "devices": {"media_player.tv": {"step_gap_ms": 80, "corrections": 1, "settle_s": 3, "picture": True,
                                                  "picture_mode": "poll", "picture_interval_s": 0.2, "picture_timeout_s": 500}}}
    got = dd.device_options(own, "media_player.tv")
    assert got == {"step_gap_ms": 80, "corrections": 1, "settle_s": 3.0, "picture": True, "picture_mode": "poll",
                   "picture_interval_s": 1.0, "picture_timeout_s": 120}
    assert dd.device_options(own, "media_player.other")["step_gap_ms"] == 150
    assert dd.clean_screen_options({"picture": "yes", "picture_mode": "x", "picture_interval_s": 2.3})["picture"] is False
    assert dd.clean_screen_options({"picture_interval_s": 2.3})["picture_interval_s"] == 2.5


def test_main_color_prefers_coloured_over_dark():
    from custom_components.harmony_deck import screen

    # black bars over most of the picture, a red scene in the middle: red wins
    rgb = screen.main_color(_picture(((0, 0, 0), 0.6), ((220, 20, 20), 0.3), ((128, 128, 128), 0.1)))
    assert rgb is not None and rgb[0] > 180 and rgb[1] < 60 and rgb[2] < 60
    # only black: black (lamps can decide with the brightness)
    assert screen.main_color(_picture(((0, 0, 0), 1.0))) == (0, 0, 0)
    assert screen.main_color(b"not a picture") is None
    assert screen.blend((200, 0, 0), (0, 0, 200)) == (100, 0, 100) and screen.blend(None, (1, 2, 3)) == (1, 2, 3)
    assert screen.hex_color((255, 16, 0)) == "#ff1000" and screen.hex_color(None) is None


async def test_wait_stable_stops_when_level_stays(hass: HomeAssistant, monkeypatch):
    """After the steps the level is read about every half second; it stops once two readings agree."""
    from custom_components.harmony_deck import direct

    levels = iter([0.30, 0.25, 0.22, 0.22, 0.10])
    reads = []

    async def refresh(_hass, _entity):
        lvl = next(levels)
        reads.append(lvl)
        hass.states.async_set("media_player.tv", "on", {"volume_level": lvl, "supported_features": 4 | 8 | 1024})

    monkeypatch.setattr(direct, "_refresh", refresh)
    monkeypatch.setattr(direct, "_POLL", 0.01)
    hass.states.async_set("media_player.tv", "on", {"volume_level": 0.40, "supported_features": 4 | 8 | 1024})
    await direct._wait_stable(hass, "media_player.tv", 5)
    assert reads == [0.30, 0.25, 0.22, 0.22]          # the TV still worked off steps, then stayed: no fixed wait
    reads.clear()
    await direct._wait_stable(hass, "media_player.tv", 0)
    assert reads == []


async def test_options_flow_no_tv(hass: HomeAssistant):
    await _setup(hass)
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    assert flow["type"] == "abort" and flow["reason"] == "no_devices"


def _netcast(hass, name="tv", uid="tv1", picture="/api/media_player_proxy/media_player.tv?token=x&cache=1"):
    er.async_get(hass).async_get_or_create("media_player", "lg_netcast", uid, suggested_object_id=name)
    hass.states.async_set(f"media_player.{name}", "on", {"supported_features": 4 | 8 | 1024, "volume_level": 0.2,
                                                         "friendly_name": f"LG {name}", "entity_picture": picture})


async def test_options_flow_per_device(hass: HomeAssistant):
    """Two Netcast TVs: pick one, its values are stored for it alone; the volume code reads them per device."""
    await _setup(hass)
    from custom_components.harmony_deck import direct

    _netcast(hass, "tv", "tv1")
    _netcast(hass, "tv2", "tv2")
    hass.data[DOMAIN]["settings"]["directDevices"] = {REMOTE: {"LG": {"entity": "media_player.tv"}, "LG2": {"entity": "media_player.tv2"}}}
    entry = hass.config_entries.async_entries(DOMAIN)[0]
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    assert flow["type"] == "form" and flow["step_id"] == "init"
    flow = await hass.config_entries.options.async_configure(flow["flow_id"], {"device": "media_player.tv2"})
    assert flow["type"] == "form" and flow["step_id"] == "device" and flow["description_placeholders"] == {"name": "LG tv2"}
    res = await hass.config_entries.options.async_configure(flow["flow_id"], {
        "volume": {"step_gap_ms": 120, "corrections": 2, "settle_s": 1.5},
        "picture": {"picture": False, "picture_mode": "change", "picture_interval_s": 2, "picture_timeout_s": 10}})
    assert res["type"] == "create_entry"
    assert entry.options["devices"]["media_player.tv2"]["step_gap_ms"] == 120
    assert direct.step_options(hass, "media_player.tv2") == {"step_gap_ms": 120, "corrections": 2, "settle_s": 1.5}
    assert direct.step_options(hass, "media_player.tv") == {"step_gap_ms": 100, "corrections": 3, "settle_s": 2.5}


async def test_tv_picture_and_main_color(hass: HomeAssistant, monkeypatch, freezer):
    """Picture on: three entities on the TV's device; a new picture follows the player; without pictures the colour goes unknown."""
    await _setup(hass)
    from custom_components.harmony_deck import screen

    pictures = {"now": _picture(((230, 10, 10), 1.0))}
    asked = []

    class Player:
        async def async_get_media_image(self):
            asked.append(1)
            return pictures["now"], "image/png"

    monkeypatch.setattr(screen, "_player", lambda _h, _e: Player())
    _netcast(hass)
    hass.data[DOMAIN]["settings"]["directDevices"] = {REMOTE: {"LG": {"entity": "media_player.tv"}}}
    from custom_components.harmony_deck.direct_watch import watcher

    watcher(hass).refresh()
    await hass.async_block_till_done()
    entry = hass.config_entries.async_entries(DOMAIN)[0]

    def ents():
        return {e.unique_id.split("::")[-1]: e.entity_id for e in er.async_entries_for_config_entry(er.async_get(hass), entry.entry_id)
                if e.unique_id.split("::")[-1] in screen.KEYS}

    assert ents() == {}         # off by default
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    assert flow["step_id"] == "device"          # one TV: straight to its settings
    await hass.config_entries.options.async_configure(flow["flow_id"], {
        "volume": {"step_gap_ms": 100, "corrections": 3, "settle_s": 2.5},
        "picture": {"picture": True, "picture_mode": "change", "picture_interval_s": 2, "picture_timeout_s": 5}})
    await hass.async_block_till_done()
    ids = ents()
    assert set(ids) == set(screen.KEYS)
    color = hass.states.get(ids["main_color"])
    assert color.state.startswith("#") and color.attributes["rgb_color"][0] > 200
    assert hass.states.get(ids["picture_available"]).state == "on"
    assert hass.states.get(ids["tv_picture"]).state not in ("unknown", "unavailable")
    # the entities sit on the TV's network device
    dev = er.async_get(hass).async_get(ids["main_color"]).device_id
    assert dev and dev == er.async_get(hass).async_get(ids["tv_picture"]).device_id

    # the player reports a new picture (entity_picture changes): fetched, the colour moves half way (smoothing)
    pictures["now"] = _picture(((10, 10, 230), 1.0))
    st = hass.states.get("media_player.tv")
    hass.states.async_set("media_player.tv", "on", {**st.attributes, "entity_picture": st.attributes["entity_picture"] + "2"})
    await hass.async_block_till_done()
    rgb = hass.states.get(ids["main_color"]).attributes["rgb_color"]
    assert 90 < rgb[0] < 140 and 90 < rgb[2] < 140
    # same picture url again (only the volume changed): no new fetch
    n = len(asked)
    hass.states.async_set("media_player.tv", "on", {**hass.states.get("media_player.tv").attributes, "volume_level": 0.3})
    await hass.async_block_till_done()
    assert len(asked) == n

    # no picture for longer than the timeout: not available, colour unknown
    freezer.tick(timedelta(seconds=6))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert hass.states.get(ids["picture_available"]).state == "off"
    assert hass.states.get(ids["main_color"]).state == "unknown"

    # mode "poll": a picture every interval, also without a change of the player
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    await hass.config_entries.options.async_configure(flow["flow_id"], {
        "volume": {"step_gap_ms": 100, "corrections": 3, "settle_s": 2.5},
        "picture": {"picture": True, "picture_mode": "poll", "picture_interval_s": 1, "picture_timeout_s": 5}})
    await hass.async_block_till_done()
    n = len(asked)
    for _ in range(3):
        freezer.tick(timedelta(seconds=1.1))
        async_fire_time_changed(hass)
        await hass.async_block_till_done()
    assert len(asked) >= n + 3
    assert hass.states.get(ids["picture_available"]).state == "on"

    # TV off: no fetch
    n = len(asked)
    hass.states.async_set("media_player.tv", "off", {})
    freezer.tick(timedelta(seconds=1.1))
    async_fire_time_changed(hass)
    await hass.async_block_till_done()
    assert len(asked) == n

    # switched off in the options: the entities go
    flow = await hass.config_entries.options.async_init(entry.entry_id)
    await hass.config_entries.options.async_configure(flow["flow_id"], {
        "volume": {"step_gap_ms": 100, "corrections": 3, "settle_s": 2.5},
        "picture": {"picture": False, "picture_mode": "poll", "picture_interval_s": 1, "picture_timeout_s": 5}})
    await hass.async_block_till_done()
    assert ents() == {}
    assert not hass.data[DOMAIN]["screen"].feeds
    await asyncio.sleep(0)
