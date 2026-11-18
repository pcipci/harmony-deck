// Edit mode "Actions": list of the actions of a hub and the step editor of one action.
// The editor works on a draft; "Save" writes it into the settings. The step types live in ./steps/.
import { ACTION_ICONS } from "../shared/icons.js";
import { STEP_UI, stepLabel, normalizeAction } from "./steps/index.js";
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";
import { keyIcon, chipIcon, prettyCommand } from "../shared/commands.js";

const MAX_STEPS = 50;

export const actionEditorMixin = {
  _actionList(hubId) { return (this._settings().actions?.[hubId] || []).map(normalizeAction).filter(Boolean); },

  // Status of the action runs of a hub (sensor "Sequence" of the integration).
  _seqState(hubId) {
    const ent = this._info?.lock?.[hubId]?.entities?.sequence;
    const st = ent && this._hass?.states?.[ent];
    return st ? { state: st.state, ...st.attributes } : { state: "idle" };
  },

  _actionsEdit(h, t) {
    return this._actEdit ? this._actionForm(h, t) : this._actionListHtml(h, t);
  },

  _actionListHtml(h, t) {
    const list = this._actionList(h.id);
    const where = (a) => [a.scope || t.actGlobal, a.tile ? t.actTileShort : ""].filter(Boolean).join(" · ");
    const rows = list.map((a) => this._actDel === a.id
      ? `<div class="actrow ask"><span><b>${esc(a.name)}</b><small>${t.actDelAsk}</small></span><button class="key" data-actdelno>${t.cancelBack}</button><button class="key warn" data-actdelyes="${esc(a.id)}">${t.remove}</button></div>`
      : `<div class="actrow"><button class="actopen" data-actopen="${esc(a.id)}"><ha-icon icon="${esc(a.icon)}"></ha-icon><span><b>${esc(a.name)}</b><small>${esc(fmtText(a.steps.length === 1 ? t.stepsOne : t.stepsMany, [a.steps.length]))} · ${esc(where(a))}</small></span><ha-icon class="chev" icon="mdi:chevron-right"></ha-icon></button><button class="key" data-actdel="${esc(a.id)}" title="${esc(t.remove)}"><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>`).join("");
    return `<div class="esec actedit" data-hub="${esc(h.id)}"><div class="etitle">${t.actions}</div>
      <div class="ehint">${t.actionsHint}</div>${rows || `<div class="ehint">${t.actNone}</div>`}
      <button class="key addact" data-actnew><ha-icon icon="mdi:plus"></ha-icon><span>${t.actAdd}</span></button></div>`;
  },

  _actionForm(h, t) {
    const d = this._actDraft;
    const acts = h.list.filter((n) => n !== "PowerOff");
    const icon = d.icon || ACTION_ICONS[0][0];
    const cur = ACTION_ICONS.find(([i]) => i === icon);
    const open = !!this._actIconOpen;
    const grid = open ? `<div class="icongrid">${ACTION_ICONS.map(([i, n]) => `<button type="button" class="iconcell ${i === icon ? "sel" : ""}" data-acticonpick="${esc(i)}" title="${esc(t.iconNames?.[i] || n)}"><ha-icon icon="${esc(i)}"></ha-icon></button>`).join("")}</div>` : "";
    const seq = this._seqState(h.id);
    const live = seq.draft && ["running", "error"].includes(seq.state) ? seq : null;
    const steps = d.steps.map((s, i) => this._stepRow(h, t, s, i, live)).join("");
    const add = this._stepAdd
      ? `<div class="steptypes">${Object.values(STEP_UI).map((u) => `<button type="button" class="steptype" data-stepnew="${u.type}"><ha-icon icon="${u.icon}"></ha-icon><b>${t.stepTypes[u.type]}</b><small>${t.stepTypeHints[u.type]}</small></button>`).join("")}</div><button type="button" class="mini txt" data-stepaddno>${t.cancelBack}</button>`
      : d.steps.length < MAX_STEPS ? `<button type="button" class="key addstep" data-stepadd><ha-icon icon="mdi:plus"></ha-icon><span>${t.stepAdd}</span></button>` : "";
    const msg = this._actMsg ? `<div class="ehint actmsg ${this._actMsg.bad ? "err" : ""}">${esc(this._actMsg.text)}</div>` : "";
    return `<div class="esec actedit actform" data-hub="${esc(h.id)}">
      <div class="actformhead"><button type="button" class="mini txt" data-actback><ha-icon icon="mdi:arrow-left"></ha-icon>${t.actBack}</button><div class="etitle">${esc(d.name || t.actAdd)}</div></div>
      <div class="egrp">
        <label class="erow"><span>${t.actName}</span><input type="text" data-actname placeholder="${esc(t.actNamePh)}" value="${esc(d.name || "")}"></label>
        <div class="erow"><span>${t.actIcon}</span><button type="button" class="iconbtn" data-acticonopen aria-expanded="${open}"><ha-icon icon="${esc(icon)}"></ha-icon><span>${esc(cur ? t.iconNames?.[cur[0]] || cur[1] : "")}</span><ha-icon icon="${open ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon></button></div>${grid}
        <label class="erow"><span>${t.actScope}</span><select data-actscope><option value="">${t.actGlobal}</option>${acts.map((n) => `<option ${d.scope === n ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>
        ${this._swRow(t.actTile, "data-acttile", d.tile)}
      </div>
      <div class="esub">${t.stepsTitle}</div>
      <div class="steplist">${steps || `<div class="ehint">${t.stepsNone}</div>`}</div>
      ${add}
      ${this._actFavsEdit(h, t)}${msg}
      <div class="actbtns"><button type="button" class="key" data-acttest ${d.steps.length ? "" : "disabled"}><ha-icon icon="${live?.state === "running" ? "mdi:stop" : "mdi:play"}"></ha-icon><span>${live?.state === "running" ? t.actStop : t.actTest}</span></button><button type="button" class="key editdone" data-actsave><ha-icon icon="mdi:content-save-outline"></ha-icon><span>${t.actSave}</span></button></div></div>`;
  },

  // Favourite keys of an action (from any devices of the hub): shown under the action when it is open.
  _actFavsEdit(h, t) {
    const d = this._actDraft;
    const favs = d.favs || [];
    const has = new Set(favs.map((f) => `${f.d}\u0000${f.c}`));
    const devs = this._devicesOf(h.id);
    const used = new Set(d.steps.filter((s) => s.type === "key").map((s) => s.device));
    const names = Object.keys(devs).sort((a, b) => (used.has(b) ? 1 : 0) - (used.has(a) ? 1 : 0) || a.localeCompare(b));
    const ov = { ...(this._settings().keyIcons || {}), ...(this._config.key_icons || {}) };
    const open = this._actFavOpen || {};
    const groups = names.map((dev) => {
      const chips = devs[dev].map((c) => { const ic = keyIcon(c, ov, dev) || chipIcon(c); return `<label class="fchip"><input type="checkbox" data-actfav data-dev="${esc(dev)}" data-cmd="${esc(c)}" ${has.has(`${dev}\u0000${c}`) ? "checked" : ""}><span>${ic ? `<ha-icon icon="${ic}"></ha-icon>` : ""}${esc(prettyCommand(c))}</span></label>`; }).join("");
      const n = favs.filter((f) => f.d === dev).length;
      return `<details class="fdev" data-actfavdev="${esc(dev)}" ${open[dev] ? "open" : ""}><summary>${esc(dev)}${n ? ` · ${n}` : ""}</summary><div class="chipbox">${chips}</div></details>`;
    }).join("");
    return `<div class="esub">${t.actFavTitle}${favs.length ? ` · ${favs.length}` : ""}</div><div class="ehint">${t.actFavHint}</div>${groups}`;
  },

  _stepRow(h, t, s, i, live) {
    const ui = STEP_UI[s.type];
    const open = this._stepOpen === i;
    const n = this._actDraft.steps.length;
    const runCls = live && live.step === i + 1 ? (live.state === "error" ? "err" : "run") : "";
    const bad = !ui.valid(s);
    const arrow = (dir, ok, title, icon) => `<button type="button" class="ib" data-stepmove="${i}:${dir}" ${ok ? "" : "disabled"} title="${esc(title)}"><ha-icon icon="${icon}"></ha-icon></button>`;
    const head = `<div class="stephead ${runCls} ${bad ? "todo" : ""} ${open ? "open" : ""}"><span class="stepno">${i + 1}</span><button type="button" class="steplab" data-stepopen="${i}" aria-expanded="${open}"><ha-icon icon="${ui.icon}"></ha-icon><span>${esc(stepLabel(s, t, this))}</span></button><span class="stepmoves">${arrow(-1, i > 0, t.stepUp, "mdi:arrow-up")}${arrow(1, i < n - 1, t.stepDown, "mdi:arrow-down")}</span></div>`;
    const err = live?.state === "error" && live.step === i + 1 && live.error ? `<div class="ehint err">${esc(live.error)}</div>` : "";
    const body = open ? `<div class="stepbody" data-stepbox="${i}">${ui.editor(s, { card: this, h, t, scope: this._actDraft.scope })}
      <label class="erow"><span>${t.stepLabel}</span><input type="text" data-steplabel placeholder="${esc(ui.label(s, t, this))}" value="${esc(s.label || "")}"></label>
      <div class="stepacts"><button type="button" class="key" data-steptest="${i}" ${bad ? "disabled" : ""}><ha-icon icon="mdi:play-outline"></ha-icon><span>${t.stepTest}</span></button><button type="button" class="key del" data-stepdel="${i}"><ha-icon icon="mdi:delete-outline"></ha-icon><span>${t.stepDelete}</span></button></div></div>` : "";
    return `<div class="step">${head}${err}${body}</div>`;
  },

  _actOpen(a) {
    this._actDraft = a ? JSON.parse(JSON.stringify(a)) : { id: "", name: "", icon: ACTION_ICONS[0][0], scope: "", tile: false, steps: [] };
    this._actEdit = a ? a.id : "new";
    this._actDirty = false;
    this._stepOpen = null; this._stepAdd = !a; this._actMsg = null; this._actIconOpen = false;
  },

  _actClose() { this._actEdit = null; this._actDraft = null; this._stepOpen = null; this._stepAdd = false; this._actMsg = null; },

  // Problems that keep the draft from being saved (null = fine).
  _actProblem(t) {
    const d = this._actDraft;
    if (!d.name.trim()) return t.actErrName;
    if (!d.steps.length) return t.actErrSteps;
    const bad = d.steps.findIndex((s) => !STEP_UI[s.type].valid(s));
    return bad >= 0 ? fmtText(t.actErrStep, [bad + 1]) : null;
  },

  async _actSave(hubId) {
    const t = this._t();
    const problem = this._actProblem(t);
    if (problem) { this._actMsg = { text: problem, bad: true }; this._rerender(); return false; }
    const d = { ...this._actDraft, name: this._actDraft.name.trim() };
    if (!d.id) d.id = Date.now().toString(36);
    const list = this._actionList(hubId);
    const i = list.findIndex((a) => a.id === d.id);
    if (i >= 0) list[i] = d; else list.push(d);
    this._actClose();
    await this._saveSettings({ actions: { ...(this._settings().actions || {}), [hubId]: list } });
    return true;
  },

  // "Done" of the edit mode while a changed draft is open: keep it if it is complete.
  async _actFlush() {
    if (this._actEdit && this._actDirty && !this._actProblem(this._t())) await this._actSave(this._actHub);
    this._actClose();
  },

  async _actTest(hubId, only) {
    const t = this._t();
    const seq = this._seqState(hubId);
    if (only === undefined && seq.state === "running") {
      try { await this._hass.callWS({ type: "harmony_deck/action/stop", hub: hubId }); } catch (e) { /* nothing ran */ }
      return;
    }
    this._actMsg = null;
    try {
      await this._hass.callWS({ type: "harmony_deck/action/run", hub: hubId, draft: { steps: this._actDraft.steps }, ...(only !== undefined ? { only_step: only } : {}) });
    } catch (e) {
      this._actMsg = { text: e?.code === "busy" ? t.actBusy : e?.code === "unknown_command" ? t.noIntegration : e?.message || String(e), bad: true };
    }
    this._rerender();
  },

  _bindActionEditor(root) {
    const box = root.querySelector(".actedit");
    if (!box) return;
    const hub = box.dataset.hub;
    this._actHub = hub;
    const redraw = () => this._rerender();
    const patch = (fn) => { fn(this._actDraft); this._actDirty = true; this._actMsg = null; redraw(); };
    box.querySelector("[data-actnew]")?.addEventListener("click", () => { this._actOpen(null); redraw(); });
    box.querySelectorAll("[data-actopen]").forEach((b) => b.addEventListener("click", () => { this._actOpen(this._actionList(hub).find((a) => a.id === b.dataset.actopen)); redraw(); }));
    box.querySelectorAll("[data-actdel]").forEach((b) => b.addEventListener("click", () => { this._actDel = b.dataset.actdel; redraw(); }));
    box.querySelector("[data-actdelno]")?.addEventListener("click", () => { this._actDel = null; redraw(); });
    box.querySelector("[data-actdelyes]")?.addEventListener("click", (e) => {
      const id = e.currentTarget.dataset.actdelyes;
      this._actDel = null;
      this._saveSettings({ actions: { ...(this._settings().actions || {}), [hub]: this._actionList(hub).filter((a) => a.id !== id) } });
    });
    if (!this._actDraft) return;
    box.querySelector("[data-actback]")?.addEventListener("click", () => { this._actClose(); redraw(); });
    box.querySelector("[data-actsave]")?.addEventListener("click", () => this._actSave(hub));
    box.querySelector("[data-acttest]")?.addEventListener("click", () => this._actTest(hub));
    // Typing changes the draft without drawing again, so the field keeps the focus.
    box.querySelector("[data-actname]")?.addEventListener("input", (e) => { this._actDraft.name = e.target.value; this._actDirty = true; });
    box.querySelector("[data-actscope]")?.addEventListener("change", (e) => patch((d) => { d.scope = e.target.value; }));
    box.querySelector("[data-acttile]")?.addEventListener("change", (e) => patch((d) => { d.tile = e.target.checked; }));
    box.querySelector("[data-acticonopen]")?.addEventListener("click", () => { this._actIconOpen = !this._actIconOpen; redraw(); });
    box.querySelectorAll("[data-acticonpick]").forEach((b) => b.addEventListener("click", () => { this._actIconOpen = false; patch((d) => { d.icon = b.dataset.acticonpick; }); }));
    box.querySelector("[data-stepadd]")?.addEventListener("click", () => { this._stepAdd = true; redraw(); });
    box.querySelector("[data-stepaddno]")?.addEventListener("click", () => { this._stepAdd = false; redraw(); });
    box.querySelectorAll("[data-stepnew]").forEach((b) => b.addEventListener("click", () => {
      this._stepAdd = false;
      patch((d) => { d.steps.push(STEP_UI[b.dataset.stepnew].create()); this._stepOpen = d.steps.length - 1; });
    }));
    box.querySelectorAll("[data-stepopen]").forEach((b) => b.addEventListener("click", () => { const i = Number(b.dataset.stepopen); this._stepOpen = this._stepOpen === i ? null : i; redraw(); }));
    box.querySelectorAll("[data-stepmove]").forEach((b) => b.addEventListener("click", () => {
      const [i, dir] = b.dataset.stepmove.split(":").map(Number);
      patch((d) => { const [s] = d.steps.splice(i, 1); d.steps.splice(i + dir, 0, s); if (this._stepOpen === i) this._stepOpen = i + dir; });
    }));
    box.querySelectorAll("[data-stepdel]").forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.stepdel);
      patch((d) => { d.steps.splice(i, 1); if (this._stepOpen === i) this._stepOpen = null; else if (this._stepOpen > i) this._stepOpen -= 1; });
    }));
    box.querySelectorAll("[data-steptest]").forEach((b) => b.addEventListener("click", () => this._actTest(hub, Number(b.dataset.steptest))));
    box.querySelectorAll("input[data-actfav]").forEach((i) => i.addEventListener("change", () => {
      this._actFavOpen = { ...(this._actFavOpen || {}), [i.dataset.dev]: true };
      patch((d) => {
        const list = (d.favs || []).filter((f) => !(f.d === i.dataset.dev && f.c === i.dataset.cmd));
        if (i.checked) list.push({ d: i.dataset.dev, c: i.dataset.cmd });
        d.favs = list;
      });
    }));
    box.querySelectorAll("details[data-actfavdev]").forEach((d) => d.addEventListener("toggle", () => { this._actFavOpen = { ...(this._actFavOpen || {}), [d.dataset.actfavdev]: d.open }; }));
    const open = box.querySelector("[data-stepbox]");
    if (open) {
      const i = Number(open.dataset.stepbox);
      const s = this._actDraft.steps[i];
      STEP_UI[s.type].bind(open, s, (p) => patch((d) => { Object.assign(d.steps[i], p); }), this);
      open.querySelector("[data-steplabel]")?.addEventListener("input", (e) => { s.label = e.target.value.trim(); if (!s.label) delete s.label; this._actDirty = true; });
      const search = open.querySelector("[data-psearch]");
      search?.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        open.querySelectorAll(".pgroups [data-q]").forEach((c) => { c.hidden = !!q && !c.dataset.q.includes(q); });
        open.querySelectorAll(".pgroups .pgroup").forEach((g) => { g.hidden = ![...g.querySelectorAll("[data-q]")].some((c) => !c.hidden); });
        open.querySelector(".prec")?.toggleAttribute("hidden", !!q);
      });
    }
  },
};
