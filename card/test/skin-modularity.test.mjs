// Skins only draw: logic files must ask for traits (shared/skin-traits.js) and never name a skin.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "src");
const allowed = new Set(["skin-decor.js", "style.js"]);        // markup and CSS of the skins
const names = /skin\w*(\(\))?\s*[!=]==?\s*["'`]\w+["'`]|["'`]\w+["'`]\s*[!=]==?\s*\w*skin\w*(\(\))?\b/i;   // comparisons like skin === "radio"
let bad = 0;
for (const dir of ["deck", "config-editor"]) {
  for (const f of readdirSync(join(root, dir)).filter((x) => x.endsWith(".js") && !allowed.has(x))) {
    readFileSync(join(root, dir, f), "utf8").split("\n").forEach((line, i) => {
      if (names.test(line)) { console.error(`skin name in logic: ${dir}/${f}:${i + 1}: ${line.trim().slice(0, 100)}`); bad++; }
    });
  }
}
if (bad) process.exit(1);
console.log("skin modularity ok");
