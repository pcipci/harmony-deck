// Volume slider of a step-only TV: after release the slider stays on the target until the TV reports it (or the hold
// time the integration gave is over), then it follows the TV again.
import assert from "node:assert/strict";
import { volSliderMixin } from "../src/deck/volslider.js";

const card = Object.create(volSliderMixin);
let level = 0.5;
let redraws = 0;
Object.assign(card, {
  _edit: false,
  _t: () => ({ volume: "Volume" }),
  _sl: { "remote.wz": { activity: { activity: "TV", device: "LG", entity: "media_player.tv", cap: 80, release: true }, devices: {} } },
  _hass: { states: { "media_player.tv": { state: "on", attributes: { get volume_level() { return level; } } } },
    callWS: async (m) => ({ ok: true, value: m.value, hold: 5000 }) },
});
Object.defineProperty(card, "hass", { set() { redraws++; }, get() { return card._hass; } });
const h = { id: "remote.wz", current: "TV" };
const r = { volume: "LG" };
const shown = () => Number(card._volSlider(h, r, "h").match(/value="(\d+)"/)[1]);

assert.equal(shown(), 50);
await card._volSend("remote.wz", 10);
assert.equal(card._volHold["remote.wz"].target, 10);
level = 0.31;                       // the TV is still on its way
assert.equal(shown(), 10, "slider stays on the target while the steps run");
level = 0.10;                       // reached
assert.equal(shown(), 10);
await new Promise((res) => setTimeout(res, 5));
assert.equal(card._volHold["remote.wz"], undefined, "hold released once the TV reports the target");
level = 0.12;                       // later change on the TV itself
assert.equal(shown(), 12, "slider follows the TV again");
// hold time over without reaching the target
await card._volSend("remote.wz", 40);
card._volHold["remote.wz"].until = Date.now() - 1;
level = 0.33;
shown();
await new Promise((res) => setTimeout(res, 5));
assert.equal(shown(), 33, "after the hold time the slider shows the real level");
for (const id of Object.keys(card._volHoldTm || {})) clearTimeout(card._volHoldTm[id]);
console.log("volhold ok");
