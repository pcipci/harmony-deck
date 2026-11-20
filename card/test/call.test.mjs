// 0.19: failed Harmony commands are retried quietly, one hint after the last failure, queue keeps order per hub.
import assert from "node:assert";
import { callMixin } from "../src/deck/call.js";

const mk = (impl) => Object.assign(Object.create(callMixin), { _retryWaits: [0, 5, 5], _rerender() {}, _hass: { callService: impl } });
// 1) fails twice, then works: no hint, true
let n = 0;
let c = mk(async () => { if (++n < 3) throw new Error("connection lost"); });
assert.equal(await c._call("remote", "send_command", { entity_id: "remote.a", command: "X" }), true);
assert.equal(n, 3); assert.deepEqual(c._hubDown || {}, {});
// 2) always fails: false and one hint; the toast is switched off (5th argument false)
const args = [];
c = mk(async (...a) => { args.push(a); throw new Error("connection lost"); });
assert.equal(await c._call("remote", "send_command", { entity_id: "remote.a", command: "X" }), false);
assert.ok(c._hubDown["remote.a"]); assert.equal(args.length, 3); assert.equal(args[0][4], false);
assert.ok(c._hubDownHtml({ hubDown: "hint" }).includes("hint"));
// 3) the next command that works clears the hint
c._hass.callService = async () => {};
assert.equal(await c._call("remote", "send_command", { entity_id: "remote.a", command: "Y" }), true);
assert.equal(c._hubDownHtml({ hubDown: "hint" }), "");
// 4) commands of one hub run one after the other
const order = [];
c = mk(async (d, s, data) => { order.push("start" + data.command); await new Promise((r) => setTimeout(r, 10)); order.push("end" + data.command); });
await Promise.all([c._call("remote", "send_command", { entity_id: "remote.a", command: "1" }), c._call("remote", "send_command", { entity_id: "remote.a", command: "2" })]);
assert.deepEqual(order, ["start1", "end1", "start2", "end2"]);
clearTimeout(c._hubDownTm);
console.log("call ok");
process.exit(0);
