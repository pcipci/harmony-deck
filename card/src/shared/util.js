// Small helpers shared by all cards: HTML escaping and the hold-ring graphics.

export const RING_IB = '<svg class="hring" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20"/></svg>';

export const RING_TILE = '<svg class="hring big" viewBox="0 0 60 60"><circle cx="30" cy="30" r="27"/></svg>';

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Short hint on a key or tile (locked, hold to switch ...): its own element with the text of data-hinttext, so a skin
// that uses the ::before of a tile itself (prompt sign, tube number) cannot hide it. Gone again after `ms`.
export const showHint = (b, ms = 1600) => {
  const text = b?.dataset?.hinttext;
  if (!text) return;
  b.querySelector(":scope > .hintbub")?.remove();
  const el = document.createElement("i");
  el.className = "hintbub";
  el.textContent = text;
  b.appendChild(el);
  b.dataset.hint = "1";
  clearTimeout(b._hintTm);
  b._hintTm = setTimeout(() => { el.remove(); b.removeAttribute("data-hint"); }, ms);
};
