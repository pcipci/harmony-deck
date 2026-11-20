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
import { actionEditorMixin } from "./action-editor.js";
import { actionsMixin } from "./actions.js";
import { activitiesMixin } from "./activities.js";
import { bindMixin } from "./bind.js";
import { callMixin } from "./call.js";
import { dataMixin } from "./data.js";
import { deviceStateMixin } from "./device-state.js";
import { devicesMixin } from "./devices.js";
import { directEditorMixin } from "./direct-editor.js";
import { favoritesMixin } from "./favorites.js";
import { fireEditorMixin } from "./fire-editor.js";
import { fireMixin } from "./fire.js";
import { helpMixin } from "./help.js";
import { infoMixin } from "./info.js";
import { keyboardMixin } from "./keyboard.js";
import { loadText } from "../shared/i18n.js";
import { lockMarkMixin } from "./lock-mark.js";
import { mismatchMixin } from "./mismatch.js";
import { optionsMixin } from "./options.js";
import { panelMixin } from "./panel.js";
import { physicalKeyboardMixin } from "./physical-keyboard.js";
import { profilesMixin } from "./profiles.js";
import { renderMixin } from "./render.js";
import { sequencePanelMixin } from "./sequence-panel.js";
import { settingsEditorMixin } from "./settings-editor.js";
import { skinDecorMixin } from "./skin-decor.js";
import { styleMixin } from "./style.js";
import { volSliderMixin } from "./volslider.js";

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
    this._mmWatch(hubs);
    this._slWatch(hubs);
    const key = JSON.stringify([this._mm, this._sl, hubs.map((h) => [h.id, h.name, h.state, h.current, h.starting, h.list]), this._info, this._editMode, this._modeState, this._device, this._hubSel, this._menuOpen, this._hintSeen, this._actPanel, this._actPanelOff, hubs.map((h) => this._watched(h)), hubs.map((h) => { const f = this._fireInfo(h.id); return f && [f.mode, f.app]; }),
      hubs.map((h) => [this._lockInfo(h.id), [...this._secLocked(h.id)], this._actionList(h.id).flatMap((a) => a.steps.filter((s) => s.type === "ha").map((s) => this._hass.states?.[s.entity]?.state)), (({ state, step, error, action }) => [state, step, error, action])(this._seqState(h.id))])]);
    // While a running action is held to stop it, a new step must not redraw the button under the finger.
    this._eyeUpdate(hubs);
    if (key === this._key || this._holdingAct || this._volDrag) return;
    this._key = key;
    // Every redraw keeps the scroll position (a state change must not throw the page back to the top); jumps to the remote are asked for explicitly.
    const keep = this._scrollRemote ? null : this._scrollState();
    this._render(hubs);
    if (keep) { keep(); requestAnimationFrame(keep); }
  }

  connectedCallback() {
    this._onKey = this._onKey || ((e) => this._keydown(e));
    document.addEventListener("keydown", this._onKey, true);
  }

  disconnectedCallback() {
    document.removeEventListener("keydown", this._onKey, true);
    this._ro?.disconnect();
    if (this._stickFn) window.removeEventListener("scroll", this._stickFn, true);
  }

  getCardSize() { return this._config?.compact ? 4 : 10; }

  static getStubConfig() { return {}; }
}

// The functions of the card live in one module per area; here they are attached to the class.
for (const part of [dataMixin, optionsMixin, renderMixin, physicalKeyboardMixin, activitiesMixin, devicesMixin, keyboardMixin, lockMarkMixin, panelMixin, fireMixin, helpMixin, favoritesMixin, actionsMixin, actionEditorMixin, sequencePanelMixin, directEditorMixin, mismatchMixin, volSliderMixin, deviceStateMixin, callMixin, skinDecorMixin, infoMixin, profilesMixin, settingsEditorMixin, fireEditorMixin, bindMixin, styleMixin]) {
  Object.defineProperties(HarmonyDeckCard.prototype, Object.getOwnPropertyDescriptors(part));
}
