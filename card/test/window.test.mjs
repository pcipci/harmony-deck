// One window for gear, help and profile: at most one is open, the same symbol closes, another switches.
import assert from "node:assert/strict";
import { infoMixin } from "../src/deck/info.js";

const o = { ...infoMixin };
o._winToggle("r", "menu");
assert.equal(o._winKind("r"), "menu");
o._winToggle("r", "help");
assert.equal(o._winKind("r"), "help");
assert.equal(!!o._menuOpen.r, false);
o._winToggle("r", "prof");
assert.equal(o._winKind("r"), "prof");
assert.equal(!!o._helpOpen.r, false);
o._winToggle("r", "prof");
assert.equal(o._winKind("r"), null);
console.log("window ok");
