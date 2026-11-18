// Target against actual state: when a linked direct device does not do what the current activity needs
// (still on, not on, wrong input), a small box below the status offers the fix. Nothing is switched by itself;
// the integration decides what differs (mismatch.py), the card only shows it and sends the tapped fix.
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

const WAIT = 4000;     // ms the state must stay as it is, so a device that is still starting up is not "wrong"

export const mismatchMixin = {
  _mmHubs() { return Object.keys(this._settings().directDevices || {}).filter((h) => Object.keys(this._settings().directDevices[h] || {}).length); },

  // Part of the redraw key: what the check depends on (activity and the states of the linked entities).
  _mmKey(hubs) {
    return hubs.map((h) => {
      const links = this._settings().directDevices?.[h.id];
      return links ? [h.current, Object.values(links).map((l) => { const s = this._hass.states?.[l.entity]; return [l.entity, s?.state, s?.attributes?.source]; })] : null;
    });
  },

  // Called with every hass update; asks the integration only after the key stayed the same for a moment.
  _mmWatch(hubs) {
    const now = JSON.stringify(this._mmKey(hubs));
    if (now === this._mmSeen) return;
    this._mmSeen = now;
    clearTimeout(this._mmTimer);
    this._mmTimer = setTimeout(() => this._mmLoad(hubs.map((h) => h.id)), WAIT);
  },

  async _mmLoad(ids) {
    const next = {};
    for (const id of ids.filter((h) => this._mmHubs().includes(h))) {
      try { next[id] = (await this._hass.callWS({ type: "harmony_deck/direct/check", hub: id })).items || []; } catch (e) { next[id] = []; }
    }
    if (JSON.stringify(next) !== JSON.stringify(this._mm || {})) { this._mm = next; this._key = ""; this.hass = this._hass; }
  },

  _mmHtml(h, t) {
    const items = this._edit ? [] : this._mm?.[h.id] || [];
    if (!items.length) return "";
    const rows = items.map((it, i) => {
      const text = it.kind === "input" ? fmtText(t.mmInput, [it.device, it.source, it.want]) : it.want ? fmtText(t.mmShouldOn, [it.device]) : fmtText(t.mmShouldOff, [it.device]);
      const label = it.fix === "source" ? fmtText(t.mmSwitch, [it.value]) : it.fix === "on" ? t.mmOn : t.mmOff;
      return `<div class="mmrow"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${esc(text)}</span>${it.can ? `<button type="button" class="mini txt" data-mmfix="${i}" data-hub="${esc(h.id)}">${esc(label)}</button>` : ""}</div>`;
    }).join("");
    return `<div class="mmbox">${rows}</div>`;
  },

  _bindMismatch(root) {
    root.querySelectorAll("[data-mmfix]").forEach((b) => b.addEventListener("click", async () => {
      const hub = b.dataset.hub;
      const it = (this._mm?.[hub] || [])[Number(b.dataset.mmfix)];
      if (!it) return;
      b.disabled = true;
      try { await this._hass.callWS({ type: "harmony_deck/direct/fix", hub, device: it.device, op: it.fix, ...(it.value ? { value: it.value } : {}) }); } catch (e) { /* the box stays; the next check says what is still wrong */ }
      // Devices need a moment to report the new state.
      setTimeout(() => this._mmLoad([hub]), 3000);
    }));
  },
};
