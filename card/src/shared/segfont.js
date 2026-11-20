// 14-segment letters drawn as SVG lines (angular, "segment display" look) for the skin "thermal".
// Only short names are drawn this way; unknown characters make the caller keep the normal font.

const S = { a: [2, 2, 18, 2], b: [20, 4, 20, 18], c: [20, 22, 20, 36], d: [2, 38, 18, 38], e: [0, 22, 0, 36], f: [0, 4, 0, 18], g1: [2, 20, 10, 20], g2: [12, 20, 18, 20], h: [2, 4, 9, 17], i: [10, 4, 10, 18], j: [18, 4, 11, 17], k: [2, 36, 9, 23], l: [10, 22, 10, 36], m: [18, 36, 11, 23] };
const G = { A: "abcefg1g2", B: "abcdig2l", C: "adef", D: "abcdil", E: "adefg1", F: "aefg1", G: "acdefg2", H: "bcefg1g2", I: "adil", J: "bcde", K: "efg1jm", L: "def", M: "efbchj", N: "efbchm", O: "abcdef", P: "abefg1g2", Q: "abcdefm", R: "abefg1g2m", S: "afg1g2cd", T: "ail", U: "bcdef", V: "efkj", W: "efcbkm", X: "hjkm", Y: "hjl", Z: "ajkd", 0: "abcdef", 1: "bc", 2: "abdeg1g2", 3: "abcdg2", 4: "bcfg1g2", 5: "acdfg1g2", 6: "acdefg1g2", 7: "abc", 8: "abcdefg1g2", 9: "abcdfg1g2", "-": "g1g2", "+": "g1g2il", " ": "", ":": ".", "/": "jk", "\\": "hm", "_": "d", "(": "adef", ")": "abcd" };
const UM = { "Ä": "A", "Ö": "O", "Ü": "U" };
export const SEG_MAX = 40;

// Returns an svg string (colour = currentColor) or null when the text has to stay in the normal font.
export function segSvg(text, h = 18) {
  const str = String(text ?? "").trim().toUpperCase().replace("ß", "SS").replace("…", "...");
  if (!str || str.length > SEG_MAX) return null;
  const lead = /^\s/.test(String(text ?? "")), trail = /\s$/.test(String(text ?? ""));
  let x = lead ? 34 : 0, out = "";
  for (const raw of str) {
    const ch = UM[raw] || raw;
    if (!(ch in G)) return null;
    if (ch === " ") { x += 34; continue; }
    if (ch === "." || ch === ",") { out += `<circle cx="${x + 6}" cy="37" r="2.2" stroke="none"/>`; x += 14; continue; }
    if (ch === ":") { out += `<circle cx="${x + 10}" cy="14" r="2"/><circle cx="${x + 10}" cy="28" r="2"/>`; x += 22; continue; }
    for (const k of G[ch].match(/g1|g2|[a-m]/g) || []) { const s = S[k]; out += `<line x1="${s[0] + x}" y1="${s[1]}" x2="${s[2] + x}" y2="${s[3]}"/>`; }
    if (UM[raw]) out += `<line x1="${x + 5}" y1="-3" x2="${x + 6}" y2="-3"/><line x1="${x + 14}" y1="-3" x2="${x + 15}" y2="-3"/>`;
    x += 28;
  }
  if (trail) x += 34;
  return `<svg class="segtxt" viewBox="-2 -6 ${x + 2} 50" height="${h}" width="${Math.round(((x + 2) * h) / 50)}" fill="currentColor" stroke="currentColor" stroke-width="4.4" stroke-linecap="square" aria-hidden="true">${out}</svg>`;
}
