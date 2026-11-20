// Skins: CSS variable sets per look.

export const SKINS = {
  homebase: {},
  // Dunkel: the former skins "Fernbedienung" and "Gerät" in one (round remote look).
  dark: {
    "--hr-text": "#e8eaed", "--hr-muted": "#9aa0a6", "--hr-card-bg": "#14171c",
    "--hr-opt-bg": "#2b2f37", "color-scheme": "dark",
    "--hr-tile-bg": "linear-gradient(180deg, #343841, #262a31)",
    "--hr-key-bg": "linear-gradient(180deg, #3a3f49, #2a2e35)",
    "--hr-radius": "999px",
    "--hr-tile-radius": "20px",
    "--hr-panel-bg": "#1b1e23",
    "--hr-accent": "#ff9800",
    "--hr-on-accent": "#1b1e23",
    "--hr-select-bg": "#2b2f37",
  },
  catppuccin: {
    "--hr-opt-bg": "#313244", "color-scheme": "dark",
    "--hr-tile-bg": "#313244", "--hr-key-bg": "#45475a", "--hr-radius": "14px", "--hr-tile-radius": "16px", "--hr-panel-bg": "#181825",
    "--hr-accent": "#cba6f7", "--hr-on-accent": "#1e1e2e", "--hr-text": "#cdd6f4", "--hr-muted": "#a6adc8", "--hr-card-bg": "#1e1e2e", "--hr-select-bg": "#313244",
    "--hr-rocker-radius": "22px", "--hr-rk-radius": "16px", "--hr-seg-radius": "12px",
  },
  synthwave: {
    "--hr-opt-bg": "#2a1b54", "color-scheme": "dark",
    "--hr-tile-bg": "#2a1b54", "--hr-key-bg": "#3a2670", "--hr-radius": "10px", "--hr-tile-radius": "12px", "--hr-panel-bg": "#140b2b",
    "--hr-accent": "#ff2fd0", "--hr-on-accent": "#14082b", "--hr-text": "#f5e9ff", "--hr-muted": "#b39ddb", "--hr-card-bg": "#1a1033", "--hr-select-bg": "#2a1b54",
    "--hr-rocker-radius": "16px", "--hr-rk-radius": "10px", "--hr-seg-radius": "8px", "--hr-key-shadow": "0 0 8px rgba(255,47,208,.22), inset 0 1px 0 rgba(255,255,255,.08)",
  },
  // Sonnenpapier: ink on paper. Flat, thin outlines, small corners, blue ink as accent.
  paper: {
    "--hr-opt-bg": "#efe8d3", "color-scheme": "light",
    "--hr-tile-bg": "#efe8d3", "--hr-key-bg": "#fbf7ea", "--hr-radius": "4px", "--hr-tile-radius": "6px", "--hr-panel-bg": "#f2ebd6",
    "--hr-accent": "#234a7a", "--hr-on-accent": "#fff", "--hr-text": "#2d2a24", "--hr-muted": "#7a7260", "--hr-card-bg": "#f8f2e0", "--hr-select-bg": "#efe8d3",
    "--hr-rocker-radius": "8px", "--hr-rk-radius": "4px", "--hr-seg-radius": "4px", "--hr-dpad-radius": "14px", "--hr-ok-radius": "8px",
    "--hr-key-shadow": "0 0 0 1px rgba(60,50,30,.30)",
  },
  nord: {
    "--hr-opt-bg": "#3b4252", "color-scheme": "dark",
    "--hr-tile-bg": "#3b4252", "--hr-key-bg": "#434c5e", "--hr-radius": "8px", "--hr-tile-radius": "10px", "--hr-panel-bg": "#272c36",
    "--hr-accent": "#88c0d0", "--hr-on-accent": "#2e3440", "--hr-text": "#eceff4", "--hr-muted": "#9aa5b8", "--hr-card-bg": "#2e3440", "--hr-select-bg": "#3b4252",
    "--hr-rocker-radius": "14px", "--hr-rk-radius": "8px", "--hr-seg-radius": "8px",
  },
  // Milchglas: frosted glass over a colour gradient, translucent tiles, light blue accent.
  glass: {
    "--hr-text": "#eef3fb", "--hr-muted": "#b4c0d8", "--hr-panel-sep": "rgba(255,255,255,.28)",
    "--hr-opt-bg": "#26305a", "color-scheme": "dark",
    "--hr-tile-bg": "rgba(255,255,255,.13)", "--hr-key-bg": "rgba(255,255,255,.18)", "--hr-radius": "16px", "--hr-tile-radius": "18px", "--hr-panel-bg": "rgba(255,255,255,.06)",
    "--hr-accent": "#8fd3ff", "--hr-on-accent": "#0a1a2a", "--hr-card-bg": "#1a2548", "--hr-frame": "linear-gradient(135deg, #142a5c, #3b2a78 55%, #0f5c7a)", "--hr-select-bg": "rgba(255,255,255,.14)", "--hr-blur": "blur(14px) saturate(140%)",
    "--hr-rocker-radius": "22px", "--hr-rk-radius": "16px", "--hr-seg-radius": "14px", "--hr-key-shadow": "inset 0 1px 0 rgba(255,255,255,.22), 0 0 0 1px rgba(255,255,255,.12)",
  },
  // Knetmasse: modelling clay. Pastel green, thick rounded shapes with a heavy shadow, coral accent.
  clay: {
    "--hr-opt-bg": "#c5d9bd", "color-scheme": "light",
    "--hr-tile-bg": "#c5d9bd", "--hr-key-bg": "#eaf3e4", "--hr-radius": "22px", "--hr-tile-radius": "26px", "--hr-panel-bg": "#cfe0c8",
    "--hr-accent": "#e4573d", "--hr-on-accent": "#fff", "--hr-text": "#2a3a26", "--hr-muted": "#5f7558", "--hr-card-bg": "#d9e8d2", "--hr-select-bg": "#c5d9bd",
    "--hr-rocker-radius": "28px", "--hr-rk-radius": "22px", "--hr-seg-radius": "20px", "--hr-dpad-radius": "50%", "--hr-ok-radius": "50%",
    "--hr-key-shadow": "inset 0 -4px 0 rgba(0,0,0,.16), 0 4px 0 rgba(60,90,50,.28)",
  },
  // Kiesel: river pebble. Cool stone grey, fully round, soft double shadow, teal accent.
  pebble: {
    "--hr-opt-bg": "#d5d9dc", "color-scheme": "light",
    "--hr-tile-bg": "#d5d9dc",
    "--hr-key-bg": "#f2f4f5",
    "--hr-radius": "999px",
    "--hr-tile-radius": "30px",
    "--hr-panel-bg": "#dde1e4",
    "--hr-accent": "#1f7a78",
    "--hr-on-accent": "#fff",
    "--hr-text": "#25292c",
    "--hr-muted": "#6b7378",
    "--hr-card-bg": "#e6e8ea",
    "--hr-dpad-radius": "50%",
    "--hr-ok-radius": "50%",
    "--hr-rocker-radius": "40px",
    "--hr-rk-radius": "30px",
    "--hr-seg-radius": "999px",
    "--hr-key-shadow": "0 4px 10px rgba(40,50,60,.22), 0 1px 2px rgba(40,50,60,.18), inset 0 1px 0 #fff",
  },
  light: {
    "--hr-opt-bg": "#f1f3f6", "color-scheme": "light",
    "--hr-tile-bg": "#f1f3f6",
    "--hr-key-bg": "#e6e9ee",
    "--hr-radius": "12px",
    "--hr-tile-radius": "12px",
    "--hr-panel-bg": "transparent",
    "--hr-accent": "#1a73e8",
    "--hr-on-accent": "#fff",
    "--hr-text": "#202124",
    "--hr-muted": "#5f6368",
    "--hr-card-bg": "#fff",
  },
  // Terminal / Radio: colours here, shapes and effects in skin-css.js.
  terminal: {
    "--hr-card-bg": "#021a05", "--hr-tile-bg": "#04210a", "--hr-key-bg": "#062b0e", "--hr-panel-bg": "#031507", "--hr-accent": "#3dff6b", "--hr-on-accent": "#021a05",
    "--hr-text": "#3dff6b", "--hr-muted": "#1fa63f", "--hr-opt-bg": "#04210a", "--hr-select-bg": "#04210a", "color-scheme": "dark",
    "--hr-radius": "3px", "--hr-tile-radius": "3px", "--hr-rocker-radius": "3px", "--hr-rk-radius": "3px", "--hr-seg-radius": "3px",
    "--hr-dpad-radius": "0px", "--hr-ok-radius": "0px", "--hr-d-big": "0px", "--hr-d-small": "0px",
  },
  // Wärmebild: heat-vision look (violet-blue night, heat colours blue-teal-green-yellow-orange-red), names in segment letters.
  thermal: {
    "--hr-card-bg": "#0a0724", "--hr-tile-bg": "#0d0a3a", "--hr-key-bg": "#0d0a3a", "--hr-panel-bg": "#0a0724", "--hr-accent": "#ff3a2a", "--hr-on-accent": "#2a0600",
    "--hr-text": "#6fd0c0", "--hr-muted": "#ff6a4a", "--hr-opt-bg": "#0d0a3a", "--hr-select-bg": "#0d0a3a", "color-scheme": "dark",
    "--hr-radius": "2px", "--hr-tile-radius": "2px", "--hr-rocker-radius": "2px", "--hr-rk-radius": "2px", "--hr-seg-radius": "2px", "--hr-dpad-radius": "0px", "--hr-ok-radius": "0px", "--hr-d-big": "0px", "--hr-d-small": "0px",
  },
  // Nixie: dark wood, number tubes with glowing digits, brass toggle switches.
  nixie: {
    "--hr-card-bg": "#2b1a10", "--hr-tile-bg": "#120a08", "--hr-key-bg": "#e3d5b0", "--hr-panel-bg": "#24150c", "--hr-accent": "#ff9a3a", "--hr-on-accent": "#1a0e06",
    "--hr-text": "#f0d9a8", "--hr-muted": "#c8964a", "--hr-opt-bg": "#120a08", "--hr-select-bg": "#120a08", "color-scheme": "dark",
    "--hr-radius": "999px", "--hr-tile-radius": "40px", "--hr-rocker-radius": "30px", "--hr-rk-radius": "22px",
  },
  // Nostromo: amber monochrome ship computer.
  nostromo: {
    "--hr-card-bg": "#120a00", "--hr-tile-bg": "#1a1000", "--hr-key-bg": "#2a1b00", "--hr-panel-bg": "#120a00", "--hr-accent": "#ffb000", "--hr-on-accent": "#1a0f00",
    "--hr-text": "#ffb000", "--hr-muted": "#a06a00", "--hr-opt-bg": "#1a1000", "--hr-select-bg": "#1a1000", "color-scheme": "dark",
    "--hr-radius": "2px", "--hr-tile-radius": "2px", "--hr-rocker-radius": "2px", "--hr-rk-radius": "2px", "--hr-seg-radius": "2px", "--hr-dpad-radius": "0px", "--hr-ok-radius": "0px", "--hr-d-big": "0px", "--hr-d-small": "0px",
  },
  radio: {
    "--hr-card-bg": "#4a2c17", "--hr-tile-bg": "#2a1a10", "--hr-key-bg": "#e3d5b0", "--hr-panel-bg": "#2f1c0e", "--hr-accent": "#ffb84a", "--hr-on-accent": "#2a170a",
    "--hr-text": "#f1e3c1", "--hr-muted": "#c8a24a", "--hr-opt-bg": "#2a1a10", "--hr-select-bg": "#2a1a10", "color-scheme": "dark",
    "--hr-radius": "999px", "--hr-tile-radius": "22px", "--hr-rocker-radius": "30px", "--hr-rk-radius": "22px",
  },
};

// Order in the pickers: the default first, then the two effect skins (premium looks), then the rest as defined.
export const skinOrder = () => { const front = ["homebase", "terminal", "radio", "thermal", "nixie", "nostromo"].filter((k) => k in SKINS); return [...front, ...Object.keys(SKINS).filter((k) => !front.includes(k))]; };

// Saved skin keys of removed skins map to their successor.
export const SKIN_ALIAS = { remote: "dark", device: "dark" };
export const skinKey = (k) => { const a = SKIN_ALIAS[k] || k; return SKINS[a] ? a : "homebase"; };

// In the picker the plain colour variants are one entry "Farbschema" with a palette dropdown below it (0.18.1);
// the stored skin keys stay unchanged.
export const SCHEME_SKINS = ["dark", "light", "catppuccin", "nord", "synthwave", "paper"];
export const skinGroup = (k) => (SCHEME_SKINS.includes(k) ? "scheme" : k);
export const skinGroups = () => { const all = new Set(skinOrder().map(skinGroup)); return ["homebase", "scheme", "glass", "pebble", "clay", "terminal", "radio", "thermal", "nixie", "nostromo"].filter((g) => all.has(g)); };
