// Rendering of the main card: frame, hub section, collapse animation, scroll keeping.
import { RING_IB, esc } from "../shared/util.js";
import { SKINS } from "../shared/skins.js";
import { fmtText } from "../shared/i18n.js";
import { roomIcon } from "../shared/icons.js";

export const renderMixin = {
  _rerender() {
    const keep = this._scrollRemote ? null : this._scrollState();
    this._key = ""; this.hass = this._hass;
    if (keep) { keep(); requestAnimationFrame(keep); }
  },

  // Remember the scroll position of the page (and scrollable parents) so that a re-render does not jump to the top.
  _scrollState() {
    const els = new Set([document.scrollingElement]);
    let n = this;
    while (n) { if (n.scrollHeight > n.clientHeight + 1) els.add(n); n = n.parentElement || n.getRootNode?.().host || null; }
    const saved = [...els].filter(Boolean).map((e) => [e, e.scrollTop]);
    return () => saved.forEach(([e, y]) => { if (Math.abs(e.scrollTop - y) > 1) e.scrollTop = y; });
  },

  // On first render: jump to the hub where something is running (activity, or a linked device that is on); with several, the one used last.
  _autoJump(hubs) {
    if (this._jumped || !this._info) return;
    this._jumped = true;
    if (this._edit || this._editMode || !this._jumpOn()) return;
    const run = (h) => h.current && h.current !== "PowerOff";
    const fireOn = (h) => { const f = this._fireInfo(h.id); return !!f && (f.mode === "on" || f.mode === "playing"); };
    const running = hubs.filter((h) => run(h) || fireOn(h) || this._links(h).some((l) => l.entity && this._entityOn(l.entity)));
    if (!running.length) return;
    let last = "";
    try { last = localStorage.getItem("harmony_deck_last_hub") || ""; } catch (e) { /* no storage */ }
    const pick = running.find((h) => h.id === last) || running[0];
    this._hubSel = pick.id;
    if ((run(pick) || fireOn(pick)) && this._collapseOn()) { this._hdrCollapsed = { ...(this._hdrCollapsed || {}), [pick.id]: true }; this._scrollRemote = true; this._scrollAt = Date.now(); }
  },

  _render(hubs) {
    if (hubs && !this._jumped) this._autoJump(hubs);
    const t = this._t();
    const skin = this._skin();
    const vars = { ...(SKINS[skin] || {}), ...(this._config.skin_vars || {}) };
    if (this._noBlur()) vars["--hr-blur"] = "none";
    const varCss = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";");
    const hiddenHubs = new Set(this._settings().hiddenHubs || []);
    let vis = this._editMode === "settings" || this._config.entity ? hubs : hubs.filter((h) => !hiddenHubs.has(h.id));
    if (!vis.length) vis = hubs;
    if (!vis.some((h) => h.id === this._hubSel)) this._hubSel = vis[0]?.id;
    const sel = vis.find((h) => h.id === this._hubSel);
    const tabs = vis.length > 1 ? `<div class="hubtabs"><span class="rooms-lab">${t.rooms}</span>${vis.map((h) => `<button class="${h.id === this._hubSel ? "sel" : ""} ${h.current && h.current !== "PowerOff" ? "live" : ""} ${hiddenHubs.has(h.id) ? "off" : ""}" data-hubtab="${esc(h.id)}"><span class="ico"><ha-icon icon="${h.areaIcon || roomIcon(h.name)}"></ha-icon>${this._fireDot(h.id, t)}</span><span class="rn">${esc(h.name)}</span>${h.current && h.current !== "PowerOff" ? `<small>${esc(h.current)}</small>` : ""}</button>`).join("")}</div>` : "";
    this._tabsShown = !!tabs;
    const blocks = sel ? this._hubHtml(sel, t, 0, tabs) : "";
    // Hold the card height while the markup is replaced, so the page does not shrink for a moment and the browser keeps the scroll position.
    const held = this.offsetHeight;
    if (held) this.style.minHeight = `${held}px`;
    this.shadowRoot.innerHTML = `${this._style()}
      <ha-card style="${esc(varCss)}" data-skin="${esc(skin)}" class="${this._colorful() ? "colorful" : ""} g-${this._glow()} ks-${this._keyStyle()} lay-${this._layout()} as-${this._activeStyle()} hl-${this._labels()} ${this._edit ? `ed et-${this._etabNow()}` : ""}">
        ${this._edit ? `<div class="edittool"><div class="edmode">${this._edModeHtml(t)}</div>
          ${this._cancelAsk
            ? `<div class="askq">${t.cancelAsk}</div><div class="editrow"><button class="editcancel" data-edit="cancelno"><span>${t.cancelBack}</span></button><button class="editdone warn" data-edit="cancelyes"><ha-icon icon="mdi:delete-outline"></ha-icon><span>${t.cancelDo}</span></button></div>`
            : `<div class="editrow">${this._editMode === "profiles" ? "" : `<button class="editcancel" data-edit="cancel" title="${esc(t.cancelTip)}"><ha-icon icon="mdi:close"></ha-icon><span>${t.cancel}</span></button>`}<button class="editdone" data-edit="off"><ha-icon icon="mdi:check"></ha-icon><span>${t.done}</span></button></div>`}</div>` : ""}
        ${this._skinHead(skin, sel)}${blocks || `<p class="empty">${t.empty}</p>`}${this._skinTail(skin)}
      </ha-card>`;
    this._bind();
    if (held) requestAnimationFrame(() => requestAnimationFrame(() => { this.style.minHeight = ""; }));
    if (this._focusProfName) {
      this._focusProfName = false;
      requestAnimationFrame(() => { const i = this.shadowRoot.querySelector("input[data-prof-name]"); i?.scrollIntoView({ block: "center" }); i?.focus(); });
    }
    if (this._expandHub) {
      const id = this._expandHub; this._expandHub = null;
      this._animSection(id, "expand");
    }
    if (this._scrollRemote) {
      // Only once the layout is final: collapsed header, or a device remote, or collapsing is off.
      const ready = this.shadowRoot.querySelector("section.collapsed") || this._mode() === "devices" || !this._collapseOn();
      if (ready) { this._scrollRemote = false; requestAnimationFrame(() => this._scrollToRemote()); }
      else if (Date.now() - (this._scrollAt || 0) > 8000) this._scrollRemote = false;
    }
  },

  // To the very start of the remote (below the Home Assistant header, see scroll-margin-top in the style).
  _scrollToRemote() { this.shadowRoot.querySelector("section > .below")?.scrollIntoView({ behavior: "smooth", block: "start" }); },

  // Soft collapse / expand of the header parts above the remote (height and opacity), then `done` swaps the markup.
  _animSection(hubId, how, done) {
    const sec = this.shadowRoot.querySelector("section");
    let parts = [];
    try {
      if (sec && !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        parts = [...sec.querySelectorAll(":scope > .hdr > *, :scope > .seg, :scope > .stripcap, :scope > .pager, :scope > .linkbar, :scope > .infopanel, :scope > .helpbox, :scope > .grid")];
      }
    } catch (e) { parts = []; }
    if (!parts.length) { done?.(); return; }
    const clear = (el) => { ["maxHeight", "overflow", "opacity", "transition", "marginTop", "marginBottom"].forEach((k) => { el.style[k] = ""; }); };
    if (how === "collapse") {
      parts.forEach((el) => { el.style.overflow = "hidden"; el.style.maxHeight = `${el.offsetHeight}px`; });
      void sec.offsetHeight;
      parts.forEach((el) => { el.style.transition = "max-height .22s ease, opacity .2s ease, margin .22s ease"; el.style.maxHeight = "0"; el.style.opacity = "0"; el.style.marginTop = "0"; el.style.marginBottom = "0"; });
      setTimeout(() => done?.(), 230);
    } else {
      const heights = parts.map((el) => el.scrollHeight);
      parts.forEach((el) => { el.style.overflow = "hidden"; el.style.maxHeight = "0"; el.style.opacity = "0"; });
      void sec.offsetHeight;
      parts.forEach((el, i) => { el.style.transition = "max-height .22s ease, opacity .22s ease"; el.style.maxHeight = `${heights[i]}px`; el.style.opacity = "1"; });
      setTimeout(() => parts.forEach(clear), 260);
    }
  },

  _mode() { return ["settings", "profiles", "actions", "info"].includes(this._editMode) ? "activities" : this._editMode === "favs" ? "devices" : this._config.compact ? "activities" : (this._modeState || "activities"); },

  _hubHtml(h, t, index = 0, tabs = "") {
    const busy = !!h.starting;
    const cur = h.current && h.current !== "PowerOff" ? h.current : null;
    const mode = this._mode();
    const compact = !!this._config.compact;
    const hasDevices = !compact && Object.keys(this._devicesOf(h.id)).length > 0;
    const p = mode === "devices" ? 1 : 0;
    const seg = hasDevices && !this._edit ? `<div class="seg" data-seg><i class="th" style="transform: translateX(${p * 100}%)"></i>
        <div class="lab ${p ? "" : "a"}" data-lab="0"><ha-icon icon="mdi:remote"></ha-icon><span>${t.activities}</span></div>
        <div class="lab ${p ? "a" : ""}" data-lab="1"><ha-icon icon="mdi:devices"></ha-icon><span>${t.devicesTab}</span></div></div>` : "";
    const pend = !!this._offPend?.[h.id] && Date.now() - this._offPend[h.id] < 8000;
    const fi = this._fireInfo(h.id);
    const fireOnly = !cur && !!fi && (fi.mode === "on" || fi.mode === "playing");
    const helpAct = cur || (fireOnly ? this._fireActivity(h) : null);
    const helpBtn = this._edit || (compact && !helpAct) ? "" : `<button class="ib ${this._helpOpen?.[h.id] ? "sel" : "hl"}" data-help="${esc(h.id)}" title="${esc(helpAct ? t.help : t.helpOff)}" ${helpAct ? "" : "disabled"}><ha-icon icon="mdi:lifebuoy"></ha-icon></button>`;
    const infoBtn = this._edit ? "" : this._gearBtn(h, t);
    const openNow = mode === "devices" ? this._device?.[h.id] : cur || fireOnly;
    const collapseBtn = !this._edit && !compact ? `<button class="ib subtle" data-hdrcollapse="${esc(h.id)}" title="${esc(openNow ? t.collapseNow : t.collapseOff)}" ${openNow ? "" : "disabled"}><ha-icon icon="mdi:chevron-up"></ha-icon></button>` : "";
    const nameTxt = this._config.title ?? h.name;
    const parts = this._statusParts(h, t, cur, busy);
    const collapsedNow = !this._edit && !compact && !!openNow && !!this._hdrCollapsed?.[h.id];
    const toggleBtn = this._edit || compact ? "" : collapsedNow
      ? `<button class="ib subtle" data-hdr="${esc(h.id)}" title="${esc(t.expandHeader)}"><ha-icon icon="mdi:chevron-down"></ha-icon></button>`
      : collapseBtn;
    // Tools (lock, profile, help, info, collapse) sit right in the row of the room tabs, apart from the device controls.
    const tools = `<div class="bbtns">${this._lockMark(h.id, t)}${this._profChip(t)}${helpBtn}${infoBtn}${toggleBtn}</div>`;
    const top = `<div class="toprow">${this._menuHtml(h, t)}${tabs || (nameTxt ? `<div class="hub">${esc(nameTxt)}</div>` : '<span class="hub"></span>')}${tools}</div>`;
    // Status chips only for what runs (Harmony activity, Fire TV, linked network devices); nothing runs = no chip line.
    const bar = parts.length ? `<div class="bar"><div class="chips">${parts.map((x) => x.html).join("")}</div></div>` : "";
    const boxes = `${!this._edit && helpAct ? this._helpHtml(h, helpAct, t) : ""}`;
    let body;
    if (this._edit || !hasDevices) {
      body = mode === "devices" ? this._devicesView(h, cur, t) : this._activitiesView(h, cur, busy, t, index);
    } else {
      body = `<div class="pager" data-pager data-p="${p}"><div class="track" style="transform: translateX(${-p * 100}%)">
          <div class="pane" data-pane="0">${this._activitiesView(h, cur, busy, t, index, "grid")}</div>
          <div class="pane" data-pane="1">${this._devicesView(h, cur, t, "list")}</div></div></div>
        <div class="below">${this._edit ? "" : this._seqPanel(h, t)}${mode === "devices" ? this._devicesView(h, cur, t, "below") : this._activitiesView(h, cur, busy, t, index, "below")}${this._edit ? "" : this._actionsBlock(h, cur, t)}</div>`;
    }
    if (this._edit) return `<section class="editview"><div class="hdr">${tabs}</div>${this._editBody(h, t, body)}</section>`;
    const cap = hasDevices && !this._edit ? `<div class="stripcap">${mode === "devices" ? t.devicesTab : t.activities}</div>` : "";
    // Big remote open and auto-collapse on: show only a slim line (room, what is open, arrow) plus the remote.
    const open = mode === "devices" ? this._device?.[h.id] : cur || fireOnly;
    if (!this._edit && !compact && open && this._hdrCollapsed?.[h.id]) {
      const what = pend ? t.switchingOff : parts.length ? parts.map((x) => x.text).join(" · ") : t.allOff;
      const below = mode === "devices" ? this._devicesView(h, cur, t, "below") : this._activitiesView(h, cur, busy, t, index, "below");
      const offB = `<button class="ib offb holdoff" data-hold="act" data-hub="${esc(h.id)}" data-hinttext="${esc(t.holdHint)}" title="${esc(t.offAct)}">${RING_IB}<ha-icon icon="mdi:power"></ha-icon></button>`;
      // One text line instead of the chips; the room name only when there are no room tabs.
      const slim = `<button class="slimbar" data-hdr="${esc(h.id)}" title="${esc(t.expandHeader)}"><span class="sw ${pend || parts.length ? "" : "none"}">${esc(what)}</span></button>`;
      const hdr = `${top}<div class="slimrow">${slim}${offB}</div>`;
      return `<section class="collapsed"><div class="hdr">${hdr}</div>${boxes}${below}${this._actionsBlock(h, cur, t)}</section>`;
    }
    return `<section><div class="hdr">${top}${bar}</div>${boxes}${seg}${cap}${body}</section>`;
  },

  // What runs in a room, as chips (expanded) and short texts (collapsed): Harmony activity, Fire TV, linked network devices with their source.
  _statusParts(h, t, cur, busy) {
    const out = [];
    if (busy || cur) {
      const st = busy ? fmtText(t.harmonyStarting, [h.starting]) : cur;
      out.push({ text: st, html: `<span class="status chip active ${busy ? "busy" : ""}" title="${esc(busy ? t.starting(h.starting) : t.running(cur))}"><ha-icon icon="mdi:remote"></ha-icon><span class="ct">${esc(t.harmonyLabel)}: ${esc(st)}</span></span>` });
    }
    const fi = this._fireInfo(h.id);
    const fbar = this._fireBar(h.id, t);
    if (fbar) out.push({ text: fi.appInfo ? `${t.fireLabel} ${fi.appInfo.name}` : t.fireLabel, html: fbar });
    for (const [dev, link] of Object.entries(this._settings().directDevices?.[h.id] || {}).sort(([a], [b]) => a.localeCompare(b))) {
      if (!link?.entity || link.fire || (fi && link.entity === fi.entity)) continue;
      const st = this._hass?.states?.[link.entity];
      if (!st || ["off", "standby", "unavailable", "unknown"].includes(st.state)) continue;
      const src = st.attributes?.source;
      const label = src ? `${dev} · ${src}` : dev;
      out.push({ text: src ? `${dev} ${src}` : dev, html: `<button class="chip netchip" data-chipdev="${esc(dev)}" data-hub="${esc(h.id)}" title="${esc(label)}"><ha-icon icon="mdi:television"></ha-icon><span class="ct">${esc(label)}</span></button>` });
    }
    return out;
  },

  // Events of the frame: room tabs, slider, collapsing.
  _bindFrame(root) {
    root.querySelectorAll("[data-hubtab]").forEach((b) => b.addEventListener("click", () => { this._hubSel = b.dataset.hubtab; try { localStorage.setItem("harmony_deck_last_hub", this._hubSel); } catch (e) { /* no storage */ } this._rerender(); }));
    this._bindSlider();
    root.querySelectorAll("[data-hdrcollapse]").forEach((b) => b.addEventListener("click", () => {
      const hub = b.dataset.hdrcollapse;
      this._animSection(hub, "collapse", () => { this._hdrCollapsed = { ...(this._hdrCollapsed || {}), [hub]: true }; this._scrollRemote = true; this._scrollAt = Date.now(); this._rerender(); });
    }));
    root.querySelectorAll("[data-chipdev]").forEach((b) => b.addEventListener("click", () => this._gotoDevice(b.dataset.hub, b.dataset.chipdev)));
    root.querySelectorAll("[data-hdr]").forEach((b) => b.addEventListener("click", () => { this._hdrCollapsed = { ...(this._hdrCollapsed || {}), [b.dataset.hdr]: false }; this._expandHub = b.dataset.hdr; this._rerender(); }));
  },

  // Slider between "Aktivitäten" and "Geräte": the thumb and the list area follow the finger.
  _bindSlider() {
    const root = this.shadowRoot;
    const seg = root.querySelector("[data-seg]");
    const pager = root.querySelector("[data-pager]");
    if (!seg) return;
    const th = seg.querySelector(".th"), track = pager?.querySelector(".track");
    const panes = pager ? [...pager.querySelectorAll(".pane")] : [];
    let p = Number(pager?.dataset.p || (this._mode() === "devices" ? 1 : 0));
    const heights = () => panes.map((e) => e.offsetHeight);
    const apply = (v, animate) => {
      p = Math.max(0, Math.min(1, v));
      const tr = animate ? "transform .22s ease, height .22s ease" : "none";
      th.style.transition = animate ? "transform .22s ease" : "none";
      th.style.transform = `translateX(${p * 100}%)`;
      seg.querySelectorAll(".lab").forEach((l, i) => l.classList.toggle("a", (p > 0.5 ? 1 : 0) === i));
      if (pager) {
        track.style.transition = tr; track.style.transform = `translateX(${-p * 100}%)`;
        const [a, b] = heights();
        pager.style.transition = animate ? "height .22s ease" : "none";
        pager.style.height = `${a + (b - a) * p}px`;
      }
    };
    if (pager) {
      apply(p, false);
      const ro = new ResizeObserver(() => { if (!this._dragging) apply(p, false); });
      panes.forEach((e) => ro.observe(e));
      this._ro?.disconnect(); this._ro = ro;
    }
    const finish = (target) => {
      apply(target, true);
      const mode = target > 0.5 ? "devices" : "activities";
      if (mode !== this._mode()) setTimeout(() => { this._modeState = mode; this._buzz(); this._rerender(); }, 230);
    };
    let startX = 0, startP = 0, moved = false, active = false;
    const pos = (e) => { const r = seg.getBoundingClientRect(); return (e.clientX - r.left - r.width / 4) / (r.width / 2); };
    seg.addEventListener("pointerdown", (e) => { active = true; moved = false; startX = e.clientX; startP = p; seg.setPointerCapture?.(e.pointerId); this._dragging = true; });
    seg.addEventListener("pointermove", (e) => {
      if (!active) return;
      if (Math.abs(e.clientX - startX) > 6) moved = true;
      if (moved) apply(pos(e), false);
    });
    const end = (e) => {
      if (!active) return;
      active = false; this._dragging = false;
      finish(moved ? p : pos(e) > 0.5 ? 1 : 0);
    };
    seg.addEventListener("pointerup", end);
    seg.addEventListener("pointercancel", () => { active = false; this._dragging = false; apply(startP, true); });
  },
};
