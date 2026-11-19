// Volume slider: when the volume device of the running activity is linked with "Set volume directly" and takes a level,
// the card shows a slider instead of +/-. The integration decides (websocket direct/sliders) and holds the level to the
// volume limit (direct/volume); the card only shows the slider and sends the level while it is moved and on release.
import { esc } from "../shared/util.js";

const SEND_EVERY = 300;    // ms between two levels while dragging

export const volSliderMixin = {
  // Part of the redraw key: what the slider depends on.
  _slKey(hubs) {
    return hubs.map((h) => [h.id, h.current, Object.entries(this._settings().directDevices?.[h.id] || {}).map(([d, l]) => [d, l.entity, l.volumeDirect === true, this._hass?.states?.[l.entity]?.state])]);
  },

  // With every hass update: ask the integration again, after the key stayed the same for a moment.
  _slWatch(hubs) {
    const now = JSON.stringify(this._slKey(hubs));
    if (now === this._slSeen) return;
    this._slSeen = now;
    clearTimeout(this._slTimer);
    const any = hubs.some((h) => Object.values(this._settings().directDevices?.[h.id] || {}).some((l) => l.volumeDirect === true));
    if (!any) { if (this._sl) { this._sl = null; this._key = ""; } return; }
    this._slTimer = setTimeout(() => this._slLoad(), 600);
  },

  async _slLoad() {
    let next = null;
    try { next = await this._hass.callWS({ type: "harmony_deck/direct/sliders" }); } catch (e) { next = null; }
    if (JSON.stringify(next) !== JSON.stringify(this._sl || null)) { this._sl = next; this._key = ""; this.hass = this._hass; }
  },

  // The slider for the volume device `r.volume` of the running activity of hub h, or "" (then +/- stay).
  // In the device view (`deviceView`) the slider belongs to the device itself, whatever activity runs.
  _volSlider(h, r, orient, deviceView) {
    const s = deviceView ? this._sl?.[h.id]?.devices?.[r.volume] : this._sl?.[h.id]?.activity;
    if (!s || this._edit || !r.volume || s.device !== r.volume || (!deviceView && s.activity !== h.current)) return "";
    const st = this._hass.states?.[s.entity];
    const lvl = this._volLive?.[h.id + (deviceView ? "/" + s.device : "")] ?? (st?.attributes?.volume_level != null ? Math.round(st.attributes.volume_level * 100) : 0);
    return `<input type="range" class="volslider ${orient || "h"}" min="0" max="${s.cap}" value="${Math.min(lvl, s.cap)}" data-volhub="${h.id}" ${deviceView ? `data-voldev="${esc(s.device)}"` : ""} data-volrel="${s.release ? 1 : 0}" style="--v:${Math.round((Math.min(lvl, s.cap) / (s.cap || 100)) * 100)}" title="${Math.min(lvl, s.cap)} %" aria-label="${this._t().volume || "Volume"}">`;
  },

  async _volSend(hub, value, device) {
    const id = hub + (device ? "/" + device : "");
    if (this._volSent?.[id] === value) return;
    this._volSent = { ...(this._volSent || {}), [id]: value };
    try { await this._hass.callWS({ type: "harmony_deck/direct/volume", hub, value, ...(device ? { device } : {}) }); } catch (e) {
      // not possible (any more): back to +/-
      const cur = this._sl?.[hub] || {};
      this._sl = { ...(this._sl || {}), [hub]: device ? { ...cur, devices: { ...(cur.devices || {}), [device]: null } } : { ...cur, activity: null } };
      this._key = ""; this.hass = this._hass;
    }
  },

  _bindVolSlider(root) {
    root.querySelectorAll("input[data-volhub]").forEach((el) => {
      const hub = el.dataset.volhub;
      const release = el.dataset.volrel === "1";
      const dev = el.dataset.voldev || "";
      const id = hub + (dev ? "/" + dev : "");
      const live = () => { this._volLive = { ...(this._volLive || {}), [id]: Number(el.value) }; el.title = `${el.value} %`; el.style.setProperty("--v", String(Math.round((Number(el.value) / (Number(el.max) || 100)) * 100))); };
      const end = () => {
        clearTimeout(this._volEnd);
        // Let the device report the new level before the card follows the device again.
        this._volEnd = setTimeout(() => { this._volDrag = false; this._volLive = null; this._volSent = null; this._key = ""; if (this._hass) this.hass = this._hass; }, 1200);
      };
      el.addEventListener("pointerdown", () => { this._volDrag = true; clearTimeout(this._volEnd); });
      el.addEventListener("input", () => {
        this._volDrag = true;
        live();
        if (release || this._volBusy) return;
        // While moving: send the level about every 300 ms, only if it changed (the last level goes out on release).
        this._volBusy = true;
        this._volSend(hub, Number(el.value), dev);
        setTimeout(() => { this._volBusy = false; }, SEND_EVERY);
      });
      el.addEventListener("change", () => { live(); this._volSend(hub, Number(el.value), dev); end(); });
      ["pointerup", "pointercancel"].forEach((ev) => el.addEventListener(ev, end));
    });
  },
};
