// Settings tab "Direct devices": link a Harmony device to a Home Assistant media player (see directdev.py).
// The integration says which players are possible, what each one can do and what it reports now; the card
// only shows that and stores the link ({hub: {device: {entity, volumeDirect}}}).
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

const PLATFORMS = { lg_netcast: "LG Netcast", webostv: "LG webOS", samsungtv: "Samsung TV", sonos: "Sonos", androidtv: "Android TV (ADB)", androidtv_remote: "Android TV", cast: "Google Cast", apple_tv: "Apple TV", denonavr: "Denon AVR", yamaha_musiccast: "Yamaha MusicCast", onkyo: "Onkyo", bravia: "Sony Bravia", philips_js: "Philips TV", roku: "Roku", panasonic_viera: "Panasonic Viera" };
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

  // Where the hub sends the volume keys: activities whose volume goes to another device than this one.
  _ddVolHint(hubId, device, t) {
    const acts = this._info?.hubs?.[hubId]?.activities || {};
    const via = {};
    for (const [act, roles] of Object.entries(acts)) {
      if (roles.volume && roles.volume !== device) (via[roles.volume] ||= []).push(act);
    }
    const text = Object.entries(via).map(([dev, list]) => fmtText(t.ddVolVia, [list.join(", "), dev]));
    return text.length ? `<div class="ehint ddvia"><ha-icon icon="mdi:information-outline"></ha-icon> ${esc(text.join(" "))}</div>` : "";
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
      // Players that fit this device (room, kind, maker, name) come first, the rest below.
      const fits = (item.fits || []).filter((id) => ids.includes(id));
      const option = (id) => `<option value="${esc(id)}" ${id === cur ? "selected" : ""}>${esc(name(id))} · ${esc(id)}</option>`;
      const rest = ids.filter((id) => !fits.includes(id));
      const opts = `<option value="">${t.ddNone}</option>${fits.length ? `<optgroup label="${esc(t.ddFits)}">${fits.map(option).join("")}</optgroup><optgroup label="${esc(t.ddOthers)}">${rest.map(option).join("")}</optgroup>` : rest.map(option).join("")}`;
      const suggest = !cur && item.suggest ? `<div class="ehint ddsug"><span>${fmtText(t.ddSuggest, [esc(name(item.suggest))])}</span> <button type="button" class="mini txt" data-ddtake="${esc(item.suggest)}" data-dev="${esc(d)}">${t.ddTake}</button></div>` : "";
      let detail = "";
      if (cur) {
        const caps = item.caps || [];
        detail = item.known === false
          ? `<div class="ehint">${t.ddGone}</div>`
          : `<div class="ehint ddplat"><ha-icon icon="mdi:lan-connect"></ha-icon> ${esc(item.platform ? fmtText(t.ddFound, [PLATFORMS[item.platform] || item.platform]) : t.ddFoundNone)}</div>
            ${(item.quirks || []).map((q) => `<div class="ehint ddquirk">${esc(t.ddQuirks[q] || q)}</div>`).join("")}
            <div class="ehint ddcaps">${caps.length ? fmtText(t.ddCan, [caps.map((c) => t.ddCaps[c] || c).join(", ")]) : t.ddCanNot}</div>
            <div class="ehint">${fmtText(t.ddNow, [this._ddStateText(item.state, t)])}</div>
            ${this._ddInputsHtml(item, links[d], entityId => this._hass.states?.[entityId]?.attributes?.source_list, d, t)}
            ${caps.includes("volume_set") ? this._swRow(t.ddVolDirect, `data-ddvol data-dev="${esc(d)}"`, !!links[d]?.volumeDirect) + `<div class="ehint">${t.ddVolDirectHint}</div>` + this._ddVolHint(h.id, d, t) : ""}`;
      }
      return `<div class="egrp ddrow" data-hub="${esc(h.id)}"><div class="esub"><ha-icon icon="${this._deviceIcon(d, h.id)}"></ha-icon> ${esc(d)}</div>
        <label class="erow"><span>${t.ddLink}</span><select data-ddent data-dev="${esc(d)}">${opts}</select></label>${suggest}${detail}</div>`;
    });
    return `<div class="esec" data-t="dd" data-hub="${esc(h.id)}"><div class="etitle">${t.tabs.dd}</div><div class="ehint">${t.ddHint}</div>${cands.length ? "" : `<div class="ehint">${t.ddNoPlayers}</div>`}${rows.join("")}</div>`;
  },

  // Which source of the player belongs to each Harmony input the activities use on this device.
  _ddInputsHtml(item, link, sourcesOf, device, t) {
    const list = item.inputList || [];
    const sources = sourcesOf(link.entity);
    if (!list.length || !Array.isArray(sources) || !sources.length) return "";
    const rows = list.map((i) => {
      const auto = i.guess ? fmtText(t.ddInputAuto, [i.guess]) : t.ddInputNone;
      const opts = [`<option value="">${esc(auto)}</option>`, ...sources.map((s) => `<option ${i.source === s ? "selected" : ""}>${esc(s)}</option>`)].join("");
      return `<label class="erow"><span>${esc(i.input)} <small>${esc(fmtText(t.ddInputUsed, [i.activities.join(", ")]))}</small></span><select data-ddinput="${esc(i.input)}" data-dev="${esc(device)}">${opts}</select></label>`;
    }).join("");
    return `<div class="dname">${t.ddInputs}</div>${rows}<div class="ehint">${t.ddInputsHint}</div>`;
  },

  _bindDirectDev(root) {
    root.querySelectorAll("select[data-ddent]").forEach((s) => s.addEventListener("change", () => this._ddSave(s.closest("[data-hub]").dataset.hub, s.dataset.dev, s.value ? { entity: s.value, volumeDirect: false } : null)));
    root.querySelectorAll("[data-ddtake]").forEach((b) => b.addEventListener("click", () => this._ddSave(b.closest("[data-hub]").dataset.hub, b.dataset.dev, { entity: b.dataset.ddtake, volumeDirect: false })));
    root.querySelectorAll("select[data-ddinput]").forEach((s) => s.addEventListener("change", () => {
      const hub = s.closest("[data-hub]").dataset.hub;
      const inputs = { ...(this._ddLinks()[hub]?.[s.dataset.dev]?.inputs || {}) };
      if (s.value) inputs[s.dataset.ddinput] = s.value; else delete inputs[s.dataset.ddinput];
      this._ddSave(hub, s.dataset.dev, { inputs });
    }));
    root.querySelectorAll("input[data-ddvol]").forEach((i) => i.addEventListener("change", () => this._ddSave(i.closest("[data-hub]").dataset.hub, i.dataset.dev, { volumeDirect: i.checked })));
  },
};

export const DD_CAPS = CAPS;
