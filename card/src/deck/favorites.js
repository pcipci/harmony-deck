// Favourites: per device and per activity, display and editor.
import { KEY_GROUPS, GROUP_ICONS, keyIcon, chipIcon, prettyCommand } from "../shared/commands.js";
import { esc } from "../shared/util.js";
import { moveKey, mergeOrder } from "../shared/keyorder.js";

export const favoritesMixin = {
  _actInvolved(hubId, act) {
    const roles = this._roles(hubId, act) || {};
    const set = new Set(Object.values(roles).filter(Boolean));
    (this._info?.hubs?.[hubId]?.setup?.[act] || []).forEach((i) => i.device && set.add(i.device));
    return [...set].filter((d) => this._devicesOf(hubId)[d]);
  },

  _favEdit(h, t, standalone = false) {
    const acts = h.list.filter((n) => n !== "PowerOff");
    if (!acts.length) return "";
    const sel = this._afSel?.[h.id] && acts.includes(this._afSel[h.id]) ? this._afSel[h.id] : acts[0];
    const cur = new Set((this._settings().activityFavs?.[h.id]?.[sel] || []).map((f) => `${f.d}\u0000${f.c}`));
    const roles = this._roles(h.id, sel) || {};
    const roleDevs = new Set(["volume", "nav", "channel", "transport"].map((r) => roles[r]).filter(Boolean));
    const devs = this._actInvolved(h.id, sel).map((d) => {
      const viaDev = roleDevs.has(d) ? new Set(this._favs(h.id, d)) : new Set();
      const ov = { ...(this._settings().keyIcons || {}), ...(this._config.key_icons || {}) };
      const grp = (c) => (/vol|mute/i.test(c) ? 0 : /^(up|down|left|right|select|ok|enter|back|home|menu|exit|return)/i.test(c) ? 1 : /play|pause|stop|rew|forw|fast|skip|next|prev|record|ff|rw/i.test(c) ? 2 : /^(\d|num|digit)/i.test(c) ? 3 : 4);
      const chip = (c) => viaDev.has(c) && !cur.has(`${d}\u0000${c}`)
        ? `<label class="fchip via" title="${esc(t.favViaDevice)}"><input type="checkbox" checked disabled><span><ha-icon icon="mdi:star"></ha-icon>${esc(prettyCommand(c))}</span></label>`
        : `<label class="fchip"><input type="checkbox" data-afav data-hub="${esc(h.id)}" data-act="${esc(sel)}" data-dev="${esc(d)}" data-cmd="${esc(c)}" ${cur.has(`${d}\u0000${c}`) ? "checked" : ""}><span>${(keyIcon(c, ov, d) || chipIcon(c)) ? `<ha-icon icon="${keyIcon(c, ov, d) || chipIcon(c)}"></ha-icon>` : ""}${esc(prettyCommand(c))}</span></label>`;
      const sorted = [...(this._devicesOf(h.id)[d] || [])].sort((x, y) => grp(x) - grp(y));
      const chips = sorted.map((c, i) => (i && grp(c) !== grp(sorted[i - 1]) ? '<i class="fbr"></i>' : "") + chip(c)).join("");
      return `<details class="fdev" data-fdev="${esc(d)}" ${this._afOpen?.[`${h.id}/${sel}/${d}`] ? "open" : ""}><summary>${esc(d)}</summary><div class="chipbox">${chips}</div></details>`;
    }).join("");
    return `<div class="esec" ${standalone ? "" : 'data-t="acts"'}><div class="etitle" data-actfavs>${t.actFavs}</div>
      <div class="hint" style="padding:6px 0;text-align:left;font-size:12px">${t.actFavsHint}</div>
      <label class="erow"><span>${t.activity}</span><select data-afsel data-hub="${esc(h.id)}">${acts.map((n) => `<option ${n === sel ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>${devs || `<div class="ehint">${t.favHint}</div>`}</div>`;
  },

  _favs(hubId, device) { return this._settings().favorites?.[hubId]?.[device] || []; },

  _favBlock(h, device, cmds, t, overrides) {
    if (!cmds.length && !this._edit) return "";
    const cells = cmds.map((c, i) => {
      const icon = keyIcon(c, overrides, device);
      const mark = !this._edit ? "" : this._orderMode() ? this._editMark(h.id, device, c, cmds, { i, n: cmds.length }) : '<ha-icon class="star" icon="mdi:star"></ha-icon>';
      return `<button class="key cell isfav" title="${esc(device)}: ${esc(c)}" data-hub="${esc(h.id)}" data-device="${esc(device)}" data-cmd="${esc(c)}">${icon ? `<ha-icon icon="${esc(icon)}"></ha-icon>` : ""}<span>${esc(prettyCommand(c))}</span>${mark}</button>`;
    }).join("");
    return `<div class="block favs"><span class="dname">${t.favorites}${this._edit ? ` · ${esc(device)}` : ""}</span>
      <div class="cells">${cells || `<span class="ehint">${t.favHint}</span>`}</div></div>`;
  },

  // Favourites of every device that serves the running activity.
  _activityFavs(h, roles, t, act = "") {
    if (this._edit) return "";
    const overrides = { ...(this._settings().keyIcons || {}), ...(this._config.key_icons || {}) };
    const all = (this._settings().activityFavs?.[h.id]?.[act] || []).filter((f) => this._devicesOf(h.id)[f.d]?.includes(f.c)).map((f) => [f.d, f.c]);
    const seen = new Set(all.map(([d, c]) => `${d}\u0000${c}`));
    const devices = [...new Set(["volume", "nav", "channel", "transport"].map((r) => roles[r]).filter(Boolean))];
    devices.forEach((d) => this._favs(h.id, d).forEach((c) => { if (!seen.has(`${d}\u0000${c}`)) { seen.add(`${d}\u0000${c}`); all.push([d, c]); } }));
    if (!all.length) return "";
    const cells = all.map(([d, c]) => {
      const icon = keyIcon(c, overrides, d);
      return `<button class="key cell isfav" title="${esc(d)}: ${esc(c)}" data-hub="${esc(h.id)}" data-device="${esc(d)}" data-cmd="${esc(c)}">${icon ? `<ha-icon icon="${esc(icon)}"></ha-icon>` : ""}<span>${esc(prettyCommand(c))}</span></button>`;
    }).join("");
    return `<div class="block favs"><span class="dname">${t.favorites}</span><div class="cells">${cells}</div></div>`;
  },

  async _toggleHide(hubId, device, cmd) {
    const all = JSON.parse(JSON.stringify(this._settings().hideKeys || {}));
    const list = ((all[hubId] ||= {})[device] ||= []);
    const i = list.indexOf(cmd);
    if (i >= 0) list.splice(i, 1); else list.push(cmd);
    if (!list.length) delete all[hubId][device];
    await this._saveSettings({ hideKeys: all });
  },

  // Hide mode, device page: the key groups of the device as switches (cross, volume, channel ...), per device.
  _hideGroupsHtml(hubId, device, t) {
    if (!this._hideMode() || !device) return "";
    const has = (g) => KEY_GROUPS[g].some((a) => !!this._cmd(hubId, device, a) || !!this._adbCode(hubId, device, a));
    const hidden = this._settings().hideGroups?.[hubId]?.[device] || [];
    const chips = Object.keys(KEY_GROUPS).filter(has).map((g) => {
      const off = hidden.includes(g);
      return `<button class="key cell hgroup ${off ? "hidden" : ""}" data-hgroup="${g}" data-hub="${esc(hubId)}" data-device="${esc(device)}" aria-pressed="${off}"><ha-icon icon="${GROUP_ICONS[g]}"></ha-icon><span>${esc(t.keyGroups?.[g] || g)}</span><ha-icon class="star eye" icon="${off ? "mdi:eye-off" : "mdi:eye-outline"}"></ha-icon></button>`;
    }).join("");
    return chips ? `<div class="block hgroups"><span class="dname">${t.keyGroupsTitle}</span><div class="cells">${chips}</div></div>` : "";
  },

  async _toggleGroup(hubId, device, group) {
    const all = JSON.parse(JSON.stringify(this._settings().hideGroups || {}));
    const list = ((all[hubId] ||= {})[device] ||= []);
    const i = list.indexOf(group);
    if (i >= 0) list.splice(i, 1); else list.push(group);
    if (!list.length) delete all[hubId][device];
    if (!Object.keys(all[hubId]).length) delete all[hubId];
    await this._saveSettings({ hideGroups: all });
  },

  // Mark on a key in edit mode: star (favourites), eye (hide keys) or arrows (order, only keys of a block that can
  // move: pos = {i, n} is the place in the block).
  _editMark(hubId, device, c, favs, pos = null) {
    if (this._orderMode()) {
      if (!pos || pos.n < 2) return "";
      return `${pos.i > 0 ? '<span class="ord l" data-ord="-1"><ha-icon icon="mdi:chevron-left"></ha-icon></span>' : ""}${pos.i < pos.n - 1 ? '<span class="ord r" data-ord="1"><ha-icon icon="mdi:chevron-right"></ha-icon></span>' : ""}`;
    }
    if (this._hideMode()) return `<ha-icon class="star eye" icon="${this._hiddenKeys(hubId, device).includes(c) ? "mdi:eye-off" : "mdi:eye-outline"}"></ha-icon>`;
    return `<ha-icon class="star" icon="${favs.includes(c) ? "mdi:star" : "mdi:star-outline"}"></ha-icon>`;
  },

  // Order mode: the key moves one place inside its block (the keys of the block are read from the page as shown).
  async _moveKey(btn, dir) {
    const { hub, device, cmd } = btn.dataset;
    const cells = btn.closest(".cells");
    if (!cells || !hub || !device) return;
    const block = [...cells.querySelectorAll("button[data-cmd]")].map((b) => b.dataset.cmd);
    const next = moveKey(block, cmd, dir);
    if (next.join("\u0000") === block.join("\u0000")) return;
    this._buzz();
    if (cells.closest(".block.favs")) {      // favourites of the device: their own list is the order (also in the activities)
      const all = JSON.parse(JSON.stringify(this._settings().favorites || {}));
      const list = (all[hub] ||= {})[device] || [];
      all[hub][device] = [...next, ...list.filter((c) => !next.includes(c))];
      return this._saveSettings({ favorites: all });
    }
    const all = JSON.parse(JSON.stringify(this._settings().keyOrder || {}));
    (all[hub] ||= {})[device] = mergeOrder(this._keyOrder(hub, device), next);
    return this._saveSettings({ keyOrder: all });
  },

  async _toggleFav(hubId, device, cmd) {
    if (this._orderMode()) return;
    if (this._hideMode()) return this._toggleHide(hubId, device, cmd);
    const all = JSON.parse(JSON.stringify(this._settings().favorites || {}));
    const list = (all[hubId] ||= {})[device] ||= [];
    const i = list.indexOf(cmd);
    if (i >= 0) list.splice(i, 1); else list.push(cmd);
    await this._saveSettings({ favorites: all });
  },

  // Events of the favourites editor.
  _bindFavorites(root) {
    root.querySelectorAll("button[data-hgroup]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); this._toggleGroup(b.dataset.hub, b.dataset.device, b.dataset.hgroup); }));
    root.querySelectorAll("[data-favkind]").forEach((b) => b.addEventListener("click", () => { this._favKind = b.dataset.favkind; this._rerender(); }));
    root.querySelectorAll("select[data-afsel]").forEach((sel) => sel.addEventListener("change", () => { this._afSel = { ...(this._afSel || {}), [sel.dataset.hub]: sel.value }; this._rerender(); }));
    root.querySelectorAll("details[data-fdev]").forEach((d) => d.addEventListener("toggle", () => {
      const inp = d.querySelector("input[data-afav]");
      if (inp) this._afOpen = { ...(this._afOpen || {}), [`${inp.dataset.hub}/${inp.dataset.act}/${d.dataset.fdev}`]: d.open };
    }));
    root.querySelectorAll("input[data-afav]").forEach((i) => i.addEventListener("change", () => {
      const all = JSON.parse(JSON.stringify(this._settings().activityFavs || {}));
      const list = ((all[i.dataset.hub] ||= {})[i.dataset.act] ||= []).filter((f) => !(f.d === i.dataset.dev && f.c === i.dataset.cmd));
      if (i.checked) list.push({ d: i.dataset.dev, c: i.dataset.cmd });
      all[i.dataset.hub][i.dataset.act] = list;
      this._afOpen = { ...(this._afOpen || {}), [`${i.dataset.hub}/${i.dataset.act}/${i.dataset.dev}`]: true };
      this._saveSettings({ activityFavs: all });
    }));
  },
};
