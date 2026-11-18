// Step type "Wait until": waits until a condition holds, at most a given time; then go on or stop with an error.
import { fmtText } from "../../shared/i18n.js";
import { newCond, condValid, condText, condHtml, bindCond } from "./cond.js";
import { rangeHtml, bindRange } from "./range.js";

export const waitStep = {
  type: "wait",
  icon: "mdi:clock-check-outline",
  create: () => ({ type: "wait", cond: newCond(), timeout: 30, onTimeout: "abort" }),
  valid: (s) => condValid(s.cond),
  label: (s, t, card) => (s.cond?.entity ? fmtText(t.waitLabel, [condText(s.cond, card, t), String(s.timeout)]) : t.cPick),

  editor(s, { card, t }) {
    const body = condHtml(s.cond, card, t);
    if (!s.cond.entity) return `<div class="esub">${t.cPickWait}</div>${body}`;
    return `${body}<div class="esub">${t.waitTime}</div>${rangeHtml({ attr: "wtime", value: s.timeout, min: 1, max: 120, step: 1, fmt: (v) => `${v} s` })}
      <label class="erow"><span>${t.waitThen}</span><select data-wthen><option value="abort" ${s.onTimeout === "abort" ? "selected" : ""}>${t.waitAbort}</option><option value="continue" ${s.onTimeout === "continue" ? "selected" : ""}>${t.waitContinue}</option></select></label>`;
  },

  bind(box, s, update) {
    bindCond(box, s.cond, (cond) => update({ cond }));
    bindRange(box, "wtime", (v) => `${v} s`, (v) => update({ timeout: v }));
    box.querySelector("[data-wthen]")?.addEventListener("change", (e) => update({ onTimeout: e.target.value }));
  },
};
