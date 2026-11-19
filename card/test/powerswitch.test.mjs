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

// the change event of the checkbox reaches _swPowerSend with the switch state
const listeners = [];
const el = { dataset: { hub: "remote.sz", device: "TV" }, checked: true, addEventListener: (ev, fn) => listeners.push([ev, fn]) };
const root = { querySelectorAll: (sel) => (sel === "input[data-swpwr]" ? [el] : []) };
const sent = [];
const p = { ...skinDecorMixin, _bindStickyHeader() {}, _swPowerSend: (...a) => sent.push(a) };
p._bindSkinDecor(root);
assert.equal(listeners[0][0], "change");
listeners[0][1]();
assert.deepEqual(sent, [["remote.sz", "TV", true]]);
console.log("powerswitch ok");
