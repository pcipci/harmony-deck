// Decoration of the effect skins (see shared/skin-css.js): glass reflection and torn band (terminal),
// dial with magic eye (radio). The eye follows the volume of the running activity's device.

export const skinDecorMixin = {
  _skinHead(skin, h) {
    if (skin !== "radio") return "";
    const name = this._config.title ?? h?.name ?? "";
    const idx = h?.current ? Math.max(0, (h.list || []).indexOf(h.current)) : 0;
    const needle = h?.current && h.current !== "PowerOff" ? 12 + (idx * 17) % 76 : 8;
    return `<div class="skin-head"><div class="skin-dial"><b>${String(name).replace(/[<>&"]/g, "")}</b><i style="--needle:${needle}%"></i></div><div class="skin-eye" style="--eye:${this._eyeLevel(h)}"></div></div>`;
  },

  _skinTail(skin) {
    return skin === "terminal" ? '<div class="skin-tear"></div><div class="skin-glare"></div>' : "";
  },

  // Volume 0..1 of the device the volume slider belongs to, else of any linked player that reports one; half open if there is none.
  _eyeLevel(h) {
    const s = this._sl?.[h?.id];
    const entities = [s?.activity?.entity, ...Object.values(this._settings().directDevices?.[h?.id] || {}).map((l) => l.entity)];
    for (const e of entities) {
      const v = e && this._hass?.states?.[e]?.attributes?.volume_level;
      if (typeof v === "number") return Math.min(1, Math.max(0, v)).toFixed(2);
    }
    return "0.5";
  },

  // The eye follows the volume without redrawing the card.
  _eyeUpdate(hubs) {
    const el = this.shadowRoot?.querySelector(".skin-eye");
    if (!el) return;
    const h = hubs.find((x) => x.id === this._hubSel) || hubs[0];
    el.style.setProperty("--eye", this._eyeLevel(h));
  },
};
