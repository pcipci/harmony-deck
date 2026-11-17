// Actions: own buttons for Home Assistant entities, display and editor.
import { ACTION_ICONS } from "../shared/icons.js";
import { esc } from "../shared/util.js";

export const actionsMixin = {
  _actionsEdit(h, t) {
    const list = this._settings().actions?.[h.id] || [];
    const acts = h.list.filter((n) => n !== "PowerOff");
    const ents = Object.keys(this._hass.states).filter((id) => /^(light|switch|scene|script|button|input_boolean|input_button|cover|fan|automation|lock|media_player)\./.test(id)).sort().slice(0, 600);
    const ops = { toggle: t.opToggle, on: t.opOn, off: t.opOff, activate: t.opActivate };
    const rows = list.map((a) => `<div class="actrow"><ha-icon icon="${esc(a.icon || "mdi:flash")}"></ha-icon><span><b>${esc(a.name)}</b><small>${esc(a.entity)} · ${esc(ops[a.op] || a.op)} · ${esc(a.scope || t.actGlobal)}</small></span><button class="key" data-actdel="${esc(a.id)}" data-hub="${esc(h.id)}" title="${t.remove}"><ha-icon icon="mdi:delete-outline"></ha-icon></button></div>`).join("");
    const d = this._actDraft || {};
    const icon = d.icon || ACTION_ICONS[0][0];
    const cur = ACTION_ICONS.find(([i]) => i === icon);
    const open = !!this._actIconOpen;
    const grid = open ? `<div class="icongrid">${ACTION_ICONS.map(([i, n]) => `<button type="button" class="iconcell ${i === icon ? "sel" : ""}" data-acticonpick="${esc(i)}" title="${esc(t.iconNames?.[i] || n)}"><ha-icon icon="${esc(i)}"></ha-icon></button>`).join("")}</div>` : "";
    return `<div class="esec actedit" data-hub="${esc(h.id)}"><div class="etitle">${t.actions}</div>
      <div class="hint" style="padding:6px 0;text-align:left;font-size:12px">${t.actionsHint}</div>${rows}
      <div class="esub">${t.actAdd}</div><div class="egrp"><label class="erow"><span>${t.actName}</span><input type="text" data-act="name" placeholder="${t.actNamePh}" value="${esc(d.name || "")}"></label>
      <label class="erow"><span>${t.actEntity}</span>${this._entSelect('data-act', ents, d.entity || "", t)}</label>
      <label class="erow"><span>${t.actOp}</span><select data-act="op">${Object.entries(ops).map(([k, v]) => `<option value="${k}" ${d.op === k ? "selected" : ""}>${esc(v)}</option>`).join("")}</select></label>
      <div class="iconrow"><span class="iname">${t.actIcon}</span>
        <button type="button" class="iconbtn" data-acticonopen aria-expanded="${open}"><ha-icon icon="${esc(icon)}"></ha-icon><span>${esc(cur ? t.iconNames?.[cur[0]] || cur[1] : "")}</span><ha-icon icon="${open ? "mdi:chevron-up" : "mdi:chevron-down"}"></ha-icon></button>${grid}</div>
      <label class="erow"><span>${t.actScope}</span><select data-act="scope"><option value="">${t.actGlobal}</option>${acts.map((n) => `<option ${d.scope === n ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label></div>
      <button class="key addact" data-actadd><ha-icon icon="mdi:plus"></ha-icon><span>${t.actAdd}</span></button></div>`;
  },

  _actionsOf(hubId, cur) { return (this._settings().actions?.[hubId] || []).filter((a) => !a.scope || a.scope === cur); },

  _actionsBlock(h, cur, t) {
    const list = this._actionsOf(h.id, cur);
    if (!list.length) return "";
    const cells = list.map((a) => {
      const on = this._hass.states[a.entity]?.state === "on";
      const miss = !this._hass.states[a.entity];
      return `<button class="key cell actbtn ${on ? "acton" : ""} ${miss ? "miss" : ""}" title="${esc(a.entity)}" data-actid="${esc(a.id)}" data-hub="${esc(h.id)}"><ha-icon icon="${esc(a.icon || "mdi:flash")}"></ha-icon><span>${esc(a.name)}</span></button>`;
    }).join("");
    return `<div class="block actions"><span class="dname">${t.actions}</span><div class="cells">${cells}</div></div>`;
  },

  _runAction(hubId, id) {
    const a = (this._settings().actions?.[hubId] || []).find((x) => x.id === id);
    if (!a) return;
    this._buzz();
    const domain = a.entity.split(".")[0];
    const press = ["button", "input_button"].includes(domain);
    const activate = ["scene", "script", "automation"].includes(domain) || press;
    const svc = (d, s) => this._hass.callService(d, s, { entity_id: a.entity });
    if (press) return svc(domain, "press");
    if (a.op === "off") return svc("homeassistant", "turn_off");
    if (a.op === "on") return svc("homeassistant", "turn_on");
    if (a.op === "activate" || activate) return domain === "automation" ? svc("automation", "trigger") : svc(["scene", "script"].includes(domain) ? domain : "homeassistant", "turn_on");
    return svc("homeassistant", "toggle");
  },

  // Events of the action buttons and their editor.
  _bindActions(root) {
    root.querySelectorAll("[data-actid]").forEach((b) => b.addEventListener("click", () => this._runAction(b.dataset.hub, b.dataset.actid)));
    root.querySelectorAll("[data-actdel]").forEach((b) => b.addEventListener("click", () => {
      const all = JSON.parse(JSON.stringify(this._settings().actions || {}));
      all[b.dataset.hub] = (all[b.dataset.hub] || []).filter((a) => a.id !== b.dataset.actdel);
      this._saveSettings({ actions: all });
    }));
    root.querySelectorAll(".actedit [data-act]").forEach((el) => {
      const upd = () => { this._actDraft = { ...(this._actDraft || {}), [el.dataset.act]: el.value }; };
      el.addEventListener("input", upd); el.addEventListener("change", upd);
    });
    root.querySelector("[data-acticonopen]")?.addEventListener("click", () => { this._actIconOpen = !this._actIconOpen; this._rerender(); });
    root.querySelectorAll("[data-acticonpick]").forEach((b) => b.addEventListener("click", () => { this._actDraft = { ...(this._actDraft || {}), icon: b.dataset.acticonpick }; this._actIconOpen = false; this._rerender(); }));
    root.querySelectorAll("[data-actadd]").forEach((b) => b.addEventListener("click", () => {
      const box = b.closest(".actedit");
      const val = (n) => box.querySelector(`[data-act="${n}"]`)?.value?.trim() || "";
      const entity = val("entity");
      if (!entity || !val("name")) return;
      const all = JSON.parse(JSON.stringify(this._settings().actions || {}));
      (all[box.dataset.hub] ||= []).push({ id: Date.now().toString(36), name: val("name"), entity, op: val("op") || "toggle", icon: this._actDraft?.icon || ACTION_ICONS[0][0], scope: val("scope") });
      this._actDraft = null; this._actIconOpen = false;
      this._saveSettings({ actions: all });
    }));
  },
};
