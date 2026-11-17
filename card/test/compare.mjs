// Regression check: compares the rendered markup of two builds case by case, character by character.
import fs from "fs";
const [a, b] = process.argv.slice(2);
const names = fs.readdirSync(a); let diff = 0, same = 0; const missing = [];
for (const n of names) {
  if (!fs.existsSync(`${b}/${n}`)) { missing.push(n); continue; }
  const x = fs.readFileSync(`${a}/${n}`, "utf8"), y = fs.readFileSync(`${b}/${n}`, "utf8");
  if (x === y) { same++; continue; }
  diff++;
  if (diff <= 5) { let i = 0; while (i < x.length && x[i] === y[i]) i++; console.log(`DIFF ${n} at ${i}:\n  a: ${JSON.stringify(x.slice(Math.max(0, i - 60), i + 80))}\n  b: ${JSON.stringify(y.slice(Math.max(0, i - 60), i + 80))}`); }
}
console.log(`cases ${names.length}, identical ${same}, different ${diff}, missing ${missing.length}`);
process.exit(diff || missing.length ? 1 : 0);
