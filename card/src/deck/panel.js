// Remote panel: D-pad, volume, channel, transport, colour keys.
import { esc } from "../shared/util.js";

export const panelMixin = {
  _key_(hubId, device, action, icon, cls = "", label = "", sub = "") {
    const cmd = this._cmd(hubId, device, action);
    const ad = this._adbCode(hubId, device, action);
    const inner = `${icon ? `<ha-icon icon="${icon}"></ha-icon>` : ""}${label && !icon ? esc(label) : ""}${sub ? `<span class="sub">${esc(sub)}</span>` : ""}`;
    if (ad && (!cmd || ad.prefer)) return `<button class="key adbk ${cls} ${action === "mute" ? "once" : ""}" data-adb="${esc(ad.entity)}" data-adbcmd="${esc(ad.cmd || `input keyevent ${ad.code}`)}" ${label || sub ? `title="${esc(label || sub)}"` : ""}>${inner}</button>`;
    if (!cmd) return `<span class="key ghost ${cls}"></span>`;
    return `<button class="key ${cls} ${action === "mute" ? "once" : ""}" data-hub="${esc(hubId)}" data-device="${esc(device)}" data-cmd="${esc(cmd)}" ${label || sub ? `title="${esc(label || sub)}"` : ""}>${inner}</button>`;
  },

  // Key that always goes over ADB (Fire TV without a running Harmony activity); falls back to the normal key.
  _adbKey(hubId, device, action, icon, cls = "", label = "") {
    const ad = this._adbCode(hubId, device, action);
    if (!ad) return this._key_(hubId, device, action, icon, cls, label);
    return `<button class="key adbk ${cls}" data-adb="${esc(ad.entity)}" data-adbcmd="${esc(ad.cmd || `input keyevent ${ad.code}`)}" ${label ? `title="${esc(label)}"` : ""}>${icon ? `<ha-icon icon="${icon}"></ha-icon>` : ""}${label && !icon ? esc(label) : ""}</button>`;
  },

  // A key for a raw command name (disc keys etc.), same look as the other side keys.
  _cmdKey(hubId, device, cmd, icon, cls, sub) {
    return `<button class="key ${cls}" data-hub="${esc(hubId)}" data-device="${esc(device)}" data-cmd="${esc(cmd)}" title="${esc(sub || cmd)}"><ha-icon icon="${icon}"></ha-icon>${sub ? `<span class="sub">${esc(sub)}</span>` : ""}</button>`;
  },

  // Disc player keys the device really has (Eject, disc menu, subtitles, ...); empty for other devices.
  _discKeys(hubId, dev) {
    const cmds = this._devicesOf(hubId)[dev] || [];
    // [pattern, icon, text key, disc-specific?]
    const defs = [[/^(Eject|OpenClose|Open\/Close|OpenCloseTray)$/i, "mdi:eject", "discEject", 1], [/^(Disc.?Menu|DVD.?Menu|Root.?Menu|Title.?Menu|Title)$/i, "mdi:disc", "discMenu", 1], [/^Top.?Menu$/i, "mdi:menu", "discTop", 1],
      [/^Pop.?up(.?Menu)?$/i, "mdi:dock-window", "discPopup", 1], [/^(Subtitles?|Sub.?Title|Caption)$/i, "mdi:subtitles-outline", "discSub", 0], [/^(Audio|AudioLang|Language)$/i, "mdi:account-voice", "discAudio", 0],
      [/^Angle$/i, "mdi:video-vintage", "discAngle", 1], [/^(Info|Display)$/i, "mdi:information-outline", "discInfo", 0]];
    const out = defs.map(([re, ic, k, sp]) => { const c = cmds.find((x) => re.test(x)); return c ? { c, ic, k, sp } : null; }).filter(Boolean);
    const discy = /blu-?ray|dvd|disc|\bbd\b|cd.?player/i.test(dev);
    const specific = out.filter((d) => d.sp).length;
    return (discy ? out.length >= 1 : specific >= 2) ? out.slice(0, 8) : [];
  },

  // Remote panel for a set of roles {volume, nav, channel, transport} (devices that serve the keys).
  _panelHtml(h, r, t, extraIn = "") {
    const extra = typeof extraIn === "string" ? { small: "", big: extraIn } : extraIn;
    // The key locks of the links apply to the remote of a running activity only, never to the device view (direct control of a device).
    const lockKeys = extra.noLock ? new Set() : this._locks(h).keys;
    const L = (role, html) => (lockKeys.has(role) && html ? html.replace('class="', 'class="locked ') : html);
    const K = (dev, a, icon, cls, label) => (extra.forceAdb && dev === r.nav ? this._adbKey(h.id, dev, a, icon, cls, label) : this._key_(h.id, dev, a, icon, cls, label));
    const slH = this._volSlider(h, r, "h"), slV = this._volSlider(h, r, "v");
    const hasVol = r.volume && (slH || this._has(h.id, r.volume, "volume_up"));
    const muteK = r.volume && this._has(h.id, r.volume, "mute") ? K(r.volume, "mute", "mdi:volume-mute", "rk mute round") : "";
    const vol = hasVol ? `<div class="volcol">${slV ? `<div class="rocker slr">${slV}</div>` : `<div class="rocker">
        ${K(r.volume, "volume_up", "mdi:volume-plus", "rk")}
        ${K(r.volume, "volume_down", "mdi:volume-minus", "rk")}</div>`}${muteK}</div>` : "";
    if (this._config.compact && !this._config.compact_dpad) {
      return vol ? `<div class="compactvol"><div class="hrow">${slH || K(r.volume, "volume_down", "mdi:volume-minus")}${K(r.volume, "mute", "mdi:volume-mute", "mute")}${slH ? "" : K(r.volume, "volume_up", "mdi:volume-plus")}</div></div>` : "";
    }
    const dirs = r.nav ? ["up", "down", "left", "right"].filter((a) => this._has(h.id, r.nav, a)) : [];
    const hasOk = !!(r.nav && this._has(h.id, r.nav, "ok"));
    const hasNav = dirs.length > 0 || hasOk;
    const fullPad = dirs.length === 4;
    const hasCh = !!(r.channel && this._has(h.id, r.channel, "channel_up"));
    const ch = hasCh ? `<div class="rocker">
        ${K(r.channel, "channel_up", "mdi:chevron-up", "rk")}
        <span class="rl" title="${t.channel}">P</span>
        ${K(r.channel, "channel_down", "mdi:chevron-down", "rk")}</div>` : `<div class="rocker none"></div>`;
    const KS = (dev, a, icon, sub) => this._key_(h.id, dev, a, icon, "tall", "", sub);
    const hasPills = !!r.nav && ["back", "home", "menu"].some((a) => this._has(h.id, r.nav, a));
    const pills = hasPills ? `<div class="pills">${K(r.nav, "back", "mdi:arrow-u-left-top", "pill", t.back)}${K(r.nav, "home", "mdi:home-outline", "pill", t.home)}${K(r.nav, "menu", "mdi:menu", "pill", t.menu)}</div>` : "";
    const mpIcon = { up: "mdi:chevron-up", down: "mdi:chevron-down", left: "mdi:chevron-left", right: "mdi:chevron-right" };
    const mpOrder = ["up", "left", "ok", "right", "down"].filter((a) => (a === "ok" ? hasOk : dirs.includes(a)));
    const horiz = dirs.includes("left") || dirs.includes("right");
    // Incomplete cross (e.g. a candle with only up/down/select): just the keys that exist, no empty segments.
    const nav = hasNav && !fullPad ? `<div class="padwrap"><div class="minipad ${horiz ? "h" : "v"}">${mpOrder.map((a) => (a === "ok" ? K(r.nav, "ok", "", "mp ok", "OK") : K(r.nav, a, mpIcon[a], "mp"))).join("")}</div></div>` : hasNav ? `<div class="padwrap">
        <div class="dpad">
          ${K(r.nav, "up", "mdi:chevron-up", "d up")}${K(r.nav, "left", "mdi:chevron-left", "d left")}
          ${K(r.nav, "ok", "", "d ok", "OK")}
          ${K(r.nav, "right", "mdi:chevron-right", "d right")}${K(r.nav, "down", "mdi:chevron-down", "d down")}
        </div></div>` : "";
    const tr = r.transport && ["play", "pause", "stop", "rewind", "forward"].some((a) => this._has(h.id, r.transport, a)) ? `<div class="transport">
        ${["rewind", "play", "pause", "stop", "forward"].map((a) => this._has(h.id, r.transport, a)
          ? K(r.transport, a, { rewind: "mdi:rewind", play: "mdi:play", pause: "mdi:pause", stop: "mdi:stop", forward: "mdi:fast-forward" }[a]) : "").join("")}</div>` : "";
    const dcfg = r.nav ? this._directFor(h.id, r.nav) : null;
    const kmap = dcfg?.keymap || {};
    const mapApp = (c) => this._appsOf(h.id).find((a) => a.name === kmap[c]);
    const colors = dcfg && ["red", "green", "yellow", "blue"].some((c) => mapApp(c)) ? `<div class="colors">
        ${["red", "green", "yellow", "blue"].map((c) => { const a = mapApp(c); return a ? `<button class="key color ${c}" title="${esc(a.name)}" data-adb="${esc(dcfg.entity)}" data-adbcmd="${esc(a.cmd)}"><span>${esc(a.abbr || a.name.slice(0, 3))}</span></button>` : `<span class="key ghost ${c}"></span>`; }).join("")}</div>` : r.nav && ["red", "green", "yellow", "blue"].every((c) => this._has(h.id, r.nav, c)) ? `<div class="colors">
        ${["red", "green", "yellow", "blue"].map((c) => `<button class="key color ${c}" data-hub="${esc(h.id)}" data-device="${esc(r.nav)}" data-cmd="${this._cmd(h.id, r.nav, c)}"></button>`).join("")}</div>` : "";
    // Keyboard device in the activity: compact keyboard with a full-height volume strip instead of the TV remote.
    const kbCmds = !this._config.compact && r.nav ? this._devicesOf(h.id)[r.nav] : null;
    const kbAct = kbCmds ? this._keyboard(h, r.nav, kbCmds, t, { compact: true }) : null;
    if (kbAct) {
      const kv = hasVol ? `<div class="kbvol">${slV || K(r.volume, "volume_up", "mdi:volume-plus", "kvk")}${this._has(h.id, r.volume, "mute") ? K(r.volume, "mute", "mdi:volume-mute", "kvk mute") : ""}${slV ? "" : K(r.volume, "volume_down", "mdi:volume-minus", "kvk")}</div>` : "";
      return `<div class="pwrap"><div class="pcol"><div class="kbact">${L("volume", kv)}${L("nav", kbAct.html)}</div></div><div class="pside">${extra.small || ""}</div></div><div class="xwide">${extra.big || ""}</div>`;
    }
    // Only volume (games consoles, controlled elsewhere): one wide row instead of an empty remote.
    if (hasVol && !hasNav && !hasCh) {
      const bar = `<div class="volbar">${slH || K(r.volume, "volume_down", "mdi:volume-minus")}${muteK ? K(r.volume, "mute", "mdi:volume-mute", "mute") : ""}${slH ? "" : K(r.volume, "volume_up", "mdi:volume-plus")}</div>`;
      return `<div class="pwrap"><div class="pcol">${L("volume", bar)}${L("transport", tr)}</div><div class="pside">${extra.small || ""}</div></div><div class="xwide">${extra.big || ""}</div>`;
    }
    const disc = hasNav ? this._discKeys(h.id, r.nav) : [];
    const discCol = disc.length ? `<div class="sidecol">${disc.map((d) => this._cmdKey(h.id, r.nav, d.c, d.ic, "tall", t[d.k] || d.k)).join("")}</div>` : "";
    const pillCol = hasPills && hasNav && !hasCh && !discCol ? `<div class="sidecol">${KS(r.nav, "back", "mdi:arrow-u-left-top", t.back)}${KS(r.nav, "home", "mdi:home-outline", t.home)}${KS(r.nav, "menu", "mdi:menu", t.menu)}</div>` : "";
    // Keypad layout: a device that is not a real remote (candles, light effects ...) or chosen per activity shows its keys in groups instead of an empty cross.
    const navCmds = r.nav ? this._devicesOf(h.id)[r.nav] || [] : [];
    const lmode = !extra.noKeypad && h.current ? this._layoutMode(h.id, h.current) : "remote";
    if (!extra.noKeypad && navCmds.length && !this._edit && (lmode === "keypad" || (lmode === "auto" && !fullPad && !hasCh))) {
      const volRow = hasVol ? `<div class="volbar">${slH || K(r.volume, "volume_down", "mdi:volume-minus")}${muteK ? K(r.volume, "mute", "mdi:volume-mute", "mute") : ""}${slH ? "" : K(r.volume, "volume_up", "mdi:volume-plus")}</div>` : "";
      return `<div class="pwrap"><div class="pcol">${L("volume", volRow)}</div><div class="pside">${extra.small || ""}</div></div><div class="xwide">${extra.big || ""}</div>${this._deviceRemote(h, r.nav, navCmds, t, true)}`;
    }
    const third = hasCh ? L("channel", ch) : discCol ? L("nav", discCol) : pillCol ? L("nav", pillCol) : "";
    const topPills = pillCol ? "" : pills;
    const panel = hasVol || hasNav || hasCh ? `<div class="panel ${discCol ? "wide3" : pillCol ? "mid3" : ""} ${vol ? "" : "nol"} ${third ? "" : "nor"}">${L("nav", topPills)}${vol ? L("volume", vol) : ""}${L("nav", nav)}${third}</div>` : "";
    const textRow = dcfg?.entity && !this._edit && hasNav ? this._textBlock(h.id, dcfg.entity, t) : "";
    const pcol = `${panel}${textRow}${L("transport", tr)}${L("nav", colors)}`.trim();
    if (!pcol && !extra.noKeypad && !extra.small && !extra.big) return `<div class="hint nokeys">${t.noKeys}</div>`;
    return `<div class="pwrap">${pcol ? `<div class="pcol">${pcol}</div>` : ""}<div class="pside">${extra.small || ""}</div></div><div class="xwide">${extra.big || ""}</div>`;
  },

  // Events of the remote keys (light up, send).
  _bindKeys(root) {
    root.querySelectorAll("button.key, button.tile").forEach((b) => {
      const off = () => b.classList.remove("lit");
      b.addEventListener("pointerdown", () => { if (!this._edit) b.classList.add("lit"); });
      ["pointerup", "pointercancel", "pointerleave"].forEach((ev) => b.addEventListener(ev, off));
    });
    root.querySelectorAll("button.key[data-cmd]").forEach((b) => this._bindKey(b));
  },

  // Tap sends once; holding repeats (not for mute and menu keys).
  _bindKey(b) {
    let delay = null, loop = null;
    const send = () => {
      this._buzz();
      const pre = b.dataset.pre;   // key that needs two commands in a row (Löschen = cursor left + Delete)
      this._hass.callService("remote", "send_command", { entity_id: b.dataset.hub, device: b.dataset.device, command: pre ? [pre, b.dataset.cmd] : b.dataset.cmd, ...(pre ? { delay_secs: 0.15 } : {}), ...this._holdOpt() });
    };
    const stop = () => { clearTimeout(delay); clearInterval(loop); };
    b.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (this._edit) {
        if (b.classList.contains("cell")) this._toggleFav(b.dataset.hub, b.dataset.device, b.dataset.cmd);
        return;
      }
      send();
      if (b.classList.contains("kl") && this._shiftOn) { this._shiftOn = false; setTimeout(() => this._rerender(), 0); return; }
      if (b.classList.contains("once") || b.classList.contains("chip") || b.classList.contains("pill") || b.classList.contains("ok") || b.classList.contains("helpkey")) return;
      delay = setTimeout(() => { loop = setInterval(send, 350); }, 450);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, stop));
  },
};
