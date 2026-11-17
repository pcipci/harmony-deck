// Help box (devices of an activity) and hold-to-switch-off.
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";
import { keyIcon, prettyCommand, powerCls } from "../shared/commands.js";

export const helpMixin = {
  // What an activity needs: [{device, input command or null, power command or null}].
  _setupOf(h, act) {
    const info = this._info?.hubs?.[h.id];
    const norm = (x) => String(x).toLowerCase().replace(/[^a-z0-9]/g, "");
    let items = info?.setup?.[act];
    if (!Array.isArray(items)) {
      const r = this._roles(h.id, act);
      items = [...new Set([r.volume, r.nav, r.channel].filter(Boolean))].map((device) => ({ device, input: null }));
    }
    const merged = new Map();
    items.forEach((it) => { const m = merged.get(it.device); if (!m) merged.set(it.device, { ...it }); else if (!m.input && it.input) m.input = it.input; });
    return [...merged.values()].map((it) => {
      const cmds = info?.devices?.[it.device] || [];
      const want = it.input ? norm(it.input) : "";
      const input = want ? cmds.find((c) => norm(c) === "input" + want || norm(c) === want || norm(c).endsWith(want) && norm(c).startsWith("input")) : null;
      const known = !!info?.devices?.[it.device];
      const power = ["PowerOn", "PowerToggle"].find((c) => (!known && !cmds.length) || cmds.includes(c)) || null;
      return { device: it.device, input: input || null, inputRaw: it.input, power, manual: !!it.manual };
    });
  },

  // Devices of the help list: only those the card can switch (power or input command); the user can hide more per activity.
  _helpItems(h, act) {
    const all = this._setupOf(h, act);
    // A device with a direct (ADB) link can always be woken, even if the hub switches it by hand or has no command for it.
    const withAdb = all.map((it) => ({ ...it, adb: this._linkedFire(h.id, it.device)?.entity || "" }));
    const manual = withAdb.filter((it) => it.manual && !it.adb).map((it) => it.device);
    const items = withAdb.filter((it) => !it.manual || it.adb).map((it) => ({ ...it, manual: false }));
    const hid = new Set(this._settings().helpHide?.[h.id]?.[act] || []);
    return { items, usable: items, hid, visible: items.filter((it) => !hid.has(it.device)), manual };
  },

  // "Also turn off related devices": the devices the Fire TV activity switches on (not the ones another running activity needs, not hidden ones), each with its own PowerOff command.
  async _offRelated(hubId) {
    if (!this._settings().offRelated?.[hubId]) return;
    const h = this._hubs().find((x) => x.id === hubId);
    if (!h) return;
    const act = this._fireActivity(h);
    if (!act) return;
    const fire = this._fireInfo(hubId)?.cfg?.device || "";
    const busy = new Set(h.current && h.current !== "PowerOff" && h.current !== act ? this._setupOf(h, h.current).map((it) => it.device) : []);
    const devs = this._devicesOf(hubId);
    for (const it of this._helpItems(h, act).visible) {
      if (it.device === fire || busy.has(it.device) || !(devs[it.device] || []).includes("PowerOff")) continue;
      this._hass.callService("remote", "send_command", { entity_id: hubId, device: it.device, command: "PowerOff" });
      await new Promise((r) => setTimeout(r, 500));
    }
  },

  // Held long enough: switch off (Harmony activity, else the Fire TV and, if enabled, the related devices). The header stays as it is until nothing is open any more.
  _holdOff(b) {
    this._buzz(35);
    const hub = b.dataset.hub;
    const hh = this._hubs().find((x) => x.id === hub);
    const f = this._fireInfo(hub);
    const fireLive = !!f && (f.mode === "on" || f.mode === "playing");
    if (b.dataset.hold === "fire") { this._adb(b.dataset.entity || f?.entity, "input keyevent 223"); this._offRelated(hub); }
    else if (hh?.current && hh.current !== "PowerOff") this._hass.callService("remote", "turn_off", { entity_id: hub });
    else if (fireLive) { this._adb(f.entity, "input keyevent 223"); this._offRelated(hub); }
    else this._hass.callService("remote", "turn_off", { entity_id: hub });
    (this._offPend ||= {})[hub] = Date.now();
    setTimeout(() => this._rerender(), 8200);
    setTimeout(() => this._rerender(), 350); // let the red flash be seen first
  },

  _helpHtml(h, act, t) {
    const open = !!this._helpOpen?.[h.id];
    if (!open) return "";
    const { usable, hid, visible, manual } = this._helpItems(h, act);
    const edit = !!this._helpEdit?.[h.id];
    const shown = edit ? usable : visible;
    const names = this._helpNames();
    const overrides = { ...(this._settings().keyIcons || {}), ...(this._config.key_icons || {}) };
    const devs = this._config.compact ? {} : this._devicesOf(h.id);
    const cards = shown.map((it) => {
      const pw = it.power ? `<button class="key helpkey ${powerCls(it.power)}" data-hub="${esc(h.id)}" data-device="${esc(it.device)}" data-cmd="${esc(it.power)}" title="${esc(it.device)}"><ha-icon icon="mdi:power"></ha-icon></button>` : "";
      const ap = !it.power && it.adb ? `<button class="key helpkey pon" data-adb="${esc(it.adb)}" data-adbcmd="input keyevent 224" title="${esc(it.device)}"><ha-icon icon="mdi:power"></ha-icon></button>` : "";
      const ic = it.input ? keyIcon(it.input, overrides, it.device) || "mdi:import" : "";
      const inp = it.input ? `<button class="key helpkey inp" data-hub="${esc(h.id)}" data-device="${esc(it.device)}" data-cmd="${esc(it.input)}"><ha-icon icon="${ic}"></ha-icon><b>${esc(prettyCommand(it.input).replace(/^Input\s*/i, ""))}</b></button>` : "";
      const state = `${t.on}${it.inputRaw ? ` · ${it.input ? prettyCommand(it.input).replace(/^Input\s*/i, "") : it.inputRaw}` : ""}`;
      const sw = edit ? `<label class="hsw" title="${esc(t.helpShowDev)}"><input type="checkbox" data-helphide data-hub="${esc(h.id)}" data-act="${esc(act)}" data-device="${esc(it.device)}" ${hid.has(it.device) ? "" : "checked"}><i></i></label>` : "";
      const note = !it.power && !it.input && !it.adb ? ` · ${t.helpNoCmd}` : "";
      // The device name leads to the remote of that device (only navigation, nothing is switched).
      const go = !edit && devs[it.device];
      const dev = `<ha-icon icon="${this._deviceIcon(it.device, h.id)}"></ha-icon>${names ? `<span>${esc(it.device)}<small>${esc(state + note)}</small></span>` : ""}${go ? `<ha-icon class="golink" icon="mdi:chevron-right"></ha-icon>` : ""}`;
      return `<div class="hrow ${hid.has(it.device) ? "dim" : ""}" title="${esc(it.device)}">${sw}${go ? `<button class="hdev go" data-gotodev="${esc(it.device)}" data-hub="${esc(h.id)}" title="${esc(fmtText(t.helpGoDev, [it.device]))}">${dev}</button>` : `<div class="hdev">${dev}</div>`}
        <div class="hkeys">${edit ? "" : pw + ap + inp}${!pw && !ap && !inp && !names ? `<small class="nocmd">${esc(state + note)}</small>` : ""}</div></div>`;
    }).join("");
    const all = visible.length && !edit ? `<button class="helpall" title="${t.helpAll}" data-helpall="${esc(h.id)}" data-act="${esc(act)}"><ha-icon icon="mdi:power"></ha-icon><span>${t.helpAll}</span></button>` : "";
    const lm = this._layoutMode(h.id, act);
    const foot = this._config.compact ? "" : `<div class="hfoot"><button class="hlink ${edit ? "on" : ""}" data-helpedit="${esc(h.id)}"><ha-icon icon="mdi:tune-variant"></ha-icon><span>${edit ? t.helpDone : t.helpAdjust}</span></button>
      ${act === h.current ? `<label class="hlink"><span>${t.layoutMode}</span><select data-layoutmode data-hub="${esc(h.id)}" data-act="${esc(act)}">${[["auto", t.layoutAuto], ["remote", t.layoutRemote], ["keypad", t.layoutKeypad]].map(([k, v]) => `<option value="${k}" ${k === lm ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>` : ""}</div>`;
    const none = (manual.length && !edit && this._settings().helpManual ? `<div class="hint nocl">${fmtText(t.helpManual, [manual.join(", ")])}</div>` : "");
    return `<div class="helpbox"><div class="htitle">${t.helpTitle}</div>${cards ? `<div class="hlist">${cards}</div>${all}` : `<div class="hint">${t.helpNone}</div>`}${none}${foot}</div>`;
  },

  // Help box -> remote of one device; the device view then offers the way back to the activity.
  _gotoDevice(hub, dev) {
    this._buzz();
    this._helpOpen = { ...(this._helpOpen || {}), [hub]: false };
    this._modeState = "devices";
    this._device = { ...(this._device || {}), [hub]: dev };
    if (this._collapseOn()) this._hdrCollapsed = { ...(this._hdrCollapsed || {}), [hub]: true };
    this._scrollRemote = true; this._scrollAt = Date.now();
    this._rerender();
  },

  _gotoActivity(hub) {
    this._buzz();
    this._modeState = "activities";
    if (this._collapseOn()) this._hdrCollapsed = { ...(this._hdrCollapsed || {}), [hub]: true };
    this._scrollRemote = true; this._scrollAt = Date.now();
    this._rerender();
  },

  // The activity a device belongs to right now (running Harmony activity, else the Fire TV activity while the Fire TV is on), or null.
  _runningActOf(h, dev) {
    const cur = h.current && h.current !== "PowerOff" ? h.current : null;
    const f = this._fireInfo(h.id);
    const act = cur || (f && (f.mode === "on" || f.mode === "playing") ? this._fireActivity(h) : null);
    return act && this._setupOf(h, act).some((it) => it.device === dev) ? act : null;
  },

  // Events of the help box and of hold-to-switch-off.
  _bindHelp(root) {
    root.querySelectorAll("[data-gotodev]").forEach((b) => b.addEventListener("click", () => this._gotoDevice(b.dataset.hub, b.dataset.gotodev)));
    root.querySelectorAll("[data-gotoact]").forEach((b) => b.addEventListener("click", () => this._gotoActivity(b.dataset.gotoact)));
    root.querySelectorAll("[data-help]").forEach((b) => b.addEventListener("click", () => { this._buzz(); this._helpOpen = { ...(this._helpOpen || {}), [b.dataset.help]: !this._helpOpen?.[b.dataset.help] }; this._rerender(); }));
    root.querySelectorAll("[data-helpedit]").forEach((b) => b.addEventListener("click", () => { this._helpEdit = { ...(this._helpEdit || {}), [b.dataset.helpedit]: !this._helpEdit?.[b.dataset.helpedit] }; this._rerender(); }));
    root.querySelectorAll("input[data-helphide]").forEach((i) => i.addEventListener("change", () => {
      const all = JSON.parse(JSON.stringify(this._settings().helpHide || {}));
      const cur = new Set(all[i.dataset.hub]?.[i.dataset.act] || []);
      if (i.checked) cur.delete(i.dataset.device); else cur.add(i.dataset.device);
      ((all[i.dataset.hub] ||= {})[i.dataset.act]) = [...cur];
      this._saveSettings({ helpHide: all });
    }));
    root.querySelectorAll("select[data-layoutmode]").forEach((sel) => sel.addEventListener("change", () => {
      const all = JSON.parse(JSON.stringify(this._settings().layoutMode || {}));
      ((all[sel.dataset.hub] ||= {})[sel.dataset.act]) = sel.value;
      this._saveSettings({ layoutMode: all });
    }));
    root.querySelectorAll("[data-hold]").forEach((b) => {
      let raf = 0, t0 = 0, done = false;
      const reset = () => { cancelAnimationFrame(raf); raf = 0; b.classList.remove("holding"); b.style.removeProperty("--p"); };
      const step = (now) => {
        const p = Math.min(100, ((now - t0) / 700) * 100);
        b.style.setProperty("--p", p.toFixed(1));
        if (p >= 100) { done = true; reset(); b.classList.add("fired"); setTimeout(() => b.classList.remove("fired"), 500); this._holdOff(b); return; }
        raf = requestAnimationFrame(step);
      };
      const start = (e) => {
        if (e.type === "keydown" && (e.repeat || !["Enter", " "].includes(e.key))) return;
        if (e.type === "pointerdown" && e.button > 0) return;
        if (raf) return;
        done = false; t0 = performance.now(); b.classList.add("holding"); this._buzz(8); raf = requestAnimationFrame(step);
      };
      const stop = () => {
        if (!raf) return;
        reset();
        if (!done) { b.dataset.hint = "1"; setTimeout(() => b.removeAttribute("data-hint"), 1600); }
      };
      b.addEventListener("pointerdown", start);
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, stop));
      b.addEventListener("keydown", start); b.addEventListener("keyup", stop);
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    root.querySelectorAll("[data-helpall]").forEach((b) => b.addEventListener("click", async () => {
      this._buzz(25);
      const h = this._hubs().find((x) => x.id === b.dataset.helpall);
      for (const it of this._helpItems(h, b.dataset.act).visible) {
        if (it.power) this._hass.callService("remote", "send_command", { entity_id: h.id, device: it.device, command: it.power });
        else if (it.adb) this._adb(it.adb, "input keyevent 224");
        if (it.input) { await new Promise((r) => setTimeout(r, 900)); this._hass.callService("remote", "send_command", { entity_id: h.id, device: it.device, command: it.input }); }
        await new Promise((r) => setTimeout(r, 400));
      }
    }));
  },
};
