// State of linked devices and sending power commands: logic shared by all skins (skins only draw, see skin-decor.js).

export const deviceStateMixin = {
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

  // State of a device from its linked player: true = on, false = off, null = not known (no link, unavailable).
  _powerState(hub, dev) {
    const link = this._settings().directDevices?.[hub]?.[dev];
    const st = link ? this._hass?.states?.[link.entity]?.state : null;
    if (!st || ["unavailable", "unknown"].includes(st)) return null;
    return !["off", "standby"].includes(st);
  },

  // What makes the card redraw: state, source, mute and the pending switch of EVERY player linked to a device of the hub
  // (not only those of the running activity: a device Harmony thinks is inactive must still follow its player) and of the activity links.
  _watched(h) {
    const out = [];
    const seen = new Set();
    const add = (entity, device) => {
      if (!entity || seen.has(entity)) return;
      seen.add(entity);
      const e = this._hass?.states?.[entity];
      out.push([entity, e?.state, e?.attributes?.source, e?.attributes?.source_list?.length, e?.attributes?.is_volume_muted, e?.attributes?.app_id, device ? this._powerPending(h.id, device) : null]);
    };
    for (const [device, l] of Object.entries(this._settings().directDevices?.[h.id] || {})) add(l.entity, device);
    for (const l of this._links(h)) add(l.entity, l.device);
    return out;
  },

  // Player of a Harmony device that can be addressed directly now (linked, reachable), with its supported feature bits; else null.
  _reach(hub, dev) {
    const link = this._settings().directDevices?.[hub]?.[dev];
    const st = link ? this._hass?.states?.[link.entity] : null;
    if (!st || ["unavailable", "unknown"].includes(st.state)) return null;
    return { entity: link.entity, state: st.state, attrs: st.attributes || {}, features: Number(st.attributes?.supported_features) || 0, link };
  },

  // Commands that go straight to the player when it is reachable and reports the capability; Harmony stays the fallback.
  // "On" never goes this way (the device may be off or in WLAN sleep and only Harmony can wake it).
  _directRoute(hub, dev, command) {
    if (Array.isArray(command)) return null;
    const r = this._reach(hub, dev);
    if (!r) return null;
    const has = (bit) => !!(r.features & bit);
    const c = String(command).toLowerCase();
    if (c === "poweroff" && has(256)) return { service: "turn_off", data: {} };
    if (c === "mute" && has(8)) return { service: "volume_mute", data: { is_volume_muted: !r.attrs.is_volume_muted } };
    if (r.link.volumeDirect === true && has(1024) && (c === "volumeup" || c === "volumedown")) return { service: c === "volumeup" ? "volume_up" : "volume_down", data: {} };
    if (c === "play" && has(16384)) return { service: "media_play", data: {} };
    if (c === "pause" && has(1)) return { service: "media_pause", data: {} };
    if (c === "stop" && has(4096)) return { service: "media_stop", data: {} };
    return null;
  },

  // Send one command of a Harmony device: directly if possible, else over the hub.
  _sendCmd(hub, device, command, extra = {}) {
    const route = this._directRoute(hub, device, command);
    if (route) { this._hass.callService("media_player", route.service, { entity_id: this._reach(hub, device).entity, ...route.data }); return; }
    this._hass.callService("remote", "send_command", { entity_id: hub, device, command, ...extra, ...this._holdOpt() });
  },

  // Target state of a switch that was just pressed and is not confirmed by the device yet (null = nothing pending).
  _powerPending(hub, dev) {
    const p = this._pwrPend?.[`${hub}/${dev}`];
    if (!p) return null;
    const real = this._powerState(hub, dev);
    if (Date.now() - p.at > 20000 || real === p.on) { delete this._pwrPend[`${hub}/${dev}`]; return null; }
    return p.on;
  },

  // The switch sends On/Off itself and flips at once; the lamp shows "switching" until the device confirms (or 20 s pass).
  _swPowerSend(hub, device, on) {
    this._pwrPend = { ...(this._pwrPend || {}), [`${hub}/${device}`]: { on, at: Date.now() } };
    this._buzz();
    this._sendCmd(hub, device, on ? "PowerOn" : "PowerOff");
    clearTimeout(this._pwrT);
    this._pwrT = setTimeout(() => { this._key = ""; this._rerender?.(); }, 20500);
  },
};
