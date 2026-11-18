// Step type "Pause": wait a few seconds (quick choices plus an own value).
import { fmtText } from "../../shared/i18n.js";

const QUICK = [1, 2, 5, 10];

export const pauseStep = {
  type: "pause",
  icon: "mdi:timer-sand",
  create: () => ({ type: "pause", secs: 2 }),
  valid: (s) => s.secs > 0 && s.secs <= 300,
  label: (s, t) => fmtText(t.stepPauseLabel, [String(s.secs)]),

  editor(s, { t }) {
    return `<div class="pchips">${QUICK.map((n) => `<button type="button" class="pchip ${s.secs === n ? "sel" : ""}" data-psecs="${n}">${n} s</button>`).join("")}</div>
      <label class="erow"><span>${t.stepSecs}</span><input type="number" min="0.1" max="300" step="0.1" data-psecsin value="${s.secs}"></label>`;
  },

  bind(box, s, update) {
    box.querySelectorAll("[data-psecs]").forEach((b) => b.addEventListener("click", () => update({ secs: Number(b.dataset.psecs) })));
    box.querySelector("[data-psecsin]")?.addEventListener("change", (e) => {
      const v = Math.round(Number(e.target.value) * 10) / 10;
      if (v > 0) update({ secs: Math.min(300, v) });
    });
  },
};
