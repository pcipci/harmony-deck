// Media bar (0.25): time text, position counting, remembered abilities, parts, player order by room.
import assert from "node:assert/strict";
import { fmtTime, mediaPos, mergeSeen, barParts, MF } from "../src/deck/mediabar.js";
import { playerGroups } from "../src/deck/mediabar-editor.js";

assert.equal(fmtTime(42), "0:42");
assert.equal(fmtTime(728), "12:08");
assert.equal(fmtTime(4328), "1:12:08");
assert.equal(fmtTime(NaN), "–:––");

const at = "2026-11-27T10:00:00.000Z";
const t0 = Date.parse(at);
const st = (state, extra = {}) => ({ state, attributes: { media_position: 100, media_position_updated_at: at, media_duration: 200, ...extra } });
assert.equal(mediaPos(st("playing"), t0 + 30000), 130);       // counts on while playing
assert.equal(mediaPos(st("paused"), t0 + 30000), 100);        // not while paused
assert.equal(mediaPos(st("playing"), t0 + 999000), 200);      // held to the duration
assert.equal(mediaPos({ state: "playing", attributes: {} }), null);

// Abilities are remembered: a player that turns off keeps its layout.
const cast = { state: "playing", attributes: { supported_features: MF.PAUSE | MF.SEEK | MF.STOP | MF.PLAY, media_title: "Dune", media_position: 1, media_duration: 9 } };
let seen = mergeSeen(null, cast);
assert.deepEqual(seen, { f: MF.PAUSE | MF.SEEK | MF.STOP | MF.PLAY, t: true, p: true });
seen = mergeSeen(seen, { state: "off", attributes: { supported_features: 0 } });
assert.equal(seen.t && seen.p && seen.f, MF.PAUSE | MF.SEEK | MF.STOP | MF.PLAY);
const full = barParts(seen, false);
assert.ok(full.show && full.title && full.progress && full.seek && full.jumps && full.play && full.pause && full.stop);

// Never seen: the smallest bar (nothing known) is not shown; a player with only play/pause shows just that.
assert.equal(barParts(mergeSeen(null, undefined), false).show, false);
const simple = barParts(mergeSeen(null, { state: "on", attributes: { supported_features: MF.PAUSE | MF.PLAY } }), false);
assert.ok(simple.show && simple.play && !simple.progress && !simple.jumps && !simple.title);

// Fire TV (ADB): without title or position no bar; jumps by key presses when it reports a position.
const fire = mergeSeen(null, { state: "playing", attributes: { supported_features: MF.PAUSE | MF.PLAY | MF.STOP, app_name: "Netflix" } });
assert.equal(barParts(fire, true).show, false);
const fire2 = barParts(mergeSeen(fire, { state: "playing", attributes: { media_title: "Show" } }), true);
assert.ok(fire2.show && fire2.jumps && !fire2.seek);

// Picker: players of the hub's room first, nothing chosen.
const hass = {
  states: { "remote.wz": {}, "media_player.cc": { attributes: { friendly_name: "Chromecast Ultra" } }, "media_player.k": { attributes: { friendly_name: "Kitchen" } },
    "media_player.lg": { attributes: { friendly_name: "LG TV" } }, "light.x": {} },
  entities: { "remote.wz": { device_id: "d1" }, "media_player.cc": { area_id: "living" }, "media_player.lg": { device_id: "d2" }, "media_player.k": { area_id: "kitchen" } },
  devices: { d1: { area_id: "living" }, d2: { area_id: "living" } },
  areas: { living: { name: "Living room" }, kitchen: { name: "Kitchen" } },
};
const g = playerGroups(hass, "remote.wz");
assert.equal(g.area, "Living room");
assert.deepEqual(g.room.map((i) => i.id), ["media_player.cc", "media_player.lg"]);
assert.deepEqual(g.other.map((i) => [i.id, i.areaName]), [["media_player.k", "Kitchen"]]);
assert.deepEqual(playerGroups({ states: hass.states }, "remote.wz").room, []);

console.log("mediabar ok");
