// Step type "Harmony key": choose a device, then one of its keys (chips in the usual groups, search, recently used).
import { esc } from "../../shared/util.js";
import { prettyCommand } from "../../shared/commands.js";
import { recent, remember } from "./recent.js";

export const keyStep = {
  type: "key",
  icon: "mdi:remote",
  create: () => ({ type: "key", device: "", command: "", repeat: 1 }),
  valid: (s) => !!(s.device && s.command),
  label: (s, t) => (s.device && s.command ? `${s.device} · ${prettyCommand(s.command)}${s.repeat > 1 ? ` ×${s.repeat}` : ""}` : t.stepPickDevice),

  editor(s, { card, h, t, scope }) {
    const devs = card._devicesOf(h.id);
    if (!s.device || !devs[s.device]) {
      // Devices of the activity this action belongs to first, the rest after them.
      const first = scope ? card._actInvolved(h.id, scope) : [];
      const order = [...first, ...Object.keys(devs).filter((d) => !first.includes(d))];
      return `<div class="esub">${t.stepPickDevice}</div><div class="pchips">${order.map((d) => `<button type="button" class="pchip ${first.includes(d) ? "hot" : ""}" data-kdev="${esc(d)}"><ha-icon icon="${card._deviceIcon(d, h.id)}"></ha-icon><span>${esc(d)}</span></button>`).join("")}</div>`;
    }
    const cmds = devs[s.device];
    const chip = (c) => `<button type="button" class="pchip ${c === s.command ? "sel" : ""}" data-kcmd="${esc(c)}" data-q="${esc(`${prettyCommand(c)} ${c}`.toLowerCase())}">${esc(prettyCommand(c))}</button>`;
    const rec = recent("key").filter((r) => r.d === s.device && cmds.includes(r.c)).slice(0, 8);
    const groups = card._groups(cmds, t).map(([label, list]) => `<div class="pgroup"><div class="esub">${esc(label)}</div><div class="pchips">${list.map(chip).join("")}</div></div>`).join("");
    return `<div class="erow"><span><ha-icon icon="${card._deviceIcon(s.device, h.id)}"></ha-icon>${esc(s.device)}</span><button type="button" class="mini txt" data-kdev="">${t.stepChange}</button></div>
      <input type="search" class="psearch" data-psearch placeholder="${esc(t.stepSearch)}" autocomplete="off">
      ${rec.length ? `<div class="pgroup prec"><div class="esub">${t.stepRecent}</div><div class="pchips">${rec.map((r) => chip(r.c)).join("")}</div></div>` : ""}
      <div class="pgroups">${groups}</div>
      <div class="erow"><span>${t.stepRepeat}</span><span class="stepper"><button type="button" data-krep="-1">−</button><b>${s.repeat || 1}</b><button type="button" data-krep="1">+</button></span></div>`;
  },

  bind(box, s, update) {
    box.querySelectorAll("[data-kdev]").forEach((b) => b.addEventListener("click", () => update({ device: b.dataset.kdev, command: "" })));
    box.querySelectorAll("[data-kcmd]").forEach((b) => b.addEventListener("click", () => {
      remember("key", { d: s.device, c: b.dataset.kcmd });
      update({ command: b.dataset.kcmd });
    }));
    box.querySelectorAll("[data-krep]").forEach((b) => b.addEventListener("click", () => update({ repeat: Math.min(10, Math.max(1, (s.repeat || 1) + Number(b.dataset.krep))) })));
  },
};
