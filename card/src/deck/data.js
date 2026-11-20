// Data access of the main card: hub knowledge from the integration, shared settings, sending commands.
import { ALIASES } from "../shared/commands.js";

export const dataMixin = {
  // Optional: hold each key for a moment (config `hold_secs`), helps hosts that miss very short key presses.
  _holdOpt() { const v = Number(this._config.hold_secs); return v > 0 ? { hold_secs: v } : {}; },

  _send(hub, device, command) {
    if (!command) return;
    this._buzz();
    this._sendCmd(hub, device, command, Array.isArray(command) ? { delay_secs: 0.15 } : {});
  },

  // Hub knowledge from the integration: per hub {name, activities: {A: {volume, nav, channel, transport}}, devices: {D: [commands]}}
  // and shared settings {hidden: {hub: [..]}, skin, names: {hub: label}}.
  async _loadInfo() {
    try {
      const req = this._profileReq();
      this._info = await this._hass.callWS({ type: "harmony_deck/info", ...(req ? { profile: req } : {}) });
    } catch (e) {
      this._info = { hubs: {}, settings: {} };
    }
    this._takePackages(this._info.packages);
    this._key = "";
    this.hass = this._hass;
    this._prune();
  },

  // Removes settings that point to activities, devices or commands the hub no longer has.
  async _prune() {
    if (!this._hass?.user?.is_admin) return;
    const st = this._settings();
    const patch = {};
    const states = this._hass.states || {};
    const hidden = {};
    let changed = false;
    for (const [hub, list] of Object.entries(st.hidden || {})) {
      const known = states[hub]?.attributes?.activity_list;
      if (!Array.isArray(known) || !known.length) { hidden[hub] = list; continue; }
      const keep = list.filter((n) => known.includes(n));
      if (keep.length !== list.length) changed = true;
      if (keep.length) hidden[hub] = keep; else changed = true;
    }
    if (changed) patch.hidden = hidden;
    const favs = {};
    let favChanged = false;
    for (const [hub, devs] of Object.entries(st.favorites || {})) {
      const known = this._info?.hubs?.[hub]?.devices;
      if (!known || !Object.keys(known).length) { favs[hub] = devs; continue; }
      for (const [dev, cmds] of Object.entries(devs)) {
        if (!known[dev]) { favChanged = true; continue; }
        const keep = cmds.filter((c) => known[dev].includes(c));
        if (keep.length !== cmds.length) favChanged = true;
        if (keep.length) (favs[hub] ||= {})[dev] = keep; else favChanged = true;
      }
    }
    if (favChanged) patch.favorites = favs;
    const links = {};
    let linkChanged = false;
    for (const [hub, list] of Object.entries(st.links || {})) {
      const known = states[hub]?.attributes?.activity_list;
      if (!Array.isArray(known) || !known.length) { links[hub] = list; continue; }
      const keep = list.filter((l) => known.includes(l.activity)).map((l) => ({ ...l, lockActivities: (l.lockActivities || []).filter((a) => known.includes(a)) }));
      if (JSON.stringify(keep) !== JSON.stringify(list)) linkChanged = true;
      if (keep.length) links[hub] = keep;
    }
    if (linkChanged) patch.links = links;
    // Favourites of activities: drop activities the hub no longer has and commands a device no longer knows.
    const actFavs = {};
    let actFavChanged = false;
    for (const [hub, acts] of Object.entries(st.activityFavs || {})) {
      const knownActs = states[hub]?.attributes?.activity_list;
      const knownDevs = this._info?.hubs?.[hub]?.devices;
      if (!Array.isArray(knownActs) || !knownActs.length || !knownDevs || !Object.keys(knownDevs).length) { actFavs[hub] = acts; continue; }
      for (const [act, list] of Object.entries(acts || {})) {
        const keep = knownActs.includes(act) ? (list || []).filter((x) => knownDevs[x.d]?.includes(x.c)) : [];
        if (keep.length !== (list || []).length) actFavChanged = true;
        if (keep.length) (actFavs[hub] ||= {})[act] = keep;
      }
    }
    if (actFavChanged) patch.activityFavs = actFavs;
    if (Object.keys(patch).length) await this._saveSettings(patch);
  },

  _settings() { return this._info?.settings || {}; },

  _hubs() {
    const states = this._hass?.states || {};
    const ids = this._config.entity ? [this._config.entity]
      : Object.keys(states).filter((id) => id.startsWith("remote.") && Array.isArray(states[id].attributes.activity_list));
    const list = ids.filter((id) => states[id]).map((id) => {
      const s = states[id], a = s.attributes;
      return {
        id, state: s.state, list: a.activity_list || [],
        name: this._settings().names?.[id] || this._info?.hubs?.[id]?.area?.name || String(a.friendly_name || id).trim(),   // own name, else the room (area), else the hub name
        current: s.state === "on" ? a.current_activity : null,
        starting: a.activity_starting && a.activity_starting !== "PowerOff" ? a.activity_starting : null,
        areaIcon: this._info?.hubs?.[id]?.area?.icon || "",
      };
    });
    return this._sortRooms(list);
  },

  // Rooms by floor (lowest first), then by area name; hubs without an area keep their order at the end. Card option `sort_rooms: false` keeps the old order.
  _sortRooms(list) {
    if (list.length < 2 || this._config.sort_rooms === false) return list;
    const area = (id) => this._info?.hubs?.[id]?.area;
    const level = (id) => { const a = area(id); return !a ? 1000 : typeof a.level === "number" ? a.level : 500; };
    return list.map((h, i) => [h, i]).sort(([a, i], [b, j]) => level(a.id) - level(b.id) || String(area(a.id)?.name || "").localeCompare(String(area(b.id)?.name || ""), undefined, { sensitivity: "base" }) || i - j).map(([h]) => h);
  },

  _lang() { return String(this._config.language || this._hass?.locale?.language || this._hass?.language || "en").slice(0, 2).toLowerCase(); },

  _t() { return this._text; },

  _hidden(hubId) {
    return new Set([...(this._config.hide || []), ...(this._settings().hidden?.[hubId] || [])]);
  },

  _roles(hubId, activity) {
    const fromHub = this._info?.hubs?.[hubId]?.activities?.[activity] || {};
    const cfg = this._config.keys?.[hubId];
    const manual = cfg ? { ...(cfg.default || {}), ...(cfg[activity] || {}) } : {};
    const r = { ...fromHub, ...manual };
    r.transport = r.transport || r.nav;
    return r;
  },

  _cmd(hubId, device, action) {
    if (!device) return null;
    const known = this._info?.hubs?.[hubId]?.devices?.[device];
    const names = ALIASES[action] || [action];
    if (!known) return names[0]; // no command list: assume the standard name
    return names.find((n) => known.includes(n)) || null;
  },

  // The Fire TV sleeps in standby or in the screensaver; then the first key only wakes it. So wake it first, wait a moment and send the key.
  _fireAsleep(entity) {
    const st = this._hass?.states?.[entity];
    if (!st) return false;
    return ["standby", "off"].includes(st.state) || /screensaver|daydream|somnambulator|dreams/i.test(String(st.attributes?.app_id || st.attributes?.app_name || ""));
  },

  _adb(entity, command) {
    this._buzz();
    const send = () => this._hass.callService("androidtv", "adb_command", { entity_id: entity, command });
    if (this._fireAsleep(entity) && !/keyevent (223|224)\b/.test(String(command))) {
      this._hass.callService("androidtv", "adb_command", { entity_id: entity, command: "input keyevent 224" });
      setTimeout(send, 800);
      return;
    }
    send();
  },

  _buzz(ms = 15) { if (this._vibrateOn() && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* not supported */ } },

  _has(hubId, device, action) { return !!this._cmd(hubId, device, action) || !!this._adbCode(hubId, device, action); },

  // Keys the user hid for a device (own list per hub, separate from the lock); the editor in hide mode still sees everything.
  _hiddenKeys(hubId, dev) { return this._settings().hideKeys?.[hubId]?.[dev] || []; },
  _hideMode() { return this._editMode === "favs" && this._favKind === "hide"; },

  _devicesOf(hubId) {
    const all = this._devicesRaw(hubId);
    const hide = this._settings().hideKeys?.[hubId];
    if (!hide || this._hideMode()) return all;
    return Object.fromEntries(Object.entries(all).map(([d, c]) => [d, hide[d]?.length ? c.filter((x) => !hide[d].includes(x)) : c]));
  },

  _devicesRaw(hubId) {
    const fromHub = this._info?.hubs?.[hubId]?.devices;
    if (fromHub && Object.keys(fromHub).length) return fromHub;
    const cfg = this._config.devices?.[hubId];
    return cfg ? Object.fromEntries(Object.entries(cfg).map(([d, c]) => [d, c.map((x) => (typeof x === "string" ? x : x.command))])) : {};
  },

  async _saveSettings(patch) {
    const settings = { ...this._settings(), ...patch };
    this._info = { ...(this._info || { hubs: {} }), settings };
    try { await this._hass.callWS({ type: "harmony_deck/save_settings", settings, profile: this._prof().active }); } catch (e) { /* kept for this session only */ }
    this._key = "";
    this.hass = this._hass;
  },
};
