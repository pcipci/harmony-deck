// Condition editor shared by the steps "Wait until" and "If": one Home Assistant entity, its state or one
// attribute, a comparison and a value. Nothing here knows kinds of devices ("TV is on", "Harmony runs Fire TV"
// and "volume above 30" are the same form); the integration evaluates it (conditions.py).
import { esc } from "../../shared/util.js";

const HIDDEN_ATTRS = new Set(["friendly_name", "icon", "entity_picture", "supported_features", "supported_color_modes", "attribution", "restored", "editable", "assumed_state", "entity_picture_local"]);
const OPS = ["is", "not", "gt", "lt", "ge", "le"];
const NUMERIC = ["gt", "lt", "ge", "le"];
const SHOWN = 60;

const states = (card) => card?._hass?.states || {};
const nameOf = (card, id) => states(card)[id]?.attributes?.friendly_name || id;
const opText = (t) => ({ is: t.cOpIs, not: t.cOpNot, gt: t.cOpGt, lt: t.cOpLt, ge: t.cOpGe, le: t.cOpLe });
const scalar = (v) => (typeof v === "string" || typeof v === "number" || typeof v === "boolean" ? String(v) : null);

export const newCond = () => ({ entity: "", attr: "", op: "is", value: "" });

export function condValid(c) {
  if (!c || !/^[a-z_]+\.[a-z0-9_]+$/.test(c.entity || "")) return false;
  if (NUMERIC.includes(c.op)) return c.value !== "" && Number.isFinite(Number(c.value));
  return String(c.value ?? "") !== "";
}

/** "Yamaha AVR is on", "Living room current_activity is Fire TV" */
export function condText(c, card, t) {
  if (!c?.entity) return t.cPick;
  return [nameOf(card, c.entity), c.attr, opText(t)[c.op] || c.op, c.value === "" ? "…" : c.value].filter(Boolean).join(" ");
}

function pickerHtml(card, t) {
  const st = states(card);
  const ids = Object.keys(st).sort((a, b) => nameOf(card, a).localeCompare(nameOf(card, b), undefined, { sensitivity: "base" }));
  const item = (id) => `<button type="button" class="pent" data-cpick="${esc(id)}" data-q="${esc(`${nameOf(card, id)} ${id}`.toLowerCase())}"><span>${esc(nameOf(card, id))}</span><small>${esc(id)} · ${esc(st[id]?.state ?? "")}</small></button>`;
  return `<input type="search" class="psearch" data-csearch placeholder="${esc(t.stepSearchEntity)}" autocomplete="off">
    <div class="plist" data-clist>${ids.map(item).join("")}</div><div class="ehint" data-cmore hidden>${t.stepMore}</div>`;
}

export function condHtml(c, card, t) {
  if (!c.entity) return pickerHtml(card, t);
  const st = states(card)[c.entity];
  const attrs = Object.keys(st?.attributes || {}).filter((k) => !HIDDEN_ATTRS.has(k)).sort();
  if (c.attr && !attrs.includes(c.attr)) attrs.unshift(c.attr);
  const cur = c.attr ? scalar(st?.attributes?.[c.attr]) : st?.state ?? null;
  const ops = opText(t);
  const chips = [...new Set([cur, ...(c.attr ? [] : ["on", "off"])].filter((x) => x !== null && x !== ""))];
  return `<div class="erow"><span><b>${esc(nameOf(card, c.entity))}</b><small class="pid">${esc(c.entity)} · ${esc(st?.state ?? t.unavailable)}</small></span><button type="button" class="mini txt" data-cpick="">${t.stepChange}</button></div>
    <label class="erow"><span>${t.cWhat}</span><select data-cattr><option value="" ${c.attr ? "" : "selected"}>${esc(t.cState)}</option>${attrs.map((a) => `<option value="${esc(a)}" ${a === c.attr ? "selected" : ""}>${esc(a)}</option>`).join("")}</select></label>
    <label class="erow"><span>${t.cCompare}</span><select data-cop>${OPS.map((o) => `<option value="${o}" ${o === c.op ? "selected" : ""}>${esc(ops[o])}</option>`).join("")}</select></label>
    <label class="erow"><span>${t.cValue}</span><input type="${NUMERIC.includes(c.op) ? "number" : "text"}" step="any" data-cval value="${esc(c.value)}"></label>
    ${chips.length ? `<div class="pchips">${chips.map((x, i) => `<button type="button" class="pchip ${String(c.value) === x ? "sel" : ""}" data-cchip="${esc(x)}">${esc(x)}${i === 0 && cur === x ? ` · ${esc(t.cNow)}` : ""}</button>`).join("")}</div>` : ""}`;
}

/** set(newCond) stores the change. */
export function bindCond(box, c, set) {
  box.querySelectorAll("[data-cpick]").forEach((b) => b.addEventListener("click", () => set({ ...newCond(), entity: b.dataset.cpick })));
  box.querySelector("[data-cattr]")?.addEventListener("change", (e) => set({ ...c, attr: e.target.value, value: "" }));
  box.querySelector("[data-cop]")?.addEventListener("change", (e) => set({ ...c, op: e.target.value, value: NUMERIC.includes(e.target.value) && !Number.isFinite(Number(c.value)) ? "" : c.value }));
  box.querySelector("[data-cval]")?.addEventListener("change", (e) => set({ ...c, value: e.target.value.trim() }));
  box.querySelectorAll("[data-cchip]").forEach((b) => b.addEventListener("click", () => set({ ...c, value: b.dataset.cchip, op: NUMERIC.includes(c.op) && !Number.isFinite(Number(b.dataset.cchip)) ? "is" : c.op })));
  const search = box.querySelector("[data-csearch]");
  const list = box.querySelector("[data-clist]");
  if (!search || !list) return;
  const filter = () => {
    const q = search.value.trim().toLowerCase();
    let n = 0, hits = 0;
    list.querySelectorAll("[data-cpick]").forEach((b) => {
      const ok = !q || b.dataset.q.includes(q);
      if (ok) hits++;
      b.hidden = !ok || n >= SHOWN;
      if (ok && n < SHOWN) n++;
    });
    box.querySelector("[data-cmore]").hidden = hits <= SHOWN;
  };
  search.addEventListener("input", filter);
  filter();
}
