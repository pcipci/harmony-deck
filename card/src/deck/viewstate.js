// Remember where you were (0.24.1): room, Activities/Devices, chosen device, folded header and scroll position, per
// browser and dashboard page. Coming back within the time of the setting "Remember the view" (default 2 hours), the
// card opens there again, e.g. after switching apps on a phone. Windows (settings, actions, lock) are never reopened.
// If an activity changed in the meantime (started elsewhere), the remembered view is dropped and the card jumps to
// the running activity as before.

const KEY = "harmony_deck_view";
export const VIEW_CHOICES = [0, 30, 120, 360];      // minutes; 0 = off
const DEFAULT_MIN = 120;

// The remembered view if it may be used now, else null (pure, tested in test/viewstate.test.mjs).
export function viewToRestore(saved, now, minutes, hubs) {
  if (!saved || typeof saved !== "object" || !minutes || typeof saved.at !== "number") return null;
  if (now - saved.at > minutes * 60000 || now < saved.at) return null;
  const ids = new Set(hubs.map((h) => h.id));
  const current = saved.current || {};
  // An activity changed since (started, switched or ended elsewhere): the running one wins.
  if (hubs.some((h) => h.id in current && (current[h.id] || "") !== (h.current || ""))) return null;
  const devices = {};
  for (const [hub, dev] of Object.entries(saved.device || {})) if (ids.has(hub) && typeof dev === "string") devices[hub] = dev;
  const collapsed = {};
  for (const [hub, on] of Object.entries(saved.collapsed || {})) if (ids.has(hub)) collapsed[hub] = !!on;
  return {
    hub: ids.has(saved.hub) ? saved.hub : null,
    mode: saved.mode === "devices" || saved.mode === "activities" ? saved.mode : null,
    device: devices,
    collapsed,
    scroll: Array.isArray(saved.scroll) ? saved.scroll.filter((s) => Array.isArray(s) && s.length === 2 && s.every(Number.isFinite)) : [],
  };
}

export const viewStateMixin = {
  _viewMinutes() {
    const v = this._config.remember_view ?? this._settings().rememberView;
    return VIEW_CHOICES.includes(Number(v)) ? Number(v) : DEFAULT_MIN;
  },

  _viewKey() { return `${KEY}:${window.location.pathname}`; },

  // The scrollable parents of the card, from the card outwards (the same walk as _scrollState in render.js).
  _viewScrollers() {
    const out = [];
    let n = this;
    while (n) { out.push(n); n = n.parentElement || n.getRootNode?.().host || null; }
    out.push(document.scrollingElement);
    return out.filter(Boolean);
  },

  // Called once on the first full render (hub list and configuration known), before the jump to the running activity.
  _viewRestore(hubs) {
    if (this._viewTried) return;
    this._viewTried = true;
    if (this._edit || this._editMode) return;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(this._viewKey()) || "null"); } catch (e) { /* no storage */ }
    const v = viewToRestore(saved, Date.now(), this._viewMinutes(), hubs);
    if (!v) return;
    if (v.hub) this._hubSel = v.hub;
    if (v.mode) this._modeState = v.mode;
    const devs = {};
    for (const [hub, dev] of Object.entries(v.device)) if (this._devicesOf(hub)?.[dev]) devs[hub] = dev;
    if (Object.keys(devs).length) this._device = { ...(this._device || {}), ...devs };
    if (Object.keys(v.collapsed).length) this._hdrCollapsed = { ...(this._hdrCollapsed || {}), ...v.collapsed };
    this._jumped = true;            // the remembered view replaces the jump to the running activity
    this._scrollRemote = false;
    if (v.scroll.length) {
      const put = () => { const els = this._viewScrollers(); v.scroll.forEach(([i, y]) => { if (els[i] && Math.abs(els[i].scrollTop - y) > 1) els[i].scrollTop = y; }); };
      // The page around the card may still be growing: try again a little later.
      [0, 250, 800].forEach((ms) => setTimeout(() => requestAnimationFrame(put), ms));
    }
  },

  _viewSave() {
    if (!this._viewTried || !this._viewMinutes() || this._edit || this._editMode) return;
    const hubs = this._hubs?.() || [];
    const scroll = this._viewScrollers().map((e, i) => [i, e.scrollTop || 0]).filter(([, y]) => y > 0);
    const data = { at: Date.now(), hub: this._hubSel || "", mode: this._modeState || "", device: this._device || {},
      collapsed: this._hdrCollapsed || {}, scroll, current: Object.fromEntries(hubs.map((h) => [h.id, h.current || ""])) };
    try { localStorage.setItem(this._viewKey(), JSON.stringify(data)); } catch (e) { /* storage blocked: the view is not kept */ }
  },

  _viewForget() { try { localStorage.removeItem(this._viewKey()); } catch (e) { /* no storage */ } },
};
