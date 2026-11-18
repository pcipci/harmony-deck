// Step types of an action, as the card knows them. A new type is one module here (and one in the integration).
import { haStep } from "./ha.js";
import { keyStep } from "./key.js";
import { pauseStep } from "./pause.js";

export const STEP_UI = { key: keyStep, pause: pauseStep, ha: haStep };

export const stepLabel = (s, t, card) => s.label || STEP_UI[s.type]?.label(s, t, card) || s.type;

// Actions as stored since 0.5 ({steps}); those of 0.4 ({entity, op}) are read as one Home Assistant step.
export function normalizeAction(a) {
  if (!a || typeof a !== "object") return null;
  const steps = Array.isArray(a.steps) ? a.steps : a.entity ? [{ type: "ha", entity: a.entity, op: a.op === "activate" ? "run" : a.op || "toggle" }] : [];
  return { id: a.id, name: a.name || "", icon: a.icon || "mdi:flash", scope: a.scope || "", tile: !!a.tile, favs: Array.isArray(a.favs) ? a.favs.filter((f) => f && f.d && f.c) : [], steps: steps.filter((s) => STEP_UI[s?.type]) };
}
