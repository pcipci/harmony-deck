// Activities view: tiles, links to other entities and the locks that follow from them.
import { RING_TILE, esc } from "../shared/util.js";
import { activityIcon } from "../shared/icons.js";

export const activitiesMixin = {
  // Symbol of an activity: card option `icons`, own choice in the settings, else a guess (same keywords as the devices, so "Mac mini starten" looks like "Mac mini").
  _actIcon(hubId, name) {
    return this._config.icons?.[name] || this._settings().activityIcons?.[hubId]?.[name] || activityIcon(name, (n) => this._deviceIcon(n));
  },

  _activitiesView(h, cur, busy, t, index, part = "") {
    const hidden = this._hidden(h.id);
    const shown = h.list.filter((n) => n !== "PowerOff" && (this._edit || !hidden.has(n)));
    const locks = this._locks(h);
    const secOff = this._secLocked(h.id);
    const offAct = this._fireOfflineAct(h);
    const tiles = shown.map((n) => {
      const on = !busy && cur === n, going = busy && h.starting === n, hid = hidden.has(n);
      if (this._edit) {
        return `<label class="tile edit-tile ${hid ? "hid" : ""}"><input type="checkbox" data-vis data-hub="${esc(h.id)}" data-act="${esc(n)}" ${hid ? "" : "checked"}>
          <ha-icon icon="${esc(this._actIcon(h.id, n))}"></ha-icon><span>${esc(n)}</span></label>`;
      }
      if (!this._edit && secOff.has(n)) {
        const st2 = this._tileStyle();
        return `<button class="tile locked seclocked ts-${st2}" title="${esc(`${n} – ${t.secLockTile}`)}" data-seclocked data-hinttext="${esc(t.secLockTile)}">${st2 === "text" ? "" : `<ha-icon icon="${esc(this._actIcon(h.id, n))}"></ha-icon>`}${st2 === "icon" ? "" : `<span>${esc(n)}</span>`}<ha-icon class="lockic" icon="mdi:lock"></ha-icon></button>`;
      }
      if (n === offAct && !on && !going) {
        const st3 = this._tileStyle();
        return `<button class="tile locked offline ts-${st3}" title="${esc(`${n} – ${t.fireOfflineTile}`)}" data-seclocked data-hinttext="${esc(t.fireOfflineTile)}">${st3 === "text" ? "" : `<ha-icon icon="${esc(this._actIcon(h.id, n))}"></ha-icon>`}${st3 === "icon" ? "" : `<span>${esc(n)}</span>`}<ha-icon class="lockic" icon="mdi:television-off"></ha-icon></button>`;
      }
      const lk = locks.acts.has(n), st = this._tileStyle();
      const hs = !lk && this._holdSwitchOn() && !on && !going && !!(cur || h.starting);
      return `<button class="tile ${on ? "on" : ""} ${going ? "going" : ""} ${lk ? "locked" : ""} ${hs ? "holdsw" : ""} ts-${st}" title="${esc(lk ? `${n} – ${t.locked} · ${t.longPress}` : hs ? `${n} – ${t.switchHold}` : n)}" ${lk ? "data-locked" : ""} ${hs ? `data-holdsw data-hinttext="${esc(t.switchHold)}"` : ""} data-hub="${esc(h.id)}" data-act="${esc(n)}">
        ${st === "text" ? "" : `<ha-icon icon="${esc(this._actIcon(h.id, n))}"></ha-icon>`}${st === "icon" ? "" : `<span>${esc(n)}</span>`}${lk ? `<ha-icon class="lockic" icon="mdi:lock"></ha-icon>` : ""}</button>`;
    }).join("");
    const aTiles = this._edit ? [] : this._actionTiles(h, cur, t);
    const cols = Number(this._config.columns) || 3;
    const rest = (shown.length + aTiles.length) % cols;
    const offBtn = this._edit ? "" : `<button class="tile off holdoff" style="grid-column: span ${rest ? cols - rest : cols}" title="${esc(this._config.off_label || t.off)}" data-hub="${esc(h.id)}" data-hold="tile" data-hinttext="${esc(t.holdHint)}">${RING_TILE}<ha-icon icon="mdi:power"></ha-icon></button>`;
    const body = this._edit ? this._editHtml(t, h) : cur ? this._panelHtml(h, this._roles(h.id, cur), t, { small: this._activityFavs(h, this._roles(h.id, cur), t, cur), big: this._directHtml(h, this._roles(h.id, cur).nav, t, true, cur) }) : this._fireOnlyHtml(h, t);
    if (part === "grid") return `<div class="grid">${tiles}${aTiles.join("")}${offBtn}</div>`;
    if (part === "below") return body;
    return this._edit ? `${body}<div class="grid" data-t="acts">${tiles}</div>` : `<div class="grid">${tiles}${aTiles.join("")}${offBtn}</div>${body}`;
  },

  // The Fire TV activity while its direct (ADB) link is not reachable and the option "lock when not reachable" is on, else null.
  _fireOfflineAct(h) {
    const f = this._fireInfo(h.id);
    if (!f || !f.cfg.lockOffline || f.mode !== "unknown") return null;
    return this._fireActivity(h);
  },

  // Links: {activity, entity, lockActivities, lockKeys} per hub (card option `links` wins over the shared settings).
  _links(h) {
    const list = this._config.links?.[h.id] ?? this._settings().links?.[h.id] ?? [];
    return list.filter((l) => l && l.activity);
  },

  _entityOn(entity) {
    const st = entity && this._hass?.states?.[entity]?.state;
    return !!st && !["off", "standby", "unavailable", "unknown", "none"].includes(st);
  },

  // Activities and key groups locked right now (link whose activity is running).
  _locks(h) {
    const acts = new Set(), keys = new Set();
    for (const l of this._links(h)) {
      if (h.current !== l.activity || h.starting) continue;
      (l.lockActivities || []).forEach((a) => a !== l.activity && acts.add(a));
      (l.lockKeys || []).forEach((k) => keys.add(k));
    }
    return { acts, keys };
  },

  // A linked player runs while Harmony shows another activity: a hint with "Match" (shown in the gear window since 0.16).
  _linkHints(h, t) {
    if (this._edit || h.starting) return [];
    return this._links(h).filter((l) => l.entity && this._entityOn(l.entity) && h.current !== l.activity).map((l) => {
      const name = this._hass.states[l.entity]?.attributes?.friendly_name || l.entity;
      return { key: `${l.entity}>${l.activity}`, html: `<div class="hint-row o"><ha-icon icon="mdi:link-variant"></ha-icon><span>${esc(t.linkMismatch(name, h.current || t.none))}</span><button data-sync="${esc(h.id)}" data-act="${esc(l.activity)}">${t.linkSync}</button></div>` };
    });
  },

  // Events of the activity tiles.
  _bindActivities(root) {
    root.querySelectorAll("[data-sync]").forEach((b) => b.addEventListener("click", () => { this._buzz(25); this._hass.callService("remote", "turn_on", { entity_id: b.dataset.sync, activity: b.dataset.act }); }));
    root.querySelectorAll(".tile[data-locked]").forEach((b) => {
      let tm = null;
      b.addEventListener("pointerdown", () => { b.classList.add("holding"); tm = setTimeout(() => { this._buzz(40); this._hass.callService("remote", "turn_on", { entity_id: b.dataset.hub, activity: b.dataset.act }); }, 700); });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, () => { clearTimeout(tm); b.classList.remove("holding"); }));
    });
    // Not allowed by the security lock: no start, a short hint instead.
    root.querySelectorAll(".tile[data-seclocked]").forEach((b) => b.addEventListener("click", () => {
      this._buzz(20);
      b.dataset.hint = "1";
      setTimeout(() => b.removeAttribute("data-hint"), 1600);
    }));
    // Switching from a running activity (option): hold the tile, the fill shows the progress.
    root.querySelectorAll(".tile[data-holdsw]").forEach((b) => {
      let tm = null, done = false;
      const stop = () => { clearTimeout(tm); b.classList.remove("holding"); if (!done && tm) { b.dataset.hint = "1"; setTimeout(() => b.removeAttribute("data-hint"), 1600); } tm = null; };
      b.addEventListener("pointerdown", (e) => {
        if (e.button > 0) return;
        done = false; b.classList.add("holding"); this._buzz(8);
        tm = setTimeout(() => { done = true; tm = null; b.classList.remove("holding"); this._buzz(40); this._startActivity(b.dataset.hub, b.dataset.act); }, 700);
      });
      ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => b.addEventListener(ev, stop));
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    root.querySelectorAll(".tile[data-act]:not([data-locked]):not([data-holdsw])").forEach((b) => b.addEventListener("click", () => {
      this._buzz(25);
      this._startActivity(b.dataset.hub, b.dataset.act);
    }));
  },

  // Starts an activity and folds the header away (option collapse_header).
  _startActivity(hub, activity) {
    this._hass.callService("remote", "turn_on", { entity_id: hub, activity });
    const apply = () => {
      if (this._collapseOn()) { this._hdrCollapsed = { ...(this._hdrCollapsed || {}), [hub]: true }; this._scrollRemote = true; this._scrollAt = Date.now(); }
      this._rerender();
    };
    if (this._collapseOn()) this._animSection(hub, "collapse", apply); else apply();
  },
};
