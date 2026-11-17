// Recomputes the import lines of every module from the names it uses (keeps the rest of the file).
import fs from "fs"; import path from "path";
const root = process.argv[2] || "src";
const files = []; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".js") && files.push(path.join(d, e.name))));
walk(root);
const exportsOf = {};
for (const f of files) { const t = fs.readFileSync(f, "utf8"); exportsOf[f] = [...t.matchAll(/^export (?:const|function|class|async function) ([A-Za-z_$][\w$]*)/gm)].map((m) => m[1]); }
for (const f of files) {
  let t = fs.readFileSync(f, "utf8");
  const lines = t.split("\n"); const keep = lines.filter((l) => !/^import \{[^}]*\} from "\.[^"]*";$/.test(l));
  const body = keep.join("\n");
  const code = body.replace(/^export (?:const|function|class) \w+/gm, "");
  const imps = [];
  for (const [g, names] of Object.entries(exportsOf)) {
    if (g === f) continue;
    const used = names.filter((n) => new RegExp("(?<![\\w$\"])(?<!(?<!\\.\\.)\\.)" + n.replace(/\$/g, "\\$") + "(?![\\w$\"])").test(code));
    if (used.length) { let r = path.posix.relative(path.posix.dirname(f), g); if (!r.startsWith(".")) r = "./" + r; imps.push(`import { ${used.join(", ")} } from "${r}";`); }
  }
  // header comment block (leading // or /* */ lines) stays first
  let i = 0; while (i < keep.length && (/^\/\//.test(keep[i]) || /^\/\*/.test(keep[i]) || /^ \*/.test(keep[i]))) i++;
  const rest = keep.slice(i).join("\n").replace(/^\n+/, "");
  fs.writeFileSync(f, keep.slice(0, i).join("\n") + (i ? "\n" : "") + (imps.length ? imps.sort().join("\n") + "\n" : "") + "\n" + rest);
}
