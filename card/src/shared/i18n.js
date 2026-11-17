// Texts: loads translations/<language>.json (English first, then the wanted language on top).
import { VERSION } from "./version.js";

// Texts live in translations/<language>.json (see translations/README.md).
export const TEXT_URL = "/harmony_deck/translations";

export const TEXT_FUNCS = ["running", "starting", "linkMismatch"];

export const TEXT_CACHE = {};

export function fmtText(tpl, args) {
  return String(tpl).replace(/\{(\d+)\}/g, (_, n) => (args[+n] ?? ""));
}

export function mergeText(base, over) {
  const out = { ...base };
  for (const k of Object.keys(over || {})) {
    out[k] = over[k] && typeof over[k] === "object" && !Array.isArray(over[k]) ? mergeText(base[k] || {}, over[k]) : over[k];
  }
  return out;
}

// Loads English plus the wanted language once; resolves to the merged texts.
export function loadText(lang) {
  if (!TEXT_CACHE[lang]) {
    const get = (code) => fetch(`${TEXT_URL}/${code}.json?v=${VERSION}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    TEXT_CACHE[lang] = Promise.all([get("en"), lang === "en" ? null : get(lang)]).then(([en, own]) => {
      const t = mergeText(en || {}, own || {});
      TEXT_FUNCS.forEach((k) => { const tpl = t[k]; t[k] = (...a) => fmtText(tpl, a); });
      t.__ok = !!en;
      return t;
    });
  }
  return TEXT_CACHE[lang];
}
