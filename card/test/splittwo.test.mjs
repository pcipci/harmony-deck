// Long names with a hyphen or space are split into two lines in the segment skin.
import assert from "node:assert/strict";
import { splitTwo } from "../src/deck/skin-decor.js";

assert.deepEqual(splitTwo("Panasonic-Mini-System"), ["Panasonic-", "Mini-System"]);
assert.deepEqual(splitTwo("Amazon Fire TV Cube"), ["Amazon Fire", "TV Cube"]);
assert.equal(splitTwo("Blu-ray"), null);
assert.equal(splitTwo("Wohnzimmerlampenschalter"), null);
console.log("splittwo ok");
