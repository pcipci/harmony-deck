// Settings tab "Direct devices": link a Harmony device to a Home Assistant media player (see directdev.py).
// The integration says which players are possible, what each one can do and what it reports now; the card
// only shows that and stores the link ({hub: {device: {entity, volumeDirect}}}).
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

const CAPS = ["state", "power_on", "power_off", "volume_set", "volume_read", "mute", "source_select", "source_read"];

export const directEditorMixin = {
  // Overview of the integration, loaded when the tab (or a step "Device") needs it; the card redraws when it arrives.
  async _ddLoad(force = false) {
    if (this._ddBusy || (this._dd && !force)) return;
    this._ddBusy = true;
    try { this._dd = await this._hass.callWS({ type: "harmony_deck/direct/overview" }); } catch (e) { this._dd = { hubs: {}, candidates: [], extensions: [] }; }
    this._ddBusy = false;
    this._rerender();
  },

  _ddLinks() { return this._settings().directDevices || {}; },

  async _ddSave(hubId, device, patch) {
    const all = JSON.parse(JSON.stringify(this._ddLinks()));
    all[hubId] = { ...(all[hubId] || {}) };
    if (patch === null) delete all[hubId][device]; else all[hubId][device] = { ...(all[hubId][device] || {}), ...patch };
    await this._saveSettings({ directDevices: all });
    this._ddLoad(true);
  },

  _ddStateText(st, t) {
    if (!st) return "";
    const on = st.on === true ? t.ddOn : st.on === false ? t.ddOff : t.ddUnknown;
    return [on, st.volume != null ? fmtText(t.ddVolume, [String(st.volume)]) : "", st.source || "", st.app || ""].filter(Boolean).join(" · ");
  },

  _directDevHtml(h, t) {
    const devs = Object.keys(this._devicesOf(h.id));
    if (!this._dd) { this._ddLoad(); return `<div class="esec" data-t="dd"><div class="etitle">${t.tabs.dd}</div><div class="ehint">${t.ddLoading}</div></div>`; }
    const info = this._dd.hubs?.[h.id] || {};
    const links = this._ddLinks()[h.id] || {};
    const name = (id) => this._hass.states?.[id]?.attributes?.friendly_name || id;
    const cands = this._dd.candidates || [];
    const rows = devs.map((d) => {
      const cur = links[d]?.entity || "";
      const item = info[d] || {};
      const ids = cands.map((c) => c.entity);
      if (cur && !ids.includes(cur)) ids.push(cur);
      const opts = [`<option value="">${t.ddNone}</option>`, ...ids.map((id) => `<option value="${esc(id)}" ${id === cur ? "selected" : ""}>${esc(name(id))} · ${esc(id)}</option>`)].join("");
      const suggest = !cur && item.suggest ? `<div class="ehint ddsug"><span>${fmtText(t.ddSuggest, [esc(name(item.suggest))])}</span> <button type="button" class="mini txt" data-ddtake="${esc(item.suggest)}" data-dev="${esc(d)}">${t.ddTake}</button></div>` : "";
      let detail = "";
      if (cur) {
        const caps = item.caps || [];
        detail = item.known === false
          ? `<div class="ehint">${t.ddGone}</div>`
          : `<div class="ehint ddcaps">${caps.length ? fmtText(t.ddCan, [caps.map((c) => t.ddCaps[c] || c).join(", ")]) : t.ddCanNot}</div>
            <div class="ehint">${fmtText(t.ddNow, [this._ddStateText(item.state, t)])}</div>
            ${caps.includes("volume_set") ? this._swRow(t.ddVolDirect, `data-ddvol data-dev="${esc(d)}"`, !!links[d]?.volumeDirect) + `<div class="ehint">${t.ddVolDirectHint}</div>` : ""}`;
      }
      return `<div class="egrp ddrow" data-hub="${esc(h.id)}"><div class="esub"><ha-icon icon="${this._deviceIcon(d, h.id)}"></ha-icon> ${esc(d)}</div>
        <label class="erow"><span>${t.ddLink}</span><select data-ddent data-dev="${esc(d)}">${opts}</select></label>${suggest}${detail}</div>`;
    });
    return `<div class="esec" data-t="dd" data-hub="${esc(h.id)}"><div class="etitle">${t.tabs.dd}</div><div class="ehint">${t.ddHint}</div>${cands.length ? "" : `<div class="ehint">${t.ddNoPlayers}</div>`}${rows.join("")}</div>`;
  },

  _bindDirectDev(root) {
    root.querySelectorAll("select[data-ddent]").forEach((s) => s.addEventListener("change", () => this._ddSave(s.closest("[data-hub]").dataset.hub, s.dataset.dev, s.value ? { entity: s.value, volumeDirect: false } : null)));
    root.querySelectorAll("[data-ddtake]").forEach((b) => b.addEventListener("click", () => this._ddSave(b.closest("[data-hub]").dataset.hub, b.dataset.dev, { entity: b.dataset.ddtake, volumeDirect: false })));
    root.querySelectorAll("input[data-ddvol]").forEach((i) => i.addEventListener("change", () => this._ddSave(i.closest("[data-hub]").dataset.hub, i.dataset.dev, { volumeDirect: i.checked })));
  },
};

export const DD_CAPS = CAPS;
