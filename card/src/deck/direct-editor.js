// Settings tab "Direct devices": link a Harmony device to a Home Assistant media player (see directdev.py).
// The integration says which players are possible, what each one can do and what it reports now; the card
// only shows that and stores the link ({hub: {device: {entity, volumeDirect}}}).
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

const PLATFORMS = { lg_netcast: "LG Netcast", webostv: "LG webOS", samsungtv: "Samsung TV", sonos: "Sonos", androidtv: "Android TV (ADB)", androidtv_remote: "Android TV", cast: "Google Cast", apple_tv: "Apple TV", denonavr: "Denon AVR", yamaha_musiccast: "Yamaha MusicCast", onkyo: "Onkyo", bravia: "Sony Bravia", philips_js: "Philips TV", roku: "Roku", panasonic_viera: "Panasonic Viera" };
const CAPS = ["state", "power_on", "power_off", "volume_set", "volume_read", "mute", "source_select", "source_read"];

export const directEditorMixin = {
  // Overview of the integration, loaded when the tab (or a step "Device") needs it; the card redraws when it arrives.
  async _ddLoad(force = false) {
    if (this._ddBusy || (this._dd && !force)) return;
    this._ddBusy = true;
    try { this._dd = await this._hass.callWS({ type: "harmony_deck/direct/overview" }); } catch (e) { this._dd = { hubs: {}, candidates: [], extensions: [] }; }
    this._ddBusy = false;
    this._rerender();
  },

  // Where the hub sends the volume keys: activities whose volume goes to another device than this one.
  _ddVolHint(hubId, device, t) {
    const acts = this._info?.hubs?.[hubId]?.activities || {};
    const via = {};
    for (const [act, roles] of Object.entries(acts)) {
      if (roles.volume && roles.volume !== device) (via[roles.volume] ||= []).push(act);
    }
    const text = Object.entries(via).map(([dev, list]) => fmtText(t.ddVolVia, [list.join(", "), dev]));
    return text.length ? `<div class="ehint ddvia"><ha-icon icon="mdi:information-outline"></ha-icon> ${esc(text.join(" "))}</div>` : "";
  },

  _ddLinks() { return this._settings().directDevices || {}; },

  async _ddSave(hubId, device, patch) {
    const all = JSON.parse(JSON.stringify(this._ddLinks()));
    all[hubId] = { ...(all[hubId] || {}) };
    const cand = patch?.entity ? (this._dd?.candidates || []).find((c) => c.entity === patch.entity) : null;
    // The Fire TV page settings move onto the new link (instead of an empty block that would hide them).
    const rest = { ...(this._settings().direct || {}) };
    if (cand?.caps?.includes("app_read") && !Object.values(all[hubId]).some((l) => l.fire)) {
      const old = rest[hubId];
      if (old && old.entity === patch.entity) { const { entity, device: dev, ...keep } = old; patch = { ...patch, fire: keep }; delete rest[hubId]; } else patch = { ...patch, fire: {} };
    }
    if (patch === null) delete all[hubId][device]; else all[hubId][device] = { ...(all[hubId][device] || {}), ...patch };
    await this._saveSettings({ directDevices: all, direct: rest });
    this._ddLoad(true);
  },

  // Suggestions: on for all unless switched off; single devices can be left out ({off, never: {hub: [device]}}).
  _ddSuggest() { const s = this._settings().directSuggest || {}; return { off: s.off === true, never: { ...(s.never || {}) } }; },

  async _ddSuggestSave(patch) {
    await this._saveSettings({ directSuggest: { ...this._ddSuggest(), ...patch } });
    this._ddLoad(true);
  },

  _ddNever(hubId, device, never) {
    const cur = this._ddSuggest().never;
    const list = new Set(cur[hubId] || []);
    if (never) list.add(device); else list.delete(device);
    cur[hubId] = [...list];
    if (!cur[hubId].length) delete cur[hubId];
    return this._ddSuggestSave({ never: cur });
  },

  _ddStateText(st, t) {
    if (!st) return "";
    const on = st.on === true ? t.ddOn : st.on === false ? t.ddOff : t.ddUnknown;
    return [on, st.volume != null ? fmtText(t.ddVolume, [String(st.volume)]) : "", st.source || "", st.app || ""].filter(Boolean).join(" · ");
  },

  // The tab: one line per Harmony device (player, state dot, button to its page) and, if there is one, a suggestion.
  _directDevHtml(h, t) {
    const devs = Object.keys(this._devicesOf(h.id));
    if (!this._dd) { this._ddLoad(); return `<div class="esec" data-t="dd"><div class="etitle">${t.tabs.dd}</div><div class="ehint">${t.ddLoading}</div></div>`; }
    if (this._ddPage?.hub === h.id) return this._ddPageHtml(h, t);
    const info = this._dd.hubs?.[h.id] || {};
    const links = this._ddLinks()[h.id] || {};
    const name = (id) => this._hass.states?.[id]?.attributes?.friendly_name || id;
    const cands = this._dd.candidates || [];
    const rows = devs.map((d) => {
      const cur = links[d]?.entity || "";
      const item = info[d] || {};
      const ids = cands.map((c) => c.entity);
      if (cur && !ids.includes(cur)) ids.push(cur);
      // Players that fit this device (room, kind, maker, name) come first, the rest below.
      const fits = (item.fits || []).filter((id) => ids.includes(id));
      const option = (id) => `<option value="${esc(id)}" ${id === cur ? "selected" : ""}>${esc(name(id))} · ${esc(id)}</option>`;
      const rest = ids.filter((id) => !fits.includes(id));
      const opts = `<option value="">${t.ddNone}</option>${fits.length ? `<optgroup label="${esc(t.ddFits)}">${fits.map(option).join("")}</optgroup><optgroup label="${esc(t.ddOthers)}">${rest.map(option).join("")}</optgroup>` : rest.map(option).join("")}`;
      let suggest = "";
      if (!cur && item.suggest) {
        suggest = `<div class="ddsug"><span class="ddsugtx" title="${esc(item.suggest)}">${fmtText(t.ddSuggest, [esc(name(item.suggest))])}</span><button type="button" class="mini ic" data-ddtake="${esc(item.suggest)}" data-dev="${esc(d)}" title="${esc(t.ddTake)}" aria-label="${esc(t.ddTake)}"><ha-icon icon="mdi:check"></ha-icon></button><button type="button" class="mini ic" data-ddnever data-dev="${esc(d)}" title="${esc(t.ddNever)}" aria-label="${esc(t.ddNever)}"><ha-icon icon="mdi:close"></ha-icon></button></div>`;
      } else if (!cur && item.noSuggest && !this._dd.suggestOff) {
        suggest = `<div class="ddsug"><span class="ddsugtx">${esc(t.ddNeverSet)}</span><button type="button" class="mini ic" data-ddagain data-dev="${esc(d)}" title="${esc(t.ddAgain)}" aria-label="${esc(t.ddAgain)}"><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon></button></div>`;
      }
      let dot = `<span class="ddslot"></span>`, page = `<span class="ddslot cog"></span>`;
      if (cur) {
        const live = this._hass.states?.[cur];
        const ok = item.known !== false && live && !["unavailable", "unknown"].includes(live.state);
        dot = `<span class="adbdot ${ok ? "ok" : "bad"}" title="${esc(ok ? t.adbOk : t.adbDown)}"></span>`;
        page = `<button type="button" class="mini ic" data-ddpage data-dev="${esc(d)}" title="${esc(t.ddSettings)}" aria-label="${esc(t.ddSettings)}"><ha-icon icon="mdi:cog-outline"></ha-icon></button>`;
      }
      return `<div class="egrp ddrow" data-hub="${esc(h.id)}"><div class="ddline"><span class="ddname"><ha-icon icon="${this._deviceIcon(d, h.id)}"></ha-icon><span>${esc(d)}</span></span>${dot}<select data-ddent data-dev="${esc(d)}" title="${esc(cur ? name(cur) : "")}">${opts}</select>${page}</div>${suggest}${cur && item.known === false ? `<div class="ehint">${t.ddGone}</div>` : ""}</div>`;
    });
    const sugSw = this._swRow(t.ddSuggestShow, "data-ddsugon", !this._ddSuggest().off);
    return `<div class="esec" data-t="dd" data-hub="${esc(h.id)}"><div class="etitle">${t.tabs.dd}</div><div class="ehint">${t.ddHint}</div>${sugSw}${cands.length ? "" : `<div class="ehint">${t.ddNoPlayers}</div>`}${rows.join("")}</div>`;
  },

  // The page of one linked device: Fire TV = its own settings (apps, keys, connection), everything else = what the player can do.
  _ddPageHtml(h, t) {
    const d = this._ddPage.device;
    const item = this._dd.hubs?.[h.id]?.[d] || {};
    const link = this._ddLinks()[h.id]?.[d];
    const head = `<div class="ddpagehead"><button type="button" class="mini txt" data-ddback><ha-icon icon="mdi:arrow-left"></ha-icon><span>${t.ddBack}</span></button><span class="ddpagetitle">${esc(d)}${item.platform ? ` <small>${esc(PLATFORMS[item.platform] || item.platform)}</small>` : ""}</span></div>`;
    if (!link) return `<div class="esec" data-t="dd" data-hub="${esc(h.id)}">${head}<div class="ehint">${t.ddNone}</div></div>`;
    if (item.page === "firetv") {
      return `<div class="ddpage" data-hub="${esc(h.id)}" data-t="dd">${head}${this._directEdit(h, t, true).replace('data-t="fire"', 'data-t="dd"')}</div>`;
    }
    const caps = item.caps || [];
    const has = (c) => caps.includes(c);
    const live = this._hass.states?.[link.entity];
    const st = { ...(item.state || {}), ...(live && !["unavailable", "unknown"].includes(live.state) ? { on: live.state !== "off", ...(live.attributes?.source != null ? { source: live.attributes.source } : {}), ...(live.attributes?.volume_level != null ? { volume: Math.round(live.attributes.volume_level * 100) } : {}), ...(live.attributes?.is_volume_muted != null ? { muted: !!live.attributes.is_volume_muted } : {}) } : {}) };
    const seen = item.sourcesLive === false || live?.state === "off";
    const cap = this._settings().volumeCap || 80;
    const row = (label, ctl) => `<div class="erow ddctl"><span>${label}</span><span class="ddctls">${ctl}</span></div>`;
    const btn = (attrs, text, icon) => `<button type="button" class="mini txt" ${attrs} data-dev="${esc(d)}">${icon ? `<ha-icon icon="${icon}"></ha-icon>` : ""}<span>${esc(text)}</span></button>`;
    const rowsHtml = [
      has("state") ? row(t.ddCtlState, `<span class="ddnow">${esc(st.on === true ? t.ddOn : st.on === false ? t.ddOff : t.ddUnknown)}</span>`) : "",
      has("power_on") || has("power_off") ? row(t.ddCtlPower, (has("power_on") ? btn('data-ddctl="on"', t.ddCtlOn, "mdi:power") : "") + (has("power_off") ? btn('data-ddctl="off"', t.ddCtlOff, "mdi:power-off") : "")) : "",
      has("volume_set") ? row(t.ddCtlVolume, `<input type="range" min="0" max="${cap}" value="${Math.min(st.volume ?? 0, cap)}" data-ddctl="volume" data-dev="${esc(d)}"><span class="ddnow" data-ddvolval>${st.volume != null ? st.volume + " %" : ""}</span>`) : (has("volume_read") ? row(t.ddCtlVolume, `<span class="ddnow">${st.volume != null ? st.volume + " %" : t.ddUnknown}</span>`) : ""),
      has("mute") ? row(t.ddCtlMute, btn(`data-ddctl="mute" data-val="${st.muted ? "0" : "1"}"`, st.muted ? t.ddCtlUnmute : t.ddCtlMute, st.muted ? "mdi:volume-high" : "mdi:volume-off")) : "",
      has("source_select") ? row(t.ddCtlSources, (item.sources || []).length ? item.sources.map((src) => `<button type="button" class="mini txt ${st.source === src ? "sel" : ""} ${seen ? "seen" : ""}" data-ddctl="source" data-val="${esc(src)}" data-dev="${esc(d)}"><span>${esc(src)}</span></button>`).join("") + (seen ? `<div class="ehint">${t.ddSourcesSeen}</div>` : "") : `<span class="ddnow">${esc(t.ddNoSources)}</span>`) : "",
    ].join("");
    const caption = caps.length ? "" : `<div class="ehint">${t.ddCanNot}</div>`;
    // All capabilities at a glance (also for comparing two devices); "last seen" = remembered, not reported right now.
    const ALL = ["state", "power_on", "power_off", "volume_set", "volume_read", "mute", "source_select", "source_read", "app_read", "app_list"];
    const liveCaps = item.capsLive || caps;
    const capList = `<details class="ddcaps"><summary>${fmtText(t.ddCapsTitle, [ALL.filter((c) => caps.includes(c)).length, ALL.length])}</summary><div class="ddcapgrid">${ALL.map((c) => `<span class="ddcap ${caps.includes(c) ? "yes" : "no"} ${caps.includes(c) && !liveCaps.includes(c) ? "seen" : ""}"><ha-icon icon="${caps.includes(c) ? "mdi:check-circle-outline" : "mdi:close-circle-outline"}"></ha-icon>${esc(t.ddCapName[c])}${caps.includes(c) && !liveCaps.includes(c) ? ` <small>${t.ddCapSeen}</small>` : ""}</span>`).join("")}</div></details>`;
    const rescan = `<div class="egrp ddrescan"><button type="button" class="mini txt" data-ddrescan data-dev="${esc(d)}" title="${esc(t.ddRescanHint)}"><ha-icon icon="mdi:refresh"></ha-icon><span>${t.ddRescan}</span></button><span class="ehint" data-ddrescanmsg>${this._ddRescanMsg?.[d] || ""}</span></div>`;
    return `<div class="esec" data-t="dd" data-hub="${esc(h.id)}">${head}${capList}${rescan}
      ${(item.quirks || []).map((q) => `<div class="ehint ddquirk">${esc(t.ddQuirks[q] || q)}</div>`).join("")}
      <div class="egrp">${rowsHtml}${caption}</div><div class="ddmsg ehint" data-ddmsg></div>
      ${this._ddInputsHtml(item, link, () => item.sources, d, t)}
      ${has("volume_set") ? this._swRow(t.ddVolDirect, `data-ddvol data-dev="${esc(d)}"`, !!link.volumeDirect) + `<div class="ehint">${t.ddVolDirectHint}</div>` + this._ddVolHint(h.id, d, t) : ""}</div>`;
  },

  async _ddControl(hub, device, op, value, box) {
    const msg = box?.querySelector("[data-ddmsg]");
    try {
      await this._hass.callWS({ type: "harmony_deck/direct/fix", hub, device, op, ...(value !== undefined ? { value } : {}) });
      if (msg) msg.textContent = "";
    } catch (e) {
      if (msg) msg.textContent = e?.message || String(e);
    }
    setTimeout(() => this._ddLoad(true), 1200);
  },

  // Which source of the player belongs to each Harmony input the activities use on this device.
  _ddInputsHtml(item, link, sourcesOf, device, t) {
    const list = item.inputList || [];
    const sources = sourcesOf(link.entity);
    if (!list.length || !Array.isArray(sources) || !sources.length) return "";
    const rows = list.map((i) => {
      const auto = i.guess ? fmtText(t.ddInputAuto, [i.guess]) : t.ddInputNone;
      const opts = [`<option value="">${esc(auto)}</option>`, ...sources.map((s) => `<option ${i.source === s ? "selected" : ""}>${esc(s)}</option>`)].join("");
      return `<label class="erow"><span>${esc(i.input)} <small>${esc(fmtText(t.ddInputUsed, [i.activities.join(", ")]))}</small></span><select data-ddinput="${esc(i.input)}" data-dev="${esc(device)}">${opts}</select></label>`;
    }).join("");
    return `<div class="dname">${t.ddInputs}</div>${rows}<div class="ehint">${t.ddInputsHint}</div>`;
  },

  _bindDirectDev(root) {
    root.querySelectorAll("[data-ddpage]").forEach((b) => b.addEventListener("click", () => { this._ddPage = { hub: b.closest("[data-hub]").dataset.hub, device: b.dataset.dev }; this._rerender(); }));
    root.querySelectorAll("[data-ddrescan]").forEach((b) => b.addEventListener("click", async () => {
      const t = this._t();
      const dev = b.dataset.dev;
      const hub = b.closest("[data-hub]").dataset.hub;
      const say = (txt) => { this._ddRescanMsg = { ...(this._ddRescanMsg || {}), [dev]: txt }; const m = this.shadowRoot.querySelector("[data-ddrescanmsg]"); if (m) m.textContent = txt; };
      say(t.ddRescanWait);
      try {
        const r = await this._hass.callWS({ type: "harmony_deck/direct/rescan", hub, device: dev });
        say(r.on ? fmtText(t.ddRescanDone, [r.count, r.total, (r.sources || []).length]) : t.ddRescanOff);
      } catch (e) { say(fmtText(t.ddRescanFail, [e?.message || String(e)])); }
      await this._ddLoad(true);
      this._rerender();
    }));
    root.querySelectorAll("[data-ddback]").forEach((b) => b.addEventListener("click", () => { this._ddPage = null; this._ddLoad(true); this._rerender(); }));
    root.querySelectorAll("[data-ddctl]").forEach((el) => {
      const hub = () => el.closest("[data-hub]").dataset.hub, box = () => el.closest("[data-hub]");
      if (el.type === "range") {
        el.addEventListener("input", () => { const v = box().querySelector("[data-ddvolval]"); if (v) v.textContent = `${el.value} %`; });
        el.addEventListener("change", () => this._ddControl(hub(), el.dataset.dev, "volume", Number(el.value), box()));
      } else {
        el.addEventListener("click", () => {
          const op = el.dataset.ddctl;
          this._ddControl(hub(), el.dataset.dev, op, op === "mute" ? el.dataset.val === "1" : op === "source" ? el.dataset.val : undefined, box());
        });
      }
    });
    root.querySelectorAll("select[data-ddent]").forEach((s) => s.addEventListener("change", () => this._ddSave(s.closest("[data-hub]").dataset.hub, s.dataset.dev, s.value ? { entity: s.value, volumeDirect: false } : null)));
    root.querySelectorAll("[data-ddtake]").forEach((b) => b.addEventListener("click", () => this._ddSave(b.closest("[data-hub]").dataset.hub, b.dataset.dev, { entity: b.dataset.ddtake, volumeDirect: false })));
    root.querySelectorAll("[data-ddnever]").forEach((b) => b.addEventListener("click", () => this._ddNever(b.closest("[data-hub]").dataset.hub, b.dataset.dev, true)));
    root.querySelectorAll("[data-ddagain]").forEach((b) => b.addEventListener("click", () => this._ddNever(b.closest("[data-hub]").dataset.hub, b.dataset.dev, false)));
    root.querySelectorAll("input[data-ddsugon]").forEach((i) => i.addEventListener("change", () => this._ddSuggestSave({ off: !i.checked })));
    root.querySelectorAll("select[data-ddinput]").forEach((s) => s.addEventListener("change", () => {
      const hub = s.closest("[data-hub]").dataset.hub;
      const inputs = { ...(this._ddLinks()[hub]?.[s.dataset.dev]?.inputs || {}) };
      if (s.value) inputs[s.dataset.ddinput] = s.value; else delete inputs[s.dataset.ddinput];
      this._ddSave(hub, s.dataset.dev, { inputs });
    }));
    root.querySelectorAll("input[data-ddvol]").forEach((i) => i.addEventListener("change", () => this._ddSave(i.closest("[data-hub]").dataset.hub, i.dataset.dev, { volumeDirect: i.checked })));
  },
};

export const DD_CAPS = CAPS;
