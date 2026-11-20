// Tube radio On/Off switch (0.15.5): it must send the command itself (keys send on pointerdown, a click reached nothing).
import assert from "node:assert/strict";
import { skinDecorMixin } from "../src/deck/skin-decor.js";
import { deviceStateMixin } from "../src/deck/device-state.js";

const calls = [];
const o = { ...deviceStateMixin, _settings: () => ({}), _rerender() {}, _buzz() {}, _holdOpt: () => ({}), _hass: { callService: (...a) => calls.push(a) } };
o._swPowerSend("remote.wz", "LG-Fernseher", true);
o._swPowerSend("remote.wz", "LG-Fernseher", false);
assert.deepEqual(calls, [
  ["remote", "send_command", { entity_id: "remote.wz", device: "LG-Fernseher", command: "PowerOn" }],
  ["remote", "send_command", { entity_id: "remote.wz", device: "LG-Fernseher", command: "PowerOff" }],
]);
assert.equal(o._powerState("remote.wz", "LG-Fernseher"), null);
assert.equal(o._pwrPend["remote.wz/LG-Fernseher"].on, false);
clearTimeout(o._pwrT);

// the knob (a button) sends On when it was off and Off when it was on, through _swPowerSend
const listeners = [];
const attrs = { "aria-pressed": "false" };
const el = { dataset: { hub: "remote.sz", device: "TV" }, parentElement: { classList: { toggle() {}, add() {} } }, getAttribute: (k) => attrs[k], setAttribute: (k, v) => { attrs[k] = v; }, addEventListener: (ev, fn) => listeners.push([ev, fn]) };
const root = { querySelectorAll: (sel) => (sel === "button[data-swpwr]" ? [el] : []) };
const sent = [];
const p = { ...skinDecorMixin, _bindStickyHeader() {}, _swPowerSend: (...a) => sent.push(a) };
p._bindSkinDecor(root);
assert.equal(listeners[0][0], "click");
listeners[0][1]();
listeners[0][1]();
assert.deepEqual(sent, [["remote.sz", "TV", true], ["remote.sz", "TV", false]]);

// state from the linked player: known = true/false, unknown = null (then the keys I and O show)
const st = (state) => ({ ...deviceStateMixin, _settings: () => ({ directDevices: { r: { TV: { entity: "media_player.tv" } } } }), _hass: { states: { "media_player.tv": { state } } } });
assert.equal(st("on")._powerState("r", "TV"), true);
assert.equal(st("off")._powerState("r", "TV"), false);
assert.equal(st("unavailable")._powerState("r", "TV"), null);
assert.equal({ ...deviceStateMixin, _settings: () => ({}), _hass: { states: {} } }._powerState("r", "TV"), null);

// direct commands: Off goes to the player when it is reachable and can turn off, On always over Harmony
const player = (state, features, extra = {}) => ({ ...deviceStateMixin, _holdOpt: () => ({}),
  _settings: () => ({ directDevices: { r: { TV: { entity: "media_player.tv", volumeDirect: false } } } }),
  _hass: { states: { "media_player.tv": { state, attributes: { supported_features: features, ...extra } } }, callService: (...a) => direct.push(a) } });
const direct = [];
let q = player("on", 256 | 8);
q._sendCmd("r", "TV", "PowerOff");
q._sendCmd("r", "TV", "PowerOn");
q._sendCmd("r", "TV", "Mute");
assert.deepEqual(direct, [
  ["media_player", "turn_off", { entity_id: "media_player.tv" }],
  ["remote", "send_command", { entity_id: "r", device: "TV", command: "PowerOn" }],
  ["media_player", "volume_mute", { entity_id: "media_player.tv", is_volume_muted: true }],
]);
direct.length = 0;
q = player("unavailable", 256);                       // not reachable: Harmony
q._sendCmd("r", "TV", "PowerOff");
q = player("on", 0);                                  // no capability: Harmony
q._sendCmd("r", "TV", "PowerOff");
assert.deepEqual(direct.map((c) => c[0]), ["remote", "remote"]);
// pending switch state until the player confirms
const pp = player("on", 256); pp._rerender = () => {}; pp._buzz = () => {};
pp._swPowerSend("r", "TV", false);
assert.equal(pp._powerPending("r", "TV"), false);
clearTimeout(pp._pwrT);
const confirmed = { ...pp, _hass: { ...pp._hass, states: { "media_player.tv": { state: "off", attributes: {} } } } };
assert.equal(confirmed._powerPending("r", "TV"), null);
console.log("powerswitch ok");
