// Settings mode: tabs, look, icons, links, hints; edit mode start / cancel.
import { SCHEME_SKINS, skinGroup, skinGroups } from "../shared/skins.js";
import { activityIcon, ACTION_ICONS, DEVICE_ICONS } from "../shared/icons.js";
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";
import { volumeCap } from "./steps/ha-values.js";

export const settingsEditorMixin = {
  _etabNow() { const k = this._etab || "look"; return (this._t().tabs || {})[k] ? k : "look"; },

  _edModeHtml(t) {
    const m = this._editMode;
    const icon = { info: "mdi:information-outline", favs: "mdi:star-outline", profiles: "mdi:account-circle-outline", actions: "mdi:flash" }[m] || "mdi:cog-outline";
    const label = { info: t.menuInfo, favs: t.editFavs, profiles: t.editProfiles, actions: t.actions }[m] || t.editSettings;
    return `<ha-icon icon="${icon}"></ha-icon><span>${label} · ${t.profLabel}: ${esc(this._prof().active)}</span>`;
  },

  // Edit view: only the tabs of the rooms and the edited area (no status line, tiles or info above it).
  _editBody(h, t, body) {
    if (this._editMode === "profiles") return `<div class="editbox">${this._profilesEdit(t)}</div>`;
    if (this._editMode === "actions") return `<div class="editbox">${this._actionsEdit(h, t)}</div>`;
    if (this._editMode === "info") return `<div class="editbox infoarea">${this._infoArea(h, t)}</div>`;
    if (this._editMode === "favs") {
      const kind = ["act", "hide"].includes(this._favKind) ? this._favKind : "dev";
      const sw = `<div class="favkind"><button class="${kind === "dev" ? "sel" : ""}" data-favkind="dev"><ha-icon icon="mdi:devices"></ha-icon><span>${t.devicesTab}</span></button><button class="${kind === "act" ? "sel" : ""}" data-favkind="act"><ha-icon icon="mdi:remote"></ha-icon><span>${t.activities}</span></button><button class="${kind === "hide" ? "sel" : ""}" data-favkind="hide"><ha-icon icon="mdi:eye-off-outline"></ha-icon><span>${t.hideKeys}</span></button></div>`;
      return sw + (kind === "act" ? `<div class="editbox">${this._favEdit(h, t, true)}</div>` : body);
    }
    return body;
  },

  // One row per option: label left, control right; the whole row is a <label>, so tapping anywhere switches or focuses.
  _swRow(label, attrs, on) { return `<label class="erow swrow"><span>${label}</span><span class="sw"><input type="checkbox" ${attrs} ${on ? "checked" : ""}><i></i></span></label>`; },
  _selRow(label, attrs, items, cur) { return `<label class="erow"><span>${label}</span><select ${attrs}>${Object.entries(items).map(([k, v]) => `<option value="${k}" ${k === cur ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>`; },
  _grp(title, rows) { return `<div class="egrp">${title ? `<div class="esub">${title}</div>` : ""}${rows}</div>`; },

  _editHtml(t, h) {
    const skin = this._skin();
    const shown = !(this._settings().hiddenHubs || []).includes(h.id);
    const skins = Object.fromEntries(skinGroups().map((k) => [k, t.skins[k] || k]));
    const palettes = Object.fromEntries(SCHEME_SKINS.map((k) => [k, t.skins[k] || k]));
    const roomOnly = this._settings().roomSkins?.[h.id] !== undefined;
    const plain = !this._trait("premium");
    const etab = this._etabNow();
    const g = t.groups || {};
    const tabsBar = `<div class="etabs">${Object.entries(t.tabs).map(([k, v]) => `<button class="${k === etab ? "sel" : ""}" data-etab="${k}">${esc(v)}</button>`).join("")}</div>`;
    const tabHint = t.tabHints?.[etab] ? `<div class="ehint tabhint">${esc(t.tabHints[etab])}</div>` : "";
    return `<div class="editbox">${tabsBar}${tabHint}
      <div class="esec" data-t="misc"><div class="etitle">${t.secHub}</div>${this._grp("", `
        <label class="erow"><span>${t.hubName}</span><input type="text" data-hubname data-hub="${esc(h.id)}" value="${esc(h.name)}"></label>
        ${this._swRow(t.hubShown, `data-hubvis data-hub="${esc(h.id)}"`, shown)}
        ${this._swRow(t.offRelated, `data-offrel data-hub="${esc(h.id)}"`, !!this._settings().offRelated?.[h.id])}
        ${this._swRow(t.helpManualSet, 'data-setting="helpManual"', !!this._settings().helpManual)}
        ${this._swRow(t.trafficLog, 'data-setting="trafficLog"', !!this._settings().trafficLog)}`)}</div>
      <div class="esec" data-t="look"><div class="etitle">${t.secLook}</div>
        ${this._grp(g.skin, `${this._selRow(t.skin, "data-skin", skins, skinGroup(skin))}
          ${skinGroup(skin) === "scheme" ? this._selRow(t.palette, "data-palette", palettes, skin) : ""}
          ${this._hubs().length > 1 ? this._swRow(t.roomOnly, `data-roomonly data-hub="${esc(h.id)}"`, roomOnly) : ""}
          ${this._trait("glassLook") ? this._selRow(t.glassLook, "data-glasslook", t.glassLooks, this._glassLook()) : ""}
          ${this._trait("glassLook") ? this._selRow(t.glassBg, "data-glassbg", t.glassBgs, this._glassBg()) : ""}
          ${this._trait("glassLook") ? this._selRow(t.glassActColors, "data-glassac", t.glassActColorsOpts, this._actColors() ? "on" : "off") : ""}
          ${plain ? this._swRow(t.colorIcons, 'data-setting="colorIcons"', this._colorful()) : ""}`)}
        ${this._grp(g.tiles, `${plain ? this._selRow(t.tileStyle, "data-tilestyle", t.tileStyles, this._tileStyle()) : ""}
          ${this._selRow(t.layout, "data-layout", t.layouts, this._layout())}
          ${plain ? this._selRow(t.activeStyle, "data-activestyle", t.activeStyles, this._activeStyle()) : ""}`)}
        ${this._grp(g.keys, `${plain ? this._selRow(t.keyStyle, "data-keystyle", t.keyStyles, this._keyStyle()) : ""}
          ${this._selRow(t.labels, "data-labels", t.labelOpts, this._labels())}
          ${plain ? this._selRow(t.glow, "data-glow", t.glows, this._glow()) : ""}`)}</div>
      <div class="esec" data-t="behave"><div class="etitle">${t.tabs.behave}</div>
        ${this._grp(g.touch, `${this._swRow(t.vibrate, 'data-setting="vibrate"', this._vibrateOn())}
          ${this._swRow(t.holdSwitch, 'data-setting="holdSwitch"', this._holdSwitchOn())}
          ${this._swRow(t.keyCtl, 'data-setting="keyboardControl"', !!(this._config.keyboard_control ?? this._settings().keyboardControl))}`)}
        ${this._grp(g.view, `${this._swRow(t.collapseHeader, 'data-setting="collapseHeader"', this._collapseOn())}
          ${this._swRow(t.jumpRunning, 'data-setting="jumpRunning"', this._jumpOn())}
          ${this._swRow(t.helpNames, 'data-setting="helpNames"', this._helpNames())}`)}
        ${this._grp(g.actions, this._selRow(t.volumeCap, "data-volcap", Object.fromEntries([50, 60, 70, 80, 90, 100].map((n) => [String(n), `${n} %`])), String(this._settings().volumeCap || 80)) + `<div class="ehint">${t.volumeCapHint}</div>`)}</div>
      <div class="esec" data-t="devs"><div class="etitle">${t.deviceIcons}</div>${Object.keys(this._devicesOf(h.id)).map((n) => this._iconPicker(h.id, n, t)).join("")}</div>
      <div class="esec" data-t="acts"><div class="etitle">${t.activityIcons}</div>${h.list.filter((n) => n !== "PowerOff").map((n) => this._iconPicker(h.id, n, t, "act")).join("")}</div>
      ${this._linkEdit(h, t)}
      ${this._directDevHtml(h, t)}
      </div>
      <div class="etitle outside" data-t="acts">${t.visible}</div>`;
  },

  // Icon chooser for a device: shows the current symbol; tapping opens a grid of all symbols (a native select cannot show icons).
  _iconPicker(hubId, name, t, kind = "dev") {
    const act = kind === "act";
    const own = (act ? this._settings().activityIcons : this._settings().deviceIcons)?.[hubId]?.[name] || "";
    const key = `${kind}|${hubId}|${name}`;
    const open = this._iconOpen === key;
    const list = act ? [...new Map([...DEVICE_ICONS, ...ACTION_ICONS].map((x) => [x[0], x])).values()] : DEVICE_ICONS;
    const cur = list.find(([ic]) => ic === own);
    const auto = act ? activityIcon(name, (n) => this._deviceIcon(n)) : this._deviceIcon(name, hubId);
    const cell = (ic, label, sel) => `<button class="iconcell ${sel ? "sel" : ""}" data-iconpick="${esc(ic)}" data-kind="${kind}" data-hub="${esc(hubId)}" data-dev="${esc(name)}" title="${esc(label)}"><ha-icon icon="${ic || auto}"></ha-icon>${ic ? "" : "<small>A</small>"}</button>`;
    return `<div class="iconrow"><span class="iname"><ha-icon icon="${own || auto}"></ha-icon> ${esc(name)}</span>
      <button class="iconbtn" data-iconopen="${esc(key)}" aria-expanded="${open}"><ha-icon icon="${own || auto}"></ha-icon><span>${esc(cur ? t.iconNames?.[cur[0]] || cur[1] : t.iconAuto)}</span><ha-icon icon="${open ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon></button>
      ${open ? `<div class="icongrid">${cell("", t.iconAuto, !own)}${list.map(([ic, nm]) => cell(ic, t.iconNames?.[ic] || nm, ic === own)).join("")}</div>` : ""}</div>`;
  },

  // Entity chooser with search: type part of the name or the id, tap a match. The value sits in a hidden field (`attr="entity"`).
  _entSelect(attr, ids, value, t) {
    const st = this._hass.states || {};
    const name = (id) => String(st[id]?.attributes?.friendly_name || "").trim();
    const disp = (id) => (name(id) ? `${name(id)} (${id})` : id);
    const all = [...new Set([...ids, ...(value ? [value] : [])])].sort((a, b) => (name(a) || a).localeCompare(name(b) || b, undefined, { sensitivity: "base" }));
    const opts = all.map((id) => `<button type="button" class="entopt" data-v="${esc(id)}" data-d="${esc(disp(id))}" data-q="${esc(`${name(id)} ${id}`.toLowerCase())}"><span>${esc(name(id) || id)}</span>${name(id) ? `<small>${esc(id)}</small>` : ""}</button>`).join("");
    return `<div class="entpick" data-entpick><input type="text" class="entin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t.entityPick)}" value="${esc(value ? disp(value) : "")}"><input type="hidden" ${attr}="entity" value="${esc(value || "")}">
      <div class="entlist" hidden><button type="button" class="entopt none" data-v="" data-d="" data-q=""><span>${esc(t.linkNone)}</span></button>${opts}</div></div>`;
  },

  _bindEntPick(root) {
    root.querySelectorAll("[data-entpick]").forEach((box) => {
      const inp = box.querySelector(".entin"), hid = box.querySelector('input[type="hidden"]'), list = box.querySelector(".entlist");
      const opts = [...list.querySelectorAll(".entopt:not(.none)")];
      let typed = false;
      const fire = () => hid.dispatchEvent(new Event("change", { bubbles: true }));
      const filter = () => {
        const q = typed ? inp.value.trim().toLowerCase() : "";
        let n = 0;
        opts.forEach((o) => { const ok = !q || o.dataset.q.includes(q); o.hidden = !ok || n >= 60; if (ok && n < 60) n++; });
      };
      inp.addEventListener("focus", () => { typed = false; filter(); list.hidden = false; inp.select(); });
      inp.addEventListener("input", () => { typed = true; filter(); list.hidden = false; });
      inp.addEventListener("blur", () => setTimeout(() => { list.hidden = true; }, 200));
      inp.addEventListener("change", (e) => {
        e.stopPropagation();
        const v = inp.value.trim();
        if (/^[a-z_]+\.[a-z0-9_]+$/.test(v) && v !== hid.value) { hid.value = v; fire(); }
      });
      list.addEventListener("pointerdown", (e) => e.preventDefault());
      list.querySelectorAll(".entopt").forEach((o) => o.addEventListener("click", () => {
        hid.value = o.dataset.v; inp.value = o.dataset.d; list.hidden = true; typed = false; inp.blur(); fire();
      }));
    });
  },

  _linkEdit(h, t) {
    const l = this._links(h)[0] || {};
    const acts = h.list.filter((n) => n !== "PowerOff");
    const opts = [`<option value="">${t.linkNone}</option>`, ...acts.map((n) => `<option value="${esc(n)}" ${l.activity === n ? "selected" : ""}>${esc(n)}</option>`)].join("");
    const checks = (name, items, on) => items.map(([v, label]) => `<label class="chk"><input type="checkbox" data-link="${name}" value="${esc(v)}" ${(on || []).includes(v) ? "checked" : ""}>${esc(label)}</label>`).join("");
    const doms = ["media_player", "remote", "switch", "light", "input_boolean", "binary_sensor"];
    return `<div class="linkbox esec" data-t="acts" data-hub="${esc(h.id)}"><div class="etitle">${t.secLink}</div>
      <label class="erow"><span>${t.linkEntity}</span>${this._entSelect('data-link', Object.keys(this._hass.states || {}).filter((id) => doms.includes(id.split(".")[0])), l.entity || "", t)}</label>
      <label class="erow"><span>${t.linkActivity}</span><select data-link="activity">${opts}</select></label>
      <div class="egroup"><div class="ehint">${t.linkLockActs}</div><div class="chks">${checks("lockActivities", acts.map((n) => [n, n]), l.lockActivities)}</div></div>
      <div class="egroup"><div class="ehint">${t.linkLockKeys}</div><div class="chks">${checks("lockKeys", Object.entries(t.roles), l.lockKeys)}</div></div></div>`;
  },

  async _saveLink(box) {
    const hub = box.dataset.hub;
    const val = (n) => box.querySelector(`[data-link="${n}"]`)?.value || "";
    const list = (n) => [...box.querySelectorAll(`input[data-link="${n}"]:checked`)].map((i) => i.value);
    const link = { entity: val("entity").trim(), activity: val("activity"), lockActivities: list("lockActivities"), lockKeys: list("lockKeys") };
    const all = { ...(this._settings().links || {}) };
    if (link.activity) all[hub] = [link]; else delete all[hub];
    await this._saveSettings({ links: all });
  },

  // Settings that the card YAML sets explicitly win over the editor; show them as locked so a change does not seem to do nothing.
  _applyLocks(root) {
    const t = this._t();
    const keys = {
      "select[data-skin], select[data-palette]": "skin", "[data-tilestyle]": "tile_style", '[data-setting="colorIcons"]': "colored_icons", '[data-setting="helpNames"]': "help_names",
      '[data-setting="keyboardControl"]': "keyboard_control", '[data-setting="vibrate"]': "vibrate", '[data-setting="collapseHeader"]': "collapse_header", '[data-setting="holdSwitch"]': "hold_switch", "[data-layout]": "layout", "[data-activestyle]": "active_style",
      "[data-keystyle]": "key_style", "[data-labels]": "labels", "[data-glow]": "glow", "[data-glasslook]": "glass_look", "[data-glassbg]": "glass_bg", "[data-glassac]": "glass_act_colors",
    };
    const locked = new Map();
    Object.entries(keys).forEach(([sel, key]) => {
      const el = root.querySelector(sel);
      if (!el || this._config[key] === undefined) return;
      el.disabled = true;
      const sec = el.closest(".esec");
      const lab = el.closest(".erow")?.querySelector(":scope > span");
      if (lab) lab.insertAdjacentHTML("beforeend", `<ha-icon class="lockyaml" icon="mdi:lock-outline" title="${esc(fmtText(t.yamlLock, [key, this._config[key]]))}"></ha-icon>`);
      if (sec) locked.set(sec, [...(locked.get(sec) || []), `${key}: ${this._config[key]}`]);
    });
    // The hint goes only into the section (tab) that has locked options.
    locked.forEach((list, sec) => sec.querySelector(":scope > .etitle")?.insertAdjacentHTML("afterend", `<div class="ehint yamlhint"><ha-icon icon="mdi:lock-outline"></ha-icon><span>${esc(fmtText(t.yamlHint, [list.join(", ")]))}</span></div>`));
  },

  // Info bubbles (i) next to settings; texts in translations/*.json under "tips".
  _applyTips(root) {
    const tips = this._t().tips || {};
    const rows = {
      "select[data-skin], select[data-palette]": "skin", "[data-tilestyle]": "tileStyle", '[data-setting="colorIcons"]': "colorIcons", '[data-setting="helpNames"]': "helpNames",
      '[data-setting="keyboardControl"]': "keyCtl", '[data-setting="vibrate"]': "vibrate", '[data-setting="collapseHeader"]': "collapseHeader", '[data-setting="holdSwitch"]': "holdSwitch", "[data-layout]": "layout", "[data-activestyle]": "activeStyle",
      "[data-keystyle]": "keyStyle", "[data-labels]": "labels", "[data-glow]": "glow", '[data-direct="entity"]': "directEntity", '[data-direct="device"]': "directDevice",
      '[data-direct="prefer"]': "directPrefer", '[data-direct="irvol"]': "irVolume", '[data-direct="inact"]': "directAct", '[data-direct="offlock"]': "offlineLock", '[data-direct="model"]': "directModel",
      "[data-hubname]": "hubName", "[data-hubvis]": "hubVis", "[data-glasslook]": "glassLook", "[data-glassbg]": "glassBg", "[data-glassac]": "glassActColors", '[data-setting="jumpRunning"]': "jumpRunning", "[data-offrel]": "offRelated", '[data-setting="helpManual"]': "helpManual", '[data-setting="trafficLog"]': "trafficLog",
      '[data-link="entity"]': "linkEntity", '[data-link="activity"]': "linkActivity",
      '[data-actname]': "actName", '[data-hent="entity"]': "actEntity", "[data-hop]": "actOp", "[data-actscope]": "actScope", "[data-acttile]": "actTile",
    };
    const tip = (el, key) => {
      if (!tips[key] || !el || el.querySelector(":scope > .tip")) return;
      const i = document.createElement("span");
      i.className = "tip";
      i.tabIndex = 0;
      i.dataset.tip = tips[key];
      i.title = tips[key];
      i.textContent = "ⓘ";
      el.appendChild(i);
    };
    Object.entries(rows).forEach(([sel, key]) => tip(root.querySelector(sel)?.closest(".erow")?.querySelector(":scope > span"), key));
    const heading = (attr) => {
      let el = root.querySelector(`[${attr}]`)?.closest(".cells")?.previousElementSibling;
      while (el && !el.matches(".dname")) el = el.previousElementSibling;
      return el;
    };
    tip(root.querySelector(".linkbox > .etitle"), "linkTitle");
    const lg = root.querySelectorAll(".linkbox .egroup > .ehint");
    tip(lg[0], "linkLockActs"); tip(lg[1], "linkLockKeys");
    tip(root.querySelector(".actform [data-acticonopen]")?.closest(".erow")?.querySelector(":scope > span"), "actIcon");
    tip(root.querySelector(".actedit > .etitle"), "actions");
    tip(root.querySelector(".etitle[data-actfavs]"), "actFavs");
    tip(heading("data-hide-app"), "apps");
    tip(heading("data-hide-key"), "keys");
  },

  async _saveHidden(hubId) {
    const hidden = [...this.shadowRoot.querySelectorAll(`input[data-vis][data-hub="${hubId}"]`)].filter((i) => !i.checked).map((i) => i.dataset.act);
    await this._saveSettings({ hidden: { ...(this._settings().hidden || {}), [hubId]: hidden } });
  },

  // Settings and favourites save on every change; "cancel" restores the state from when the edit mode was opened.
  async _onEdit(act) {
    if (act === "cancel") this._cancelAsk = true;
    else if (act === "cancelno") this._cancelAsk = false;
    else if (act === "cancelyes") {
      this._cancelAsk = false;
      this._actClose();
      const snap = this._snap;
      this._editMode = null; this._snap = null;
      if (snap) {
        this._info = { ...(this._info || { hubs: {} }), settings: snap };
        try { await this._hass.callWS({ type: "harmony_deck/save_settings", settings: snap, profile: this._prof().active }); } catch (e) { /* kept for this session only */ }
      }
    } else if (act === "off") { if (this._editMode === "actions") await this._actFlush(); this._editMode = null; this._snap = null; this._cancelAsk = false; }
    else { if (!this._edit) this._snap = JSON.parse(JSON.stringify(this._settings())); this._editMode = act; this._winSet(this._hubSel, null); }
    // Leaving or entering settings: no device page of the network tab stays open (the tab starts at its overview).
    if (act !== "cancel" && act !== "cancelno") { this._ddPage = null; this._iconOpen = null; }
    this._key = "";
    this.hass = this._hass;
  },

  // Events of the settings mode.
  _bindSettings(root) {
    if (this._edit) { this._applyTips(root); this._applyLocks(root); this._bindEntPick(root); }
    root.querySelector("input[data-hubname]")?.addEventListener("change", (e) => this._saveSettings({ names: { ...(this._settings().names || {}), [e.target.dataset.hub]: e.target.value.trim() } }));
    root.querySelectorAll("input[data-offrel]").forEach((i) => i.addEventListener("change", () => this._saveSettings({ offRelated: { ...(this._settings().offRelated || {}), [i.dataset.hub]: i.checked } })));
    root.querySelector("input[data-hubvis]")?.addEventListener("change", (e) => {
      const hid = new Set(this._settings().hiddenHubs || []);
      if (e.target.checked) hid.delete(e.target.dataset.hub); else hid.add(e.target.dataset.hub);
      this._saveSettings({ hiddenHubs: [...hid] });
    });
    root.querySelectorAll(".linkbox").forEach((box) => box.addEventListener("change", () => this._saveLink(box)));
    root.querySelector("select[data-volcap]")?.addEventListener("change", (e) => this._saveSettings({ volumeCap: Number(e.target.value) }));
    root.querySelectorAll("input[data-setting]").forEach((i) => i.addEventListener("change", () => this._saveSettings({ [i.dataset.setting]: i.checked })));
    root.querySelectorAll("[data-edit]").forEach((b) => b.addEventListener("click", () => { this._etab = b.dataset.goetab || "look"; this._onEdit(b.dataset.edit); }));
    root.querySelectorAll("input[data-vis]").forEach((i) => i.addEventListener("change", () => this._saveHidden(i.dataset.hub)));
    root.querySelector("select[data-tilestyle]")?.addEventListener("change", (e) => this._saveSettings({ tileStyle: e.target.value }));
    root.querySelectorAll("[data-iconopen]").forEach((b) => b.addEventListener("click", () => { this._iconOpen = this._iconOpen === b.dataset.iconopen ? null : b.dataset.iconopen; this._rerender(); }));
    root.querySelectorAll("[data-iconpick]").forEach((b) => b.addEventListener("click", () => {
      const field = b.dataset.kind === "act" ? "activityIcons" : "deviceIcons";
      const all = JSON.parse(JSON.stringify(this._settings()[field] || {}));
      all[b.dataset.hub] = { ...(all[b.dataset.hub] || {}) };
      if (b.dataset.iconpick) all[b.dataset.hub][b.dataset.dev] = b.dataset.iconpick; else delete all[b.dataset.hub][b.dataset.dev];
      this._iconOpen = null;
      this._saveSettings({ [field]: all });
    }));
    root.querySelector("select[data-labels]")?.addEventListener("change", (e) => this._saveSettings({ labels: e.target.value }));
    root.querySelectorAll("[data-etab]").forEach((b) => b.addEventListener("click", () => { this._etab = b.dataset.etab; this._rerender(); }));
    root.querySelector("select[data-layout]")?.addEventListener("change", (e) => this._saveSettings({ layout: e.target.value }));
    root.querySelector("select[data-activestyle]")?.addEventListener("change", (e) => this._saveSettings({ activeStyle: e.target.value }));
    root.querySelector("select[data-keystyle]")?.addEventListener("change", (e) => this._saveSettings({ keyStyle: e.target.value }));
    root.querySelector("select[data-glasslook]")?.addEventListener("change", (e) => this._saveSettings({ glassLook: e.target.value }));
    root.querySelector("select[data-glassac]")?.addEventListener("change", (e) => this._saveSettings({ glassActColors: e.target.value }));
    root.querySelector("select[data-glassbg]")?.addEventListener("change", (e) => this._saveSettings({ glassBg: e.target.value }));
    root.querySelector("select[data-glow]")?.addEventListener("change", (e) => this._saveSettings({ glow: e.target.value }));
    // One look for the room shown: with "only this room" it is stored for the room, otherwise as the default skin.
    const applyLook = (hub, key) => {
      const rs = { ...(this._settings().roomSkins || {}) };
      if (rs[hub] !== undefined) { rs[hub] = key; this._saveSettings({ roomSkins: rs }); } else this._saveSettings({ skin: key });
    };
    root.querySelector("select[data-skin]")?.addEventListener("change", (e) => {
      const cur = this._skin();
      applyLook(this._hubSel, e.target.value === "scheme" ? (SCHEME_SKINS.includes(cur) ? cur : "dark") : e.target.value);
    });
    root.querySelector("select[data-palette]")?.addEventListener("change", (e) => applyLook(this._hubSel, e.target.value));
    root.querySelector("input[data-roomonly]")?.addEventListener("change", (e) => {
      const rs = { ...(this._settings().roomSkins || {}) };
      if (e.target.checked) rs[e.target.dataset.hub] = this._skin(); else delete rs[e.target.dataset.hub];
      this._saveSettings({ roomSkins: rs });
    });
  },
};
