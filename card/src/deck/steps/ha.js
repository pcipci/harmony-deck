// Step type "Home Assistant": switch or start an entity (light, switch, scene, script, automation, button …).
// The picker filters by kind and by typing, and shows recently used entities first.
import { esc } from "../../shared/util.js";
import { recent, remember } from "./recent.js";

export const HA_DOMAINS = ["light", "switch", "scene", "script", "automation", "button", "input_button", "input_boolean", "cover", "fan", "lock", "media_player"];
// Filter chips: kind -> domains.
const KINDS = { light: ["light"], switch: ["switch", "input_boolean"], script: ["script"], scene: ["scene"], automation: ["automation"], button: ["button", "input_button"] };
const SHOWN = 60;

const name = (card, id) => card?._hass?.states?.[id]?.attributes?.friendly_name || id;

export const haStep = {
  type: "ha",
  icon: "mdi:home-assistant",
  create: () => ({ type: "ha", entity: "", op: "toggle" }),
  valid: (s) => /^[a-z_]+\.[a-z0-9_]+$/.test(s.entity || ""),
  label(s, t, card) {
    if (!s.entity) return t.stepPickEntity;
    const ops = { toggle: t.opToggle, on: t.opOn, off: t.opOff, run: t.opActivate };
    return `${name(card, s.entity)} · ${ops[s.op] || s.op}`;
  },

  editor(s, { card, t }) {
    const st = card._hass.states || {};
    const ops = { toggle: t.opToggle, on: t.opOn, off: t.opOff, run: t.opActivate };
    const opRow = `<label class="erow"><span>${t.actOp}</span><select data-hop>${Object.entries(ops).map(([k, v]) => `<option value="${k}" ${s.op === k ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`;
    if (s.entity) {
      return `<div class="erow"><span><b>${esc(name(card, s.entity))}</b><small class="pid">${esc(s.entity)} · ${esc(st[s.entity]?.state ?? t.unavailable)}</small></span><button type="button" class="mini txt" data-hpick="">${t.stepChange}</button></div>${opRow}`;
    }
    const ids = Object.keys(st).filter((id) => HA_DOMAINS.includes(id.split(".")[0])).sort((a, b) => name(card, a).localeCompare(name(card, b), undefined, { sensitivity: "base" }));
    const item = (id) => `<button type="button" class="pent" data-hpick="${esc(id)}" data-dom="${esc(id.split(".")[0])}" data-q="${esc(`${name(card, id)} ${id}`.toLowerCase())}"><span>${esc(name(card, id))}</span><small>${esc(id)} · ${esc(st[id]?.state ?? "")}</small></button>`;
    const rec = recent("ha").filter((id) => st[id]).slice(0, 6);
    return `<input type="search" class="psearch" data-hsearch placeholder="${esc(t.stepSearchEntity)}" autocomplete="off">
      <div class="pchips" data-hkinds><button type="button" class="pchip sel" data-hkind="">${t.kindAll}</button>${Object.keys(KINDS).map((k) => `<button type="button" class="pchip" data-hkind="${k}">${esc(t.kinds[k])}</button>`).join("")}</div>
      ${rec.length ? `<div class="pgroup prec"><div class="esub">${t.stepRecent}</div><div class="plist">${rec.map(item).join("")}</div></div>` : ""}
      <div class="plist" data-hlist>${ids.map(item).join("")}</div><div class="ehint" data-hmore hidden>${t.stepMore}</div>`;
  },

  bind(box, s, update) {
    box.querySelectorAll("[data-hpick]").forEach((b) => b.addEventListener("click", () => {
      if (b.dataset.hpick) remember("ha", b.dataset.hpick);
      update({ entity: b.dataset.hpick });
    }));
    box.querySelector("[data-hop]")?.addEventListener("change", (e) => update({ op: e.target.value }));
    const search = box.querySelector("[data-hsearch]");
    const list = box.querySelector("[data-hlist]");
    if (!search || !list) return;
    let kind = "";
    // Filtering works on the drawn list (no redraw, so the search field keeps the focus).
    const filter = () => {
      const q = search.value.trim().toLowerCase();
      const doms = KINDS[kind];
      let n = 0, hits = 0;
      list.querySelectorAll("[data-hpick]").forEach((b) => {
        const ok = (!q || b.dataset.q.includes(q)) && (!doms || doms.includes(b.dataset.dom));
        if (ok) hits++;
        b.hidden = !ok || n >= SHOWN;
        if (ok && n < SHOWN) n++;
      });
      box.querySelector("[data-hmore]").hidden = hits <= SHOWN;
      box.querySelector(".prec")?.toggleAttribute("hidden", !!q || !!kind);
    };
    search.addEventListener("input", filter);
    box.querySelectorAll("[data-hkind]").forEach((b) => b.addEventListener("click", () => {
      kind = b.dataset.hkind;
      box.querySelectorAll("[data-hkind]").forEach((x) => x.classList.toggle("sel", x === b));
      filter();
    }));
    filter();
  },
};
