// Action panel: the step list of a sequence (done / current / open), stop, send single steps, continue from a step,
// and the devices the sequence uses with their power / input keys (same rows as the help box).
import { STEP_UI, stepLabel } from "./steps/index.js";
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";
import { keyIcon, prettyCommand } from "../shared/commands.js";

export const sequencePanelMixin = {
  // Action whose panel is shown for a hub: the one opened by hand, else the one that just failed.
  _panelAction(h) {
    const seq = this._seqState(h.id);
    const open = this._actPanel?.[h.id];
    const id = open || (seq.state === "error" && !seq.draft && this._actPanelOff?.[h.id] !== seq.started ? seq.action : null);
    return id ? this._actionList(h.id).find((a) => a.id === id) || null : null;
  },

  // Marker of one step: done / current / error / stopped / open.
  _stepMark(seq, a, i) {
    const mine = seq.action === a.id && !seq.draft;
    if (!mine) return "open";
    const n = i + 1, first = seq.first || 1;
    if (seq.state === "done") return n >= first ? "done" : "open";
    if (n < first) return "open";
    if (n < seq.step) return "done";
    if (n > seq.step) return "open";
    return { running: "current", error: "error", stopped: "stopped" }[seq.state] || "open";
  },

  // Devices that key steps of an action use, as rows like those of the help box.
  _actionDevices(h, a) {
    const info = this._info?.hubs?.[h.id];
    const by = new Map();
    a.steps.filter((s) => s.type === "key" || s.type === "irvol").forEach((s) => {
      const it = by.get(s.device) || { device: s.device, input: null, inputRaw: null, manual: false };
      if (!it.input && /^input/i.test(s.command || "")) it.input = s.command;
      by.set(s.device, it);
    });
    return [...by.values()].map((it) => {
      const cmds = info?.devices?.[it.device] || [];
      const power = ["PowerOn", "PowerToggle"].find((c) => cmds.includes(c)) || null;
      return { ...it, power, adb: this._linkedFire(h.id, it.device)?.entity || "" };
    });
  },

  _seqPanel(h, t) {
    const a = this._panelAction(h);
    if (!a) return "";
    const seq = this._seqState(h.id);
    const mine = seq.action === a.id && !seq.draft;
    const running = mine && seq.state === "running";
    const busy = seq.state === "running";
    const n = a.steps.length;
    const status = !mine ? "" : seq.state === "running" ? fmtText(t.seqStep, [seq.step, n])
      : seq.state === "done" ? t.seqDone : seq.state === "stopped" ? fmtText(t.seqStopped, [seq.step]) : seq.state === "error" ? fmtText(t.seqFailed, [seq.step]) : "";
    const marks = { done: "mdi:check-circle", current: "mdi:progress-clock", error: "mdi:alert-circle", stopped: "mdi:stop-circle-outline", open: "mdi:circle-outline" };
    const rows = a.steps.map((s, i) => {
      const m = this._stepMark(seq, a, i);
      const err = m === "error" && seq.error ? `<small class="seqerr">${esc(seq.error)}</small>` : "";
      const btn = (attr, icon, title) => `<button type="button" class="ib" ${attr}="${i}" data-hub="${esc(h.id)}" data-actid="${esc(a.id)}" title="${esc(title)}" ${busy ? "disabled" : ""}><ha-icon icon="${icon}"></ha-icon></button>`;
      const failed = m === "error" || m === "stopped";
      const tools = running ? "" : failed
        ? `${btn("data-seqfrom", "mdi:reload", t.seqRetry)}${i < n - 1 ? btn("data-seqfrom", "mdi:skip-next-outline", t.seqSkip).replace(`data-seqfrom="${i}"`, `data-seqfrom="${i + 1}"`) : ""}`
        : `${btn("data-seqonly", "mdi:play-outline", t.seqOnly)}${i < n - 1 ? btn("data-seqfrom", "mdi:skip-forward-outline", t.seqFrom) : ""}`;
      return `<div class="seqrow ${m}"><ha-icon class="seqmark" icon="${marks[m]}"></ha-icon><span class="seqlab"><ha-icon icon="${STEP_UI[s.type].icon}"></ha-icon><span>${esc(stepLabel(s, t, this))}</span>${err}</span><span class="seqtools">${tools}</span></div>`;
    }).join("");
    const names = this._helpNames();
    const ctx = { hid: new Set(), edit: false, names, overrides: { ...(this._settings().keyIcons || {}), ...(this._config.key_icons || {}) }, devs: this._config.compact ? {} : this._devicesOf(h.id) };
    const devs = this._actionDevices(h, a).map((it) => this._helpRow(h, it, "", t, ctx)).join("");
    const head = `<div class="seqhead ${mine ? seq.state : ""}"><ha-icon icon="${esc(a.icon)}"></ha-icon><span class="seqname"><b>${esc(a.name)}</b>${status ? `<small>${esc(status)}</small>` : ""}</span>
      ${running ? `<button type="button" class="key seqstop" data-seqstop="${esc(h.id)}"><ha-icon icon="mdi:stop"></ha-icon><span>${t.actStop}</span></button>` : `<button type="button" class="key" data-seqrun data-hub="${esc(h.id)}" data-actid="${esc(a.id)}" ${busy ? "disabled" : ""}><ha-icon icon="mdi:play"></ha-icon><span>${t.seqStart}</span></button>`}
      <button type="button" class="ib" data-seqclose="${esc(h.id)}" title="${esc(t.seqClose)}"><ha-icon icon="mdi:close"></ha-icon></button></div>`;
    return `<div class="block seqpanel" data-seqpanel>${head}<div class="seqlist">${rows}</div>${devs ? `<div class="esub">${t.seqDevices}</div><div class="hlist">${devs}</div>` : ""}</div>${this._seqFavs(h, a, t)}`;
  },

  // Favourite keys picked in the action, grouped by device (same cells as every other favourites block).
  _seqFavs(h, a, t) {
    const devs = this._devicesOf(h.id);
    const ov = { ...(this._settings().keyIcons || {}), ...(this._config.key_icons || {}) };
    const by = new Map();
    (a.favs || []).filter((f) => devs[f.d]?.includes(f.c)).forEach((f) => by.set(f.d, [...(by.get(f.d) || []), f.c]));
    return [...by].map(([dev, cmds]) => `<div class="block favs"><span class="dname">${t.favorites} · ${esc(dev)}</span><div class="cells">${cmds.map((c) => {
      const icon = keyIcon(c, ov, dev);
      return `<button class="key cell isfav" title="${esc(dev)}: ${esc(c)}" data-hub="${esc(h.id)}" data-device="${esc(dev)}" data-cmd="${esc(c)}">${icon ? `<ha-icon icon="${esc(icon)}"></ha-icon>` : ""}<span>${esc(prettyCommand(c))}</span></button>`;
    }).join("")}</div></div>`).join("");
  },

  _bindSeq(root) {
    const go = (b, extra) => this._runAction(b.dataset.hub, b.dataset.actid, extra);
    root.querySelectorAll("[data-actmore]").forEach((b) => b.addEventListener("click", (e) => {
      e.stopPropagation(); this._buzz();
      const hub = b.dataset.hub, open = this._actPanel?.[hub] === b.dataset.actmore;
      this._actPanel = { ...(this._actPanel || {}), [hub]: open ? null : b.dataset.actmore };
      if (open) this._actPanelOff = { ...(this._actPanelOff || {}), [hub]: this._seqState(hub).started };
      this._rerender();
    }));
    root.querySelectorAll("[data-seqclose]").forEach((b) => b.addEventListener("click", () => {
      const hub = b.dataset.seqclose;
      this._actPanel = { ...(this._actPanel || {}), [hub]: null };
      this._actPanelOff = { ...(this._actPanelOff || {}), [hub]: this._seqState(hub).started };
      this._rerender();
    }));
    root.querySelectorAll("[data-seqstop]").forEach((b) => b.addEventListener("click", () => { this._buzz(30); this._hass.callWS({ type: "harmony_deck/action/stop", hub: b.dataset.seqstop }).catch(() => {}); }));
    root.querySelectorAll("[data-seqrun]").forEach((b) => b.addEventListener("click", () => go(b)));
    root.querySelectorAll("[data-seqonly]").forEach((b) => b.addEventListener("click", () => go(b, { only_step: Number(b.dataset.seqonly) })));
    root.querySelectorAll("[data-seqfrom]").forEach((b) => b.addEventListener("click", () => go(b, { from_step: Number(b.dataset.seqfrom) })));
  },
};
