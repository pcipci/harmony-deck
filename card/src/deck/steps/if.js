// Step type "If": looks at a condition once. Holds -> the next step. Else: skip the next steps, end the action, or stop with an error.
import { esc } from "../../shared/util.js";
import { fmtText } from "../../shared/i18n.js";
import { newCond, condValid, condText, condHtml, bindCond } from "./cond.js";

export const ifStep = {
  type: "if",
  icon: "mdi:call-split",
  create: () => ({ type: "if", cond: newCond(), else: "skip", skip: 1 }),
  valid: (s) => condValid(s.cond),
  label(s, t, card) {
    if (!s.cond?.entity) return t.cPick;
    const other = s.else === "end" ? t.ifEnd : s.else === "fail" ? t.ifFail : fmtText(s.skip > 1 ? t.ifSkipMany : t.ifSkipOne, [String(s.skip || 1)]);
    return fmtText(t.ifLabel, [condText(s.cond, card, t), other]);
  },

  editor(s, { card, t }) {
    const body = condHtml(s.cond, card, t);
    if (!s.cond.entity) return `<div class="esub">${t.cPickIf}</div>${body}`;
    const stepper = s.else === "skip" ? `<div class="erow"><span>${t.ifHowMany}</span><span class="stepper"><button type="button" data-iskip="-1">−</button><b>${s.skip || 1}</b><button type="button" data-iskip="1">+</button></span></div>` : "";
    const msg = s.else === "fail" ? `<label class="erow"><span>${t.ifMessage}</span><input type="text" data-imsg maxlength="60" placeholder="${esc(t.ifMessagePh)}" value="${esc(s.message || "")}"></label>` : "";
    return `${body}<div class="esub">${t.ifOtherwise}</div>
      <label class="erow"><span>${t.ifThen}</span><select data-ielse><option value="skip" ${s.else === "skip" ? "selected" : ""}>${t.ifOptSkip}</option><option value="end" ${s.else === "end" ? "selected" : ""}>${t.ifOptEnd}</option><option value="fail" ${s.else === "fail" ? "selected" : ""}>${t.ifOptFail}</option></select></label>${stepper}${msg}`;
  },

  bind(box, s, update) {
    bindCond(box, s.cond, (cond) => update({ cond }));
    box.querySelector("[data-ielse]")?.addEventListener("change", (e) => update({ else: e.target.value }));
    box.querySelectorAll("[data-iskip]").forEach((b) => b.addEventListener("click", () => update({ skip: Math.min(10, Math.max(1, (s.skip || 1) + Number(b.dataset.iskip))) })));
    box.querySelector("[data-imsg]")?.addEventListener("change", (e) => update({ message: e.target.value.trim() }));
  },
};
