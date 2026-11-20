// What a skin brings along beyond colours. Logic files ask for a trait ("does this skin have a power knob?")
// and never for a skin name; the look itself lives in skin-css.js and deck/skin-decor.js.

export const SKIN_TRAITS = {
  radio: { powerKnob: true, keyHoldMs: 120, dial: true, premium: true },
  terminal: { glass: true, premium: true, noColorIcons: true },
  thermal: { premium: true, keyHoldMs: 220, segFont: true, noColorIcons: true },
  nixie: { premium: true, toggles: true, powerKnob: true },
  nostromo: { premium: true, noColorIcons: true },
  glass: { premium: true, noColorIcons: true, glassLook: true, powerKnob: true },
  clay: { premium: true, noColorIcons: true, powerKnob: true },
};

export const skinTrait = (skin, name, fallback = false) => SKIN_TRAITS[skin]?.[name] ?? fallback;
