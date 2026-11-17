/*
 * Harmony Deck security card: the lock of every Harmony hub in one place.
 *
 *   type: custom:harmony-deck-security
 *   entity: remote.living_room   # optional: one hub (default: all hubs)
 *   title: ''                    # optional
 *   skin: homebase               # optional, default: the look of the main card
 *   language: de                 # optional
 *   log_rows: 12                 # optional: rows of the intervention list before "show all"
 *
 * The card is only a surface: state, lists and the installed apps come from the integration
 * (websocket harmony_deck/lock/get), every change goes back to it (administrators only).
 */
import { loadText } from "../shared/i18n.js";
import { securityBindMixin } from "./bind.js";
import { securityDataMixin } from "./data.js";
import { securityViewMixin } from "./view.js";

export class HarmonyDeckSecurityCard extends HTMLElement {
  setConfig(config) {
    this._config = { log_rows: 12, ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._key = "";
    if (this._hass) this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._load();
    const lang = String(this._config.language || hass?.locale?.language || hass?.language || "en").slice(0, 2).toLowerCase();
    if (this._textLang !== lang) {
      this._textLang = lang;
      this._text = null;
      loadText(lang).then((txt) => { if (this._textLang === lang) { this._text = txt; this._key = ""; this._render(); } });
    }
    // The lock entities change when the lock does (also by an automation or a time window): then ask the integration again.
    const watch = this._watchKey();
    if (this._watched !== undefined && watch !== this._watched) this._load();
    this._watched = watch;
    this._render();
  }

  getCardSize() { return 8; }
  static getStubConfig() { return {}; }
}

for (const part of [securityDataMixin, securityViewMixin, securityBindMixin]) {
  Object.defineProperties(HarmonyDeckSecurityCard.prototype, Object.getOwnPropertyDescriptors(part));
}
