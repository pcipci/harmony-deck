// Own key order (0.27): inside a block, one place left / right, new keys last.
import assert from "node:assert/strict";
import { applyOrder, moveKey, mergeOrder } from "../src/shared/keyorder.js";

assert.deepEqual(applyOrder(["A", "B", "C"], []), ["A", "B", "C"]);
assert.deepEqual(applyOrder(["A", "B", "C"], ["C", "A"]), ["C", "A", "B"]);         // B is new: last
assert.deepEqual(applyOrder(["A", "B", "C", "D"], ["X", "D"]), ["D", "A", "B", "C"]); // unknown keep their order
assert.deepEqual(moveKey(["A", "B", "C"], "B", -1), ["B", "A", "C"]);
assert.deepEqual(moveKey(["A", "B", "C"], "B", 1), ["A", "C", "B"]);
assert.deepEqual(moveKey(["A", "B", "C"], "A", -1), ["A", "B", "C"]);               // edge: unchanged
assert.deepEqual(moveKey(["A", "B", "C"], "C", 1), ["A", "B", "C"]);
// a block changes, the order of another block stays
const order = mergeOrder(["X", "Y", "A", "B"], ["B", "A"]);
assert.deepEqual(applyOrder(["A", "B"], order), ["B", "A"]);
assert.deepEqual(applyOrder(["Y", "X"], order), ["X", "Y"]);
console.log("keyorder ok");
