// What a skin brings along beyond colours. Logic files ask for a trait ("does this skin have a power knob?")
// and never for a skin name; the look itself lives in skin-css.js and deck/skin-decor.js.

export const SKIN_TRAITS = {
  radio: { powerKnob: true, keyHoldMs: 120, dial: true },
  terminal: { glass: true },
  glass: { blurOption: true },
};

export const skinTrait = (skin, name, fallback = false) => SKIN_TRAITS[skin]?.[name] ?? fallback;
