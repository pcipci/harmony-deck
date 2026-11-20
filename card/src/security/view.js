// Security card, view: status, mode, release, allowed activities and apps, schedule, list of interventions.
import { FIRE_APPS, appPackage, appLabel, knownPackages } from "../shared/fire.js";
import { LAUNCHER, RELEASE_CHOICES } from "./const.js";
import { SKINS, skinKey } from "../shared/skins.js";
import { activityIcon, roomIcon } from "../shared/icons.js";
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";
import { securityStyle } from "./style.js";
import { styleMixin } from "../deck/style.js";

const time = (iso) => { const d = new Date(iso); return isNaN(d) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }); };
const dayTime = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const today = new Date().toDateString() === d.toDateString();
  return today ? time(iso) : `${d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" })} ${time(iso)}`;
};

export const securityViewMixin = {
  _render() {
    const t = this._text;
    if (!t || !this._hass || !this._config) return;
    const d = this._data;
    const hubs = this._hubs();
    if (!hubs.some((h) => h.id === this._hubSel)) this._hubSel = hubs[0]?.id;
    const st = this._hass.states || {};
    const key = JSON.stringify([d, this._hubSel, this._logAll, this._appsMsg, this._error, this._open, this._textLang, this._config,
      hubs.map((h) => (h.fire_entity ? [st[h.fire_entity]?.state, st[h.fire_entity]?.attributes?.app_id] : null))]);
    if (key === this._key) return;
    this._key = key;
    // Same choice as the main card: card YAML, then the skin of the room shown, then the shared skin.
    const sel0 = hubs.find((h) => h.id === this._hubSel);
    const skin = skinKey(this._config.skin || d?.roomSkins?.[sel0?.id] || d?.skin || "homebase");
    const glassBg = ["dark", "carbon", "alu", "board"].includes(this._config.glass_bg) ? this._config.glass_bg : ["dark", "carbon", "alu", "board"].includes(d?.glassBg) ? d.glassBg : "dark";
    const glassLook = ["a", "b", "c"].includes(this._config.glass_look) ? this._config.glass_look : ["a", "b", "c"].includes(d?.glassLook) ? d.glassLook : "c";
    const vars = Object.entries({ ...SKINS[skin], ...(this._config.skin_vars || {}) }).map(([k, v]) => `${k}:${v}`).join(";");
    const sel = hubs.find((h) => h.id === this._hubSel);
    const tabs = hubs.length > 1 ? `<div class="hubtabs">${hubs.map((h) => `<button class="${h.id === this._hubSel ? "sel" : ""} ${h.effective ? "live" : ""}" data-hubtab="${esc(h.id)}"><span class="ico"><ha-icon icon="${h.effective ? "mdi:lock" : roomIcon(h.name)}"></ha-icon></span><span class="rn">${esc(h.name)}</span></button>`).join("")}</div>` : "";
    const body = !d ? `<p class="empty">…</p>`
      : d.available === false ? `<p class="empty">${esc(t.sec.notAvailable)}</p>`
      : !sel ? `<p class="empty">${esc(t.sec.noHubs)}</p>`
      : this._hubHtml(sel, t);
    const keep = this._scrollKeep();
    this.shadowRoot.innerHTML = `${styleMixin._style.call({ _config: {} })}${securityStyle}
      <ha-card style="${esc(vars)}" data-skin="${esc(skin)}" class="gl-${glassLook} gb-${glassBg} sec g-see ks-skin lay-narrow as-ring hl-auto">
        <div class="sechead"><ha-icon icon="mdi:shield-lock-outline"></ha-icon><b>${esc(this._config.title || t.sec.title)}</b>${sel && hubs.length < 2 ? `<span>${esc(sel.name)}</span>` : ""}</div>
        ${tabs}${body}
      </ha-card>`;
    this._bind();
    keep();
  },

  // Keeps the scroll position of the page over a re-render.
  _scrollKeep() {
    const els = new Set([document.scrollingElement]);
    let n = this;
    while (n) { if (n.scrollHeight > n.clientHeight + 1) els.add(n); n = n.parentElement || n.getRootNode?.().host || null; }
    const saved = [...els].filter(Boolean).map((e) => [e, e.scrollTop]);
    return () => saved.forEach(([e, y]) => { if (Math.abs(e.scrollTop - y) > 1) e.scrollTop = y; });
  },

  _hubHtml(h, t) {
    const s = t.sec;
    const admin = this._admin();
    const dis = admin ? "" : "disabled";
    const open = (k, def = false) => ((this._open?.[k] ?? def) ? "open" : "");
    return `<section>
      ${this._stateHtml(h, s)}
      ${admin ? "" : `<div class="ehint secnote"><ha-icon icon="mdi:lock-outline"></ha-icon><span>${esc(s.readOnly)}</span></div>`}
      ${this._error ? `<div class="ehint secnote err"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${esc(this._error)}</span></div>` : ""}
      <div class="esec"><div class="etitle">${esc(s.mode)}</div>
        <div class="favkind">${["off", "always", "schedule"].map((m) => `<button class="${h.mode === m ? "sel" : ""}" data-mode="${m}" ${dis}><ha-icon icon="${{ off: "mdi:lock-open-variant-outline", always: "mdi:lock", schedule: "mdi:calendar-clock" }[m]}"></ha-icon><span>${esc(s.modes[m])}</span></button>`).join("")}</div></div>
      ${this._testHtml(h, s, t)}
      ${this._releaseHtml(h, s, dis)}
      <details class="esec" data-open="acts" ${open("acts", true)}><summary class="etitle">${esc(s.acts)} · ${h.activities.filter((a) => h.all_activities.includes(a)).length}/${h.all_activities.length}</summary>${this._actsHtml(h, s, dis)}</details>
      <details class="esec" data-open="apps" ${open("apps", true)}><summary class="etitle">${esc(s.apps)}${h.app_device ? ` · ${esc(h.app_device)}` : ""}</summary>${this._appsHtml(h, t, dis)}</details>
      ${admin ? `<details class="esec" data-open="dbg" ${open("dbg", false)}><summary class="etitle">${esc(s.dbg)}</summary>${this._debugHtml(h, s)}</details>` : ""}
      <details class="esec" data-open="offdev" ${open("offdev", false)}><summary class="etitle">${esc(s.offDev)} · ${(h.off_devices || []).length}</summary>${this._offDevHtml(h, s, dis)}</details>
      <details class="esec" data-open="schedule" ${open("schedule", h.mode === "schedule")}><summary class="etitle">${esc(s.schedule)} · ${h.schedule.length}</summary>${this._scheduleHtml(h, s, dis)}</details>
      <details class="esec" data-open="log" ${open("log", true)}><summary class="etitle">${esc(s.log)} · ${h.log.length}</summary>${this._logHtml(h, t, admin)}</details>
      <div class="ehint">${esc(s.entities)}</div>
    </section>`;
  },

  _stateHtml(h, s) {
    const kind = h.effective ? "on" : h.released_until ? "free" : h.mode === "off" ? "off" : "idle";
    const text = { on: s.stateOn, free: fmtText(s.stateFree, [time(h.released_until)]), off: s.stateOff, idle: s.stateIdle }[kind];
    const icon = { on: "mdi:lock", free: "mdi:lock-clock", off: "mdi:lock-open-variant-outline", idle: "mdi:calendar-clock" }[kind];
    return `<div class="secstate s-${kind}"><ha-icon icon="${icon}"></ha-icon><b>${esc(text)}</b><span>${esc(fmtText(s.today, [h.today]))}</span></div>`;
  },

  // Test: what the lock would switch off right now (nothing is switched off).
  _testHtml(h, s, t) {
    const r = this._testRes?.[h.id];
    let msg = "";
    if (r) {
      const app = r.fire_app ? appLabel(r.fire_app, t, h.app_names || {}) : "";
      const seen = fmtText(s.testSeen, [r.activity && r.activity !== "PowerOff" ? r.activity : s.testNone, !r.has_fire ? s.testNoFire : app || r.fire_state || s.testNone]);
      const verdict = !r.effective ? s.testOff : [r.activity_blocked ? fmtText(s.testHub, [r.activity]) : "", r.fire_blocked ? fmtText(s.testFire, [app || r.fire_state]) : ""].filter(Boolean).join(" ") || s.testClean;
      msg = `<div class="ehint sectest ${r.effective && (r.activity_blocked || r.fire_blocked) ? "warn" : ""}"><b>${esc(verdict)}</b><br>${esc(seen)}</div>`;
    }
    return `<div class="esec"><div class="secrel"><button class="pbtn" data-test><ha-icon icon="mdi:shield-search"></ha-icon><span>${esc(s.testBtn)}</span></button><span class="ehint">${esc(s.testHint)}</span></div>${msg}</div>`;
  },

  _releaseHtml(h, s, dis) {
    const choices = [...new Set([...RELEASE_CHOICES, h.minutes])].sort((a, b) => a - b);
    const off = h.mode === "off";
    return `<div class="esec"><div class="etitle">${esc(s.release)}</div>
      <div class="secrel"><select data-minutes ${dis}>${choices.map((m) => `<option value="${m}" ${m === h.minutes ? "selected" : ""}>${esc(fmtText(s.minutes, [m]))}</option>`).join("")}</select>
        ${h.released_until
          ? `<button class="pbtn pri" data-release-end ${dis}><ha-icon icon="mdi:lock"></ha-icon><span>${esc(s.releaseEnd)}</span></button>`
          : `<button class="pbtn pri" data-release ${dis || (off ? "disabled" : "")}><ha-icon icon="mdi:lock-clock"></ha-icon><span>${esc(s.releaseBtn)}</span></button>`}</div>
      <div class="ehint">${esc(s.releaseHint)}</div></div>`;
  },

  _actsHtml(h, s, dis) {
    if (!h.all_activities.length) return `<div class="ehint">${esc(s.actsNone)}</div>`;
    const on = new Set(h.activities);
    return `<div class="ehint">${esc(s.actsHint)}</div><div class="chipbox">${h.all_activities.map((a) => `<label class="fchip"><input type="checkbox" data-allow-act="${esc(a)}" ${on.has(a) ? "checked" : ""} ${dis}><span><ha-icon icon="${esc(h.activity_icons?.[a] || activityIcon(a))}"></ha-icon>${esc(a)}</span></label>`).join("")}</div>`;
  },

  // Apps to offer: built-in list, what the device has installed, what is allowed already and what runs now.
  _appList(h, t) {
    const own = h.app_names || {};
    const installed = this._data?.packages?.[h.fire_entity]?.list || [];
    const now = this._hass.states?.[h.fire_entity]?.attributes?.app_id || "";
    const all = [...new Set([...knownPackages(), ...installed, ...(h.seen || []), ...h.apps, ...(now ? [now] : [])])].filter((p) => p !== LAUNCHER);
    // Confirmed = installed (read from the device) or seen running on the Fire TV; the others are dimmed.
    const seen = h.seen || [];
    return all.map((pkg) => ({ pkg, name: appLabel(pkg, t, own), installed: installed.includes(pkg) || seen.includes(pkg) })).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  },

  _appsHtml(h, t, dis) {
    const s = t.sec;
    if (!h.fire_entity) return `<div class="ehint">${esc(s.noFire)}</div>`;
    const st = this._hass.states?.[h.fire_entity];
    const now = st && !["off", "standby", "unavailable", "unknown"].includes(st.state) ? st.attributes?.app_id : "";
    const on = new Set(h.apps);
    const cache = this._data?.packages?.[h.fire_entity];
    const msg = this._appsMsg?.[h.fire_entity];
    // The start screen comes first; without it the other apps cannot be allowed (the integration clears them).
    const home = on.has(LAUNCHER);
    const launcher = `<label class="fchip seclauncher" title="${esc(LAUNCHER)}"><input type="checkbox" data-allow-app="${esc(LAUNCHER)}" data-launcher ${home ? "checked" : ""} ${dis}><span><ha-icon icon="mdi:home-outline"></ha-icon>${esc(appLabel(LAUNCHER, t, h.app_names || {}))}</span></label>`;
    const chips = launcher + this._appList(h, t).map((a) => `<label class="fchip ${a.installed ? "" : "noinst"}" title="${esc(a.pkg)}"><input type="checkbox" data-allow-app="${esc(a.pkg)}" ${on.has(a.pkg) ? "checked" : ""} ${dis || (home ? "" : "disabled")}><span>${esc(a.name)}</span></label>`).join("");
    return `<div class="ehint">${esc(s.appsHint)}</div>
      ${now ? `<div class="secnow"><ha-icon icon="mdi:television-play"></ha-icon><span>${esc(fmtText(s.fireNow, [appLabel(now, t, h.app_names || {})]))}</span></div>` : ""}
      <div class="chipbox">${chips}</div>
      ${home ? "" : `<div class="ehint secnote err"><ha-icon icon="mdi:home-off-outline"></ha-icon><span>${esc(s.launcherOff)}</span></div>`}
      <div class="ehint seclegend"><span class="lc">${esc(s.legendOn)}</span> ${esc(s.legendInstalled)} <span class="lc off">${esc(s.legendOff)}</span> ${esc(s.legendMissing)}</div>
      <div class="secrel"><button class="pbtn" data-read-apps="${esc(h.fire_entity)}" ${dis}><ha-icon icon="mdi:package-variant"></ha-icon><span>${esc(t.pkgRead)}</span></button><span class="ehint">${esc(msg || (cache?.at ? fmtText(s.appsRead, [dayTime(cache.at)]) : s.appsNever))}</span></div>`;
  },

  // Debug (administrators): the real package names, to copy into the allowed apps or the app table.
  _debugHtml(h, s) {
    if (!h.fire_entity) return `<div class="ehint">${esc(s.noFire)}</div>`;
    const st = this._hass.states?.[h.fire_entity];
    const now = st && !["off", "standby", "unavailable", "unknown"].includes(st.state) ? st.attributes?.app_id || "" : "";
    const all = this._data?.packages?.[h.fire_entity]?.all || this._data?.packages?.[h.fire_entity]?.list || [];
    const row = (pkg) => `<div class="secpkg" data-pkg="${esc(pkg)}"><code>${esc(pkg)}</code><button class="pbtn" data-copy="${esc(pkg)}" title="${esc(s.dbgCopy)}"><ha-icon icon="mdi:content-copy"></ha-icon></button></div>`;
    return `<div class="ehint">${esc(s.dbgHint)}</div>
      <div class="secnow"><ha-icon icon="mdi:television-play"></ha-icon><span>${esc(s.dbgNow)}:</span>${now ? row(now) : `<span>${esc(s.dbgNowNone)}</span>`}</div>
      <div class="etitle">${esc(fmtText(s.dbgAll, [all.length]))}</div>
      ${all.length ? `<input class="secsearch" type="search" data-pkg-search placeholder="${esc(s.dbgSearch)}"><div class="secpkgs">${all.map(row).join("")}</div>` : `<div class="ehint">${esc(s.dbgNoList)}</div>`}`;
  },

  // Symbol of an app (from the table of known apps), empty if unknown.
  _appIcon(pkg) { return FIRE_APPS.find((a) => appPackage(a.cmd) === pkg)?.icon || ""; },

  // Devices that the lock also switches off when it switches off the Fire TV (PowerOff over the hub).
  _offDevHtml(h, s, dis) {
    if (!h.fire_entity) return `<div class="ehint">${esc(s.noFire)}</div>`;
    if (!h.power_devices?.length) return `<div class="ehint">${esc(s.offDevNone)}</div>`;
    const on = new Set(h.off_devices || []);
    return `<div class="ehint">${esc(s.offDevHint)}</div><div class="chipbox">${h.power_devices.map((d) => `<label class="fchip"><input type="checkbox" data-off-dev="${esc(d)}" ${on.has(d) ? "checked" : ""} ${dis}><span><ha-icon icon="mdi:power"></ha-icon>${esc(d)}</span></label>`).join("")}</div>`;
  },

  _scheduleHtml(h, s, dis) {
    const rows = h.schedule.map((w, i) => `<div class="secwin" data-win="${i}">
        <div class="secdays">${s.days.map((d, n) => `<label class="fchip"><input type="checkbox" data-day="${n}" ${w.days.includes(n) ? "checked" : ""} ${dis}><span>${esc(d)}</span></label>`).join("")}</div>
        <div class="sectimes"><label><span>${esc(s.from)}</span><input type="time" data-from value="${esc(w.from)}" ${dis}></label><label><span>${esc(s.to)}</span><input type="time" data-to value="${esc(w.to)}" ${dis}></label>
          <button class="pbtn" data-win-del="${i}" title="${esc(s.removeWindow)}" ${dis}><ha-icon icon="mdi:delete-outline"></ha-icon></button></div></div>`).join("");
    return `<div class="ehint">${esc(s.scheduleHint)}</div>${rows || `<div class="ehint">${esc(s.scheduleEmpty)}</div>`}
      <div class="secrel"><button class="pbtn" data-win-add ${dis}><ha-icon icon="mdi:plus"></ha-icon><span>${esc(s.addWindow)}</span></button></div>`;
  },

  _logHtml(h, t, admin) {
    const s = t.sec;
    if (!h.log.length) return `<div class="ehint">${esc(s.logEmpty)}</div>`;
    const all = [...h.log].reverse();
    const max = Math.max(1, Number(this._config.log_rows) || 12);
    const shown = this._logAll ? all : all.slice(0, max);
    const allowedApps = new Set(h.apps), allowedActs = new Set(h.activities);
    const rows = shown.map((e) => {
      const sep = e.kind === "on" || e.kind === "off" || e.kind === "release";
      const what = e.kind === "fire" ? (e.what ? appLabel(e.what, t, h.app_names || {}) : s.unknownApp) : e.kind === "release" ? e.what : e.kind === "hub" ? e.what : "";
      const text = fmtText(s.kinds[e.kind] || e.kind, [what]) + (sep && e.kind !== "release" && s.reasons[e.what] ? ` (${s.reasons[e.what]})` : "");
      const icon = e.kind === "hub" && e.what ? (h.activity_icons?.[e.what] || activityIcon(e.what))
        : e.kind === "fire" && e.what ? (this._appIcon(e.what) || "mdi:television-play")
        : { on: "mdi:lock", off: "mdi:lock-open-variant-outline", release: "mdi:lock-clock", hub: "mdi:remote", fire: "mdi:television-play" }[e.kind] || "mdi:circle-small";
      const can = admin && ((e.kind === "fire" && e.what && !allowedApps.has(e.what)) || (e.kind === "hub" && e.what && !allowedActs.has(e.what) && h.all_activities.includes(e.what)));
      const btn = can ? `<button class="pbtn" data-allow-${e.kind === "fire" ? "pkg" : "name"}="${esc(e.what)}">${esc(s.allow)}</button>` : "";
      return `<div class="seclog ${sep ? "sep" : ""} k-${esc(e.kind)}" ${e.kind === "fire" && e.what ? `title="${esc(e.what)}"` : ""}><time>${esc(dayTime(e.at))}</time><ha-icon icon="${icon}"></ha-icon><span>${esc(text)}</span>${btn}</div>`;
    }).join("");
    const more = all.length > max ? `<button class="pbtn" data-log-all>${esc(this._logAll ? s.logLess : fmtText(s.logAll, [all.length]))}</button>` : "";
    return `<div class="ehint">${esc(s.logHint)}</div><div class="secloglist">${rows}</div>
      <div class="secrel">${more}${admin ? `<button class="pbtn" data-log-clear><ha-icon icon="mdi:delete-sweep-outline"></ha-icon><span>${esc(s.logClear)}</span></button>` : ""}</div>`;
  },
};
