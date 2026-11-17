// Security card, data: asks the integration for the state of the lock and sends changes to it.

export const securityDataMixin = {
  async _load() {
    if (this._loading) { this._again = true; return; }
    this._loading = true;
    try {
      this._data = await this._hass.callWS({ type: "harmony_deck/lock/get" });
    } catch (e) {
      this._data = { hubs: {}, packages: {}, available: false, admin: false };
    }
    this._loading = false;
    this._key = "";
    this._watched = this._watchKey();
    this._render();
    if (this._again) { this._again = false; this._load(); }
  },

  // Sends one change; the answer is the new state of all hubs.
  async _call(type, args) {
    try {
      this._data = await this._hass.callWS({ type: `harmony_deck/lock/${type}`, ...args });
      this._error = "";
    } catch (e) {
      this._error = e?.message || e?.code || "error";
    }
    this._key = "";
    this._watched = this._watchKey();
    this._render();
  },

  async _test(hub) {
    try { this._testRes = { ...(this._testRes || {}), [hub]: await this._hass.callWS({ type: "harmony_deck/lock/test", hub }) }; this._error = ""; } catch (e) { this._error = e?.message || e?.code || "error"; }
    this._key = ""; this._render();
  },

  // Copies text to the clipboard; the button shows a check mark for a moment.
  async _copy(btn) {
    const t = this._text;
    const text = btn.dataset.copy;
    let ok = false;
    try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
      try {
        const ta = document.createElement("textarea");
        ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select(); ok = document.execCommand("copy"); ta.remove();
      } catch (e2) { ok = false; }
    }
    const icon = btn.querySelector("ha-icon");
    if (icon) { icon.setAttribute("icon", ok ? "mdi:check" : "mdi:alert-circle-outline"); btn.title = ok ? t.sec.dbgCopied : text; setTimeout(() => icon.setAttribute("icon", "mdi:content-copy"), 1500); }
  },

  _set(hub, patch) { return this._call("set", { hub, ...patch }); },

  async _readApps(entity) {
    this._appsMsg = { ...(this._appsMsg || {}), [entity]: this._text.pkgWait };
    this._key = ""; this._render();
    let res = null;
    try { res = await this._hass.callWS({ type: "harmony_deck/fire_apps", entity_id: entity, refresh: true }); } catch (e) { res = null; }
    this._appsMsg = { ...this._appsMsg, [entity]: res?.ok ? this._text.pkgFound.replace("{0}", res.list.length) : this._text.pkgNone };
    await this._load();
  },

  // Hubs to show: all, or the one of the card option `entity`.
  _hubs() {
    const all = Object.entries(this._data?.hubs || {}).map(([id, h]) => ({ id, ...h }));
    return this._config.entity ? all.filter((h) => h.id === this._config.entity) : all;
  },

  // States the card depends on: the lock entities of every hub and what runs on the Fire TV.
  _watchKey() {
    const st = this._hass?.states || {};
    return JSON.stringify(Object.values(this._data?.hubs || {}).map((h) => [
      Object.values(h.entities || {}).map((id) => [st[id]?.state, st[id]?.attributes?.today]),
      h.fire_entity ? [st[h.fire_entity]?.state, st[h.fire_entity]?.attributes?.app_id] : null,
    ]));
  },

  _admin() { return !!this._data?.admin; },
};
