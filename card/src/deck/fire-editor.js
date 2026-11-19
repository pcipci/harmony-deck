// Settings tab Fire TV: connection, apps, packages, keys.
import { FIRE_KEYS, ADB_KEYS } from "../shared/fire.js";
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

export const fireEditorMixin = {
  async _saveDirect(box) {
    const hub = box.dataset.hub;
    const val = (n) => box.querySelector(`[data-direct="${n}"]`)?.value || "";
    const all = { ...(this._fireCfg(hub) ? { [hub]: this._fireCfg(hub) } : {}) };
    if (val("entity")) all[hub] = { entity: val("entity").trim(), device: val("device"), model: val("model"), prefer: val("prefer"), ...(val("irvol") ? { irVolume: val("irvol") } : {}), keymap: Object.fromEntries(["red", "green", "yellow", "blue"].map((c) => [c, val("km_" + c)]).filter((x) => x[1])), hiddenApps: [...box.querySelectorAll('input[data-hide-app]:not(:checked)')].map((i) => i.dataset.hideApp), hiddenKeys: [...box.querySelectorAll('input[data-hide-key]:not(:checked)')].map((i) => i.dataset.hideKey), inActivities: box.querySelector('[data-direct="inact"]')?.checked || false, ...(box.querySelector('[data-direct="offlock"]')?.checked ? { lockOffline: true } : {}), ...(all[hub]?.pkgs ? { pkgs: all[hub].pkgs } : {}), ...(all[hub]?.customApps ? { customApps: all[hub].customApps } : {}) }; else delete all[hub];
    await this._fireSave(hub, all[hub] || null);
  },

  _adbStatus(cur, t, own) {
    const st = this._hass.states;
    const ent = cur.entity;
    const found = own ? (cur.entity ? [cur.entity] : []) : this._fireCandidates();
    const label = (id) => {
      const s = st[id];
      const ok = s && !["unavailable", "unknown"].includes(s.state);
      return `<span class="adbdot ${ok ? "ok" : "bad"}"></span>${esc(s?.attributes?.friendly_name || id)} <small>${ok ? t.adbOk : t.adbDown}</small>`;
    };
    const list = found.length ? found.map((id) => `<div class="adbrow">${label(id)}</div>`).join("") : `<div class="ehint">${t.adbNone}</div>`;
    const res = this._adbRes?.[ent];
    const btn = ent ? `<button class="key adbtest" data-adbtest="${esc(ent)}"><ha-icon icon="mdi:lan-connect"></ha-icon><span>${t.adbTest}</span></button>${res ? `<span class="adbres">${esc(res)}</span>` : ""}` : "";
    // Selected Fire TV not reachable: say what to do instead of only a red dot.
    const down = ent && (!st[ent] || ["unavailable", "unknown"].includes(st[ent].state));
    const help = down ? `<div class="ehint adbhelp"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon><span>${esc(t.adbHelp)}</span></div>` : "";
    return `<div class="dname">${t.adbFound}</div>${list}${help}${btn}`;
  },

  // App management: read installed packages from the Fire TV, assign packages, add own apps.
  _appsEdit(hubId, cur, apps, t) {
    const ent = cur.entity;
    if (!ent) return "";
    const list = this._pkgList?.[ent];
    const known = new Set(apps.map((a) => a.pkg));
    const res = this._pkgRes?.[ent];
    const opts = (sel) => (list || []).map((p) => `<option value="${esc(p)}" ${p === sel ? "selected" : ""}>${esc(p)}</option>`).join("");
    const todo = list ? apps.filter((a) => !a.custom && (a.status === "missing" || a.guess)) : [];
    return `<div class="pkgbox"><div class="ehint">${t.pkgHint}</div>
      <button class="key adbtest" data-pkgread="${esc(ent)}"><ha-icon icon="mdi:package-variant"></ha-icon><span>${t.pkgRead}</span></button>${res ? `<span class="adbres">${esc(res)}</span>` : ""}
      ${todo.length ? `<details class="pkgmapbox"><summary>${fmtText(t.pkgMapTitle, [todo.length])}</summary>${todo.map((a) => `<label class="erow"><span>${esc(a.name)}</span><select data-pkgmap="${esc(a.name)}"><option value="">${t.pkgPick}</option>${opts("")}</select></label>`).join("")}</details>` : ""}
      ${list ? `<div class="dname">${t.pkgCustom}</div>
        <label class="erow"><span>${t.pkgCustomName}</span><input type="text" data-pkgname></label>
        <label class="erow"><span>${t.pkgMap}</span><select data-pkgnew><option value="">${t.pkgPick}</option>${list.filter((p) => !known.has(p)).map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join("")}</select></label>
        <button class="key adbtest" data-pkgadd="${esc(hubId)}"><ha-icon icon="mdi:plus"></ha-icon><span>${t.pkgAdd}</span></button>` : ""}
    </div>`;
  },

  async _patchDirect(hubId, fn) {
    const cur = { ...(this._fireCfg(hubId) || {}) };
    fn(cur);
    await this._fireSave(hubId, cur);
  },

  // The installed apps are read by the integration (one reader for both cards); the card only keeps the answer.
  async _readPackages(ent) {
    const t = this._t();
    this._pkgRes = { ...(this._pkgRes || {}), [ent]: t.pkgWait };
    this._rerender();
    let res = null;
    try { res = await this._hass.callWS({ type: "harmony_deck/fire_apps", entity_id: ent, refresh: true }); } catch (e) { res = null; }
    if (res?.ok) this._takePackages({ [ent]: res.list });
    this._pkgRes = { ...this._pkgRes, [ent]: res?.ok ? fmtText(t.pkgFound, [res.list.length]) : t.pkgNone };
    this._rerender();
  },

  // Package lists per Fire TV entity as the integration has them ({entity: [packages]}).
  _takePackages(map) {
    for (const [ent, list] of Object.entries(map || {})) {
      if (!Array.isArray(list) || !list.length) continue;
      this._pkgs = { ...(this._pkgs || {}), [ent]: new Set(list) };
      this._pkgList = { ...(this._pkgList || {}), [ent]: [...list].sort() };
    }
  },

  _directEdit(h, t, own) {
    const cur = this._fireCfg(h.id) || {};
    const allApps = this._appsOf(h.id);
    const devs = Object.keys(this._devicesOf(h.id));
    const g = t.groups || {};
    const dopts = [`<option value="">${t.directAuto}</option>`, ...devs.map((d) => `<option value="${esc(d)}" ${cur.device === d ? "selected" : ""}>${esc(d)}</option>`)].join("");
    return `<div class="esec directedit" data-t="fire" data-hub="${esc(h.id)}"><div class="etitle">${t.direct}</div>
      <div class="hint" style="padding:6px 0;text-align:left;font-size:12px">${t.directReq}</div>
      <div class="adbstat">${this._adbStatus(cur, t, own)}</div>
      ${this._grp(g.conn, `${own ? `<input type="hidden" data-direct="entity" value="${esc(cur.entity || "")}"><input type="hidden" data-direct="device" value="${esc(cur.device || "")}">` : `<label class="erow"><span>${t.directEntity}</span>${this._entSelect('data-direct', this._fireCandidates(), cur.entity || "", t)}</label>
        <label class="erow"><span>${t.directDevice}</span><select data-direct="device">${dopts}</select></label>`}
        <label class="erow"><span>${t.directModel}</span><select data-direct="model">${Object.entries(t.models).map(([k, v]) => `<option value="${k}" ${(cur.model || "all") === k ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
        <label class="erow"><span>${t.directPrefer}</span><select data-direct="prefer"><option value="">${t.preferH}</option><option value="adb" ${cur.prefer === "adb" ? "selected" : ""}>${t.preferA}</option></select></label>
        ${(cur.model || "all") === "cube" ? `<label class="erow"><span>${t.irVolume}</span><select data-direct="irvol"><option value="">${t.irVolumeOff}</option><option value="cube" ${cur.irVolume === "cube" ? "selected" : ""}>${t.irVolumeCube}</option></select></label>` : ""}`)}
      ${this._grp(g.fireAct, `${this._swRow(t.directAct, 'data-direct="inact"', cur.inActivities)}
        ${this._swRow(t.offlineLock, 'data-direct="offlock"', cur.lockOffline)}`)}
      ${this._grp(g.colorKeys, ["red", "green", "yellow", "blue"].map((c) => `<label class="erow"><span>${t.colorKey[c]}</span><select data-direct="km_${c}"><option value="">–</option>${allApps.map((a) => `<option ${cur.keymap?.[c] === a.name ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select></label>`).join(""))}
      <div class="dname">${t.directShow}</div><div class="ehint pkgleg"><b>${t.pkgLegendLabel}</b> <ha-icon class="abadge s-unv" icon="mdi:help-circle-outline"></ha-icon>${t.unvChip} <ha-icon class="abadge s-ok" icon="mdi:check-circle-outline"></ha-icon>${t.instChip} <ha-icon class="abadge s-bad" icon="mdi:alert-circle-outline"></ha-icon>${t.missChip}</div><div class="cells">${allApps.map((a) => `<label class="erow approw"><input type="checkbox" data-hide-app="${esc(a.name)}" ${(cur.hiddenApps || []).includes(a.name) ? "" : "checked"}><span class="appname" title="${esc(a.pkg || "")}">${esc(a.name)}${this._appBadge(a, t)}</span>${!a.custom && cur.pkgs?.[a.name] ? `<button class="mini" data-pkgunmap="${esc(a.name)}" data-hub="${esc(h.id)}" title="${esc(fmtText(t.pkgUnmap, [cur.pkgs[a.name]]))}"><ha-icon icon="mdi:link-variant-off"></ha-icon></button>` : ""}${a.custom ? `<button class="mini" data-pkgdel="${esc(a.name)}" data-hub="${esc(h.id)}" title="${esc(t.pkgRemove)}"><ha-icon icon="mdi:close"></ha-icon></button>` : ""}</label>`).join("")}</div>
      ${this._appsEdit(h.id, cur, allApps, t)}
      <div class="dname">${t.lockApps}</div><div class="ehint">${t.lockAppsMoved}</div>
      <div class="dname">${t.directShowKeys}</div><div class="cells">${FIRE_KEYS.filter(([, , c]) => !Object.values(ADB_KEYS).includes(c)).map(([l]) => `<label class="erow approw"><input type="checkbox" data-hide-key="${esc(l)}" ${(cur.hiddenKeys || []).includes(l) ? "" : "checked"}><span>${esc(t.fireKeys?.[l] || l)}</span></label>`).join("")}</div></div>`;
  },

  // Events of the settings tab Fire TV.
  _bindFireEditor(root) {
    root.querySelectorAll("[data-direct], [data-hide-app], [data-hide-key]").forEach((el) => el.addEventListener("change", () => this._saveDirect(el.closest(".directedit"))));
    root.querySelectorAll("[data-pkgread]").forEach((b) => b.addEventListener("click", () => this._readPackages(b.dataset.pkgread)));
    root.querySelectorAll("select[data-pkgmap]").forEach((sel) => sel.addEventListener("change", () => {
      const hub = sel.closest("[data-hub]").dataset.hub;
      if (sel.value) this._patchDirect(hub, (c) => { c.pkgs = { ...(c.pkgs || {}), [sel.dataset.pkgmap]: sel.value }; });
    }));
    root.querySelectorAll("[data-pkgadd]").forEach((b) => b.addEventListener("click", () => {
      const box = b.closest(".pkgbox");
      const name = box.querySelector("[data-pkgname]").value.trim();
      const pkg = box.querySelector("[data-pkgnew]").value;
      if (name && pkg) this._patchDirect(b.dataset.pkgadd, (c) => { c.customApps = [...(c.customApps || []).filter((x) => x.name !== name), { name, pkg }]; });
    }));
    root.querySelectorAll("[data-pkgunmap]").forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault();
      this._patchDirect(b.dataset.hub, (c) => { const m = { ...(c.pkgs || {}) }; delete m[b.dataset.pkgunmap]; if (Object.keys(m).length) c.pkgs = m; else delete c.pkgs; });
    }));
    root.querySelectorAll("[data-pkgdel]").forEach((b) => b.addEventListener("click", (e) => {
      e.preventDefault();
      this._patchDirect(b.dataset.hub, (c) => { c.customApps = (c.customApps || []).filter((x) => x.name !== b.dataset.pkgdel); });
    }));
    root.querySelectorAll("[data-adbtest]").forEach((b) => b.addEventListener("click", async () => {
      const ent = b.dataset.adbtest;
      this._adbRes = { ...(this._adbRes || {}), [ent]: this._t().adbWait };
      this._rerender();
      let res = null;
      try { res = await this._hass.callWS({ type: "harmony_deck/fire_test", entity_id: ent }); } catch (e) { res = null; }
      this._adbRes = { ...this._adbRes, [ent]: res?.ok ? res.answer : this._t().adbNoAnswer };
      this._rerender();
    }));
  },
};
