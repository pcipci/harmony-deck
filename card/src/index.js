// Entry point: registers the custom elements with Home Assistant.
import { HarmonyDeckCard } from "./deck/card.js";
import { HarmonyDeckCardEditor } from "./config-editor/editor.js";
import { HarmonyDeckSecurityCard } from "./security/card.js";
import { VERSION } from "./shared/version.js";

HarmonyDeckCard.getConfigElement = () => document.createElement("harmony-deck-card-editor");

if (!customElements.get("harmony-deck-card")) {
  customElements.define("harmony-deck-card-editor", HarmonyDeckCardEditor);
  customElements.define("harmony-deck-card", HarmonyDeckCard);
  window.customCards = window.customCards || [];
  window.customCards.push({ type: "harmony-deck-card", name: "Harmony Deck", description: "Remote control for Logitech Harmony hubs", preview: false });
  customElements.define("harmony-deck-security", HarmonyDeckSecurityCard);
  window.customCards.push({ type: "harmony-deck-security", name: "Harmony Deck Security", description: "Lock for Harmony hubs and Fire TV: mode, release, allowed activities and apps, schedule, interventions", preview: false });
  console.info(`%c HARMONY-DECK %c ${VERSION} `, "background:#ff9800;color:#000", "");
}
