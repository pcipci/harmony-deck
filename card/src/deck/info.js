// Info panel of a hub, diagnostics line and the legend.
import { PLATFORMS } from "../shared/platforms.js";
import { VERSION } from "../shared/version.js";
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";
import { prettyCommand } from "../shared/commands.js";

export const infoMixin = {
  _diagText(t) {
    const d = this._info?.diagnostics;
    if (!d) return t.noIntegration;
    const errs = (d.errors || []).map(esc).join("; ");
    return `${t.hubConfig}: ${d.readable} / ${d.entries}${errs ? ` · ${errs}` : ""}`;
  },

  // Technical data of one hub, in Settings › Info (0.16: no longer a panel on the card). Folded; a hub that is down opens by itself.
  _hubInfoHtml(h, t) {
    const meta = this._info?.hubs?.[h.id]?.meta || {};
    const st = this._hass?.states?.[h.id];
    const a = st?.attributes || {};
    const fmt = (iso) => { const d = new Date(iso); if (isNaN(d)) return null; const today = new Date().toDateString() === d.toDateString();
      const tm = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      return today ? tm : `${d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" })} ${tm}`; };
    const down = st?.state === "unavailable";
    const r0 = this._roles(h.id, a.current_activity);
    const setup = (this._info?.hubs?.[h.id]?.setup?.[a.current_activity] || []).map((x) => x.device);
    const inUse = st?.state === "on" && a.current_activity ? new Set([r0.volume, r0.nav, r0.channel, ...setup].filter(Boolean)).size : 0;
    const rows = [
      [down ? t.infoDownSince : t.infoSince, st?.last_changed ? fmt(st.last_changed) : null],
      [t.infoActive, inUse ? String(inUse) : null],
      [t.infoConn, meta.host ? `${t.infoLocal}` : null],
      [t.infoIp, meta.host],
      [t.infoFw, meta.firmware],
      [t.infoMac, (meta.macs || []).join(", ") || null],
      [t.infoCounts, `${(a.activity_list || []).filter((n) => n !== "PowerOff").length} / ${(a.devices_list || []).length}`],
      [t.infoState, st ? (st.state === "unavailable" ? t.unavailable : st.state === "on" ? t.on : t.off_) : null],
      [t.infoLast, a.last_activity],
      [t.infoEntity, h.id],
    ].filter(([, v]) => v);
    const head = `<summary class="infohead"><i class="sdot ${down ? "bad" : "ok"}"></i><b>${esc(h.name)}</b><span>${esc([meta.manufacturer, meta.model].filter(Boolean).join(" "))}</span></summary>`;
    const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
    return `<details class="infopanel hubinfo" ${down ? "open" : ""}>${head}${rows.map(([k, v]) => `<div class="irow"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}<div class="infoedits"><button class="infoedit" data-copyinfo="${esc(text)}"><ha-icon icon="mdi:content-copy"></ha-icon><span>${esc(t.copy)}</span></button></div></details>`;
  },

  // Hints of a hub, most serious first: r = error, o = difference to fix, b = notice. Shown in the window of the gear button.
  _hintsOf(h, t) {
    if (this._edit) return [];
    const out = [];
    const st = this._hass?.states?.[h.id];
    if (st?.state === "unavailable") {
      const d = new Date(st.last_changed);
      const tm = isNaN(d) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
      out.push({ sev: "r", key: "down", html: `<div class="hint-row r"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${esc(fmtText(t.hintDown, [h.name, tm]))}</span></div>` });
    }
    const iv = this._info?.version;
    if (iv && iv !== VERSION) out.push({ sev: "o", key: `stale:${iv}`, html: `<div class="hint-row o"><ha-icon icon="mdi:update"></ha-icon><span>${esc(fmtText(t.hintStale, [VERSION, iv]))}</span><button type="button" data-reload>${esc(t.hintReload)}</button></div>` });
    const errs = this._info?.diagnostics?.errors || [];
    if (errs.length) out.push({ sev: "r", key: "diag", html: `<div class="hint-row r"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${esc(errs.join("; "))}</span></div>` });
    for (const l of this._linkHints(h, t)) out.push({ sev: "o", key: `link:${l.key}`, html: l.html });
    (this._mm?.[h.id] || []).forEach((it, i) => out.push({ sev: it.quiet ? "q" : "o", key: `mm:${it.device}:${it.kind}:${it.want}`, html: this._mmRow(h, it, i, t) }));
    return out;
  },

  // The gear: always in the same place; it takes the colour of the most serious hint, pulses while there is something unseen and shows the count.
  // Quiet notes (sev "q") are only listed in the window, they neither colour nor count.
  _gearBtn(h, t) {
    const hints = this._hintsOf(h, t).filter((x) => x.sev !== "q");
    const sev = hints.some((x) => x.sev === "r") ? "r" : hints.some((x) => x.sev === "o") ? "o" : hints.length ? "b" : "";
    const sig = hints.map((x) => x.key).join("|");
    const fresh = sev && this._hintSeen?.[h.id] !== sig;
    const tip = hints.length ? fmtText(t.hintsTip, [hints.length]) : t.menuTitle;
    return `<button class="ib gear ${sev ? `sev-${sev}` : ""} ${fresh ? "fresh" : ""} ${this._menuOpen?.[h.id] ? "sel" : ""}" data-menu="${esc(h.id)}" data-sig="${esc(sig)}" title="${esc(tip)}" aria-label="${esc(tip)}"><ha-icon icon="mdi:cog-outline"></ha-icon>${hints.length ? `<i class="gbadge">${hints.length}</i>` : ""}</button>`;
  },

  // Window under the gear: hints with their action on top, below always the way to settings (admins).
  // One window for gear, help and profile: at most one is open; the same symbol closes it, another symbol switches.
  _winKind(hub) { return this._menuOpen?.[hub] ? "menu" : this._helpOpen?.[hub] ? "help" : this._profOpen?.[hub] ? "prof" : null; },
  _winSet(hub, kind) {
    this._menuOpen = kind === "menu" ? { [hub]: true } : {};
    this._helpOpen = { ...(this._helpOpen || {}), [hub]: kind === "help" };
    this._profOpen = kind === "prof" ? { [hub]: true } : {};
  },
  _winToggle(hub, kind) { this._winSet(hub, this._winKind(hub) === kind ? null : kind); },

  // The common frame (title, close, scrolling body) around the three windows.
  _winHtml(h, t, helpAct) {
    if (this._edit) return "";
    const kind = this._winKind(h.id);
    if (!kind) return "";
    let body = "", title = "";
    if (kind === "menu") { title = t.menuTitle; body = this._menuBody(h, t); }
    else if (kind === "help") { if (!helpAct) return ""; title = t.helpTitle; body = this._helpHtml(h, helpAct, t); }
    else { title = t.profLabel; body = this._profList(t); }
    return `<div class="hmenu win" data-hmenu="${esc(h.id)}" data-kind="${kind}"><div class="whead"><span class="wtitle">${esc(title)}</span><button type="button" class="ib wclose" data-winclose="${esc(h.id)}" title="${esc(t.winClose)}"><ha-icon icon="mdi:close"></ha-icon></button></div><div class="wbody">${body}</div></div>`;
  },

  _menuBody(h, t) {
    const hints = this._hintsOf(h, t);
    const admin = this._hass?.user?.is_admin !== false;
    const entries = admin ? `<div class="mentries">
        <button class="mentry" data-edit="settings"><ha-icon icon="mdi:cog-outline"></ha-icon><span>${esc(t.editSettings)}</span></button>
        <button class="mentry" data-edit="favs"><ha-icon icon="mdi:star-outline"></ha-icon><span>${esc(t.editFavs)}</span></button>
        <button class="mentry" data-edit="actions"><ha-icon icon="mdi:flash"></ha-icon><span>${esc(t.actions)}</span></button>
        <button class="mentry" data-edit="info"><ha-icon icon="mdi:information-outline"></ha-icon><span>${esc(t.menuInfo)}</span></button></div>` : "";
    const list = hints.length ? `<div class="mhints">${hints.map((x) => x.html).join("")}</div>` : (admin ? "" : `<div class="mnone">${esc(t.noHints)}</div>`);
    return `${list}${entries}`;
  },

  _legendHtml(t) {
    const items = Array.isArray(t.legend) ? t.legend : [];
    const sample = (kind) => ({
      lamp: '<i class="sdot lit"></i>', busy: '<i class="sdot lit busy"></i>',
      playing: '<i class="fdot f-playing"><ha-icon icon="mdi:television-play"></ha-icon></i>', on: '<i class="fdot f-on"><ha-icon icon="mdi:television"></ha-icon></i>',
      unknown: '<i class="fdot f-unknown"><ha-icon icon="mdi:television-off"></ha-icon></i>', link: '<ha-icon icon="mdi:link-variant"></ha-icon>', lock: '<ha-icon icon="mdi:lock"></ha-icon>',
      room: '<span class="ico lit"><ha-icon icon="mdi:sofa"></ha-icon></span>',
    }[kind] || "");
    const status = Array.isArray(t.statusLegend) ? t.statusLegend : [];
    const open = status[this._statusOpen];
    const grid = status.map((x, n) => `<button class="sbtn ${n === this._statusOpen ? "sel" : ""}" data-status="${n}"><span class="sample">${sample(x.kind)}</span><span>${esc(x.short || x.title)}</span></button>`).join("");
    const hubs = `<div class="esec infobox"><div class="etitle">${t.hubsTitle}</div>${this._hubs().map((h) => this._hubInfoHtml(h, t)).join("")}</div>`;
    return `${hubs}<div class="esec infobox"><div class="etitle">${t.statusTitle}</div><div class="sgrid">${grid}</div>
        <div class="ehint sexpl">${open ? `<b>${esc(open.title)}</b> ${esc(open.text)}` : esc(t.statusHint)}</div></div>
      <details class="esec infobox"><summary class="etitle">${t.infoTitle}</summary>${items.map((x) => `<div class="infoitem"><ha-icon icon="${esc(x.icon || "mdi:information-outline")}"></ha-icon><div><b>${esc(x.title)}</b><div>${esc(x.text)}</div></div></div>`).join("")}</details>`;
  },

  // Network devices linked to Harmony devices as a table (narrow: one card per device with labelled lines).
  _netInfoHtml(t) {
    if (!this._dd) { this._ddLoad(); return `<div class="esec infobox"><div class="etitle">${t.netTitle}</div><div class="ehint">${t.ddLoading}</div></div>`; }
    const stName = (on) => (on === true ? t.ddOn : on === false ? t.ddOff : t.ddUnknown);
    const rows = [];
    for (const h of this._hubs()) {
      for (const [dev, item] of Object.entries(this._dd.hubs?.[h.id] || {})) {
        if (!item.entity) continue;
        const live = this._hass.states?.[item.entity];
        const on = live && !["unavailable", "unknown"].includes(live.state) ? live.state !== "off" && live.state !== "standby" : null;
        const caps = (item.caps || []).map((c) => t.ddCapName?.[c] || c);
        const when = live?.last_changed ? new Date(live.last_changed) : null;
        const last = when && !isNaN(when) ? (new Date().toDateString() === when.toDateString() ? when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : `${when.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" })} ${when.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`) : null;
        // Like a hub: one folded line (state dot, symbol, name, platform); unfolded it lists the properties.
        const lines = [
          [t.netColPlatform, item.platform ? PLATFORMS[item.platform] || item.platform : "–"],
          [t.netColAddress, item.host || "–"],
          [t.netColState, stName(on)],
          [t.netColCaps, caps.length ? caps.join(", ") : t.ddCanNot],
          [t.infoLast, last],
          [t.infoEntity, item.entity],
          ...(this._hubs().length > 1 ? [[t.hubsTitle, h.name]] : []),
        ].filter(([, v]) => v);
        const head = `<summary class="infohead"><i class="sdot ${on === true ? "ok" : ""}"></i><ha-icon icon="${this._deviceIcon(dev, h.id)}"></ha-icon><b>${esc(dev)}</b><span>${esc(item.platform ? PLATFORMS[item.platform] || item.platform : "")}</span></summary>`;
        rows.push(`<details class="infopanel hubinfo netdev">${head}${lines.map(([k, v]) => `<div class="irow"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}</details>`);
      }
    }
    return `<div class="esec infobox"><div class="etitle">${t.netTitle}</div>${rows.length ? rows.join("") : `<div class="ehint">${t.netNone}</div>`}</div>`;
  },

  // Which keys of the running activity go straight to the device and which over Harmony (same decision as _sendCmd).
  _keyMapHtml(h, t) {
    const cur = h.current && h.current !== "PowerOff" ? h.current : null;
    const act = cur || ((this._fireInfo(h.id)?.mode === "on" || this._fireInfo(h.id)?.mode === "playing") ? this._fireActivity(h) : null);
    if (!act) return `<div class="esec infobox"><div class="etitle">${t.kbTitle}</div><div class="ehint">${t.kbNone}</div></div>`;
    const probe = ["PowerOff", "Mute", "VolumeUp", "VolumeDown", "Play", "Pause", "Stop"];
    const devices = this._devicesOf(h.id);
    const rows = this._setupOf(h, act).map((it) => {
      const cmds = devices[it.device] || [];
      const norm = (x) => String(x).toLowerCase();
      const direct = probe.filter((c) => cmds.some((x) => norm(x) === norm(c)) && this._directRoute(h.id, it.device, cmds.find((x) => norm(x) === norm(c))));
      const fire = this._linkedFire(h.id, it.device);
      const link = this._settings().directDevices?.[h.id]?.[it.device];
      const reach = this._reach(h.id, it.device);
      const chips = direct.map((c) => `<span class="kbchip"><ha-icon icon="mdi:lan-connect"></ha-icon>${esc(prettyCommand(c))}</span>`).join("") + (fire ? `<span class="kbchip"><ha-icon icon="mdi:lan-connect"></ha-icon>${esc(t.kbFire)}</span>` : "");
      const note = !link ? t.kbNoLink : !reach ? t.kbDown : "";
      const cell = (label, v) => `<td data-l="${esc(label)}">${v}</td>`;
      return `<tr>${cell(t.kbDev, `<b>${esc(it.device)}</b>`)}${cell(t.kbDirect, chips || `<span class="kbnone">${esc(note || t.kbNothing)}</span>`)}${cell(t.kbHarmony, esc(direct.length || fire ? t.kbRest : t.kbAll))}</tr>`;
    });
    const head = [t.kbDev, t.kbDirect, t.kbHarmony].map((x) => `<th>${esc(x)}</th>`).join("");
    return `<div class="esec infobox"><div class="etitle">${t.kbTitle}: ${esc(act)}</div>${rows.length ? `<table class="nettab"><thead><tr>${head}</tr></thead><tbody>${rows.join("")}</tbody></table>` : `<div class="ehint">${t.kbNone}</div>`}<div class="ehint">${t.kbOn}</div></div>`;
  },

  // The Info area (own view of the gear menu): hubs, network devices, status symbols, explanations, raw data.
  _infoArea(h, t) {
    const raw = `<details class="esec raw infobox"><summary class="etitle">${t.raw}</summary><button class="hlink copyraw" data-copyraw><ha-icon icon="mdi:content-copy"></ha-icon><span>${t.copy}</span></button><pre>${esc(JSON.stringify({ commandSource: this._info?.hubs?.[h.id]?.commandSource || "live", setup: this._info?.hubs?.[h.id]?.setup || {}, fixit: this._info?.hubs?.[h.id]?.fixit || {}, roles: this._info?.hubs?.[h.id]?.activities || {} }, null, 1))}</pre></details>
      <div class="ehint">${this._diagText(t)}</div>`;
    return `${this._legendHtml(t)}${this._keyMapHtml(h, t)}${this._netInfoHtml(t)}${raw}`;
  },

  // Events of the info panel and the legend.
  _bindInfo(root) {
    root.querySelectorAll("[data-menu]").forEach((b) => b.addEventListener("click", () => {
      const hub = b.dataset.menu;
      this._winToggle(hub, "menu");
      const open = !!this._menuOpen?.[hub];
      if (open) this._hintSeen = { ...(this._hintSeen || {}), [hub]: b.dataset.sig };
      this._rerender();
    }));
    root.querySelectorAll("[data-reload]").forEach((b) => b.addEventListener("click", () => window.location.reload()));
    root.querySelectorAll("[data-winclose]").forEach((b) => b.addEventListener("click", () => { this._winSet(b.dataset.winclose, null); this._rerender(); }));
    root.querySelectorAll("[data-copyinfo]").forEach((b) => b.addEventListener("click", async (e) => {
      e.preventDefault();
      let ok = false;
      try { await navigator.clipboard.writeText(b.dataset.copyinfo); ok = true; } catch (err) { ok = false; }
      b.querySelector("span").textContent = ok ? this._t().copied : this._t().copyFailed;
    }));
    root.querySelectorAll("[data-copyraw]").forEach((b) => b.addEventListener("click", async () => {
      const text = b.parentElement.querySelector("pre")?.textContent || "";
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
        const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand("copy"); } catch (e2) { /* no clipboard */ } ta.remove();
      }
      b.querySelector("span").textContent = ok ? this._t().copied : this._t().copyFailed;
    }));
    root.querySelectorAll("[data-status]").forEach((b) => b.addEventListener("click", () => { const n = Number(b.dataset.status); this._statusOpen = this._statusOpen === n ? -1 : n; this._rerender(); }));
  },
};
