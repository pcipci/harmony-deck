// On-screen keyboard for keyboard-like devices (PC / Mac) and text sending.
import { ALIASES, prettyCommand } from "../shared/commands.js";
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

export const keyboardMixin = {
  // Keyboard-like devices (PC/Mac): letters, digits and special keys laid out like a real keyboard.
  // Letters (upper / lower case), digits and a finder for the commands of a keyboard-like device.
  _kbMaps(commands) {
    const upper = {}, lower = {};
    commands.forEach((c) => {
      const m = c.match(/^(?:key|letter|char)?[\s_-]?([A-Za-z])$/i) || [];
      if (m[1]) { (m[1] === m[1].toUpperCase() ? upper : lower)[m[1].toUpperCase()] ||= c; return; }
      const d = c.match(/^([a-z])\.$/);
      if (d) lower[d[1].toUpperCase()] ||= c;
    });
    const digit = (c) => (c.match(/^(?:num(?:ber)?|digit|key)?[\s_-]?(\d)$/i) || [])[1];
    const digits = {};
    commands.forEach((c) => { const d = digit(c); if (d !== undefined && !(d in digits)) digits[d] = c; });
    return { upper, lower, digits, find: (re) => commands.find((c) => re.test(c)) };
  },

  // Text -> list of commands for "send text"; characters the device has no command for are collected in `skipped`.
  _textCommands(commands, text) {
    const { upper, lower, digits, find } = this._kbMaps(commands);
    const cmds = [], skipped = new Set();
    const special = { " ": find(/^(Space|Spacebar)$/i), "\n": find(/^(Enter|Return)$/i), "\t": find(/^Tab$/i) };
    for (const ch of text) {
      let c = null;
      if (ch in special) c = special[ch];
      else if (/[a-z]/i.test(ch)) { const L = ch.toUpperCase(), up = ch === L; c = up ? upper[L] || lower[L] : lower[L] || upper[L]; }
      else if (/\d/.test(ch)) c = digits[ch];
      else if (commands.includes(ch)) c = ch;
      if (c) cmds.push(c); else if (ch !== "\r") skipped.add(ch === "\n" ? "⏎" : ch);
    }
    return { cmds, skipped };
  },

  _keyboard(h, dev, commands, t, opts = {}) {
    const compact = !!opts.compact;
    const { upper, lower, digits, find } = this._kbMaps(commands);
    const have = new Set([...Object.keys(upper), ...Object.keys(lower)]);
    if (have.size < 20) return null;
    const favs = this._favs(h.id, dev);
    const used = new Set([...Object.values(upper), ...Object.values(lower), ...Object.values(digits)]);
    const os = this._kbdOs || this._config.keyboard_os || (find(/^(Win|Windows)$/i) ? "windows" : "mac");
    const caps = !!this._capsOn;
    const shift = !!this._shiftOn || caps;
    const phys = !compact && this._phys?.hub === h.id && this._phys?.dev === dev;
    const K = (c, label, cls = "", icon = "", w = 1, pre = "") => {
      if (!c) return `<span class="kk ghost" style="flex: ${w} 1 0"></span>`;
      used.add(c);
      const star = this._edit ? this._editMark(h.id, dev, c, favs) : "";
      return `<button class="key cell kk ${icon ? "ic" : ""} ${cls} ${favs.includes(c) ? "isfav" : ""} ${this._hideMode() && this._hiddenKeys(h.id, dev).includes(c) ? "hid" : ""}" style="flex: ${w} 1 0" title="${esc(pre ? `${pre} + ${c}` : c)}" data-hub="${esc(h.id)}" data-device="${esc(dev)}" data-cmd="${esc(c)}" ${pre ? `data-pre="${esc(pre)}"` : ""}>${icon ? `<ha-icon icon="${icon}"></ha-icon>` : ""}<span>${esc(label)}</span>${star}</button>`;
    };
    const lay = this._config.keyboard_layout || ((this._config.language || this._hass?.locale?.language || "en").startsWith("de") ? "qwertz" : "qwerty");
    const rows = lay === "qwertz" ? ["QWERTZUIOP", "ASDFGHJKL", "YXCVBNM"] : ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    const letterCmd = (L) => (shift ? upper[L] || lower[L] : lower[L] || upper[L]);
    const fkeys = commands.filter((c) => /^F\d{1,2}$/i.test(c)).sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)));
    const esc_ = find(/^(Esc|Escape)$/i);
    const bsCmd = find(/^(Backspace|BkSp)$/i), delCmd = find(/^(Delete|Del)$/i);
    // No real Backspace in the hub configuration (the Mac "Delete" removes to the right): "cursor left, then Delete" does the same.
    const leftCmd = find(/^(DirectionLeft|Left|ArrowLeft|CursorLeft)$/i);
    const subBack = !bsCmd && !!delCmd && !!leftCmd;
    const back = bsCmd || delCmd, del = bsCmd || subBack ? delCmd : null;
    const row = (cls, inner) => (inner.trim() ? `<div class="kbrow ${cls}">${inner}</div>` : "");
    const shiftKey = (w) => `<button class="key cell kk ic shiftkey ${shift ? "isfav" : ""}" style="flex: ${w} 1 0" data-shift title="${caps ? t.capsOn : "Shift"}"><ha-icon icon="${caps ? "mdi:apple-keyboard-caps" : "mdi:apple-keyboard-shift"}"></ha-icon><span>${caps ? "Caps" : "Shift"}</span></button>`;
    const frow = row("f", K(esc_, "Esc", "", "mdi:keyboard-esc", 1.4) + fkeys.map((c) => K(c, c.toUpperCase())).join(""));
    // Media keys (the function row of a real keyboard also has them): previous, play/pause, next, mute, quieter, louder.
    const pick = (action) => (ALIASES[action] || []).find((n) => commands.includes(n));
    const mrow = row("med", [["rewind", "mdi:skip-previous"], ["play", "mdi:play"], ["pause", "mdi:pause"], ["forward", "mdi:skip-next"], ["mute", "mdi:volume-mute"], ["volume_down", "mdi:volume-minus"], ["volume_up", "mdi:volume-plus"]]
      .map(([a, ic]) => (pick(a) ? K(pick(a), prettyCommand(pick(a)), "", ic) : "")).join(""));
    const arrows = [["up", "mdi:chevron-up"], ["left", "mdi:chevron-left"], ["down", "mdi:chevron-down"], ["right", "mdi:chevron-right"]].map(([a, ic]) => [a, ic, this._cmd(h.id, dev, a)]);
    // Arrow cluster like on a real keyboard: left, up/down stacked (half height), right.
    const arr = arrows.every(([, , c]) => c) ? `<div class="kbarr">${K(arrows[1][2], "", "", arrows[1][1])}<div class="kbud">${K(arrows[0][2], "", "", arrows[0][1])}${K(arrows[2][2], "", "", arrows[2][1])}</div>${K(arrows[3][2], "", "", arrows[3][1])}</div>` : "";
    const nrow = Object.keys(digits).length >= 5 ? row("", ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"].map((d) => K(digits[d], d)).join("") + K(back, t.kb.delete, "", "mdi:backspace-outline", 1.6, subBack ? leftCmd : "")) : "";
    const enter = find(/^(Enter|Return)$/i) || find(/^OK$/);
    const tab = find(/^Tab$/i);
    const rQ = row("", K(tab, "Tab", "", "mdi:keyboard-tab", 1.4) + [...rows[0]].map((ch) => K(letterCmd(ch), ch, "kl")).join(""));
    const rA = row("", `<span class="kk ghost" style="flex: 0.6 1 0"></span>` + [...rows[1]].map((ch) => K(letterCmd(ch), ch, "kl")).join("") + K(enter, "Enter", "", "mdi:keyboard-return", 1.6));
    const rZ = row("", shiftKey(1.5) + [...rows[2]].map((ch) => K(letterCmd(ch), ch, "kl")).join("") + shiftKey(1.5));
    const ctrl = find(/^(Ctrl|Control|Strg)$/i), alt = find(/^(Alt|Option|Opt)$/i), cmd = find(/^(Cmd|Command|Win|Windows|Super|Meta)$/i);
    const cmdIcon = os === "windows" ? "mdi:microsoft-windows" : "mdi:apple-keyboard-command";
    const altName = os === "windows" ? "Alt" : "Option", cmdName = os === "windows" ? "Win" : "Cmd", ctrlName = os === "windows" ? t.kb.ctrl : "Ctrl";
    const space = find(/^(Space|Spacebar)$/i);
    const KB = (c, ...rest) => (c ? K(c, ...rest) : "");
    const rB = row("b", KB(ctrl, ctrlName, "", os === "windows" ? "" : "mdi:apple-keyboard-control", 1.2) + (os === "windows" ? KB(cmd, cmdName, "", cmdIcon, 1.2) + KB(alt, altName, "", "", 1.2) : KB(alt, altName, "", "mdi:apple-keyboard-option", 1.2) + KB(cmd, cmdName, "", cmdIcon, 1.2))
      + KB(space, "Space", "space", "mdi:keyboard-space", 4.2) + (os === "windows" ? KB(find(/^AltGr$/i), "AltGr", "", "", 1.2) + KB(cmd, cmdName, "", cmdIcon, 1.2) + KB(find(/^(ContextMenu|AppMenu)$/i), t.kb.menu, "", "mdi:menu", 1.2) + KB(ctrl, ctrlName, "", "", 1.2) : KB(cmd, cmdName, "", cmdIcon, 1.2) + KB(alt, altName, "", "mdi:apple-keyboard-option", 1.2)) + arr);
    const rBc = row("b", KB(cmd, cmdName, "", cmdIcon, 1.2) + KB(space, "Space", "space", "mdi:keyboard-space", 5) + arr);
    const rN = row("m", [[t.kb.del, del, "mdi:delete-outline"], [t.kb.home, find(/^Home$/i), "mdi:page-first"], [t.kb.end, find(/^End$/i), "mdi:page-last"], [t.kb.pageUp, find(/^(PageUp|PgUp)$/i), "mdi:chevron-double-up"], [t.kb.pageDown, find(/^(PageDown|PgDn)$/i), "mdi:chevron-double-down"]]
      .filter(([, c]) => c).map(([l, c, ic]) => K(c, l, "", ic)).join(""));
    const textForm = `<form class="kbtext" data-ktext data-hub="${esc(h.id)}" data-device="${esc(dev)}"><input type="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(t.textPh)}"><button type="submit" class="key" title="${esc(t.textSend)}"><ha-icon icon="mdi:send"></ha-icon></button></form><div class="kbtextmsg"></div>`;
    const swos = `<div class="kbsw"><button data-kbdos="mac" class="${os !== "windows" ? "sel" : ""}">⌘</button><button data-kbdos="windows" class="${os === "windows" ? "sel" : ""}">⊞</button></div>`;
    const phsw = `<label class="physsw"><span>${t.physKb}</span><span class="sw"><input type="checkbox" data-phys="${esc(dev)}" data-hub="${esc(h.id)}" ${phys ? "checked" : ""}><i></i></span></label>`;
    const live = `<div class="physlive"><ha-icon icon="mdi:keyboard"></ha-icon><div>${t.physOn}<small>${t.physHint}</small></div></div>`;
    const offer = !phys && this._physOffer?.hub === h.id && this._physOffer?.dev === dev ? `<div class="physoffer"><ha-icon icon="mdi:keyboard"></ha-icon><span>${t.physFound}</span><button class="yes" data-physyes="${esc(dev)}" data-hub="${esc(h.id)}">${t.yes}</button><button data-physno>${t.no}</button></div>` : "";
    if (compact) return { html: `<div class="block kbd compact">${nrow}${rQ}${rA}${rZ}${rBc}</div>`, used };
    return { html: `<div class="block kbd ${phys ? "physon" : ""}">${offer}<div class="kbhead"><span class="dname">${t.keyboard}</span>${phsw}</div><div class="kbtools">${swos}</div>${this._edit ? "" : textForm}${phys ? live : `${frow}${mrow}${nrow}${rQ}${rA}${rZ}`}${rN}${rB}</div>`, used };
  },

  // Events of the on-screen and the real keyboard.
  _bindKeyboard(root) {
    root.querySelectorAll("[data-shift]").forEach((b) => b.addEventListener("click", () => {
      const now = Date.now();
      if (this._capsOn) { this._capsOn = false; this._shiftOn = false; }
      else if (this._shiftOn && now - (this._shiftAt || 0) < 450) { this._capsOn = true; this._shiftOn = false; }   // second quick tap: Caps Lock
      else this._shiftOn = !this._shiftOn;
      this._shiftAt = now;
      this._rerender();
    }));
    root.querySelectorAll("form[data-ktext]").forEach((f) => f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const t = this._t(), inp = f.querySelector("input"), msg = f.nextElementSibling, text = inp.value;
      if (!text) return;
      const { cmds, skipped } = this._textCommands(this._devicesOf(f.dataset.hub)[f.dataset.device] || [], text);
      if (!cmds.length) { if (msg) msg.textContent = fmtText(t.textNone, [[...skipped].join(" ")]); return; }
      inp.value = ""; inp.disabled = true; this._buzz(25);
      try {
        for (let i = 0; i < cmds.length; i += 40) {
          await this._call("remote", "send_command", { entity_id: f.dataset.hub, device: f.dataset.device, command: cmds.slice(i, i + 40), delay_secs: 0.15, ...this._holdOpt() });
        }
        if (msg) msg.textContent = skipped.size ? fmtText(t.textSkipped, [cmds.length, [...skipped].join(" ")]) : fmtText(t.textSent, [cmds.length]);
      } finally { inp.disabled = false; }
    }));
    root.querySelectorAll("[data-kbdos]").forEach((b) => b.addEventListener("click", () => { this._kbdOs = b.dataset.kbdos; this._rerender(); }));
    root.querySelectorAll("input[data-phys]").forEach((i) => i.addEventListener("change", () => { this._phys = i.checked ? { hub: i.dataset.hub, dev: i.dataset.phys } : null; this._physTouched = true; this._rerender(); }));
    root.querySelectorAll("[data-physyes]").forEach((b) => b.addEventListener("click", () => { this._phys = { hub: b.dataset.hub, dev: b.dataset.physyes }; this._physTouched = true; this._physOffer = null; this._rerender(); }));
    root.querySelectorAll("[data-physno]").forEach((b) => b.addEventListener("click", () => { this._physTouched = true; this._physOffer = null; this._rerender(); }));
  },
};
