// Lock symbol of the main card: shows whether the lock of a hub works right now.
// The main card only reads the state of the entity "Lock active"; everything else about the lock is in the security card.
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

export const lockMarkMixin = {
  // {on, until} of a hub's lock, or null if it is off (or the integration has no lock).
  _lockInfo(hubId) {
    const id = this._info?.lock?.[hubId]?.entities?.lock_active;
    const st = id && this._hass?.states?.[id];
    if (!st) return null;
    const until = st.attributes?.released_until || null;
    if (st.state !== "on" && !until) return null;
    return { on: st.state === "on", until };
  },

  // Tap on the lock symbol opens the dashboard page with the security card (option security_path).
  _bindLockMark(root) {
    const path = this._config.security_path;
    if (!path) return;
    root.querySelectorAll("[data-secnav]").forEach((el) => el.addEventListener("click", (e) => {
      e.stopPropagation();
      window.history.pushState(null, "", path);
      window.dispatchEvent(new CustomEvent("location-changed", { bubbles: true, composed: true, detail: { replace: false } }));
    }));
  },

  // Activities the security lock does not allow right now (empty while the lock does not work).
  // The allowed list is an attribute of the entity "Lock active", so a change in the security card shows up at once.
  _secLocked(hubId) {
    if (!this._lockInfo(hubId)?.on) return new Set();
    const st = this._hass?.states?.[this._info?.lock?.[hubId]?.entities?.lock_active];
    const allowed = new Set(st?.attributes?.allowed_activities || []);
    const all = this._hubs().find((h) => h.id === hubId)?.list || [];
    return new Set(all.filter((a) => a !== "PowerOff" && !allowed.has(a)));
  },

  _lockMark(hubId, t) {
    const l = this._lockInfo(hubId);
    if (!l) return "";
    const link = this._config.security_path ? ' data-secnav role="link"' : "";
    if (l.on) return `<span class="lockmark on"${link} title="${esc(t.lockOn)}"><ha-icon icon="mdi:lock"></ha-icon></span>`;
    const d = new Date(l.until);
    const tm = isNaN(d) ? "" : d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return `<span class="lockmark free"${link} title="${esc(fmtText(t.lockFreeUntil, [tm]))}"><ha-icon icon="mdi:lock-open-variant-outline"></ha-icon><small>${esc(tm)}</small></span>`;
  },
};
