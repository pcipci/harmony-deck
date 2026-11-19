// Devices view: device list and the remote of one device (key groups).
import { ALIASES, keyIcon, prettyCommand, powerCls } from "../shared/commands.js";
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

export const devicesMixin = {
  _deviceIcon(name, hubId = "") {
    const own = this._settings().deviceIcons?.[hubId]?.[name];
    if (own) return own;
    const k = name.toLowerCase();
    const map = [["fire tv cube", "mdi:cube-outline"], ["cube", "mdi:cube-outline"], ["fire tv stick", "mdi:usb-flash-drive-outline"], ["firestick", "mdi:usb-flash-drive-outline"], ["fire stick", "mdi:usb-flash-drive-outline"], ["shield", "mdi:television-box"],
      ["nintendo", "mdi:nintendo-switch"], ["wii", "mdi:nintendo-wii"], ["gameboy", "mdi:nintendo-game-boy"], ["steam", "mdi:steam"], ["ps4", "mdi:sony-playstation"], ["ps5", "mdi:sony-playstation"], ["ps3", "mdi:sony-playstation"],
      ["gamepad", "mdi:gamepad-variant"], ["retro", "mdi:controller-classic"], ["hdmi", "mdi:hdmi-port"], ["echo", "mdi:speaker-wireless"], ["alexa", "mdi:speaker-wireless"], ["homepod", "mdi:speaker-wireless"],
      ["plex", "mdi:plex"], ["netflix", "mdi:netflix"], ["youtube", "mdi:youtube"], ["spotify", "mdi:spotify"], ["set-top", "mdi:set-top-box"], ["settop", "mdi:set-top-box"], ["kabel", "mdi:set-top-box"], ["cable", "mdi:set-top-box"],
      ["magenta", "mdi:set-top-box"], ["sky", "mdi:satellite-variant"], ["sat", "mdi:satellite-variant"], ["antenne", "mdi:antenna"], ["dvb", "mdi:antenna"], ["vcr", "mdi:video-vintage"], ["videorekorder", "mdi:video-vintage"],
      ["kassette", "mdi:cassette"], ["plattenspieler", "mdi:record-player"], ["turntable", "mdi:record-player"], ["radio", "mdi:radio"], ["tuner", "mdi:radio-tower"], ["kopfh", "mdi:headphones"], ["headphone", "mdi:headphones"],
      ["tablet", "mdi:tablet"], ["ipad", "mdi:tablet"], ["handy", "mdi:cellphone"], ["phone", "mdi:cellphone"], ["synology", "mdi:nas"], ["qnap", "mdi:nas"], ["server", "mdi:nas"], ["router", "mdi:router-wireless"], ["kamera", "mdi:cctv"], ["camera", "mdi:cctv"],
      ["steckdose", "mdi:power-socket-eu"], ["socket", "mdi:power-socket-eu"], ["led", "mdi:led-strip"], ["lichterkette", "mdi:string-lights"], ["kamin", "mdi:fireplace"], ["klima", "mdi:air-conditioner"],
      ["heizung", "mdi:radiator"], ["saug", "mdi:robot-vacuum"], ["vorhang", "mdi:curtains"], ["leinwand", "mdi:projector-screen"], ["monitor", "mdi:monitor"], ["röhren", "mdi:television-classic"], ["surround", "mdi:speaker-multiple"],
      ["mac mini", "mdi:desktop-tower-monitor"], ["macmini", "mdi:desktop-tower-monitor"], ["imac", "mdi:desktop-tower-monitor"], ["macbook", "mdi:laptop"], ["mac", "mdi:desktop-tower-monitor"],
      ["laptop", "mdi:laptop"], ["notebook", "mdi:laptop"], ["computer", "mdi:desktop-tower-monitor"], ["pc", "mdi:desktop-tower-monitor"], ["raspberry", "mdi:raspberry-pi"],
      ["apple tv", "mdi:apple"], ["chromecast", "mdi:cast"], ["roku", "mdi:television-box"], ["kodi", "mdi:kodi"],
      ["soundbar", "mdi:soundbar"], ["sub", "mdi:speaker"], ["beamer", "mdi:projector"], ["projector", "mdi:projector"], ["hue", "mdi:lightbulb"], ["lamp", "mdi:lightbulb"], ["licht", "mdi:lightbulb"], ["light", "mdi:lightbulb"],
      ["switch", "mdi:nintendo-switch"], ["fire", "mdi:television-play"], ["fernseher", "mdi:television"], ["tv", "mdi:television"], ["verstärker", "mdi:amplifier"], ["amplifier", "mdi:amplifier"],
      ["receiver", "mdi:amplifier"], ["blu-ray", "mdi:disc-player"], ["dvd", "mdi:disc-player"], ["dvr", "mdi:satellite-variant"],
      ["spielkonsole", "mdi:microsoft-xbox"], ["xbox", "mdi:microsoft-xbox"], ["playstation", "mdi:sony-playstation"],
      ["mini-system", "mdi:speaker"], ["speaker", "mdi:speaker"], ["candle", "mdi:candle"], ["disco", "mdi:candle"]];
    const hit = map.find(([x]) => k.includes(x));
    return hit ? hit[1] : "mdi:remote";
  },

  // Which roles in the running activity a device serves, e.g. ["volume", "nav"].
  _usedBy(hubId, cur) {
    const used = {};
    if (!cur) return used;
    const r = this._roles(hubId, cur);
    for (const role of ["volume", "nav", "channel"]) if (r[role]) (used[r[role]] ||= []).push(role);
    return used;
  },

  _devicesView(h, cur, t, part = "") {
    const devices = this._devicesOf(h.id);
    const names = Object.keys(devices);
    const sel = this._device?.[h.id] && devices[this._device[h.id]] ? this._device[h.id] : null;
    const used = this._usedBy(h.id, cur);
    const roleName = { volume: t.volume, nav: t.navigation, channel: t.channel };
    const list = names.map((n) => {
      const roles = (used[n] || []).map((r) => roleName[r]).join(" · ");
      return `<button class="tile dev ${sel === n ? "sel" : ""} ${used[n] ? "inuse" : ""}" data-hub="${esc(h.id)}" data-dev="${esc(n)}">
        <ha-icon icon="${this._deviceIcon(n, h.id)}"></ha-icon><span>${esc(n)}</span>${roles ? `<small>${esc(roles)}</small>` : ""}</button>`;
    }).join("");
    const remote = sel ? this._deviceRemote(h, sel, devices[sel], t) : `<div class="hint">${t.pickDevice}</div>`;
    const favHint = this._editMode === "favs" ? `<div class="ehint favhint"><ha-icon icon="${this._hideMode() ? "mdi:eye-off-outline" : "mdi:star-outline"}"></ha-icon>${this._hideMode() ? t.hideEditHint : t.favEditHint}</div>` : "";
    if (part === "list") return `<div class="devlist">${list}</div>`;
    if (part === "below") return `<div class="devremote">${remote}</div>`;
    return `${favHint}<div class="devlayout"><div class="devlist">${list}</div><div class="devremote">${remote}</div></div>`;
  },

  // Splits the keys that have no fixed place on the remote into functional blocks.
  _groups(rest, t) {
    const rules = [
      [t.symbols, /^[^A-Za-z0-9]$/],
      [t.mouse, /^(Left|Right|Middle)Click/i],
      [t.windows, /^(CloseProgram|CloseWindow|MinimizeAll|ShowDock|Fullscreen|Zoom|Desktop|Mission|Spotlight)/i],
      [t.shortcuts, /^(Ctrl|Control|Strg|Cmd|Command|Alt|Option|Win|Meta|Super|Shift)\b.*\+|^(Ctrl|Strg|Cmd|Alt|Win|Meta|Super)/i],
      [t.inputs, /^Input/i],
      [t.sound, /^(Dsp|Surround|Stereo|Enhancer|Bass|D\.Bass|UniVolume|SubWoofer|ChannelLevel|PresetEq|ReMaster|Sound)/i],
      [t.menus, /^(Menu|Settings|Setup|Guide|Info|Q\.?Menu|Smart|ServiceMenu|UserGuide|Help|List|Fav|Favorite|Option|Display|Title|PopUp|DiscMenu|Dock|T\.OPT|Simplink|Open\/Close|Eject)/i],
      [t.screen, /^(Text|Teletext|Subtitle|Audio|AD$|Ratio|3D|LiveTv|Live TV|Tv\/Rad|Radio|TV$|Video|Page|Q\.?View|Repeat|PlayMode)/i],
      [t.record, /^(Rec|Record|DVR)/i],
      [t.apps, /^(MyApps|App|Apps|Netflix|Xbox|OneGuide|AppChannels)/i],
      [t.timer, /^(Sleep|In-Start|In-Stop|Clock|AutoOff|TimerPlay|Dimmer)/i],
    ];
    const groups = rules.map(([label]) => [label, []]);
    const left = [];
    for (const c of rest) {
      const i = rules.findIndex(([, re]) => re.test(c));
      (i >= 0 ? groups[i][1] : left).push(c);
    }
    // Remaining keys: group by common name start (Candle2h, CandleOn → "Candle"), rest in "other".
    const byPrefix = {};
    left.forEach((c) => { const m = c.match(/^[A-Z][a-z]+/); (byPrefix[m ? m[0] : ""] ||= []).push(c); });
    const other = [];
    Object.entries(byPrefix).forEach(([pre, list]) => (pre && list.length >= 3 ? groups.push([pre, list]) : other.push(...list)));
    groups.push([t.other, other]);
    // Functional order and row breaks inside a few groups (gaps stay empty in the grid).
    const CATS = new Map([[t.windows, [/^Close|^Quit/i, /^(Minimi|Hide|Fullscreen)/i, /^Zoom/i, /^(Desktop|Mission|Spotlight|ShowDock|Dock)/i]],
      [t.sound, [/^(Dsp|Surround|Stereo|PresetEq|ReMaster)/i, /^(Enhancer|Bass|D\.Bass|SubWoofer|UniVolume)/i, /^(ChannelLevel|Sound)/i]]]);
    return groups.filter(([, c]) => c.length).map(([label, cmds]) => {
      const cats = CATS.get(label);
      if (!cats) return [label, cmds, new Set()];
      const idx = (c) => { const i = cats.findIndex((re) => re.test(c)); return i < 0 ? cats.length : i; };
      const sorted = [...cmds].sort((a, b) => idx(a) - idx(b));
      const brk = new Set();
      sorted.forEach((c, i) => { if (i === 0 || idx(c) !== idx(sorted[i - 1])) brk.add(c); });
      return [label, sorted, brk];
    });
  },

  _deviceRemote(h, dev, commands, t, embed = false) {
    const used = new Set(Object.values(ALIASES).flat());
    // Number keys are called "5", "Number5", "Num5" or "Digit5" depending on the device.
    const digitOf = (c) => (c.match(/^(?:num(?:ber)?|digit|key)?[\s_-]?(\d)$/i) || [])[1];
    const digitCmds = {};
    commands.forEach((c) => { const d = digitOf(c); if (d !== undefined && !(d in digitCmds)) digitCmds[d] = c; });
    const power = ["PowerOn", "PowerOff", "PowerToggle"].filter((c) => commands.includes(c));
    if (this._config.physical_keyboard && !this._physTouched && !this._phys && this._keyboard(h, dev, commands, t)) this._phys = { hub: h.id, dev };
    const kb = this._keyboard(h, dev, commands, t);
    // Keyboard devices: the keyboard comes first and carries the media and arrow keys itself, so no cross / volume / channel block above it.
    const own = kb ? {} : { volume: dev, nav: dev, channel: dev, transport: dev };
    const rest = commands.filter((c) => !used.has(c) && !power.includes(c) && digitOf(c) === undefined && !(kb && kb.used.has(c)));
    const favs = this._favs(h.id, dev);
    const overrides = { ...(this._settings().keyIcons || {}), ...(this._config.key_icons || {}) };
    const btn = (c, label, icon = null, extraCls = "") => {
      const star = this._edit ? this._editMark(h.id, dev, c, favs) : "";
      return `<button class="key cell ${powerCls(c)} ${extraCls} ${favs.includes(c) ? "isfav" : ""} ${this._hideMode() && this._hiddenKeys(h.id, dev).includes(c) ? "hid" : ""}" title="${esc(c)}" data-hub="${esc(h.id)}" data-device="${esc(dev)}" data-cmd="${esc(c)}">${icon ? `<ha-icon icon="${esc(icon)}"></ha-icon>` : ""}<span>${label}</span>${star}</button>`;
    };
    // Groups with only one or two keys would each get a lonely card: collect them into "other".
    let gs = this._groups(rest, t);
    const keepOwn = new Set([t.symbols, t.shortcuts, t.windows, t.other]);
    const small = gs.filter(([l, c]) => c.length <= 2 && !keepOwn.has(l));
    if (small.length >= 2 || (small.length && gs.some(([l]) => l === t.other))) {
      const merged = small.flatMap(([, c]) => c);
      gs = gs.filter((g) => !small.includes(g));
      const oi = gs.findIndex(([l]) => l === t.other);
      if (oi >= 0) gs[oi] = [t.other, [...gs[oi][1], ...merged], new Set()]; else gs.push([t.other, merged, new Set()]);
    }
    const blocks = gs.map(([label, cmds, brk]) => {
      const icons = cmds.map((c) => keyIcon(c, overrides, dev));
      const useIcons = label !== t.symbols && icons.some(Boolean);
      return `<div class="block ${label === t.symbols ? "sym" : ""} ${label === t.shortcuts ? "short" : ""} ${label === t.windows ? "wide" : ""}"><span class="dname">${esc(label)}</span>
      <div class="cells ${brk.size > 1 ? "rows" : ""}">${cmds.map((c, i) => btn(c, esc(prettyCommand(c)), useIcons ? icons[i] || "mdi:circle-small" : null, brk.has(c) && brk.size > 1 ? "newrow" : "")).join("")}</div></div>`;
    }).join("");
    const dp = this._directHtml(h, dev, t, false, "", true) || {};
    const favBlock = this._favBlock(h, dev, favs.filter((c) => commands.includes(c)), t, overrides);
    // Tube radio: On/Off as one toggle switch (lever up = on) instead of two buttons; Toggle stays a button.
    const swPower = this._skin() === "radio" && power.includes("PowerOn") && power.includes("PowerOff");
    const pwSwitch = swPower ? this._powerSwitch(h.id, dev, t) : "";
    const pw = power.length ? `<div class="block power">${pwSwitch}<div class="cells">${power.map((c) => btn(c, esc(prettyCommand(c)), "mdi:power", swPower && c !== "PowerToggle" ? "pwronoff" : "")).join("")}</div></div>` : "";
    const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];
    const pad = !kb && Object.keys(digitCmds).length >= 3 ? `<details class="block numpad" open><summary class="dname">${t.numbers}</summary><div class="nums">${digits.map((d) => (d && digitCmds[d] ? btn(digitCmds[d], d) : "<span></span>")).join("")}</div></details>` : "";
    // Part of the running activity: say so, and lead back to the remote of that activity.
    const act = !embed && !this._edit ? this._runningActOf(h, dev) : null;
    const back = act ? `<button class="actlink" data-gotoact="${esc(h.id)}" title="${esc(t.devBackAct)}"><ha-icon icon="${esc(this._actIcon(h.id, act))}"></ha-icon><span>${esc(fmtText(t.devActiveIn, [act]))}</span><ha-icon icon="mdi:arrow-left-top"></ha-icon></button>` : "";
    return `${embed ? `<div class="devhead emb"><span class="devname">${esc(dev)}</span></div>` : `<div class="devhead"><span class="devname">${esc(dev)}</span>${back}${this._edit ? "" : `<button class="ib devclose" data-devclose="${esc(h.id)}" title="${esc(t.devClose)}"><ha-icon icon="mdi:close"></ha-icon></button>`}</div>`}
      ${pw}${this._panelHtml(h, own, t, { small: (kb ? kb.html : "") + favBlock + (dp.keys || ""), big: (dp.main || "") + pad + blocks, noLock: true, noKeypad: true })}`;
  },

  // Events of the device list.
  _bindDevices(root) {
    root.querySelectorAll(".tile[data-dev]").forEach((b) => b.addEventListener("click", () => {
      const hub = b.dataset.hub;
      const same = this._device?.[hub] === b.dataset.dev;
      if (this._edit) { this._device = { ...(this._device || {}), [hub]: same ? null : b.dataset.dev }; this._rerender(); return; }
      if (same) { this._scrollToRemote(); return; }   // second tap: back to the start of the remote (closing is the x in the device header)
      const select = () => {
        this._device = { ...(this._device || {}), [hub]: b.dataset.dev };
        if (this._collapseOn()) this._hdrCollapsed = { ...(this._hdrCollapsed || {}), [hub]: true };
        this._scrollRemote = true; this._scrollAt = Date.now();
        this._rerender();
      };
      if (this._collapseOn()) this._animSection(hub, "collapse", select); else select();
    }));
    root.querySelectorAll("[data-devclose]").forEach((b) => b.addEventListener("click", () => {
      const hub = b.dataset.devclose;
      this._device = { ...(this._device || {}), [hub]: null };
      this._hdrCollapsed = { ...(this._hdrCollapsed || {}), [hub]: false };
      this._expandHub = hub;
      this._rerender();
    }));
  },
};
