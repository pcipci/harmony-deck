// Decoration of the effect skins (see shared/skin-css.js): glass reflection and torn band (terminal),
// dial with magic eye (radio). The eye follows the volume of the running activity's device.

export const skinDecorMixin = {
  _skinHead(skin, h) {
    if (skin !== "radio") return "";
    const clean = (x) => String(x ?? "").replace(/[<>&"]/g, "");
    const name = clean(this._config.title ?? h?.name);   // the room (area), see _hubs
    // The needle sits where the running activity is on the dial (spread over the list) and its name stands next to it.
    const acts = (h?.list || []).filter((a) => a !== "PowerOff");
    const idx = h?.current ? acts.indexOf(h.current) : -1;
    const run = idx >= 0;
    const needle = run ? 10 + (acts.length > 1 ? (idx / (acts.length - 1)) * 80 : 40) : 6;
    const lab = run ? `<span class="skin-sta ${needle > 62 ? "left" : ""}" style="--needle:${needle}%">${clean(h.current)}</span>` : "";
    return `<div class="skin-head"><div class="skin-dial"><b>${name}</b>${lab}<i style="--needle:${needle}%"></i></div><div class="skin-eye" style="--eye:${this._eyeLevel(h)}"></div></div>`;
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

  // State of a device from its linked player: true = on, false = off, null = not known (no link, unavailable).
  _powerState(hub, dev) {
    const link = this._settings().directDevices?.[hub]?.[dev];
    const st = link ? this._hass?.states?.[link.entity]?.state : null;
    if (!st || ["unavailable", "unknown"].includes(st)) return null;
    return !["off", "standby"].includes(st);
  },

  // Tube radio, device view: On/Off as a sunken brass button in a bezel with a lamp behind (known state), see _bindSkinDecor.
  _powerKnob(hub, dev, on) {
    const a = `data-swpwr data-hub="${hub.replace(/"/g, "")}" data-device="${String(dev).replace(/"/g, "&quot;")}"`;
    return `<span class="pwknob ${on ? "on" : ""}"><button type="button" class="knob" ${a} aria-pressed="${on ? "true" : "false"}"><ha-icon icon="mdi:power"></ha-icon></button></span>`;
  },

  // The collapsed header no longer sticks (0.16): the offset below the Home Assistant bar was wrong in views with tabs and pushed it over the keys.
  _bindStickyHeader() { if (this._stickFn) window.removeEventListener("scroll", this._stickFn, true); this._stickFn = null; },

  _bindSkinDecor(root) {
    this._bindStickyHeader(root);
    root.querySelectorAll("button[data-swpwr]").forEach((el) => el.addEventListener("click", () => {
      const { hub, device } = el.dataset;
      const on = el.getAttribute("aria-pressed") !== "true";
      el.setAttribute("aria-pressed", on ? "true" : "false");
      el.parentElement.classList.toggle("on", on);
      this._swPowerSend(hub, device, on);
    }));
  },

  // The switch sends On/Off itself. (Up to 0.15.4 it "clicked" the hidden On/Off key, but keys send on pointerdown,
  // so a click never reached them and the switch did nothing.)
  _swPowerSend(hub, device, on) {
    this._pwrLast = { ...(this._pwrLast || {}), [`${hub}/${device}`]: on };
    this._buzz();
    this._hass.callService("remote", "send_command", { entity_id: hub, device, command: on ? "PowerOn" : "PowerOff", ...this._holdOpt() });
  },
};
