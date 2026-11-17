// Info panel of a hub, diagnostics line and the legend.
import { esc } from "../shared/util.js";

export const infoMixin = {
  _diagText(t) {
    const d = this._info?.diagnostics;
    if (!d) return t.noIntegration;
    const errs = (d.errors || []).map(esc).join("; ");
    return `${t.hubConfig}: ${d.readable} / ${d.entries}${errs ? ` · ${errs}` : ""}`;
  },

  _infoHtml(h, t) {
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
    const canEdit = this._hass?.user?.is_admin !== false && !this._config.compact;
    const edit = canEdit ? `<div class="infoedits"><button class="infoedit" data-edit="settings"><ha-icon icon="mdi:cog-outline"></ha-icon><span>${t.editSettings}</span></button><button class="infoedit" data-edit="favs"><ha-icon icon="mdi:star-outline"></ha-icon><span>${t.editFavs}</span></button><button class="infoedit" data-edit="actions"><ha-icon icon="mdi:flash"></ha-icon><span>${t.actions}</span></button></div>` : "";
    const head = `<div class="infohead"><i class="sdot ${down ? "bad" : "ok"}"></i><b>${esc(h.name)}</b><span>${esc([meta.manufacturer, meta.model].filter(Boolean).join(" "))}</span></div>`;
    return `<div class="infopanel">${head}${rows.map(([k, v]) => `<div class="irow"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join("")}${edit}</div>`;
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
    return `<div class="esec infobox" data-t="info"><div class="etitle">${t.statusTitle}</div><div class="sgrid">${grid}</div>
        <div class="ehint sexpl">${open ? `<b>${esc(open.title)}</b> ${esc(open.text)}` : esc(t.statusHint)}</div></div>
      <details class="esec infobox" data-t="info"><summary class="etitle">${t.infoTitle}</summary>${items.map((x) => `<div class="infoitem"><ha-icon icon="${esc(x.icon || "mdi:information-outline")}"></ha-icon><div><b>${esc(x.title)}</b><div>${esc(x.text)}</div></div></div>`).join("")}</details>`;
  },

  // Events of the info panel and the legend.
  _bindInfo(root) {
    root.querySelectorAll("[data-info]").forEach((b) => b.addEventListener("click", () => { this._infoOpen = { ...(this._infoOpen || {}), [b.dataset.info]: !this._infoOpen?.[b.dataset.info] }; this._rerender(); }));
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
