// 0.17/0.18: old skin keys map to a successor, room skin beats default skin, YAML beats room skin, segment letters.
import assert from "node:assert";
import { skinKey, SKINS, skinOrder } from "../src/shared/skins.js";
import { segSvg } from "../src/shared/segfont.js";
import { optionsMixin } from "../src/deck/options.js";

assert.equal(skinKey("remote"), "dark"); assert.equal(skinKey("device"), "dark"); assert.equal(skinKey("nope"), "homebase"); assert.equal(skinKey("nixie"), "nixie");
for (const k of ["thermal", "nixie", "nostromo", "dark"]) assert.ok(SKINS[k] && skinOrder().includes(k), k);
assert.ok(!("remote" in SKINS) && !("device" in SKINS));
const mk = (config, settings, hubSel) => Object.assign(Object.create(optionsMixin), { _config: config, _hubSel: hubSel, _settings: () => settings });
assert.equal(mk({}, { skin: "nord", roomSkins: { a: "thermal" } }, "a")._skin(), "thermal");
assert.equal(mk({}, { skin: "nord", roomSkins: { a: "thermal" } }, "b")._skin(), "nord");
assert.equal(mk({ skin: "paper" }, { skin: "nord", roomSkins: { a: "thermal" } }, "a")._skin(), "paper");
assert.equal(mk({}, { skin: "remote" }, "a")._skin(), "dark");
assert.ok(segSvg("Bluray").includes("<svg") && segSvg("Äpfel") && segSvg("x".repeat(17)) === null && segSvg("a@b") === null);
console.log("skins170 ok");
