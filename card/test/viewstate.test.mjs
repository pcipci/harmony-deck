// Remember the view (0.24.1): used only within the time, and dropped when an activity changed meanwhile.
import assert from "node:assert/strict";
import { viewToRestore } from "../src/deck/viewstate.js";

const hubs = [{ id: "remote.a", current: "TV" }, { id: "remote.b", current: "PowerOff" }];
const now = 1_000_000_000;
const saved = { at: now - 10 * 60000, hub: "remote.a", mode: "devices", device: { "remote.a": "LG", "remote.gone": "X" },
  collapsed: { "remote.a": true }, scroll: [[3, 420], ["x", 1]], current: { "remote.a": "TV", "remote.b": "PowerOff" } };

const v = viewToRestore(saved, now, 120, hubs);
assert.equal(v.hub, "remote.a");
assert.equal(v.mode, "devices");
assert.deepEqual(v.device, { "remote.a": "LG" }, "devices of hubs that are gone are dropped");
assert.deepEqual(v.collapsed, { "remote.a": true });
assert.deepEqual(v.scroll, [[3, 420]]);

assert.equal(viewToRestore(saved, now, 0, hubs), null, "off");
assert.equal(viewToRestore(saved, now + 3 * 3600000, 120, hubs), null, "too old");
assert.equal(viewToRestore(saved, now, 120, [{ id: "remote.a", current: "Radio" }, hubs[1]]), null, "activity changed elsewhere");
assert.equal(viewToRestore(saved, now, 120, [hubs[0], { id: "remote.b", current: "SAT" }]), null, "activity started in another room");
assert.equal(viewToRestore(null, now, 120, hubs), null);
assert.equal(viewToRestore({ ...saved, at: now + 5000 }, now, 120, hubs), null, "clock went back");
assert.equal(viewToRestore({ ...saved, hub: "remote.gone" }, now, 120, hubs).hub, null);
console.log("viewstate ok");
