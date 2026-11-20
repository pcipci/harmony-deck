// Visual editor shown by Home Assistant's card dialog (the pencil inside the card edits the shared settings).
// All texts come from translations/<language>.json (section "cardEditor"), in the language of Home Assistant.
import { esc } from "../shared/util.js";
import { loadText } from "../shared/i18n.js";
import { skinOrder } from "../shared/skins.js";

export class HarmonyDeckCardEditor extends HTMLElement {
  setConfig(config) { this._config = config; this._render(); }

  set hass(hass) {
    this._hass = hass;
    const lang = String(hass?.locale?.language || hass?.language || "en").slice(0, 2).toLowerCase();
    if (this._lang !== lang) {
      this._lang = lang;
      loadText(lang).then((txt) => { if (this._lang === lang) { this._txt = txt; this._render(); } });
    }
    this._render();
  }

  _schema() {
    const t = this._txt;
    const states = this._hass?.states || {};
    const hubs = Object.keys(states).filter((id) => id.startsWith("remote.") && Array.isArray(states[id].attributes.activity_list));
    const activities = [...new Set(hubs.flatMap((id) => states[id].attributes.activity_list))].filter((n) => n !== "PowerOff");
    const opts = (map) => Object.entries(map || {}).map(([value, label]) => ({ value, label }));
    return [
      { name: "entity", selector: { entity: { domain: "remote" } } },
      { name: "profile", selector: { select: { mode: "dropdown", options: [{ value: "", label: t.cardEditor.auto }, ...(this._profiles || []).map((n) => ({ value: n, label: n }))] } } },
      { name: "skin", selector: { select: { mode: "dropdown", options: skinOrder().map((k) => ({ value: k, label: t.skins?.[k] || k })) } } },
      { name: "language", selector: { select: { mode: "dropdown", options: [{ value: "de", label: "Deutsch" }, { value: "en", label: "English" }, { value: "ru", label: "Русский" }] } } },
      { name: "columns", selector: { number: { min: 2, max: 5, mode: "box" } } },
      { name: "compact", selector: { boolean: {} } },
      { name: "compact_dpad", selector: { boolean: {} } },
      { name: "tile_style", selector: { select: { mode: "dropdown", options: opts(t.tileStyles) } } },
      { name: "colored_icons", selector: { boolean: {} } },
      { name: "keyboard_control", selector: { boolean: {} } },
      { name: "physical_keyboard", selector: { boolean: {} } },
      { name: "vibrate", selector: { boolean: {} } },
      { name: "collapse_header", selector: { boolean: {} } },
      { name: "key_style", selector: { select: { mode: "dropdown", options: opts(t.keyStyles) } } },
      { name: "glow", selector: { select: { mode: "dropdown", options: opts(t.glows) } } },
      { name: "help_names", selector: { boolean: {} } },
      { name: "title", selector: { text: {} } },
      { name: "hide", selector: { select: { multiple: true, mode: "list", custom_value: true, options: activities } } },
    ];
  }

  // Settings that the editor of this card can fix in the card YAML (value present) or hand back to the integration (key removed).
  static get FIXABLE() { return ["skin", "tile_style", "colored_icons", "help_names", "keyboard_control", "vibrate", "collapse_header", "key_style", "glow", "profile"]; }

  async _loadProfiles() {
    if (this._profLoaded || !this._hass) return;
    this._profLoaded = true;
    try { this._profiles = (await this._hass.callWS({ type: "harmony_deck/profiles", action: "list" })).names; this._render(); } catch (e) { /* no backend: dropdown only offers automatic */ }
  }

  _render() {
    if (!this._config || !this._hass || !this._txt?.cardEditor) return;
    if (!this._form) {
      this._form = document.createElement("ha-form");
      this._form.addEventListener("value-changed", (ev) => {
        const config = { ...ev.detail.value };
        Object.keys(config).forEach((k) => (config[k] === "" || config[k] === undefined || (Array.isArray(config[k]) && !config[k].length)) && delete config[k]);
        this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true }));
      });
      this.appendChild(this._form);
    }
    const labels = this._txt.cardEditor.labels || {};
    this._loadProfiles();
    this._form.hass = this._hass;
    this._form.data = this._config;
    this._form.schema = this._schema();
    this._form.computeLabel = (s) => labels[s.name] || s.name;
    this._renderFixed(labels);
  }

  _setConfig(config) { this._config = config; this.dispatchEvent(new CustomEvent("config-changed", { detail: { config }, bubbles: true, composed: true })); this._render(); }

  _renderFixed(labels) {
    if (!this._fixed) { this._fixed = document.createElement("div"); this._fixed.style.cssText = "margin-top:16px;padding-top:12px;border-top:1px solid var(--divider-color)"; this.appendChild(this._fixed); }
    const t = this._txt.cardEditor;
    const set = HarmonyDeckCardEditor.FIXABLE.filter((k) => this._config[k] !== undefined);
    const btn = "flex:none;border:1px solid var(--divider-color);background:none;color:var(--primary-color);border-radius:8px;padding:6px 10px;font:inherit;cursor:pointer";
    const rows = set.map((k) => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0"><span style="flex:1;min-width:0;overflow-wrap:anywhere"><b>${esc(labels[k] || k)}</b> <code>${esc(k)}: ${esc(this._config[k])}</code></span><button type="button" data-release="${k}" style="${btn}">${esc(t.release)}</button></div>`).join("");
    this._fixed.innerHTML = `<div style="font-weight:500;margin-bottom:4px">${esc(t.title)}</div><div style="font-size:12px;color:var(--secondary-text-color);margin-bottom:6px">${esc(set.length ? t.intro : t.none)}</div>${rows}${set.length > 1 ? `<button type="button" data-release="*" style="${btn}">${esc(t.all)}</button>` : ""}<div style="font-size:12px;color:var(--secondary-text-color);margin-top:8px">${esc(t.yamlMode)}</div>`;
    this._fixed.querySelectorAll("[data-release]").forEach((b) => b.addEventListener("click", () => {
      const config = { ...this._config };
      const k = b.dataset.release;
      (k === "*" ? HarmonyDeckCardEditor.FIXABLE : [k]).forEach((x) => delete config[x]);
      this._setConfig(config);
    }));
  }
}
