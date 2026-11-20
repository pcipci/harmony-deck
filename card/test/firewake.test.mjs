// A sleeping Fire TV (standby, screensaver) is woken before a key or app is sent; Standby/Wake themselves are sent at once.
import assert from "node:assert/strict";
import { dataMixin } from "../src/deck/data.js";

const run = (attrs, state, command) => {
  const calls = [];
  const o = { ...dataMixin, _call(d, s, x) { this._hass.callService(d, s, x); }, _buzz() {}, _hass: { states: { "media_player.fire": { state, attributes: attrs } }, callService: (...a) => calls.push(a[2].command) } };
  o._adb("media_player.fire", command);
  return calls;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

assert.deepEqual(run({ app_id: "com.netflix.ninja" }, "playing", "input keyevent 85"), ["input keyevent 85"]);
assert.deepEqual(run({ app_id: "com.amazon.tv.launcher" }, "idle", "input keyevent 3"), ["input keyevent 3"]);
const slept = run({ app_id: "com.amazon.ftv.screensaver" }, "idle", "input keyevent 3");
assert.deepEqual(slept, ["input keyevent 224"]);
await wait(900);
assert.deepEqual(slept, ["input keyevent 224", "input keyevent 3"]);
assert.deepEqual(run({}, "standby", "input keyevent 223"), ["input keyevent 223"]);
assert.deepEqual(run({}, "standby", "input keyevent 224"), ["input keyevent 224"]);
console.log("firewake ok");
