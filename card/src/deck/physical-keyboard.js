// Real keyboard: key presses become commands (keyboard device or running activity).

export const physicalKeyboardMixin = {
  // Real keyboard: key press -> command of the keyboard device (physical keyboard) or of the running activity (keyboard control).
  _keydown(e) {
    if (!this._hass || this._edit) return;
    const tgt = e.composedPath?.()[0];
    if (tgt && (/^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName) || tgt.isContentEditable)) return;
    if (!this.isConnected || document.visibilityState !== "visible" || !this.getBoundingClientRect().height) return;
    if (!this._phys && !this._physTouched && !this._physOffer && !e.ctrlKey && !e.metaKey && !e.altKey && (e.key?.length === 1 || ["Backspace", "Enter", "Tab"].includes(e.key)) && this._mode() === "devices") {
      const hh = this._hubs().find((x) => x.id === this._hubSel) || this._hubs()[0];
      const dd = hh && this._device?.[hh.id];
      const cc = dd && this._devicesOf(hh.id)[dd];
      if (cc && this._keyboard(hh, dd, cc, this._t())) { this._physOffer = { hub: hh.id, dev: dd }; this._rerender(); return; }
    }
    const ph = this._phys;
    if (ph && this._mode() === "devices" && this._device?.[ph.hub] === ph.dev) {
      const cmd = this._physCmd(ph.hub, ph.dev, e);
      if (cmd) { e.preventDefault(); e.stopPropagation(); this._send(ph.hub, ph.dev, cmd); }
      return;
    }
    if (!(this._config.keyboard_control ?? this._settings().keyboardControl) || e.metaKey || e.ctrlKey || e.altKey) return;
    const h = this._hubs().find((x) => x.id === this._hubSel) || this._hubs()[0];
    if (!h?.current || h.current === "PowerOff") return;
    const r = this._roles(h.id, h.current);
    const map = { ArrowUp: ["nav", "up"], ArrowDown: ["nav", "down"], ArrowLeft: ["nav", "left"], ArrowRight: ["nav", "right"], Enter: ["nav", "ok"], Escape: ["nav", "back"], Backspace: ["nav", "back"],
      h: ["nav", "home"], " ": ["transport", "play"], PageUp: ["volume", "volume_up"], PageDown: ["volume", "volume_down"], m: ["volume", "mute"] };
    const m = map[e.key];
    if (!m) return;
    const dev = r[m[0]];
    const cmd = dev && this._cmd(h.id, dev, m[1]);
    if (cmd) { e.preventDefault(); this._send(h.id, dev, cmd); }
  },

  _physCmd(hub, dev, e) {
    const cmds = this._devicesOf(hub)[dev] || [];
    const canon = (x) => String(x).toLowerCase().replace(/command|\u2318/g, "cmd").replace(/control/g, "ctrl").replace(/option/g, "alt").replace(/escape/g, "esc");
    const byCanon = (name) => cmds.find((c) => canon(c) === name);
    const first = (list) => { for (const n of list) { const c = cmds.find((x) => x.toLowerCase() === n.toLowerCase()); if (c) return c; } return null; };
    const k = e.key;
    if (["Shift", "Control", "Alt", "Meta", "CapsLock"].includes(k)) return null;
    if (e.metaKey || e.ctrlKey || e.altKey) {
      const key = k === " " ? "space" : k.toLowerCase();
      const mods = [e.ctrlKey ? "ctrl" : "", e.altKey ? "alt" : "", e.metaKey ? "cmd" : ""].filter(Boolean);
      return byCanon([...mods, key].join("+")) || (e.metaKey && e.ctrlKey ? byCanon(["ctrl", "cmd", key].join("+")) : null) || null;
    }
    if (k.length === 1) {
      if (/[a-z]/i.test(k)) {
        const up = k === k.toUpperCase();
        return up ? first([k.toUpperCase(), `${k.toLowerCase()}.`]) : first([`${k}.`, k.toUpperCase()]);
      }
      if (k === " ") return first(["Space", "Spacebar"]);
      return first([k]);
    }
    const named = { Enter: ["Enter", "Return", "OK", "Select"], Backspace: ["Backspace", "BkSp", "Delete"], Delete: ["Delete", "Del"], Tab: ["Tab"], Escape: ["Escape", "Esc"],
      ArrowUp: ["DirectionUp"], ArrowDown: ["DirectionDown"], ArrowLeft: ["DirectionLeft"], ArrowRight: ["DirectionRight"], PageUp: ["PageUp", "PgUp"], PageDown: ["PageDown", "PgDn"], Home: ["Home"], End: ["End"] };
    if (/^F\d{1,2}$/.test(k)) return first([k]);
    // No real Backspace on the device: cursor left, then Delete (which removes to the right).
    if (k === "Backspace" && !first(["Backspace", "BkSp"]) && first(["Delete", "Del"]) && first(["DirectionLeft"])) return [first(["DirectionLeft"]), first(["Delete", "Del"])];
    return named[k] ? first(named[k]) : null;
  },
};
