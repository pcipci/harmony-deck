// Fire TV settings on the link (0.13): where _fireCfg reads and _fireSave writes.
import assert from "node:assert/strict";
import { fireMixin } from "../src/deck/fire.js";

const make = (settings) => { const o = { ...fireMixin, saved: null, _settings: () => settings, _saveSettings: async (p) => { o.saved = p; Object.assign(settings, p); } }; return o; };

// read from the link, entity and device come from the link itself
let s = { directDevices: { r: { Cube: { entity: "media_player.fire", fire: { model: "cube", pkgs: { Netflix: "x" } } } } }, direct: { r: { entity: "media_player.old" } } };
let c = make(s);
assert.deepEqual(c._fireCfg("r"), { model: "cube", pkgs: { Netflix: "x" }, entity: "media_player.fire", device: "Cube" });
// old place as fallback
c = make({ direct: { r: { entity: "media_player.old" } } });
assert.equal(c._fireCfg("r").entity, "media_player.old");
assert.equal(make({})._fireCfg("r"), null);

// save writes onto the link and clears the old entry
s = { directDevices: { r: { Cube: { entity: "media_player.fire", fire: {} } } }, direct: { r: { entity: "media_player.fire", device: "Cube" } } };
c = make(s);
await c._fireSave("r", { entity: "media_player.fire", device: "Cube", model: "stick", hiddenApps: ["A"] });
assert.deepEqual(s.directDevices.r.Cube.fire, { model: "stick", hiddenApps: ["A"] });
assert.equal(s.direct.r, undefined);
assert.equal(s.directDevices.r.Cube.entity, "media_player.fire");

// nothing linked: stays in the old place
s = { directDevices: {}, direct: {} };
c = make(s);
await c._fireSave("r", { entity: "media_player.fire", device: "Cube" });
assert.equal(s.direct.r.entity, "media_player.fire");

// remove
s = { directDevices: { r: { Cube: { entity: "media_player.fire", fire: { model: "x" } } } }, direct: {} };
c = make(s);
await c._fireSave("r", null);
assert.equal("fire" in s.directDevices.r.Cube, false);
// linking the same player: an empty block must not hide the old settings (0.15.4)
s = { directDevices: { r: { Cube: { entity: "media_player.fire", fire: {} } } }, direct: { r: { entity: "media_player.fire", device: "", prefer: "adb", model: "cube", hiddenApps: ["Kodi"] } } };
c = make(s);
assert.deepEqual(c._fireCfg("r"), { entity: "media_player.fire", prefer: "adb", model: "cube", hiddenApps: ["Kodi"], device: "Cube" });
// a different player in the old place does not leak in
s = { directDevices: { r: { Cube: { entity: "media_player.fire", fire: {} } } }, direct: { r: { entity: "media_player.other", prefer: "adb" } } };
assert.deepEqual(make(s)._fireCfg("r"), { entity: "media_player.fire", device: "Cube" });
console.log("firecfg ok");
