// Values of a Home Assistant step (brightness, colour, volume, source, position, temperature ...).
// One entry per kind of entity in FIELDS; what an entity can do comes from the entity itself, so a lamp
// without colour shows no colour and a player without "set volume" shows no volume slider.
// The integration checks the same again before a run (values.py).
import { esc } from "../../shared/util.js";
import { fmtText } from "../../shared/i18n.js";
import { rangeHtml, bindRange } from "./range.js";

const MP = { volume: 4, mute: 8, source: 2048 };
const COLOR = ["hs", "xy", "rgb", "rgbw", "rgbww"];
const SWATCHES = [[0, 100], [25, 100], [50, 100], [120, 80], [190, 90], [220, 100], [275, 80], [320, 90], [35, 40]];
export const SET_ONLY = ["number", "input_number"];
export const DEFAULT_CAP = 80;

const dom = (e) => (e || "").split(".")[0];
const feat = (a, bit) => !!((Number(a.supported_features) || 0) & bit);
const pct = (v) => `${Math.round(v)} %`;
const num = (v) => String(Math.round(v * 100) / 100);

// key -> {label, ok(attrs), html, fmt}; the order is the order on screen.
const FIELDS = {
  light: [
    { key: "brightness", label: "valBrightness", ok: (a) => (a.supported_color_modes || []).some((m) => m !== "onoff"), range: () => ({ min: 1, max: 100, step: 1 }), fmt: pct, start: (a) => (a.brightness ? Math.round((a.brightness / 255) * 100) : 60) },
    { key: "tone", label: "valTone", ok: (a) => (a.supported_color_modes || []).some((m) => m === "color_temp" || COLOR.includes(m)) },
  ],
  media_player: [
    { key: "volume", label: "valVolume", ok: (a) => feat(a, MP.volume), range: (a, cap) => ({ min: 0, max: cap, step: 1 }), fmt: pct, start: (a, cap) => Math.min(cap, Math.round((a.volume_level ?? 0.3) * 100)) },
    { key: "source", label: "valSource", ok: (a) => feat(a, MP.source) },
    { key: "mute", label: "valMute", ok: (a) => feat(a, MP.mute) },
  ],
  cover: [{ key: "position", label: "valPosition", ok: (a) => feat(a, 4), range: () => ({ min: 0, max: 100, step: 1 }), fmt: pct, start: (a) => a.current_position ?? 50 }],
  climate: [{ key: "temperature", label: "valTemperature", ok: (a) => feat(a, 1), range: (a) => ({ min: a.min_temp ?? 7, max: a.max_temp ?? 35, step: a.target_temp_step || 0.5 }), fmt: (v) => `${num(v)} °`, start: (a) => a.temperature ?? 21 }],
  fan: [{ key: "percentage", label: "valSpeed", ok: (a) => feat(a, 1), range: (a) => ({ min: 0, max: 100, step: a.percentage_step || 1 }), fmt: pct, start: (a) => a.percentage ?? 50 }],
  number: [{ key: "value", label: "valValue", ok: () => true, range: (a) => ({ min: a.min ?? 0, max: a.max ?? 100, step: a.step || 1 }), fmt: num, start: (a, cap, st) => Number(st) || a.min || 0 }],
};
FIELDS.input_number = FIELDS.number;

export const hasValues = (entity) => !!FIELDS[dom(entity)];

const attrsOf = (card, entity) => card?._hass?.states?.[entity]?.attributes || {};
export const volumeCap = (card) => Number(card?._settings?.().volumeCap) || DEFAULT_CAP;

// Fields this entity can take.
export function fieldsFor(card, entity) {
  const a = attrsOf(card, entity);
  return (FIELDS[dom(entity)] || []).filter((f) => f.ok(a));
}

const hueName = (t, h, s) => (s < 50 ? t.hueNames[8] : t.hueNames[Math.round(((h % 360) / 360) * 8) % 8]);

/** Short text of the set values for the step label ("60 % · orange"). */
export function valuesText(entity, v, t) {
  if (!v) return "";
  const parts = [];
  if (v.brightness !== undefined) parts.push(pct(v.brightness));
  if (v.kelvin !== undefined) parts.push(`${v.kelvin} K`);
  if (v.color) parts.push(hueName(t, v.color[0], v.color[1]));
  if (v.source) parts.push(v.source);
  if (v.volume !== undefined) parts.push(`${t.valVolumeShort} ${pct(v.volume)}`);
  if (v.mute !== undefined) parts.push(v.mute ? t.valMuteOn : t.valMuteOff);
  if (v.position !== undefined) parts.push(pct(v.position));
  if (v.temperature !== undefined) parts.push(`${num(v.temperature)} °`);
  if (v.percentage !== undefined) parts.push(pct(v.percentage));
  if (v.value !== undefined) parts.push(num(v.value));
  return parts.join(" · ");
}

const isOn = (v, key) => (key === "tone" ? v.kelvin !== undefined || !!v.color : v[key] !== undefined);

function toneHtml(a, v, t) {
  const modes = a.supported_color_modes || [];
  const canK = modes.includes("color_temp"), canC = modes.some((m) => COLOR.includes(m));
  const mode = v.color || !canK ? "color" : "white";
  const seg = canK && canC ? `<div class="vseg"><button type="button" class="${mode === "white" ? "sel" : ""}" data-vtone="white">${t.valWhite}</button><button type="button" class="${mode === "color" ? "sel" : ""}" data-vtone="color">${t.valColor}</button></div>` : "";
  if (mode === "white") {
    const lo = a.min_color_temp_kelvin || 2000, hi = a.max_color_temp_kelvin || 6500;
    return seg + rangeHtml({ attr: "kelvin", value: v.kelvin ?? 2700, min: lo, max: hi, step: 50, fmt: (k) => `${k} K` });
  }
  const [h, s] = v.color || [25, 100];
  const sw = SWATCHES.map(([sh, ss]) => `<button type="button" class="vdot ${sh === h && ss === s ? "sel" : ""}" style="background:hsl(${sh} ${ss}% ${100 - ss / 2}%)" data-vswatch="${sh},${ss}" title="${esc(hueName(t, sh, ss))}"></button>`).join("");
  return `${seg}<div class="vdots">${sw}</div><div class="vhue">${rangeHtml({ attr: "hue", value: h, min: 0, max: 359, step: 1, fmt: (x) => hueName(t, x, s), ends: false })}</div><div class="vsub">${t.valSat}</div>${rangeHtml({ attr: "sat", value: s, min: 0, max: 100, step: 1, fmt: (x) => `${x} %` })}<div class="ehint">${t.valWhiteOrColor}</div>`;
}

function bodyHtml(f, card, entity, v, t) {
  const a = attrsOf(card, entity);
  const cap = volumeCap(card);
  if (f.key === "tone") return toneHtml(a, v, t);
  if (f.key === "source") {
    const list = Array.isArray(a.source_list) ? a.source_list : [];
    const all = v.source && !list.includes(v.source) ? [v.source, ...list] : list;
    return all.length ? `<div class="pchips">${all.map((x) => `<button type="button" class="pchip ${x === v.source ? "sel" : ""}" data-vsource="${esc(x)}">${esc(x)}</button>`).join("")}</div>` : `<div class="ehint">${t.valSourceNone}</div>`;
  }
  if (f.key === "mute") return `<div class="vseg"><button type="button" class="${v.mute ? "sel" : ""}" data-vmute="1">${t.valMuteOn}</button><button type="button" class="${v.mute === false ? "sel" : ""}" data-vmute="0">${t.valMuteOff}</button></div>`;
  const r = f.range(a, cap);
  return rangeHtml({ attr: f.key, value: v[f.key], ...r, fmt: f.fmt }) + (f.key === "volume" ? `<div class="ehint">${fmtText(t.valCapHint, [cap])}</div>` : "");
}

/** The "Values" section of the step editor (empty when the entity takes none). */
export function valuesHtml(s, card, t) {
  const fields = fieldsFor(card, s.entity);
  if (!fields.length) return "";
  const v = s.values || {};
  const rows = fields.map((f) => {
    const on = isOn(v, f.key);
    const shown = f.key === "tone" ? (v.kelvin !== undefined ? `${v.kelvin} K` : v.color ? hueName(t, v.color[0], v.color[1]) : "") : f.key === "source" ? v.source || "" : f.key === "mute" ? "" : on ? f.fmt(v[f.key]) : "";
    return `<div class="vrow ${on ? "on" : ""}"><label class="vhead"><span class="sw"><input type="checkbox" data-von="${f.key}" ${on ? "checked" : ""}><i></i></span><span>${t[f.label]}</span>${on && shown ? `<b>${esc(shown)}</b>` : ""}</label>${on ? `<div class="vbody">${bodyHtml(f, card, s.entity, v, t)}</div>` : ""}</div>`;
  }).join("");
  return `<div class="esub">${t.valTitle}</div>${rows}<div class="ehint">${t.valHint}</div>`;
}

export function bindValues(box, s, update, card) {
  const set = (patch) => {
    const v = { ...(s.values || {}), ...patch };
    Object.keys(v).forEach((k) => v[k] === undefined && delete v[k]);
    update({ values: v });
  };
  const a = attrsOf(card, s.entity);
  const cap = volumeCap(card);
  box.querySelectorAll("input[data-von]").forEach((i) => i.addEventListener("change", () => {
    const f = fieldsFor(card, s.entity).find((x) => x.key === i.dataset.von);
    if (!f) return;
    if (!i.checked) return set(f.key === "tone" ? { kelvin: undefined, color: undefined } : { [f.key]: undefined });
    if (f.key === "tone") {
      const canK = (a.supported_color_modes || []).includes("color_temp");
      return set(canK ? { kelvin: a.color_temp_kelvin || 2700 } : { color: a.hs_color ? a.hs_color.map(Math.round) : [25, 100] });
    }
    if (f.key === "source") return set({ source: a.source || (a.source_list || [])[0] || "" });
    if (f.key === "mute") return set({ mute: true });
    return set({ [f.key]: f.start(a, cap, card?._hass?.states?.[s.entity]?.state) });
  }));
  fieldsFor(card, s.entity).filter((f) => f.range).forEach((f) => bindRange(box, f.key, f.fmt, (x) => set({ [f.key]: x })));
  bindRange(box, "kelvin", (k) => `${k} K`, (k) => set({ kelvin: k, color: undefined }));
  const [h, sat] = s.values?.color || [25, 100];
  bindRange(box, "hue", (x) => String(x), (x) => set({ color: [x, sat], kelvin: undefined }));
  bindRange(box, "sat", (x) => `${x} %`, (x) => set({ color: [h, x], kelvin: undefined }));
  box.querySelectorAll("[data-vtone]").forEach((b) => b.addEventListener("click", () => set(b.dataset.vtone === "white" ? { kelvin: a.color_temp_kelvin || 2700, color: undefined } : { color: [h, sat], kelvin: undefined })));
  box.querySelectorAll("[data-vswatch]").forEach((b) => b.addEventListener("click", () => set({ color: b.dataset.vswatch.split(",").map(Number), kelvin: undefined })));
  box.querySelectorAll("[data-vsource]").forEach((b) => b.addEventListener("click", () => set({ source: b.dataset.vsource })));
  box.querySelectorAll("[data-vmute]").forEach((b) => b.addEventListener("click", () => set({ mute: b.dataset.vmute === "1" })));
}
