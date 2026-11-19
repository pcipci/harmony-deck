// Step type "Device": talk to the direct device of a Harmony device without the hub (switch on / off, volume,
// mute, source). Which ops are offered follows from what the player can do (directdev.py).
import { esc } from "../../shared/util.js";
import { fmtText } from "../../shared/i18n.js";
import { rangeHtml, bindRange } from "./range.js";
import { volumeCap } from "./ha-values.js";

const NEED = { on: "power_on", off: "power_off", volume: "volume_set", mute: "mute", source: "source_select" };
const OPS = Object.keys(NEED);

const linked = (card, hub) => Object.keys(card._ddLinks()[hub] || {});
const entityOf = (card, hub, dev) => card._ddLinks()[hub]?.[dev]?.entity || "";

export const devStep = {
  type: "dev",
  icon: "mdi:television-play",
  create: () => ({ type: "dev", device: "", op: "on" }),
  valid: (s) => !!s.device && (s.op === "on" || s.op === "off" || (s.op === "volume" && Number.isFinite(s.value)) || (s.op === "mute" && typeof s.value === "boolean") || (s.op === "source" && !!s.value)),
  label(s, t) {
    if (!s.device) return t.stepPickDevice;
    const what = { on: t.devOn, off: t.devOff, volume: fmtText(t.devVolume, [String(s.value ?? "")]), mute: s.value === false ? t.devUnmute : t.devMute, source: fmtText(t.devSource, [String(s.value ?? "")]) }[s.op] || s.op;
    return `${s.device} · ${what}`;
  },

  editor(s, { card, h, t }) {
    card._ddLoad();
    const devs = linked(card, h.id);
    if (!s.device || !devs.includes(s.device)) {
      return devs.length
        ? `<div class="esub">${t.stepPickDevice}</div><div class="pchips">${devs.map((d) => `<button type="button" class="pchip" data-devpick="${esc(d)}"><ha-icon icon="${card._deviceIcon(d, h.id)}"></ha-icon><span>${esc(d)}</span></button>`).join("")}</div><div class="ehint">${t.devHint}</div>`
        : `<div class="ehint">${t.devNoDevices}</div>`;
    }
    const entity = entityOf(card, h.id, s.device);
    const caps = card._dd?.hubs?.[h.id]?.[s.device]?.caps;
    const ops = OPS.filter((o) => !caps || caps.includes(NEED[o]) || o === s.op);
    const opRow = `<label class="erow"><span>${t.actOp}</span><select data-devop>${ops.map((o) => `<option value="${o}" ${s.op === o ? "selected" : ""}>${esc(t.devOps[o])}</option>`).join("")}</select></label>`;
    let value = "";
    if (s.op === "volume") {
      const cap = volumeCap(card);
      value = `${rangeHtml({ attr: "devvol", value: Math.min(s.value ?? 20, cap), min: 0, max: cap, step: 1, fmt: (v) => `${v} %` })}<div class="ehint">${fmtText(t.devVolCap, [String(cap)])}</div>${card._ddVolHint(h.id, s.device, t)}`;
    } else if (s.op === "mute") {
      value = `${card._ddVolHint(h.id, s.device, t)}<label class="erow"><span>${t.devOps.mute}</span><select data-devmute><option value="true" ${s.value !== false ? "selected" : ""}>${t.devMute}</option><option value="false" ${s.value === false ? "selected" : ""}>${t.devUnmute}</option></select></label>`;
    } else if (s.op === "source") {
      const list = card._hass.states?.[entity]?.attributes?.source_list;
      value = Array.isArray(list) && list.length
        ? `<label class="erow"><span>${t.devOps.source}</span><select data-devsrc><option value="">${t.devPickSource}</option>${list.map((x) => `<option ${s.value === x ? "selected" : ""}>${esc(x)}</option>`).join("")}</select></label>`
        : `<label class="erow"><span>${t.devOps.source}</span><input type="text" data-devsrc value="${esc(s.value || "")}"></label><div class="ehint">${t.devSourceUnknown}</div>`;
    }
    return `<div class="erow"><span><ha-icon icon="${card._deviceIcon(s.device, h.id)}"></ha-icon>${esc(s.device)}</span><button type="button" class="mini txt" data-devpick="">${t.stepChange}</button></div>${opRow}${value}`;
  },

  bind(box, s, update) {
    box.querySelectorAll("[data-devpick]").forEach((b) => b.addEventListener("click", () => update({ device: b.dataset.devpick, op: "on", value: undefined })));
    box.querySelector("[data-devop]")?.addEventListener("change", (e) => {
      const op = e.target.value;
      update({ op, value: op === "volume" ? 20 : op === "mute" ? true : undefined });
    });
    bindRange(box, "devvol", (v) => `${v} %`, (v) => update({ value: v }));
    box.querySelector("select[data-devmute]")?.addEventListener("change", (e) => update({ value: e.target.value === "true" }));
    box.querySelector("[data-devsrc]")?.addEventListener("change", (e) => update({ value: e.target.value.trim() || undefined }));
  },
};
