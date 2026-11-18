// Step type "Volume (IR)": bring an infrared device to a volume level. The integration first presses
// "volume down" until the device is surely at 0, then "volume up" to the level (irvolume.py). Per device the
// user sets the highest level, how much one press changes it and how fast the device takes presses; that
// setting is stored for the whole installation, so every action with this device uses it.
import { esc } from "../../shared/util.js";
import { fmtText } from "../../shared/i18n.js";
import { rangeHtml, bindRange } from "./range.js";

const UP = /^vol(ume)?[\s_-]*(up|\+)$/i;
const DOWN = /^vol(ume)?[\s_-]*(down|-)$/i;
const DEF = { max: 100, step: 1, delay: 0.4 };
const DELAYS = [0.2, 0.3, 0.4, 0.6, 0.8, 1.0];

const hasVolume = (cmds) => cmds.some((c) => UP.test(c)) && cmds.some((c) => DOWN.test(c));
const cfgOf = (card, hub, dev) => ({ ...DEF, ...(card._settings().irVolume?.[hub]?.[dev] || {}) });

// Same arithmetic as irvolume.plan in the integration.
export function irPlan(cfg, level) {
  const full = Math.ceil(cfg.max / cfg.step);
  return [full + Math.max(2, Math.ceil(full * 0.1)), Math.round(Math.min(level, cfg.max) / cfg.step)];
}

export const irvolStep = {
  type: "irvol",
  icon: "mdi:volume-source",
  create: () => ({ type: "irvol", device: "", level: 20 }),
  valid: (s) => !!s.device && s.level >= 0,
  label: (s, t) => (s.device ? fmtText(t.irvLabel, [s.device, String(s.level)]) : t.stepPickDevice),

  editor(s, { card, h, t }) {
    const devs = card._devicesOf(h.id);
    const able = Object.keys(devs).filter((d) => hasVolume(devs[d] || []));
    if (!s.device || !devs[s.device]) {
      return able.length
        ? `<div class="esub">${t.stepPickDevice}</div><div class="pchips">${able.map((d) => `<button type="button" class="pchip" data-ivdev="${esc(d)}"><ha-icon icon="${card._deviceIcon(d, h.id)}"></ha-icon><span>${esc(d)}</span></button>`).join("")}</div><div class="ehint">${t.irvHint}</div>`
        : `<div class="ehint">${t.irvNoDevices}</div>`;
    }
    const cfg = cfgOf(card, h.id, s.device);
    const [down, up] = irPlan(cfg, s.level);
    const secs = Math.round((down + up) * cfg.delay);
    const open = card._irSetupOpen ? "open" : "";
    return `<div class="erow"><span><ha-icon icon="${card._deviceIcon(s.device, h.id)}"></ha-icon>${esc(s.device)}</span><button type="button" class="mini txt" data-ivdev="">${t.stepChange}</button></div>
      ${rangeHtml({ attr: "irlevel", value: Math.min(s.level, cfg.max), min: 0, max: cfg.max, step: cfg.step, fmt: (v) => String(v) })}
      <div class="ehint">${fmtText(t.irvDuration, [secs, down, up])}</div>
      <details class="fdev irsetup" data-irsetup ${open}><summary>${fmtText(t.irvSetup, [s.device])}</summary>
        <label class="erow"><span>${t.irvMax}</span><input type="number" min="1" max="200" step="1" value="${cfg.max}" data-ircfg="max"></label>
        <label class="erow"><span>${t.irvStep}</span><input type="number" min="0.5" max="20" step="0.5" value="${cfg.step}" data-ircfg="step"></label>
        <label class="erow"><span>${t.irvDelay}</span><select data-ircfg="delay">${DELAYS.map((d) => `<option value="${d}" ${d === cfg.delay ? "selected" : ""}>${d} s</option>`).join("")}</select></label>
        <div class="ehint">${t.irvSetupHint}</div></details>`;
  },

  bind(box, s, update, card) {
    box.querySelectorAll("[data-ivdev]").forEach((b) => b.addEventListener("click", () => update({ device: b.dataset.ivdev })));
    bindRange(box, "irlevel", (v) => String(v), (v) => update({ level: v }));
    box.querySelector("[data-irsetup]")?.addEventListener("toggle", (e) => { card._irSetupOpen = e.target.open; });
    box.querySelectorAll("[data-ircfg]").forEach((i) => i.addEventListener("change", () => {
      const hub = card._actHub;
      const all = JSON.parse(JSON.stringify(card._settings().irVolume || {}));
      const cur = { ...DEF, ...(all[hub]?.[s.device] || {}), [i.dataset.ircfg]: Number(i.value) };
      cur.max = Math.min(200, Math.max(1, Math.round(cur.max) || DEF.max));
      cur.step = Math.min(20, Math.max(0.5, cur.step || DEF.step));
      ((all[hub] ||= {})[s.device]) = cur;
      card._irSetupOpen = true;
      card._saveSettings({ irVolume: all }).then(() => update({ level: Math.min(s.level, cur.max) }));
    }));
  },
};
