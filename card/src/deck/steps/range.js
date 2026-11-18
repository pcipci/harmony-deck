// A slider with a large value and fine buttons (−/+), shared by the step editors.
import { esc } from "../../shared/util.js";

/** attr: data attribute that names the slider; fmt: value -> text. */
export function rangeHtml({ attr, value, min, max, step = 1, fmt = String, ends = true }) {
  const v = Math.min(max, Math.max(min, Number(value)));
  return `<div class="pslide vslide" data-range="${esc(attr)}" data-min="${min}" data-max="${max}" data-step="${step}">
    <b class="pval" data-rval>${esc(fmt(v))}</b>
    <div class="pbar"><button type="button" class="pnudge" data-rnudge="-1">−</button><div class="ptrack"><input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-rin>${ends ? `<div class="pends"><span style="left:0">${esc(fmt(min))}</span><span style="left:100%">${esc(fmt(max))}</span></div>` : ""}</div><button type="button" class="pnudge" data-rnudge="1">+</button></div></div>`;
}

/** Live text while dragging, onChange(value) when let go or on −/+. */
export function bindRange(box, attr, fmt, onChange) {
  const el = box.querySelector(`[data-range="${attr}"]`);
  if (!el) return;
  const input = el.querySelector("[data-rin]"), out = el.querySelector("[data-rval]");
  const min = Number(el.dataset.min), max = Number(el.dataset.max), step = Number(el.dataset.step);
  const round = (v) => Math.round(Math.min(max, Math.max(min, v)) / step) * step;
  const clean = (v) => Number(round(v).toFixed(String(step).split(".")[1]?.length || 0));
  // Inside a value row the row's own header shows the value (the slider's large number is hidden there).
  const head = el.closest(".vrow")?.querySelector(".vhead b");
  input.addEventListener("input", () => { out.textContent = fmt(clean(Number(input.value))); if (head && attr !== "sat" && attr !== "hue") head.textContent = out.textContent; });
  input.addEventListener("change", () => onChange(clean(Number(input.value))));
  el.querySelectorAll("[data-rnudge]").forEach((b) => b.addEventListener("click", () => onChange(clean(Number(input.value) + Number(b.dataset.rnudge) * step))));
}
