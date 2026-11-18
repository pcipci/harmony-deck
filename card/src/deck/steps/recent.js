// Recently used choices of the step editor, per browser (a convenience only: works without storage too).

const KEY = "harmony-deck-recent";
const MAX = 12;
let memory = {};

const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { return memory; }
};

export function recent(kind) { return (load()[kind] || []).filter(Boolean); }

export function remember(kind, item) {
  const all = load();
  const same = (x) => JSON.stringify(x) === JSON.stringify(item);
  all[kind] = [item, ...(all[kind] || []).filter((x) => !same(x))].slice(0, MAX);
  memory = all;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* storage blocked: keep it for this page */ }
}
