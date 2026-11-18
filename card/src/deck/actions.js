// Actions: their buttons under the remote (the editor is in action-editor.js, the steps in steps/).
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";
import { stepLabel } from "./steps/index.js";

export const actionsMixin = {
  _actionsOf(hubId, cur) { return this._actionList(hubId).filter((a) => !a.scope || a.scope === cur); },

  // Entity whose state an action shows (on = highlighted): only for an action with one Home Assistant step.
  _actEntity(a) { return a.steps.length === 1 && a.steps[0].type === "ha" ? a.steps[0].entity : null; },

  // One button for an action, the same in every place (block under the remote, tile in the activity list).
  // Idle: symbol and name. Running: "3/7", a progress bar, hold to stop. Error: red, tap starts again.
  _actionBtn(h, a, t, tile = false) {
    const seq = this._seqState(h.id);
    const mine = seq.action === a.id && !seq.draft;
    const state = mine ? seq.state : "idle";
    const running = state === "running";
    const other = !mine && seq.state === "running" && !seq.draft;
    const total = seq.total || a.steps.length;
    const step = Math.min(seq.step || 1, total);
    const cur = a.steps[step - 1];
    const stepName = running && cur ? stepLabel(cur, t, this) : "";
    const ent = this._actEntity(a);
    const on = !running && ent && this._hass.states[ent]?.state === "on";
    const miss = ent && !this._hass.states[ent];
    const done = state === "done" && Date.now() - Date.parse(seq.finished || 0) < 6000;
    const label = running ? (tile ? `${step}/${total} · ${stepName}` : `${step}/${total}`) : a.name;
    const hint = running ? t.actHoldStop : other ? fmtText(t.actBusyNow, [seq.name || "", seq.step || 1, seq.total || 1]) : "";
    const tip = state === "error" ? `${a.name} – ${seq.error || t.actFailed}` : running ? `${a.name} – ${stepName}` : a.steps.length > 1 ? `${a.name}\n${a.steps.map((x, i) => `${i + 1}. ${stepLabel(x, t, this)}`).join("\n")}` : a.name;
    const cls = ["actbtn", tile ? "tile acttile" : "key cell", running ? "running" : "", state === "error" ? "failed" : "", done ? "fin" : "", on ? "acton" : "", miss ? "miss" : "", other ? "otherrun" : ""].join(" ");
    const pct = running ? Math.round(((step - 1) / total) * 100) : 0;
    const icon = state === "error" ? "mdi:alert-circle-outline" : running ? "mdi:progress-clock" : done ? "mdi:check" : a.icon;
    return `<button class="${cls}" style="--p:${pct}%" title="${esc(tip)}" data-actid="${esc(a.id)}" data-hub="${esc(h.id)}" ${running ? "data-holdstop" : ""} data-hinttext="${esc(hint)}"><ha-icon icon="${esc(icon)}"></ha-icon><span>${esc(label)}</span>${tile ? '<i class="acttag"></i>' : ""}${a.steps.length > 1 ? `<i class="actmore" role="button" data-actmore="${esc(a.id)}" data-hub="${esc(h.id)}" title="${esc(t.seqOpen)}"><ha-icon icon="mdi:chevron-down"></ha-icon></i>` : ""}${running ? '<i class="actbar"></i>' : ""}</button>`;
  },

  _actionsBlock(h, cur, t) {
    const list = this._actionsOf(h.id, cur);
    if (!list.length) return "";
    return `<div class="block actions"><span class="dname">${t.actions}</span><div class="cells">${list.map((a) => this._actionBtn(h, a, t)).join("")}</div></div>`;
  },

  // Actions that are also shown as a tile in the activity list.
  _actionTiles(h, cur, t) { return this._actionsOf(h.id, cur).filter((a) => a.tile).map((a) => this._actionBtn(h, a, t, true)); },

  // The integration carries out the steps (also when the page is closed).
  async _runAction(hubId, id, extra = {}) {
    this._buzz();
    if (this._actionList(hubId).find((a) => a.id === id)?.steps.length > 1) { this._actPanel = { ...(this._actPanel || {}), [hubId]: id }; this._rerender(); }
    try { await this._hass.callWS({ type: "harmony_deck/action/run", hub: hubId, action_id: id, ...extra }); } catch (e) { /* busy or gone: the sensor shows the state */ }
  },

  // Events of the action buttons: a tap starts, a tap while something runs only explains, holding a running one stops it.
  _bindActions(root) {
    root.querySelectorAll(".actbtn[data-actid]").forEach((b) => {
      let tm = null, done = false;
      const hint = () => { if (!b.dataset.hinttext) return; b.dataset.hint = "1"; setTimeout(() => b.removeAttribute("data-hint"), 2200); };
      const release = () => { clearTimeout(tm); b.classList.remove("holding"); tm = null; if (this._holdingAct) { this._holdingAct = false; this._key = ""; setTimeout(() => { this.hass = this._hass; }, 0); } };
      b.addEventListener("pointerdown", (e) => {
        if (e.button > 0 || !b.hasAttribute("data-holdstop") || e.target.closest?.("[data-actmore]")) return;
        done = false; b.classList.add("holding"); this._buzz(8); this._holdingAct = true;
        tm = setTimeout(() => { done = true; release(); this._buzz(40); this._hass.callWS({ type: "harmony_deck/action/stop", hub: b.dataset.hub }).catch(() => {}); }, 700);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, release));
      b.addEventListener("contextmenu", (e) => e.preventDefault());
      b.addEventListener("click", () => {
        if (done) { done = false; return; }
        if (b.hasAttribute("data-holdstop") || b.classList.contains("otherrun")) { this._buzz(20); hint(); return; }
        this._runAction(b.dataset.hub, b.dataset.actid);
      });
    });
  },
};
