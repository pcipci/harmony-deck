// Decoration of the effect skins (see shared/skin-css.js): glass reflection and torn band (terminal),
// dial with magic eye (radio). The eye follows the volume of the running activity's device.
import { segSvg } from "../shared/segfont.js";
import { skinTrait } from "../shared/skin-traits.js";

// A long name with a hyphen or space ("Panasonic-Mini-System") is split there into two larger lines instead of one tiny one.
const TWO_MIN = 12;
export function splitTwo(text) {
  const str = String(text ?? "").trim();
  if (str.length < TWO_MIN) return null;
  const cuts = [];
  for (let i = 1; i < str.length - 1; i++) { if (str[i] === "-" || str[i] === " ") cuts.push(i); }
  if (!cuts.length) return null;
  const mid = str.length / 2;
  const at = cuts.reduce((best, c) => (Math.abs(c - mid) < Math.abs(best - mid) ? c : best), cuts[0]);
  const first = (str[at] === "-" ? str.slice(0, at + 1) : str.slice(0, at)).trim(), second = str.slice(at + 1).trim();
  return first && second ? [first, second] : null;
}

export const skinDecorMixin = {
  _skinHead(skin, h) {
    if (!skinTrait(skin, "dial")) return "";
    const clean = (x) => String(x ?? "").replace(/[<>&"]/g, "");
    // The needle sits where the running activity is on the dial (spread over the list) and its name stands next to it.
    const acts = (h?.list || []).filter((a) => a !== "PowerOff");
    const idx = h?.current ? acts.indexOf(h.current) : -1;
    const run = idx >= 0;
    const needle = run ? 10 + (acts.length > 1 ? (idx / (acts.length - 1)) * 80 : 40) : 6;
    const lab = run ? `<span class="skin-sta ${needle > 62 ? "left" : ""}" style="--needle:${needle}%">${clean(h.current)}</span>` : "";
    return `<div class="skin-head"><div class="skin-wrap"><div class="skin-dial"><i style="--needle:${needle}%"></i></div>${lab}</div><div class="skin-eye" style="--eye:${this._eyeLevel(h)}"></div></div>`;
  },

  _skinTail(skin) {
    return skinTrait(skin, "glass") ? '<div class="skin-tear"></div><div class="skin-glare"></div>' : "";
  },

  // The eye follows the volume without redrawing the card.
  _eyeUpdate(hubs) {
    const el = this.shadowRoot?.querySelector(".skin-eye");
    if (!el) return;
    const h = hubs.find((x) => x.id === this._hubSel) || hubs[0];
    el.style.setProperty("--eye", this._eyeLevel(h));
  },

  // Tube radio, device view: On/Off as a sunken brass button in a bezel with a lamp behind (known state), see _bindSkinDecor.
  _powerKnob(hub, dev, real) {
    const pend = this._powerPending(hub, dev);
    const on = pend ?? real;
    const a = `data-swpwr data-hub="${hub.replace(/"/g, "")}" data-device="${String(dev).replace(/"/g, "&quot;")}"`;
    return `<span class="pwknob ${on ? "on" : ""} ${pend !== null ? "pend" : ""}"><button type="button" class="knob" ${a} aria-pressed="${on ? "true" : "false"}"><ha-icon icon="mdi:power"></ha-icon></button></span>`;
  },

  // The collapsed header no longer sticks (0.16): the offset below the Home Assistant bar was wrong in views with tabs and pushed it over the keys.
  _bindStickyHeader() { if (this._stickFn) window.removeEventListener("scroll", this._stickFn, true); this._stickFn = null; },

  // Skin "thermal": every short text in segment letters (the normal text stays as aria-label; longer texts or characters the
  // segment font lacks keep the normal font). Walks all text nodes, skipping form fields, so keys, labels, tabs and tiles are covered.
  _segNames(root) {
    if (!this._trait("segFont")) return;
    const card = root.querySelector("ha-card");
    if (!card) return;
    const skip = "select, option, textarea, input, style, script, svg, [data-segtxt]";
    const walker = card.ownerDocument.createTreeWalker(card, 4);
    const nodes = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) { if (n.nodeValue.trim() && !n.parentElement.closest(skip)) nodes.push(n); }
    nodes.forEach((n) => {
      const inTile = !!n.parentElement.closest(".tile");
      let svg = segSvg(n.nodeValue, inTile ? 16 : 12);
      const two = inTile && svg ? splitTwo(n.nodeValue) : null;
      if (two) { const a = segSvg(two[0], 16), b = segSvg(two[1], 16); if (a && b) svg = `${a}<br>${b}`; }
      if (!svg) return;
      const sp = card.ownerDocument.createElement("span");
      sp.dataset.segtxt = "1"; sp.setAttribute("aria-label", n.nodeValue.trim()); sp.innerHTML = svg;
      n.replaceWith(sp);
    });
  },

  _bindSkinDecor(root) {
    this._bindStickyHeader(root);
    this._segNames(root);
    root.querySelectorAll("button[data-swpwr]").forEach((el) => el.addEventListener("click", () => {
      const { hub, device } = el.dataset;
      const on = el.getAttribute("aria-pressed") !== "true";
      el.setAttribute("aria-pressed", on ? "true" : "false");
      el.parentElement.classList.toggle("on", on);
      el.parentElement.classList.add("pend");
      this._swPowerSend(hub, device, on);
    }));
  },
};
