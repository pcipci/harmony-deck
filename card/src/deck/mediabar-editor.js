// Settings > Activities > "Media player" (0.25): one media player per activity, chosen by the user.
// Nothing is preselected; the players of the hub's room (area) are offered first, then the others.
import { esc } from "../shared/util.js";

// Area of an entity (its own, else the one of its device), from the registries Home Assistant gives the frontend.
export function areaOf(hass, entity) {
  const e = hass?.entities?.[entity];
  if (!e) return null;
  return e.area_id || hass?.devices?.[e.device_id]?.area_id || null;
}

// Players for the picker: [{group: "room" | "other", items: [[entity, name, area name]]}] (pure, tested).
export function playerGroups(hass, hubEntity) {
  const area = areaOf(hass, hubEntity);
  const states = hass?.states || {};
  const items = Object.keys(states).filter((id) => id.startsWith("media_player.")).map((id) => {
    const a = areaOf(hass, id);
    return { id, name: states[id].attributes?.friendly_name || id, area: a, areaName: a ? hass?.areas?.[a]?.name || a : "" };
  }).sort((x, y) => x.name.localeCompare(y.name));
  const room = area ? items.filter((i) => i.area === area) : [];
  const other = items.filter((i) => !room.includes(i));
  return { area: area ? hass?.areas?.[area]?.name || area : "", room, other };
}

export const mediaBarEditorMixin = {
  _mpEditHtml(h, t) {
    const acts = h.list.filter((n) => n !== "PowerOff");
    if (!acts.length) return "";
    const g = playerGroups(this._hass, h.id);
    const all = this._settings().activityPlayers?.[h.id] || {};
    const opt = (cur) => (i) => `<option value="${esc(i.id)}" ${i.id === cur ? "selected" : ""}>${esc(i.name)}${i.areaName && !g.room.includes(i) ? ` (${esc(i.areaName)})` : ""}</option>`;
    const rows = acts.map((n) => {
      const cur = all[n]?.entity || "";
      const missing = cur && !g.room.concat(g.other).some((i) => i.id === cur) ? `<option value="${esc(cur)}" selected>${esc(cur)}</option>` : "";
      const sel = `<label class="erow"><span>${esc(n)}</span><select data-mpact="${esc(n)}" data-hub="${esc(h.id)}"><option value="">${t.mediaNone}</option>${missing}
        ${g.room.length ? `<optgroup label="${esc(t.mediaInRoom.replace("{room}", g.area))}">${g.room.map(opt(cur)).join("")}</optgroup>` : ""}
        ${g.other.length ? `<optgroup label="${esc(g.room.length ? t.mediaOtherRooms : t.mediaAllPlayers)}">${g.other.map(opt(cur)).join("")}</optgroup>` : ""}</select></label>`;
      const sw = cur ? this._swRow(t.mediaShowBar, `data-mpbar="${esc(n)}" data-hub="${esc(h.id)}"`, all[n]?.bar !== false) : "";
      return sel + sw;
    }).join("");
    return `<div class="esec mpedit" data-t="acts"><div class="etitle">${t.mediaPlayers}</div>${this._grp("", `<div class="ehint">${t.mediaPlayersHint}</div>${rows}`)}</div>`;
  },

  _mpSave(hub, act, patch) {
    const all = { ...(this._settings().activityPlayers || {}) };
    const mine = { ...(all[hub] || {}) };
    const next = { ...(mine[act] || {}), ...patch };
    if (!next.entity) delete mine[act]; else mine[act] = { entity: next.entity, bar: next.bar !== false };
    if (Object.keys(mine).length) all[hub] = mine; else delete all[hub];
    this._saveSettings({ activityPlayers: all });
  },

  _bindMpEdit(root) {
    root.querySelectorAll("select[data-mpact]").forEach((s) => s.addEventListener("change", () => this._mpSave(s.dataset.hub, s.dataset.mpact, { entity: s.value })));
    root.querySelectorAll("input[data-mpbar]").forEach((i) => i.addEventListener("change", () => this._mpSave(i.dataset.hub, i.dataset.mpbar, { bar: i.checked })));
  },
};
