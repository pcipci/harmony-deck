// Media bar (0.25): the media player the user assigned to an activity (Settings > Activities, never automatic).
// Shown below the keys of the running activity, built from what the player can do: title and app, progress with
// "elapsed / total", play / pause / stop, jumps -30 / -10 / +10 / +30 s. Parts the player cannot do are left out.
// The layout follows the remembered abilities of the player (not its state), so nothing jumps when it pauses or
// turns off; a player never seen yet starts with the smallest bar. A Fire TV without title or position shows no bar
// (its remote has the same keys already). Controls go through harmony_deck/media/control.
import { esc } from "../shared/util.js";

export const MF = { PAUSE: 1, SEEK: 2, STOP: 4096, PLAY: 16384 };
const CAPS_KEY = "harmony_deck_mcaps";
const JUMP_ICON = { "-30": "mdi:rewind-30", "-10": "mdi:rewind-10", 10: "mdi:fast-forward-10", 30: "mdi:fast-forward-30" };
const OFF = ["off", "standby", "unavailable", "unknown"];

// 0:42, 12:08, 1:12:08
export function fmtTime(s) {
  if (!Number.isFinite(s) || s < 0) return "–:––";
  s = Math.floor(s);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const p = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(sec)}` : `${m}:${p(sec)}`;
}

// Position in seconds now: reported position plus the time since, while playing; held to the duration.
export function mediaPos(st, now = Date.now()) {
  const a = st?.attributes || {};
  if (!Number.isFinite(a.media_position)) return null;
  let pos = a.media_position;
  if (st.state === "playing" && a.media_position_updated_at) {
    const at = Date.parse(a.media_position_updated_at);
    if (Number.isFinite(at)) pos += Math.max(0, (now - at) / 1000);
  }
  return Number.isFinite(a.media_duration) && a.media_duration > 0 ? Math.min(pos, a.media_duration) : pos;
}

// What the player showed so far (remembered): f = feature bits, t = had a title, p = had a position.
export function mergeSeen(seen, st) {
  const out = { f: seen?.f || 0, t: !!seen?.t, p: !!seen?.p };
  if (!st || OFF.includes(st.state)) return out;
  const a = st.attributes || {};
  out.f |= Number(a.supported_features) || 0;
  if (a.media_title || a.media_series_title) out.t = true;
  if (Number.isFinite(a.media_position) && Number.isFinite(a.media_duration) && a.media_duration > 0) out.p = true;
  return out;
}

// Parts of the bar from the remembered abilities (pure, tested in test/mediabar.test.mjs).
export function barParts(seen, adb) {
  const f = seen?.f || 0;
  const seek = !!(f & MF.SEEK);
  const parts = {
    title: !!seen?.t,
    progress: !!seen?.p,
    seek,
    play: !!(f & (MF.PLAY | MF.PAUSE)),
    pause: !!(f & MF.PAUSE),
    stop: !!(f & MF.STOP),
    jumps: seek || !!adb,
  };
  // Fire TV (ADB) without title or position: its remote already has these keys, so no bar.
  parts.show = adb ? parts.title || parts.progress : parts.title || parts.progress || parts.play || parts.stop || parts.jumps;
  return parts;
}

export const mediaBarMixin = {
  // The assignment of an activity: {entity, bar} or null.
  _actPlayer(hubId, act) {
    const it = this._settings().activityPlayers?.[hubId]?.[act];
    return it?.entity ? { entity: it.entity, bar: it.bar !== false } : null;
  },

  // Fire TV over ADB (androidtv): jumps by key presses, bar only with title or position.
  _isAdbPlayer(entity) {
    const reg = this._hass?.entities?.[entity];
    if (reg?.platform) return reg.platform === "androidtv";
    return this._hass?.states?.[entity]?.attributes?.adb_response !== undefined;
  },

  _mSeen(entity) {
    if (!this._mCaps) {
      try { this._mCaps = JSON.parse(localStorage.getItem(CAPS_KEY) || "{}") || {}; } catch (e) { this._mCaps = {}; }
    }
    const before = this._mCaps[entity];
    const now = mergeSeen(before, this._hass?.states?.[entity]);
    if (JSON.stringify(before) !== JSON.stringify(now)) {
      this._mCaps = { ...this._mCaps, [entity]: now };
      try { localStorage.setItem(CAPS_KEY, JSON.stringify(this._mCaps)); } catch (e) { /* not kept */ }
    }
    return now;
  },

  // Part of the redraw key: what the bars of the running activities show.
  _mediaSig(hubs) {
    return hubs.map((h) => {
      const p = h.current && this._actPlayer(h.id, h.current);
      const st = p && this._hass?.states?.[p.entity];
      const a = st?.attributes || {};
      return p ? [p.entity, p.bar, st?.state, a.media_title, a.media_artist, a.media_series_title, a.app_name, a.media_duration, a.media_position, a.media_position_updated_at, a.supported_features] : null;
    });
  },

  _mediaBarHtml(h, t) {
    if (this._edit || this._config.compact || !h.current || h.starting) return "";
    const p = this._actPlayer(h.id, h.current);
    if (!p || !p.bar) return "";
    const st = this._hass?.states?.[p.entity];
    const parts = barParts(this._mSeen(p.entity), this._isAdbPlayer(p.entity));
    if (!parts.show) return "";
    const a = st?.attributes || {};
    const live = !!st && !OFF.includes(st.state);
    const playing = st?.state === "playing";
    const hub = esc(h.id);
    const key = (act, icon, label, on = false, value = null) => `<button class="key mkey ${on ? "on" : ""}" data-mhub="${hub}" data-mact="${act}" ${value != null ? `data-mval="${value}"` : ""} title="${esc(label)}" ${live ? "" : "disabled"}><ha-icon icon="${icon}"></ha-icon></button>`;
    let title = "";
    if (parts.title) {
      const main = live ? a.media_title || a.media_series_title || a.app_name || "" : "";
      const sub = live ? [a.media_artist || (a.media_title && a.media_series_title) || "", a.app_name && a.app_name !== main ? a.app_name : ""].filter(Boolean).join(" · ") : "";
      title = `<div class="mtitle"><b>${esc(main || (live ? t.mediaNothing : t.mediaOff))}</b><span>${esc(sub || (st?.attributes?.friendly_name || p.entity))}</span></div>`;
    }
    let prog = "";
    if (parts.progress) {
      const dur = live && Number.isFinite(a.media_duration) && a.media_duration > 0 ? a.media_duration : 0;
      const pos = dur ? mediaPos(st) || 0 : 0;
      const v = dur ? Math.round((pos / dur) * 1000) / 10 : 0;
      const text = dur ? `${fmtTime(pos)} / ${fmtTime(dur)}` : "–:–– / –:––";
      const ro = !parts.seek || !dur;
      prog = `<div class="mprog"><div class="mwrap"><input type="range" class="volslider h mseek ${ro ? "ro" : ""}" min="0" max="${Math.max(1, Math.round(dur))}" step="1" value="${Math.round(pos)}" style="--v:${v}" data-mseek="${hub}" aria-label="${esc(t.mediaProgress)}" ${ro ? 'tabindex="-1"' : ""}><span class="mlab" data-mtime>${text}</span></div></div>`;
    }
    const jb = (s) => (parts.jumps ? key("seek_by", JUMP_ICON[s], `${s > 0 ? "+" : "−"}${Math.abs(s)} s`, false, s) : "");
    const keys = [jb(-30), jb(-10),
      parts.play ? key("play", "mdi:play", t.mediaPlay, playing) : "",
      parts.pause ? key("pause", "mdi:pause", t.mediaPause, st?.state === "paused") : "",
      parts.stop ? key("stop", "mdi:stop", t.mediaStop) : "",
      jb(10), jb(30)].join("");
    const tr = keys ? `<div class="transport mtrans">${keys}</div>` : "";
    return `<div class="mbar ${live ? "" : "idle"}" data-mbar="${hub}" ${playing && parts.progress ? "data-mplaying" : ""} data-ment="${esc(p.entity)}">${title}${prog}${tr}</div>`;
  },

  async _mediaSend(hub, action, value) {
    this._buzz?.();
    try { await this._hass.callWS({ type: "harmony_deck/media/control", hub, action, ...(value != null ? { value } : {}) }); } catch (e) { /* the player said no: the bar follows its state */ }
  },

  // Counts the time on every second while playing, without redrawing the card.
  _mediaTick() {
    const root = this.shadowRoot;
    if (!this.isConnected || !root) { clearInterval(this._mTimer); this._mTimer = null; return; }
    const bars = root.querySelectorAll(".mbar[data-mplaying]");
    if (!bars.length) { clearInterval(this._mTimer); this._mTimer = null; return; }
    bars.forEach((bar) => {
      const st = this._hass?.states?.[bar.dataset.ment];
      const dur = st?.attributes?.media_duration;
      const input = bar.querySelector("input[data-mseek]");
      if (!st || !(dur > 0) || !input || this._mDrag === input) return;
      const pos = mediaPos(st) || 0;
      input.value = String(Math.round(pos));
      input.style.setProperty("--v", String(Math.round((pos / dur) * 1000) / 10));
      const lab = bar.querySelector("[data-mtime]");
      if (lab) lab.textContent = `${fmtTime(pos)} / ${fmtTime(dur)}`;
    });
  },

  _bindMedia(root) {
    root.querySelectorAll("button[data-mact]").forEach((b) => b.addEventListener("click", () => {
      if (this._edit) return;
      const v = b.dataset.mval != null ? Number(b.dataset.mval) : null;
      this._mediaSend(b.dataset.mhub, b.dataset.mact, v);
    }));
    root.querySelectorAll("input[data-mseek]").forEach((el) => {
      if (el.classList.contains("ro")) { el.addEventListener("pointerdown", (e) => e.preventDefault()); el.addEventListener("keydown", (e) => e.preventDefault()); return; }
      const show = () => {
        const max = Number(el.max) || 1;
        el.style.setProperty("--v", String(Math.round((Number(el.value) / max) * 1000) / 10));
        const lab = el.parentElement.querySelector("[data-mtime]");
        if (lab) lab.textContent = `${fmtTime(Number(el.value))} / ${fmtTime(max)}`;
      };
      el.addEventListener("pointerdown", () => { this._mDrag = el; });
      el.addEventListener("input", () => { this._mDrag = el; show(); });
      el.addEventListener("change", () => {
        this._mDrag = null;
        this._mediaSend(el.dataset.mseek, "seek_to", Number(el.value));
      });
      ["pointerup", "pointercancel"].forEach((ev) => el.addEventListener(ev, () => { setTimeout(() => { if (this._mDrag === el) this._mDrag = null; }, 400); }));
    });
    clearInterval(this._mTimer);
    this._mTimer = root.querySelector(".mbar[data-mplaying]") ? setInterval(() => this._mediaTick(), 1000) : null;
  },
};
