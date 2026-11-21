// Display options: card YAML wins over the shared settings, then the default.
import { skinKey } from "../shared/skins.js";
import { skinTrait } from "../shared/skin-traits.js";

export const optionsMixin = {
  _trait(name, fallback = false) { return skinTrait(this._skin(), name, fallback); },
  // Skin of the room (hub) shown; a skin set in the card's YAML wins, then the room skin (0.18), then the default skin.
  _skinFor(hubId) { return skinKey(this._config.skin || this._settings().roomSkins?.[hubId] || this._settings().skin || "homebase"); },
  _skin() { return this._skinFor(this._hubSel); },

  _tileStyle() { return this._config.tile_style || this._settings().tileStyle || "icon_text"; },

  _colorful() { return this._config.colored_icons ?? this._settings().colorIcons ?? true; },

  _helpNames() { return this._config.help_names ?? this._settings().helpNames ?? true; },

  _layout() { const l = this._config.layout ?? this._settings().layout; return ["narrow", "wide"].includes(l) ? l : "auto"; },

  _activeStyle() { const a = this._config.active_style ?? this._settings().activeStyle; return a === "fill" || a === "icon" ? a : "ring"; },

  // Look of the Glas skin: a = plate lights, b = text lights, c = mix (default).
  _actColors() { return (this._config.glass_act_colors ?? this._settings().glassActColors) === "on"; },
  // Colour of an activity when "colour per activity" is on: a fixed place in the full list, colours the function colours do not use
  _actColor(h, n) {
    if (!this._actColors() || !this._trait("glassLook")) return "";
    const pal = ["#9b7bff", "#2fd8e8", "#ff5fd2", "#ff9a3a", "#8fa0ff"];
    const i = (h.list || []).filter((x) => x !== "PowerOff").indexOf(n);
    return i < 0 ? "" : pal[i % pal.length];
  },
  _glassBg() { const g = this._config.glass_bg ?? this._settings().glassBg; return ["dark", "carbon", "alu", "board"].includes(g) ? g : "dark"; },
  _glassLook() { const g = this._config.glass_look ?? this._settings().glassLook; return ["a", "b", "c"].includes(g) ? g : "c"; },

  _keyStyle() { const k = this._config.key_style ?? this._settings().keyStyle; return ["flat", "raised"].includes(k) ? k : "skin"; },

  _labels() { const l = this._config.labels ?? this._settings().labels; return ["always", "never"].includes(l) ? l : "auto"; },

  _glow() { const g = this._config.glow ?? this._settings().glow; return ["fill", "ring", "glow", "both"].includes(g) ? g : "see"; },

  _collapseOn() { return this._config.collapse_header ?? this._settings().collapseHeader ?? true; },

  _jumpOn() { return this._config.jump_running ?? this._settings().jumpRunning ?? true; },

  _noBlur() { return !!(this._config.no_blur ?? this._settings().noBlur); },

  // Switching from a running activity to another needs a long press (card option hold_switch wins over the shared setting).
  _holdSwitchOn() { return this._config.hold_switch ?? !!this._settings().holdSwitch; },

  _vibrateOn() { return this._config.vibrate ?? !!this._settings().vibrate; },

  _layoutMode(hubId, act) { const m = this._settings().layoutMode?.[hubId]?.[act]; return m === "remote" || m === "keypad" ? m : "auto"; },
};
