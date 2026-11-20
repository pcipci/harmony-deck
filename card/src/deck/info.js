// Info panel of a hub, diagnostics line and the legend.
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

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
    const errs = this._info?.diagnostics?.errors || [];
    if (errs.length) out.push({ sev: "r", key: "diag", html: `<div class="hint-row r"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${esc(errs.join("; "))}</span></div>` });
    for (const l of this._linkHints(h, t)) out.push({ sev: "o", key: `link:${l.key}`, html: l.html });
    (this._mm?.[h.id] || []).forEach((it, i) => out.push({ sev: "o", key: `mm:${it.device}:${it.kind}:${it.want}`, html: this._mmRow(h, it, i, t) }));
    return out;
  },

  // The gear: always in the same place; it takes the colour of the most serious hint, pulses while there is something unseen and shows the count.
  _gearBtn(h, t) {
    const hints = this._hintsOf(h, t);
    const sev = hints.some((x) => x.sev === "r") ? "r" : hints.some((x) => x.sev === "o") ? "o" : hints.length ? "b" : "";
    const sig = hints.map((x) => x.key).join("|");
    const fresh = sev && this._hintSeen?.[h.id] !== sig;
    const tip = hints.length ? fmtText(t.hintsTip, [hints.length]) : t.menuTitle;
    return `<button class="ib gear ${sev ? `sev-${sev}` : ""} ${fresh ? "fresh" : ""} ${this._menuOpen?.[h.id] ? "sel" : ""}" data-menu="${esc(h.id)}" data-sig="${esc(sig)}" title="${esc(tip)}" aria-label="${esc(tip)}"><ha-icon icon="mdi:cog-outline"></ha-icon>${hints.length ? `<i class="gbadge">${hints.length}</i>` : ""}</button>`;
  },

  // Window under the gear: hints with their action on top, below always the way to settings (admins).
  _menuHtml(h, t) {
    if (!this._menuOpen?.[h.id] || this._edit) return "";
    const hints = this._hintsOf(h, t);
    const admin = this._hass?.user?.is_admin !== false;
    const entries = admin ? `<div class="mentries">
        <button class="mentry" data-edit="settings"><ha-icon icon="mdi:cog-outline"></ha-icon><span>${esc(t.editSettings)}</span></button>
        <button class="mentry" data-edit="favs"><ha-icon icon="mdi:star-outline"></ha-icon><span>${esc(t.editFavs)}</span></button>
        <button class="mentry" data-edit="actions"><ha-icon icon="mdi:flash"></ha-icon><span>${esc(t.actions)}</span></button>
        <button class="mentry" data-edit="settings" data-goetab="info"><ha-icon icon="mdi:information-outline"></ha-icon><span>${esc(t.menuInfo)}</span></button></div>` : "";
    const list = hints.length ? `<div class="mhints">${hints.map((x) => x.html).join("")}</div>` : (admin ? "" : `<div class="mnone">${esc(t.noHints)}</div>`);
    return `<div class="hmenu" data-hmenu="${esc(h.id)}">${list}${entries}</div>`;
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
    const hubs = `<div class="esec infobox" data-t="info"><div class="etitle">${t.hubsTitle}</div>${this._hubs().map((h) => this._hubInfoHtml(h, t)).join("")}</div>`;
    return `${hubs}<div class="esec infobox" data-t="info"><div class="etitle">${t.statusTitle}</div><div class="sgrid">${grid}</div>
        <div class="ehint sexpl">${open ? `<b>${esc(open.title)}</b> ${esc(open.text)}` : esc(t.statusHint)}</div></div>
      <details class="esec infobox" data-t="info"><summary class="etitle">${t.infoTitle}</summary>${items.map((x) => `<div class="infoitem"><ha-icon icon="${esc(x.icon || "mdi:information-outline")}"></ha-icon><div><b>${esc(x.title)}</b><div>${esc(x.text)}</div></div></div>`).join("")}</details>`;
  },

  // Events of the info panel and the legend.
  _bindInfo(root) {
    root.querySelectorAll("[data-menu]").forEach((b) => b.addEventListener("click", () => {
      const hub = b.dataset.menu;
      const open = !this._menuOpen?.[hub];
      this._menuOpen = { [hub]: open };
      if (open) this._hintSeen = { ...(this._hintSeen || {}), [hub]: b.dataset.sig };
      this._rerender();
    }));
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
