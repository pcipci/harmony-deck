// Step type "Pause": wait a while. A non-linear slider (fine below 10 s, coarse up to 5 minutes),
// a large value, -0.1 / +0.1 for fine tuning and a tap on the value to type an exact number.
import { fmtText } from "../../shared/i18n.js";

const MAX = 300;
// positions of the slider: 0.5 s steps up to 10 s, then coarser up to 1 minute, then up to 5 minutes
const STOPS = [
  ...Array.from({ length: 20 }, (_, i) => (i + 1) / 2),
  12, 15, 20, 25, 30, 40, 50, 60, 90, 120, 180, 240, 300,
];

const round = (v) => Math.round(v * 10) / 10;
const nearest = (secs) => STOPS.reduce((best, v, i) => (Math.abs(v - secs) < Math.abs(STOPS[best] - secs) ? i : best), 0);

/** 2 -> "2 s", 90 -> "1 min 30 s", 300 -> "5 min" */
export function fmtSecs(secs) {
  if (secs < 60) return `${String(round(secs)).replace(/\.0$/, "")} s`;
  const m = Math.floor(secs / 60);
  const r = round(secs - m * 60);
  return r ? `${m} min ${r} s` : `${m} min`;
}

export const pauseStep = {
  type: "pause",
  icon: "mdi:timer-sand",
  create: () => ({ type: "pause", secs: 2 }),
  valid: (s) => s.secs > 0 && s.secs <= MAX,
  label: (s, t) => fmtText(t.stepPauseLabel, [fmtSecs(s.secs).replace(/ s$/, "")]),

  editor(s, { t }) {
    return `<div class="pslide">
      <button type="button" class="pval" data-pval title="${t.stepPauseType}">${fmtSecs(s.secs)}</button>
      <div class="pbar"><button type="button" class="pnudge" data-pnudge="-0.1">−0.1</button><div class="ptrack"><input type="range" min="0" max="${STOPS.length - 1}" step="1" value="${nearest(s.secs)}" data-pslide aria-label="${t.stepSecs}"><div class="pends">${[0.5, 10, 300].map((v) => `<span style="left:${(nearest(v) / (STOPS.length - 1)) * 100}%">${fmtSecs(v)}</span>`).join("")}</div></div><button type="button" class="pnudge" data-pnudge="0.1">+0.1</button></div>
    </div>`;
  },

  bind(box, s, update) {
    const val = box.querySelector("[data-pval]");
    const slide = box.querySelector("[data-pslide]");
    slide?.addEventListener("input", () => { val.textContent = fmtSecs(STOPS[Number(slide.value)]); });
    slide?.addEventListener("change", () => update({ secs: STOPS[Number(slide.value)] }));
    box.querySelectorAll("[data-pnudge]").forEach((b) => b.addEventListener("click", () => {
      const v = round(Math.min(MAX, Math.max(0.1, s.secs + Number(b.dataset.pnudge))));
      update({ secs: v });
    }));
    val?.addEventListener("click", () => {
      const input = document.createElement("input");
      input.type = "number"; input.min = "0.1"; input.max = String(MAX); input.step = "0.1"; input.value = String(s.secs);
      input.className = "pval pvalin"; input.setAttribute("data-psecsin", "");
      val.replaceWith(input);
      input.focus(); input.select();
      const done = () => { const v = round(Number(input.value)); if (v > 0) update({ secs: Math.min(MAX, v) }); else update({}); };
      input.addEventListener("change", done);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") input.blur(); });
      input.addEventListener("blur", done);
    });
  },
};
