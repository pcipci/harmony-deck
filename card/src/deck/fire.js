// Fire TV (direct, ADB): state, apps, keys, text row, status chip.
import { FIRE_KEYS, ADB_KEYS, FIRE_ROWS, FIRE_MODELS, FIRE_APPS, appPackage, APP_ALIASES, SYS_APPS, prettyPkg, IR_KEYS, IR_POWER, irCommand } from "../shared/fire.js";
import { RING_IB, esc } from "../shared/util.js";

export const fireMixin = {
  _adbOf(hubId, device) {
    const d = this._directFor(hubId, device);
    if (!d) return null;
    const m = d.model || this._config.direct_model || "all";
    return { entity: d.entity, prefer: d.prefer === "adb", model: m, irVolume: d.irVolume === "cube" && m === "cube" };
  },

  // ADB key code for an action if the Fire TV model has such a key.
  _adbCode(hubId, device, action) {
    const a = this._adbOf(hubId, device);
    const code = ADB_KEYS[action];
    if (!a || !code) return null;
    // Volume over the infrared sender of the Cube (only while the Fire TV runs without an activity, see _fireOnlyHtml).
    if (this._irVol && a.irVolume && IR_KEYS[action]) return { entity: a.entity, code: IR_KEYS[action], prefer: true, cmd: irCommand(IR_KEYS[action]) };
    if (/^(volume|mute)/.test(action) && a.model === "lite") return null;
    if (/^channel/.test(action) && (a.model === "stick" || a.model === "lite")) return null;
    return { entity: a.entity, code, prefer: a.prefer };
  },

  // The Fire TV of a hub: since 0.13 on the link of its Harmony device ({entity, device, ...settings}); older settings "direct" as fallback.
  _fireCfg(hubId) {
    const links = this._settings().directDevices?.[hubId] || {};
    const label = Object.keys(links).sort().find((l) => links[l].fire);
    if (label) {
      // Settings still in the old place for the same player count too (an empty block made by linking must not hide them).
      const old = this._settings().direct?.[hubId];
      const base = old && old.entity === links[label].entity ? { ...old, device: undefined } : {};
      delete base.device;
      return { ...base, ...links[label].fire, entity: links[label].entity, device: label };
    }
    return this._settings().direct?.[hubId] || null;
  },

  // Save the Fire TV settings of a hub (null = unlink the Fire TV settings); where they live is decided here.
  async _fireSave(hubId, cfg) {
    const all = JSON.parse(JSON.stringify(this._settings().directDevices || {}));
    const links = all[hubId] || {};
    let label = Object.keys(links).sort().find((l) => links[l].fire) || (cfg?.device && links[cfg.device] ? cfg.device : null);
    const rest = { ...(this._settings().direct || {}) };
    if (!label || (cfg && links[label].entity !== cfg.entity && !links[cfg.device])) {
      // no link carries it (a device not linked yet): keep it in the old place, it still works there
      if (cfg) rest[hubId] = cfg; else delete rest[hubId];
      await this._saveSettings({ direct: rest });
      return;
    }
    if (cfg) { const { entity, device, ...fire } = cfg; links[label] = { ...links[label], fire }; } else delete links[label].fire;
    all[hubId] = links;
    delete rest[hubId];
    await this._saveSettings({ directDevices: all, direct: rest });
  },

  // Fire TV apps of a hub: built-in list, package overrides and own apps, each with its check status.
  _appsOf(hubId) {
    const d = this._fireCfg(hubId) || {};
    const base = this._config.direct_apps || FIRE_APPS.concat(this._config.direct_apps_extra || []);
    const inst = this._pkgs?.[d.entity];
    const statusOf = (pkg) => (!inst || !pkg ? "" : inst.has(pkg) ? "ok" : pkg.startsWith("com.amazon.") ? "" : "missing");
    const apps = base.map((a) => {
      const own = d.pkgs?.[a.name];
      const cmd = own ? a.cmd.replace(/-p\s+[\w.]+/, `-p ${own}`).replace(/-n\s+[\w.]+\//, `-n ${own}/`) : a.cmd;
      const pkg = appPackage(cmd);
      const status = statusOf(pkg);
      return { ...a, cmd, pkg, status, guess: !!a.guess && !own && status !== "ok" };
    });
    (d.customApps || []).forEach((c) => apps.push({ name: c.name, abbr: c.name.slice(0, 3), color: "#546e7a", cmd: `monkey -p ${c.pkg} -c android.intent.category.LAUNCHER 1`, pkg: c.pkg, status: statusOf(c.pkg), custom: true }));
    return apps;
  },

  // Name, brand colour and symbol for what the Fire TV reports as running (package name or app name).
  _appInfo(raw, hubId, t) {
    if (!raw) return null;
    const own = this._fireCfg(hubId) || {};
    const apps = this._appsOf(hubId);
    let hit = apps.find((a) => a.pkg === raw);
    if (!hit) { const alias = APP_ALIASES[raw] || (own.pkgs ? Object.keys(own.pkgs).find((n) => own.pkgs[n] === raw) : null); if (alias) hit = apps.find((a) => a.name === alias); }
    if (!hit) hit = apps.find((a) => a.name.toLowerCase() === String(raw).toLowerCase());
    if (hit) return { name: hit.name, abbr: hit.abbr || hit.name.slice(0, 2), color: hit.color || "#546e7a", fg: hit.fg || "#fff", icon: hit.icon || "" };
    const sys = SYS_APPS[raw];
    if (sys) return { name: t.appSys?.[sys[0]] || prettyPkg(raw), abbr: "", color: "#546e7a", fg: "#fff", icon: sys[1] };
    const name = /^[\w]+(\.[\w]+)+$/.test(raw) ? (APP_ALIASES[raw] || prettyPkg(raw)) : String(raw);
    return { name, abbr: name.slice(0, 2), color: "#546e7a", fg: "#fff", icon: "" };
  },

  _appBadge(a, t) {
    const mark = (cls, icon, tip) => `<ha-icon class="abadge ${cls}" icon="${icon}" title="${esc(tip)}"></ha-icon>`;
    if (a.status === "ok") return mark("s-ok", "mdi:check-circle-outline", t.instTip);
    if (a.status === "missing") return mark("s-bad", "mdi:alert-circle-outline", t.missTip);
    return a.guess ? mark("s-unv", "mdi:help-circle-outline", t.unvTip) : "";
  },

  // The Fire TV of a room as the card sees it, independent of Harmony: its entity, state and running app.
  _fireInfo(hubId) {
    const cfg = this._config.direct?.[hubId] ?? this._fireCfg(hubId);
    if (!cfg?.entity) return null;
    const st = this._hass.states?.[cfg.entity];
    const raw = st?.state;
    const known = !!st && !["unavailable", "unknown"].includes(raw);
    const mode = !known ? "unknown" : ["off", "standby"].includes(raw) ? "off" : raw === "playing" ? "playing" : "on";
    const appRaw = known ? st.attributes.app_name || st.attributes.app_id || "" : "";
    return { cfg, entity: cfg.entity, name: st?.attributes?.friendly_name || cfg.entity, mode, app: appRaw, appInfo: this._appInfo(appRaw, hubId, this._t()) };
  },

  _fireText(f, t) {
    return `${f.name}: ${[f.appInfo?.name || f.app, t.fireStates[f.mode]].filter(Boolean).join(", ")}`;
  },

  // Small glowing glyph on the room tab: Fire TV is on, playing or not reachable (colour = source, glow = running).
  _fireDot(hubId, t) {
    const f = this._fireInfo(hubId);
    const icon = { playing: "mdi:television-play", on: "mdi:television", unknown: "mdi:television-off" }[f?.mode];
    return icon ? `<i class="fdot f-${f.mode}" title="${esc(this._fireText(f, t))}"><ha-icon icon="${icon}"></ha-icon></i>` : "";
  },

  // Status line of the Fire TV with play/pause and standby, shown even if Harmony knows nothing about it.
  _fireBar(hubId, t) {
    const f = this._fireInfo(hubId);
    if (!f || this._edit || this._config.compact) return "";
    const live = f.mode === "on" || f.mode === "playing";
    if (!live) return "";   // the status line shows only what runs
    const key = (code, icon, label) => (code === 223 ? `<button class="ib holdoff" data-hold="fire" data-hub="${esc(hubId)}" data-entity="${esc(f.entity)}" data-hinttext="${esc(t.holdHint)}" title="${esc(label)}">${RING_IB}<ha-icon icon="${icon}"></ha-icon></button>` : `<button class="ib" data-adb="${esc(f.entity)}" data-adbcmd="${esc(code === IR_POWER ? irCommand(code) : `input keyevent ${code}`)}" title="${esc(label)}"><ha-icon icon="${icon}"></ha-icon></button>`);
    return `<span class="firechip chip f-${f.mode}" title="${esc(this._fireText(f, t))}">${this._appBadgeHtml(f.appInfo)}<span class="ct">${esc(t.fireLabel)}: ${esc(f.appInfo ? f.appInfo.name : t.fireStates[f.mode])}</span>${live ? key(85, f.mode === "playing" ? "mdi:pause" : "mdi:play-pause", t.firePlay) + key(223, "mdi:power", t.fireOff) : ""}</span>`;
  },

  _appBadgeHtml(info) {
    if (!info) return '<ha-icon icon="mdi:television-play"></ha-icon>';
    return `<i class="appbadge" style="--c:${esc(info.color)};--fg:${esc(info.fg)}">${info.icon ? `<ha-icon icon="${esc(info.icon)}"></ha-icon>` : `<b>${esc(info.abbr)}</b>`}</i>`;
  },

  // Fire TV is on but no Harmony activity runs: still offer its remote.
  _fireOnlyHtml(h, t) {
    const f = this._fireInfo(h.id);
    if (!f || this._edit || (f.mode !== "on" && f.mode !== "playing")) return "";
    const dev = f.cfg.device || "Fire TV";
    // Only the Fire TV runs: cross, back/home/menu and text over ADB, volume from the Fire TV activity's volume device.
    const act = this._fireActivity(h);
    const roles = act ? this._roles(h.id, act) || {} : {};
    const nav = [roles.nav, ...(act ? this._setupOf(h, act).map((it) => it.device) : [])].find((d) => d && this._linkedFire(h.id, d)) || null;
    if (nav && this._has(h.id, nav, "ok")) {
      // Option "Volume over the Cube": the volume keys of this panel send infrared through the Cube instead of the Harmony device.
      const ir = !!this._adbOf(h.id, nav)?.irVolume;
      let panel;
      this._irVol = ir;
      try { panel = this._panelHtml(h, { volume: ir ? nav : roles.volume, nav, channel: null, transport: null }, t, { forceAdb: true, small: "", big: "__BIG__", noKeypad: true }); } finally { this._irVol = false; }
      return panel.replace("__BIG__", this._directHtml(h, dev, t, false, "", false, panel.includes('class="textblock')) || "");
    }
    return this._directHtml(h, dev, t, false);
  },

  // 0.25: Fire TV keys that appear by themselves in an activity with a linked Fire TV, in one row under the cross:
  // Back / Home / Menu when the cross belongs to another device, then Search and Settings (if the model has them).
  // Keys that the remote shows already (pills, the "Fire TV keys" block of the setting "Also in activities") are left out.
  _fireActKeys(h, roles, act, t) {
    if (this._edit || this._config.compact || !act) return "";
    const navFire = roles.nav ? this._linkedFire(h.id, roles.nav) : null;
    const d = navFire || this._directFor(h.id, roles.nav, act) || this._setupOf(h, act).map((it) => this._linkedFire(h.id, it.device)).find(Boolean);
    if (!d?.entity) return "";
    const model = d.model || this._config.direct_model || "all";
    const has = (l) => model === "all" || !FIRE_MODELS[model] || FIRE_MODELS[model].includes(l);
    const hidden = new Set(d.hiddenKeys || []);
    const want = [...(navFire ? [] : ["Zurück", "Home", "Menü"]), ...(d.inActivities ? [] : ["Suchen", "Einstellungen"])];
    const keys = want.map((l) => FIRE_KEYS.find(([x]) => x === l)).filter((k) => k && has(k[0]) && !hidden.has(k[0]));
    if (!keys.length) return "";
    const btn = ([l, ic, code]) => `<button class="key pill adbk" data-adb="${esc(d.entity)}" data-adbcmd="input keyevent ${code}" title="${esc(t.fireKeys?.[l] || l)}"><ha-icon icon="${ic}"></ha-icon></button>`;
    return `<div class="pills firekeys" style="grid-template-columns: repeat(${Math.min(3, Math.max(2, keys.length))}, minmax(0, 1fr))">${keys.map(btn).join("")}</div>`;
  },

  // Activity to describe while only the Fire TV runs: the one that contains the linked device, else the one named like Fire.
  _fireActivity(h) {
    const hit = h.list.find((n) => this._setupOf(h, n).some((it) => this._linkedFire(h.id, it.device)));
    return hit || h.list.find((n) => /fire/i.test(n)) || null;
  },

  // The direct link only for the device it belongs to (no activity-name shortcut).
  _linkedFire(hubId, dev) {
    const d = this._directFor(hubId, dev);
    return d && d.entity ? d : null;
  },

  // Which Fire TV entity belongs to a Harmony device: explicit setting, else the only Fire-TV-like media_player.
  _directFor(hubId, dev, activity = "") {
    const cfg = this._config.direct?.[hubId] ?? this._fireCfg(hubId);
    const isFire = (x) => /fire/i.test(x || "");
    if (cfg?.entity) {
      const match = cfg.device ? cfg.device === dev : isFire(dev);
      return match || (activity && isFire(activity) && (!cfg.device || cfg.device === dev || isFire(dev))) ? cfg : null;
    }
    if (!isFire(dev) && !(activity && isFire(activity) && isFire(dev))) return null;
    const c = this._fireCandidates();
    return c.length === 1 ? { entity: c[0] } : null;
  },

  _fireCandidates() {
    const st = this._hass?.states || {};
    return Object.keys(st).filter((id) => id.startsWith("media_player.") && (st[id].attributes.adb_response !== undefined || /fire.?tv/i.test(st[id].attributes.friendly_name || id)));
  },

  _directHtml(h, dev, t, collapsed = false, activity = "", split = false, noText = false) {
    const d = this._directFor(h.id, dev, activity);
    if (!d) return "";
    if (activity && !d.inActivities) return "";
    const st = this._hass.states[d.entity];
    const apps = this._appsOf(h.id).filter((a) => !(d.hiddenApps || []).includes(a.name));
    const nowRaw = st?.attributes?.app_name || st?.attributes?.app_id;
    const nowInfo = this._appInfo(nowRaw, h.id, t);
    const now = nowInfo?.name || nowRaw;
    const model = d.model || this._config.direct_model || "all";
    const keys = (model !== "all" && FIRE_MODELS[model] ? FIRE_KEYS.filter(([l]) => FIRE_MODELS[model].includes(l)) : FIRE_KEYS).filter(([, , c]) => c !== IR_POWER || model === "cube");
    const covered = new Set(Object.values(ADB_KEYS));
    const extra = keys.filter(([l, , code]) => !covered.has(code) && !(d.hiddenKeys || []).includes(l));
    const sstate = st?.state;
    const keyOn = (code) => (code === 85 && sstate === "playing") || (code === 223 && ["off", "standby"].includes(sstate));
    const pkgOf = appPackage;
    const curPkg = st?.attributes?.app_id;
    const key = ([l, ic, code]) => `<button class="key cell ic-row ${keyOn(code) ? "on" : ""}" data-adb="${esc(d.entity)}" data-adbcmd="${esc(code === IR_POWER ? irCommand(code) : `input keyevent ${code}`)}" title="${esc(t.fireKeys?.[l] || l)}"><ha-icon icon="${ic}"></ha-icon><span>${esc(t.fireKeys?.[l] || l)}</span></button>`;
    const app = (a) => `<button class="key cell appcell svc txt ${curPkg && pkgOf(a.cmd) === curPkg ? "on" : ""}" style="--c:${esc(a.color || "var(--hr-accent)")};--fg:${esc(a.fg || "#fff")}" title="${esc(a.name)}" data-adb="${esc(d.entity)}" data-adbcmd="${esc(a.cmd)}"><b>${esc(a.name)}</b></button>`;
    const body = `<div class="directbox">
      ${now ? `<div class="dnow">${this._appBadgeHtml(nowInfo)}<span>${t.directNow}: ${esc(now)}</span></div>` : ""}
      ${activity || split || noText ? "" : this._textForm(d.entity)}
      <div class="dname">${t.directApps}</div><div class="cells">${apps.map(app).join("")}</div>
      ${split ? "" : `<div class="dname">${t.directKeys}</div><div class="cells">${extra.map(key).join("")}</div>`}</div>`;
    if (split && !collapsed) {
      const byLabel = new Map(extra.map((k) => [k[0], k]));
      const rowsHtml = FIRE_ROWS.map((row) => (row.some((l) => byLabel.has(l)) ? `<div class="krow">${row.map((l) => (byLabel.has(l) ? key(byLabel.get(l)) : "<span></span>")).join("")}</div>` : "")).join("");
      const rest = extra.filter((k) => !FIRE_ROWS.some((r) => r.includes(k[0])));
      const keysBlock = extra.length ? `<div class="block dkeys"><span class="dname">${t.directKeys}</span>${rowsHtml}${rest.length ? `<div class="krow">${rest.map(key).join("")}</div>` : ""}</div>` : "";
      return { keys: keysBlock, main: `<div class="block direct"><span class="dname">${t.direct}</span>${body}</div>` };
    }
    return collapsed ? `<details class="block direct" data-dtog="${esc(h.id)}" ${this._dOpen?.[h.id] ? "open" : ""}><summary class="dname">${t.direct}</summary>${body}</details>` : `<div class="block direct"><span class="dname">${t.direct}</span>${body}</div>`;
  },

  // Text row: field + send (types the text and presses Enter) + delete. Under the D-pad it folds out from a slim key.
  _textForm(entity, closable = false) {
    const t = this._t();
    return `<form class="dtext" data-dtext="${esc(entity)}"><label class="dfield"><ha-icon icon="mdi:keyboard-outline"></ha-icon><input type="text" placeholder="${t.directText}" autocomplete="off" enterkeyhint="send"></label>
      <button type="submit" class="key" title="${t.directSend}"><ha-icon icon="mdi:send-outline"></ha-icon></button>
      <button type="button" class="key" data-adb="${esc(entity)}" data-adbcmd="input keyevent 67" title="${esc(t.directDelete)}"><ha-icon icon="mdi:backspace-outline"></ha-icon></button>${closable ? `<button type="button" class="key" data-ttog="${esc(closable)}" title="×"><ha-icon icon="mdi:close"></ha-icon></button>` : ""}</form>`;
  },

  _textBlock(hubId, entity, t) {
    return this._textOpen?.[hubId]
      ? `<div class="textblock open">${this._textForm(entity, hubId)}</div>`
      : `<div class="textblock"><button type="button" class="textopen" data-ttog="${esc(hubId)}"><ha-icon icon="mdi:keyboard-outline"></ha-icon><span>${esc(t.directText)}</span></button></div>`;
  },

  // Events of the Fire TV keys, apps and the text row.
  _bindFire(root) {
    // The folded "Direct" block keeps its state (a key press redraws the card).
    root.querySelectorAll("details[data-dtog]").forEach((d) => d.addEventListener("toggle", () => { this._dOpen = { ...(this._dOpen || {}), [d.dataset.dtog]: d.open }; }));
    root.querySelectorAll("[data-adb]").forEach((b) => b.addEventListener("click", () => { if (this._edit) return; this._adb(b.dataset.adb, b.dataset.adbcmd); if (b.classList.contains("appcell")) { b.classList.add("starting"); setTimeout(() => b.classList.remove("starting"), 6000); } }));
    root.querySelectorAll("[data-ttog]").forEach((b) => b.addEventListener("click", () => {
      const hub = b.dataset.ttog;
      this._textOpen = { ...(this._textOpen || {}), [hub]: !this._textOpen?.[hub] };
      this._rerender();
      if (this._textOpen[hub]) requestAnimationFrame(() => this.shadowRoot.querySelector(".textblock.open input")?.focus({ preventScroll: true }));
    }));
    root.querySelectorAll("form[data-dtext]").forEach((f) => f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = f.querySelector("input").value;
      if (!v) return;
      const esc_ = v.replace(/'/g, "'\\''").replace(/ /g, "%s");
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      f.querySelector("input").value = "";
      this._adb(f.dataset.dtext, `input text '${esc_}'`);
      await wait(400);
      this._adb(f.dataset.dtext, "input keyevent 66");
    }));
  },
};
