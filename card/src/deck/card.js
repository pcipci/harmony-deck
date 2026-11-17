/*
 * Harmony Deck card.
 *
 * A remote control for Logitech Harmony hubs: every activity as a button,
 * a round D-pad, volume / channel rockers, transport keys and per-device
 * keys. Hubs, activities and keys are discovered, nothing has to be listed.
 *
 *   type: custom:harmony-deck-card
 *   entity: remote.living_room   # optional: one hub (default: all hubs)
 *   skin: homebase               # homebase | remote | light
 *   compact: false               # activities, status, off and volume only
 *   columns: 3                   # activity buttons per row
 *   title: ''                    # optional, default hub name
 *   language: de                 # optional
 *   hide: [TV]                   # optional, normally set in the editor (pencil)
 *   skin_vars:                   # optional CSS variable overrides
 *     --hr-accent: "#e91e63"
 *
 * Where each key goes is read from the hub by the integration
 * (websocket harmony_deck/info). Without it the card still works with
 * `keys:` in the card config:
 *   keys:
 *     remote.living_room:
 *       default: { volume: Amplifier, nav: Player }
 *       TV: { volume: Amplifier, nav: Receiver, channel: Receiver }
 */
import { actionsMixin } from "./actions.js";
import { activitiesMixin } from "./activities.js";
import { bindMixin } from "./bind.js";
import { dataMixin } from "./data.js";
import { devicesMixin } from "./devices.js";
import { favoritesMixin } from "./favorites.js";
import { fireEditorMixin } from "./fire-editor.js";
import { fireMixin } from "./fire.js";
import { helpMixin } from "./help.js";
import { infoMixin } from "./info.js";
import { keyboardMixin } from "./keyboard.js";
import { loadText } from "../shared/i18n.js";
import { lockMarkMixin } from "./lock-mark.js";
import { optionsMixin } from "./options.js";
import { panelMixin } from "./panel.js";
import { physicalKeyboardMixin } from "./physical-keyboard.js";
import { profilesMixin } from "./profiles.js";
import { renderMixin } from "./render.js";
import { settingsEditorMixin } from "./settings-editor.js";
import { styleMixin } from "./style.js";

export class HarmonyDeckCard extends HTMLElement {
  // Edit modes: "settings" (forms in tabs, independent of the Activities/Devices switch) or "favs" (stars on the keys of the devices).
  get _edit() { return !!this._editMode; }

  set _edit(on) { this._editMode = on ? (this._editMode || "settings") : null; }

  setConfig(config) {
    this._config = { columns: 3, compact: false, ...config };
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._key = "";
    this._edit = false;
    this._info = this._info || null;
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) this._loadInfo();
    const lang = this._lang();
    if (this._textLang !== lang) {
      this._textLang = lang;
      this._text = null;
      loadText(lang).then((txt) => { if (this._textLang === lang) { this._text = txt; this._rerender(); } });
    }
    if (!this._text) return;
    const hubs = this._hubs();
    const key = JSON.stringify([hubs.map((h) => [h.id, h.name, h.state, h.current, h.starting, h.list]), this._info, this._editMode, this._modeState, this._device, this._hubSel, this._infoOpen, hubs.map((h) => this._links(h).map((l) => this._hass.states?.[l.entity]?.state)), hubs.map((h) => { const f = this._fireInfo(h.id); return f && [f.mode, f.app]; }),
      hubs.map((h) => [this._lockInfo(h.id), [...this._secLocked(h.id)], (this._settings().actions?.[h.id] || []).map((a) => this._hass.states?.[a.entity]?.state)])]);
    if (key === this._key) return;
    this._key = key;
    this._render(hubs);
  }

  connectedCallback() {
    this._onKey = this._onKey || ((e) => this._keydown(e));
    document.addEventListener("keydown", this._onKey, true);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKey, true);
    this._ro?.disconnect();
  }

  getCardSize() { return this._config?.compact ? 4 : 10; }

  static getStubConfig() { return {}; }
}

// The functions of the card live in one module per area; here they are attached to the class.
for (const part of [dataMixin, optionsMixin, renderMixin, physicalKeyboardMixin, activitiesMixin, devicesMixin, keyboardMixin, lockMarkMixin, panelMixin, fireMixin, helpMixin, favoritesMixin, actionsMixin, infoMixin, profilesMixin, settingsEditorMixin, fireEditorMixin, bindMixin, styleMixin]) {
  Object.defineProperties(HarmonyDeckCard.prototype, Object.getOwnPropertyDescriptors(part));
}
