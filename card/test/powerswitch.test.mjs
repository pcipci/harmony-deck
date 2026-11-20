// Tube radio On/Off switch (0.15.5): it must send the command itself (keys send on pointerdown, a click reached nothing).
import assert from "node:assert/strict";
import { skinDecorMixin } from "../src/deck/skin-decor.js";

const calls = [];
const o = { ...skinDecorMixin, _buzz() {}, _holdOpt: () => ({}), _hass: { callService: (...a) => calls.push(a) } };
o._swPowerSend("remote.wz", "LG-Fernseher", true);
o._swPowerSend("remote.wz", "LG-Fernseher", false);
assert.deepEqual(calls, [
  ["remote", "send_command", { entity_id: "remote.wz", device: "LG-Fernseher", command: "PowerOn" }],
  ["remote", "send_command", { entity_id: "remote.wz", device: "LG-Fernseher", command: "PowerOff" }],
]);
assert.equal(o._pwrLast["remote.wz/LG-Fernseher"], false);

// the knob (a button) sends On when it was off and Off when it was on, through _swPowerSend
const listeners = [];
const attrs = { "aria-pressed": "false" };
const el = { dataset: { hub: "remote.sz", device: "TV" }, parentElement: { classList: { toggle() {} } }, getAttribute: (k) => attrs[k], setAttribute: (k, v) => { attrs[k] = v; }, addEventListener: (ev, fn) => listeners.push([ev, fn]) };
const root = { querySelectorAll: (sel) => (sel === "button[data-swpwr]" ? [el] : []) };
const sent = [];
const p = { ...skinDecorMixin, _bindStickyHeader() {}, _swPowerSend: (...a) => sent.push(a) };
p._bindSkinDecor(root);
assert.equal(listeners[0][0], "click");
listeners[0][1]();
listeners[0][1]();
assert.deepEqual(sent, [["remote.sz", "TV", true], ["remote.sz", "TV", false]]);

// state from the linked player: known = true/false, unknown = null (then the keys I and O show)
const st = (state) => ({ ...skinDecorMixin, _settings: () => ({ directDevices: { r: { TV: { entity: "media_player.tv" } } } }), _hass: { states: { "media_player.tv": { state } } } });
assert.equal(st("on")._powerState("r", "TV"), true);
assert.equal(st("off")._powerState("r", "TV"), false);
assert.equal(st("unavailable")._powerState("r", "TV"), null);
assert.equal({ ...skinDecorMixin, _settings: () => ({}), _hass: { states: {} } }._powerState("r", "TV"), null);
console.log("powerswitch ok");
