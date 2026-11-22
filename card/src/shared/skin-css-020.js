// Skins of 0.20: "glass" (Glas: dark acrylic plates that light from behind, three light styles a/b/c) and
// "clay" (Knetmasse: bubbles you press, dents for surfaces and states), plus the app keys of the tube skin.
// Same rules as the other skin files: effects stay inside the card, motion stops with "reduce motion".

const G = 'ha-card[data-skin="glass"]';
const C = 'ha-card[data-skin="clay"]';
const X = 'ha-card[data-skin="nixie"]';
const W = 'ha-card[data-skin="thermal"]';
const N2 = 'ha-card[data-skin="nostromo"]';
const R2 = 'ha-card[data-skin="radio"]';
const T2 = 'ha-card[data-skin="terminal"]';

// Things that are pressed (glass: lit strongly, fades out after release) / belong to the running activity (weakly lit) / selected (brightly lit)
const PRESSED = [".key:active", ".key.lit", ".kk:active", ".pill:active", ".chip:active", ".d:active", ".actbtn:active", ".tile:active", ".tile.lit", ".linkbar button:active", ".pbtn:active"];
const ACTIVE = [".tile.on", ".actbtn.acton", ".tile.going", ".tile.dev.inuse"];
const SEL = [".key.sel", ".mini.sel", ".tile.dev.sel", ".etabs button.sel", ".favkind button.sel", ".hubtabs button.sel .ico", ".seg .lab.a", ".chk:has(input:checked)", ".fchip:has(input:checked)", ".mini.txt.sel", ".pitem.on", ".profrow.act"];
const PRIMARY = [".pbtn.pri", ".editdone:not(.warn)", ".profdlg .editrow button:last-child", ".helpall", ".addact"];
const on = (base, list) => list.map((s) => `${base} ${s}`).join(", ");
const onNot = (base, list, not) => list.map((s) => `${base} ${s}:where(${not})`).join(", ");

// Lit plate: a lamp sits behind the plate at an uneven spot (--lx/--ly) and lights it from there. k = strength of the lamp per light style.
const SPOT = "radial-gradient(ellipse 55% 140% at var(--lx, 50%) var(--ly, 50%), color-mix(in srgb, color-mix(in srgb, var(--gc) 85%, #fff) calc(var(--k) * 1%), transparent) 0, color-mix(in srgb, var(--gc) calc(var(--k) * .6%), transparent) 45%, color-mix(in srgb, var(--gc) calc(var(--k) * .15%), transparent) 100%)";
const SHEEN = "linear-gradient(180deg, rgba(255,255,255,.14), transparent 45%)";
const lit = (list, kA, kB, kC, tone) => {
  const l = list.join(", ");
  const mid = "color: color-mix(in srgb, var(--gc) 35%, #fff) !important;";
  const textA = tone === "press" ? "color: var(--gi) !important; text-shadow: none;" : tone === "sel" ? "color: #fff !important; text-shadow: 0 0 8px #fff;" : `${mid} text-shadow: none;`;
  // B: the lettering glows in the function colour; C: light lettering with a coloured halo
  const textB = tone === "belong" ? `${mid} text-shadow: 0 0 6px color-mix(in srgb, var(--gc) 70%, transparent);` : "color: color-mix(in srgb, var(--gc) 70%, #fff) !important; text-shadow: 0 0 4px var(--gc), 0 0 16px var(--gc), 0 0 34px var(--gc);";
  const textC = tone === "belong" ? `${mid} text-shadow: 0 0 6px color-mix(in srgb, var(--gc) 70%, transparent);` : "color: color-mix(in srgb, var(--gc) 25%, #fff) !important; text-shadow: 0 0 5px #fff, 0 0 18px var(--gc), 0 0 34px var(--gc);";
  return `
      ${on(G, list)} { background: ${SPOT}, ${SHEEN}, var(--gl-base) !important; border-color: color-mix(in srgb, var(--gc) 55%, transparent) !important; border-top-color: rgba(255,255,255,${tone === "belong" ? ".5" : ".85"}) !important;
        box-shadow: inset 0 0 ${tone === "belong" ? 22 : 18}px color-mix(in srgb, var(--gc) ${tone === "belong" ? 14 : 30}%, ${tone === "belong" ? "transparent" : "rgba(255,255,255,.4)"}), 0 0 ${tone === "belong" ? 14 : 42}px ${tone === "belong" ? 0 : 3}px color-mix(in srgb, var(--gc) ${tone === "belong" ? 24 : 75}%, transparent), 0 4px 8px rgba(0,0,0,.45) !important; ${tone === "press" ? "transition: none !important;" : ""} }
      ${G}.gl-a :is(${l}) { --k: ${kA}; ${textA} } ${G}.gl-b :is(${l}) { --k: ${kB}; ${textB} } ${G}.gl-c :is(${l}) { --k: ${kC}; ${textC} }
      ${G}.gl-b :is(${l}) ha-icon, ${G}.gl-c :is(${l}) ha-icon { filter: drop-shadow(0 0 4px var(--gc)); } ${G} :is(${l}) ha-icon { color: inherit !important; }`;
};

// Volume: ten lamps behind the glass; lamp i is lit from level 10*i, colours run from calm green to warm red
const LAMPS = ["#35f08a", "#5ae87a", "#8ee068", "#c4dc55", "#e8cf4a", "#ffbd47", "#ffa24a", "#ff864c", "#ff6a50", "#ff5a4a"];
const lamps = (vertical) => LAMPS.map((c, i) => {
  const at = vertical ? `50% ${100 - (5 + 10 * i)}%` : `${5 + 10 * i}% 50%`;
  const p = `calc(clamp(0, (var(--v, 0) - ${10 * i}) * 10, 100) * .72%)`;
  return `radial-gradient(circle 46px at ${at}, color-mix(in srgb, #fff ${p}, transparent) 0 2px, color-mix(in srgb, ${c} ${p}, transparent) 3px 5px, color-mix(in srgb, ${c} calc(${p} * .7), transparent) 9px, color-mix(in srgb, ${c} calc(${p} * .3), transparent) 24px, transparent 46px)`;
}).join(", ");
const LAMPS_H = lamps(false);
const LAMPS_V = lamps(true);

// Plain surfaces (settings, profile window, info tables, help): the same square plate
const SURF = [".panel", ".infopanel", ".infoitem", ".infohead", ".helpbox", ".infobox", ".profdlg", ".proflist", ".hmenu", ".hlist", ".editbox", ".esec", ".egroup", ".hubinfo", ".chipbox", ".linkbox", ".entlist", ".win"];
const FIELD = ["select", "input[type=text]", "input[type=number]", "input:not([type])", ".psearch", ".entpick", ".picker", ".inp"];
const BTN = [".etabs button", ".favkind button", ".iconbtn", ".copyraw", ".editdone", ".editcancel", ".profchip", ".infobtn", ".golink", ".nettab", ".hlink", ".fchip", ".kbchip", ".pchk", ".helpall", ".addact", ".chk", ".mini.txt", ".mentry", ".profrow"];

export const SKIN_CSS_020 = `
      /* ---------- Glas: dark acrylic plates, a lamp behind each plate lights it from an uneven spot ---------- */
      ${G} { --gl-green: #35f08a; --gl-blue: #4aa8ff; --gl-red: #ff6a5a; --gl-amber: #ffb340; --gl-violet: #9b7bff; --gl-rest: #aab6bf; --gl-base: rgba(14,20,26,.78); --gc: var(--gl-blue); --gi: #fff; --k: 0;
        font-family: "Segoe UI", Roboto, Arial, sans-serif; background-color: #07090c; background-image: radial-gradient(ellipse at 50% 0, #1a2028, #07090c 70%); color: var(--hr-text); }
      ${G} * { backdrop-filter: none; }
      /* background (setting): black (default), black with fine carbon weave, aluminium, circuit board */
      ${G}.gb-carbon { background-image: repeating-linear-gradient(45deg, rgba(255,255,255,.035) 0 2px, transparent 2px 5px), repeating-linear-gradient(-45deg, rgba(255,255,255,.025) 0 2px, transparent 2px 5px), radial-gradient(ellipse at 50% 0, #1a2028, #07090c 70%); --gl-base: rgba(14,20,26,.66); }
      ${G}.gb-alu { background-image: repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, rgba(0,0,0,.05) 1px 3px), linear-gradient(180deg, #6a737c, #3b4249 40%, #555e67 60%, #2a3036); --gl-base: rgba(14,20,26,.62); }
      ${G}.gb-board { background-color: #0b3a2c; background-image: repeating-linear-gradient(0deg, rgba(255,214,120,.09) 0 1px, transparent 1px 16px), repeating-linear-gradient(90deg, rgba(255,214,120,.07) 0 1px, transparent 1px 22px), radial-gradient(circle at 20% 30%, rgba(255,214,120,.1) 0 2px, transparent 3px), linear-gradient(135deg, #0e4a38, #072a20); background-size: auto, auto, 44px 44px, auto; --gl-base: rgba(8,20,18,.68); }
      /* where the lamp sits behind each plate (uneven, stable per position) */
      ${G} :is(.key, .tile, .actbtn, .kk, .pill, .chip, .d, .hint-row, .etabs button, .favkind button, .seg .lab):nth-child(6n+1) { --lx: 22%; --ly: 40%; } ${G} :is(.key, .tile, .actbtn, .kk, .pill, .chip, .d, .hint-row, .etabs button, .favkind button):nth-child(6n+2) { --lx: 70%; --ly: 60%; }
      ${G} :is(.key, .tile, .actbtn, .kk, .pill, .chip, .d, .hint-row, .etabs button, .favkind button):nth-child(6n+3) { --lx: 40%; --ly: 30%; } ${G} :is(.key, .tile, .actbtn, .kk, .pill, .chip, .d, .hint-row, .etabs button, .favkind button):nth-child(6n+4) { --lx: 78%; --ly: 45%; }
      ${G} :is(.key, .tile, .actbtn, .kk, .pill, .chip, .d, .hint-row, .etabs button, .favkind button):nth-child(6n+5) { --lx: 30%; --ly: 65%; } ${G} :is(.key, .tile, .actbtn, .kk, .pill, .chip, .d, .hint-row, .etabs button, .favkind button):nth-child(6n) { --lx: 60%; --ly: 35%; }
      /* function colours: green = OK / play / confirm, blue = navigation, red = off / stop, violet = running / selected, amber = hint */
      ${G} .key[data-cmd*="Ok"], ${G} .key[data-cmd*="Select"], ${G} .key[data-cmd*="Play"], ${G} .key[data-cmd*="Enter"], ${G} .d.ok, ${G} .pbtn.pri { --gc: var(--gl-green); --gi: #05261a; }
      ${G} .key[data-cmd*="Power"], ${G} .key[data-cmd*="Stop"], ${G} .key[data-cmd*="Record"], ${G} .key.pon, ${G} .key.warn, ${G} .tile.off, ${G} .editdone.warn { --gc: var(--gl-red); --gi: #fff; }
      ${G} .tile:not(.dev), ${G} .actbtn, ${G} .tile.dev.inuse, ${G} .tile.dev.sel, ${G} .key.sel, ${G} .mini.sel, ${G} .etabs button, ${G} .favkind button, ${G} .hubtabs button.sel .ico, ${G} .seg .lab { --gc: var(--gac, var(--gl-violet)); --gi: #fff; }
      ${G} .tile.off { --gc: var(--gl-red); }
      ${on(G, PRIMARY)} { --gc: var(--gl-green); --gi: #05261a; }
      ${G} .hint-row.r { --gc: var(--gl-red); --gi: #fff; } ${G} .hint-row.o { --gc: var(--gl-amber); --gi: #2a1700; } ${G} .hint-row.b { --gc: var(--gl-blue); --gi: #fff; }
      /* the resting plate: dark, half transparent, light edge on top, light grey lettering; after a press the light fades out over a second */
      ${onNot(G, [".key", ".kk", ".pill", ".chip", ".d", ".actbtn", ".tile", ".seg .lab", ".ib", ".hubtabs .ico", ".linkbar", ".hint-row", ".helpbtn", ".infohead", ...BTN], ":not(.ghost):not(.svc)")} {
        border: 1px solid rgba(255,255,255,.2) !important; border-top: 2px solid rgba(255,255,255,.55) !important; border-radius: 2px !important; background: ${SHEEN}, var(--gl-base) !important; color: var(--hr-text);
        box-shadow: 0 4px 8px rgba(0,0,0,.45) !important; transition: box-shadow 1s ease-out, text-shadow 1s ease-out, color 1s ease-out, border-color 1s ease-out; }
      ${G} .key:not(.ghost):not(.svc), ${G} .kk, ${G} .pill, ${G} .chip, ${G} .d, ${G} .actbtn, ${G} .tile { color: var(--gl-rest); }
      ${G} .key ha-icon, ${G} .kk ha-icon, ${G} .pill ha-icon, ${G} .chip ha-icon, ${G} .d ha-icon, ${G} .actbtn ha-icon, ${G} .tile ha-icon, ${G} .tile.dev ha-icon, ${G} .colorful .cell ha-icon, ${G} .colorful .rocker .rk ha-icon, ${G} .colorful .power .key ha-icon { color: inherit !important; }
      ${G} .tile.off ha-icon { color: var(--gl-red) !important; }
      ${G} .key.ghost, ${G} .dpad, ${G} .rocker { background: none !important; box-shadow: none !important; border-color: transparent !important; }
      ${G} .dpad::before, ${G} .dpad::after { display: none; }
      ${G} .tile, ${G} .actbtn { position: relative; }
      ${G} .color.red { border-bottom: 3px solid var(--gl-red) !important; } ${G} .color.green { border-bottom: 3px solid var(--gl-green) !important; } ${G} .color.yellow { border-bottom: 3px solid var(--gl-amber) !important; } ${G} .color.blue { border-bottom: 3px solid var(--gl-blue) !important; }
      ${G} .tile:active, ${G} .tile.on { transform: none; }
      ${G} .tile.locked, ${G} .key:disabled, ${G} .actbtn.miss { opacity: .55; }
      /* three levels: rest, belongs to the running activity (weak), selected (bright); pressed is strongest and fades out after release */
      ${lit(ACTIVE, 45, 8, 32, "belong")}
      ${lit(SEL, 100, 14, 56, "sel")}
      ${lit(PRESSED, 95, 18, 62, "press")}
      ${lit(PRIMARY, 34, 6, 26, "belong")}
      /* hint and info lines: the whole plate lights in the colour of the message */
      ${G} .hint-row { padding: 8px 10px; --k: 36; background: ${SPOT}, ${SHEEN}, var(--gl-base) !important; border-color: color-mix(in srgb, var(--gc) 55%, transparent) !important; }
      ${G}.gl-a .hint-row { --k: 60; } ${G}.gl-b .hint-row { --k: 16; } ${G}.gl-c .hint-row { --k: 38; }
      ${G}.gl-a .hint-row, ${G}.gl-a .hint-row > ha-icon { color: var(--gi) !important; } ${G}.gl-b .hint-row, ${G}.gl-b .hint-row > ha-icon { color: color-mix(in srgb, var(--gc) 70%, #fff) !important; text-shadow: 0 0 3px var(--gc), 0 0 10px var(--gc); }
      ${G}.gl-c .hint-row, ${G}.gl-c .hint-row > ha-icon { color: color-mix(in srgb, var(--gc) 25%, #fff) !important; text-shadow: 0 0 5px var(--gc), 0 0 12px var(--gc); }
      ${G} .hint-row button { border-radius: 2px; background: rgba(255,255,255,.14); color: inherit; border: 1px solid rgba(255,255,255,.35); }
      /* device page: no squares or dots, only light (belongs = weak violet, shown = bright violet) */
      ${G} .tile.dev.inuse::after, ${G} .tile.dev.inuse::before, ${G} .tile.dev.sel::after, ${G} .tile.dev.sel::before { display: none; }
      /* plain surfaces, fields, tabs and buttons of the settings, the profile window, hints and info tables: the same square plate */
      ${on(G, SURF)} { border: 1px solid rgba(255,255,255,.18) !important; border-top: 2px solid rgba(255,255,255,.4) !important; border-radius: 2px !important; background: ${SHEEN}, var(--gl-base) !important; color: var(--hr-text); box-shadow: 0 4px 8px rgba(0,0,0,.35); }
      ${on(G, [".win", ".helpbox", ".infopanel", ".hmenu"])} { background: ${SHEEN}, #0e1419 !important; }
      ${on(G, FIELD)} { border: 1px solid rgba(255,255,255,.24) !important; border-radius: 2px !important; background: rgba(6,9,12,.72) !important; color: var(--hr-text); color-scheme: dark; box-shadow: inset 0 2px 5px rgba(0,0,0,.5); }
      ${G} select option, ${G} select optgroup { background-color: #12181e; color: var(--hr-text); }
      ${G} .etabs button.sel, ${G} .favkind button.sel { font-weight: 700; }
      ${G} :is(.pbadge, .gbadge, .fdot, .sdot, .dmark, .badge) { border-radius: 2px !important; }
      ${G} :is(.pbadge, .gbadge) { background: var(--gl-base); border: 1px solid rgba(255,255,255,.3); }
      ${G} .editbar select, ${G} .irow.prow select, ${G} .hlink select { border-radius: 2px; }
      /* hold ("all off"): the whole plate brightens from within, no rising bar */
      ${G} .tile.holdsw::after, ${G} .tile.locked::after { transform: none !important; opacity: 0; background: color-mix(in srgb, var(--gl-red) 70%, transparent) !important; transition: opacity .7s linear; }
      ${G} .tile.holdsw.holding::after, ${G} .tile.locked.holding::after { opacity: 1; }
      ${G} .actbtn.holding::after { transform: none !important; opacity: 0; background: color-mix(in srgb, var(--gl-red) 70%, transparent) !important; animation: glhold .7s linear 1 forwards !important; }
      @keyframes glhold { from { opacity: 0; } to { opacity: 1; } }
      /* header: plates with large white, softly glowing symbols */
      ${G} .hubtabs button { border-radius: 2px; background: none; }
      ${G} .hubtabs .ico { width: 36px; height: 36px; }
      ${G} .hubtabs ha-icon, ${G} .ib ha-icon { --mdc-icon-size: 22px; color: #fff; filter: drop-shadow(0 0 4px rgba(255,255,255,.7)); }
      ${G} .ib { color: #fff; }
      ${G} .ib.gear[class*="sev-"] ha-icon { color: var(--gc, #fff); }
      ${G} .seg { background: none !important; box-shadow: none !important; border: none !important; padding: 0; gap: 8px; }
      ${G} .seg .th { display: none; }
      ${G} .seg .lab { color: var(--gl-rest); } ${G} .seg .lab.a { color: #fff; }
      /* Ja/Nein: a plate that lights red or green, no symbol, no sliding */
      ${G} .sw i { border-radius: 2px; --gc: var(--gl-red); --k: 55; background: ${SPOT}, var(--gl-base); border: 1px solid color-mix(in srgb, var(--gc) 60%, transparent); box-shadow: 0 0 10px color-mix(in srgb, var(--gc) 30%, transparent); transition: box-shadow .4s ease-out; }
      ${G} .sw i::after { display: none !important; }
      ${G} .sw input:checked + i { --gc: var(--gl-green); animation: glflash .35s ease-out 1; }
      @keyframes glflash { 0% { filter: brightness(1.9); } 100% { filter: none; } }
      /* volume: ten lamps behind the glass, soft overlapping halos; colour from calm green to warm red */
      ${G} .volslider { -webkit-appearance: none; appearance: none; background: transparent; accent-color: var(--gl-green); }
      ${G} .volslider.h::-webkit-slider-runnable-track { height: 52px; border-radius: 2px; border: 1px solid rgba(255,255,255,.3); border-top: 2px solid rgba(255,255,255,.6); background: ${LAMPS_H}, linear-gradient(180deg, rgba(255,255,255,.12), transparent 50%), rgba(8,12,16,.78); overflow: hidden; }
      ${G} .volslider.v::-webkit-slider-runnable-track { width: 100%; border-radius: 2px; border: 1px solid rgba(255,255,255,.3); background: ${LAMPS_V}, rgba(8,12,16,.78); }
      ${G} .volslider::-webkit-slider-thumb { -webkit-appearance: none; background: rgba(255,255,255,.55); box-shadow: 0 0 6px #fff; border-radius: 0; }
      ${G} .volslider.h::-webkit-slider-thumb { width: 3px; height: 52px; } ${G} .volslider.v::-webkit-slider-thumb { height: 3px; width: 44px; }
      ${G} .volslider.h::-moz-range-track { height: 52px; border-radius: 2px; background: ${LAMPS_H}, rgba(8,12,16,.78); border: 1px solid rgba(255,255,255,.3); }
      ${G} .volslider.v::-moz-range-track { border-radius: 2px; background: ${LAMPS_V}, rgba(8,12,16,.78); border: 1px solid rgba(255,255,255,.3); }
      ${G} .volslider::-moz-range-thumb { background: rgba(255,255,255,.55); border: none; border-radius: 0; width: 3px; height: 52px; }
      /* device with a known power state: one plate that is red (off) or green (on), no symbol */
      ${G} .rpow .pwrow { display: flex; align-items: center; gap: 14px; padding: 8px 6px; } ${G} .pwlab { flex: 1; min-width: 0; color: var(--gl-rest); font-weight: 600; }
      ${G} .pwio { display: flex; gap: 10px; } ${G} .key.pwio { width: 52px; min-height: 44px; flex-direction: column; gap: 1px; padding: 0; }
      ${G} .pwknob { flex: none; width: 68px; height: 44px; position: relative; }
      ${G} .pwknob .knob { --gc: var(--gl-red); --k: 55; width: 100%; height: 100%; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 2px; background: ${SPOT}, var(--gl-base); border: 1px solid color-mix(in srgb, var(--gc) 60%, transparent); box-shadow: 0 0 10px color-mix(in srgb, var(--gc) 30%, transparent); transition: box-shadow .4s ease-out; }
      ${G} .pwknob.on .knob { --gc: var(--gl-green); animation: glflash .35s ease-out 1; }
      ${G} .pwknob .knob ha-icon { display: none; } ${G} .pwknob.pend .knob { animation: glpend .6s ease-in-out infinite alternate; }
      @keyframes glpend { from { filter: brightness(.8); } to { filter: brightness(1.6); } }
      @media (prefers-reduced-motion: reduce) { ${G} *, ${G} *::after { animation: none !important; transition: none !important; } }

      /* ---------- Knetmasse: bubbles you press, dents for surfaces and states ---------- */
      ${C} { --cl-green: #eaf3e4; --cl-coral: #d94a30; --cl-dent: #bcd3b3; --cl-shade: rgba(60,100,50,.28); --hr-fire: #b85f00; }
      ${on(C, [".key:where(:not(.ghost):not(.svc))", ".kk:where(:not(.ghost))", ".pill", ".chip", ".d:where(:not(.ok))", ".actbtn", ".tile", ".linkbar button", ".pbtn", ".ib", ".hubtabs button.sel", ".seg .th"])} {
        border: none !important; background: radial-gradient(circle at 30% 22%, #fff 0 7%, rgba(255,255,255,0) 30%), radial-gradient(circle at 50% 120%, var(--cl-shade), transparent 60%), var(--cl-green) !important;
        box-shadow: inset -3px -6px 10px var(--cl-shade), inset 3px 4px 6px rgba(255,255,255,.95), 0 6px 8px rgba(50,80,40,.35), 0 2px 0 rgba(50,80,40,.25) !important;
        transition: transform .25s cubic-bezier(.3, 1.6, .5, 1), box-shadow .25s, background .25s, color .25s; color: var(--hr-text); }
      ${C} .d.ok { background: radial-gradient(circle at 30% 22%, #fff 0 7%, rgba(255,255,255,0) 30%), var(--cl-green) !important; box-shadow: inset -3px -6px 10px var(--cl-shade), inset 3px 4px 6px rgba(255,255,255,.95), 0 6px 8px rgba(50,80,40,.35) !important; }
      ${C} .dpad::before, ${C} .dpad::after { display: none; }
      ${C} .status.chip { background: var(--cl-dent) !important; box-shadow: inset 0 4px 8px rgba(40,70,35,.45), inset 0 -2px 3px rgba(255,255,255,.55) !important; border: none !important; }
      ${on(C, [".key ha-icon", ".kk ha-icon", ".pill ha-icon", ".chip ha-icon", ".d ha-icon", ".tile ha-icon", ".actbtn ha-icon"])} { color: var(--hr-text); }
      ${C} .colorful .cell ha-icon, ${C} .colorful .rocker .rk ha-icon, ${C} .colorful .power .key ha-icon { color: var(--hr-text) !important; }
      /* pressed: squashed, lower, highlight smaller; springs back */
      ${on(C, PRESSED)} { transform: scale(1.04, .92) translateY(3px) !important;
        box-shadow: inset -2px -3px 7px var(--cl-shade), inset 2px 3px 5px rgba(255,255,255,.8), 0 2px 3px rgba(50,80,40,.35) !important; }
      /* running / selected: a coral bubble, slightly pressed, soft red glow, one jelly wobble when it appears */
      ${on(C, ACTIVE)}, ${C} .hubtabs button.sel .ico { color: #fff !important; transform: scale(.98, .95) translateY(2px);
        background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.7) 0 6%, rgba(255,255,255,0) 28%), radial-gradient(circle at 50% 120%, rgba(120,20,5,.4), transparent 60%), var(--cl-coral) !important;
        box-shadow: inset -3px -6px 10px rgba(110,20,5,.4), inset 3px 4px 6px rgba(255,200,190,.6), 0 2px 3px rgba(50,80,40,.35), 0 6px 18px rgba(228,87,61,.45) !important; }
      ${on(C, [".tile.on", ".actbtn.acton", ".tile.going"])} { animation: clayjelly .4s ease-out 1; }
      ${on(C, [".tile.on ha-icon", ".tile.on span", ".tile.on small", ".actbtn.acton span", ".actbtn.acton ha-icon", ".tile.dev.sel ha-icon", ".tile.dev.sel span", ".tile.dev.sel small", ".key.sel *", ".mini.sel *"])} { color: #fff !important; }
      @keyframes clayjelly { 0% { transform: scale(1, 1); } 25% { transform: scale(1.07, .9); } 55% { transform: scale(.96, 1.06); } 80% { transform: scale(1.02, .98); } 100% { transform: scale(.98, .95) translateY(2px); } }
      /* not available: a deep dent */
      ${on(C, [".key.ghost", ".tile.locked", ".key:disabled", ".actbtn.miss", ".pill.ghost"])} { background: var(--cl-dent) !important; box-shadow: inset 0 5px 9px rgba(40,70,35,.5), inset 0 -2px 3px rgba(255,255,255,.55) !important; opacity: 1; filter: none; }
      /* hold: sinks deeper and turns red */
      ${C} .tile.holdsw.holding, ${C} .actbtn.holding, ${C} .tile.off.holding { transform: scale(.97, .92) translateY(4px); }
      ${C} .tile.holdsw::after, ${C} .tile.locked::after { background: color-mix(in srgb, var(--cl-coral) 60%, transparent); border-radius: inherit; }
      /* device page: devices of the running activity carry a soft pink rim (strong at the edge, fading to the centre) and wobble once, a little staggered */
      ${C} .tile.dev.inuse { background: radial-gradient(circle at 30% 22%, #fff 0 6%, rgba(255,255,255,0) 26%), radial-gradient(ellipse at center, rgba(255,190,205,0) 45%, rgba(255,170,190,.32) 100%), var(--cl-green) !important;
        box-shadow: inset 0 0 12px 1px rgba(255,160,185,.34), inset -3px -6px 10px rgba(60,100,50,.2), inset 3px 4px 6px rgba(255,255,255,.9), 0 6px 8px rgba(50,80,40,.35) !important; animation: claywob .5s ease-out 1 both; }
      ${C} .tile.dev.inuse:nth-child(2) { animation-delay: .06s; } ${C} .tile.dev.inuse:nth-child(3) { animation-delay: .12s; } ${C} .tile.dev.inuse:nth-child(4) { animation-delay: .18s; } ${C} .tile.dev.inuse:nth-child(n+5) { animation-delay: .24s; }
      @keyframes claywob { 0% { transform: scale(1); } 30% { transform: scale(1.06, .93) translateY(2px); } 60% { transform: scale(.95, 1.05) translateY(-2px); } 100% { transform: scale(1); } }
      ${C} .tile.dev.sel { animation: none; }
      /* switch: the track is a dent, the bubble travels and turns redder on the way */
      ${C} .sw i { background: #a9c79f; box-shadow: inset 0 3px 6px rgba(40,70,35,.5), inset 0 -2px 3px rgba(255,255,255,.5); }
      ${C} .sw i::after { background: radial-gradient(circle at 30% 25%, #fff 0 12%, rgba(255,255,255,0) 40%), #eaf3e4; box-shadow: inset -2px -3px 5px var(--cl-shade), 0 3px 4px rgba(50,80,40,.4); transition: transform .3s cubic-bezier(.3, 1.6, .5, 1), background .3s; }
      ${C} .sw input:checked + i { background: #a9c79f; }
      ${C} .sw input:checked + i::after { background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.7) 0 12%, rgba(255,255,255,0) 40%), var(--cl-coral); animation: claysw .35s ease-out 1; }
      @keyframes claysw { 0% { transform: translateX(0) scale(1, 1); background-color: #eaf3e4; } 40% { transform: translateX(14px) scale(1.25, .82); background-color: #f0a08e; } 100% { transform: translateX(20px) scale(1, 1); background-color: #e4573d; } }
      /* volume: only the dent is filled, the colour runs from light salmon to red by position, no knob */
      ${C} .volslider { -webkit-appearance: none; appearance: none; background: transparent; }
      ${C} .volslider.h::-webkit-slider-runnable-track { height: 30px; border-radius: 999px; background: linear-gradient(90deg, transparent calc(var(--v, 0) * 1%), var(--cl-dent) calc(var(--v, 0) * 1%)), linear-gradient(90deg, #f7b7a5, #e4573d); box-shadow: inset 0 4px 7px rgba(40,70,35,.5); }
      ${C} .volslider.v::-webkit-slider-runnable-track { width: 30px; border-radius: 999px; background: linear-gradient(0deg, transparent calc(var(--v, 0) * 1%), var(--cl-dent) calc(var(--v, 0) * 1%)), linear-gradient(0deg, #f7b7a5, #e4573d); box-shadow: inset 4px 0 7px rgba(40,70,35,.5); }
      ${C} .volslider::-webkit-slider-thumb { -webkit-appearance: none; width: 0; height: 0; background: none; box-shadow: none; }
      ${C} .volslider.h::-moz-range-track { height: 30px; border-radius: 999px; background: var(--cl-dent); box-shadow: inset 0 4px 7px rgba(40,70,35,.5); }
      ${C} .volslider::-moz-range-progress { background: linear-gradient(90deg, #f7b7a5, #e4573d); height: 30px; border-radius: 999px; }
      ${C} .volslider::-moz-range-thumb { width: 0; height: 0; border: none; background: none; }
      /* header: rooms as bubbles, the symbol sits directly on the bubble; hints as a big dent with bubbles inside */
      ${C} .hubtabs button { background: none !important; box-shadow: none !important; }
      ${C} .hubtabs .ico { background: none !important; box-shadow: none !important; }
      ${C} .hubtabs button.sel { background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.7) 0 6%, rgba(255,255,255,0) 28%), var(--cl-coral) !important; color: #fff; box-shadow: inset -3px -6px 10px rgba(110,20,5,.4), inset 3px 4px 6px rgba(255,200,190,.6), 0 6px 14px rgba(228,87,61,.4) !important; border-radius: 999px; }
      ${C} .hubtabs button.sel .ico { background: none !important; box-shadow: none !important; transform: none; animation: none; }
      ${C} .hubtabs button.sel ha-icon { color: #fff; } ${C} .hubtabs .fdot ha-icon, ${C} .hubtabs button.sel .fdot ha-icon { color: var(--hr-fire); }
      ${C} .ib { border-radius: 50% !important; }
      ${C} .hint-row, ${C} .helpbox, ${C} .infopanel { background: var(--cl-dent) !important; box-shadow: inset 0 5px 9px rgba(40,70,35,.45), inset 0 -2px 3px rgba(255,255,255,.55) !important; border-radius: 20px; }
      ${C} .hint-row button { border-radius: 999px; background: var(--cl-green); color: var(--hr-text); box-shadow: inset -2px -3px 6px var(--cl-shade), inset 2px 3px 4px rgba(255,255,255,.9), 0 3px 4px rgba(50,80,40,.3); }
      /* no red dot on device tiles (the pink rim / coral bubble says it), room tabs keep room for their shadow */
      ${C} .tile.dev.inuse::after, ${C} .tile.dev.sel::after { display: none; }
      ${C} .hubtabs { padding: 2px 12px 10px 4px; }
      /* settings, profile window, info tables, help: surfaces are dents, fields are dents, tabs and buttons are bubbles */
      ${on(C, SURF)} { border: none !important; border-radius: 18px !important; background: var(--cl-dent) !important; box-shadow: inset 0 5px 9px rgba(40,70,35,.45), inset 0 -2px 3px rgba(255,255,255,.55) !important; color: var(--hr-text); }
      ${on(C, FIELD)} { border: none !important; border-radius: 14px !important; background: #a9c79f !important; color: var(--hr-text); box-shadow: inset 0 3px 6px rgba(40,70,35,.5), inset 0 -2px 3px rgba(255,255,255,.5); }
      ${on(C, BTN)} { border: none !important; border-radius: 999px !important; background: radial-gradient(circle at 30% 22%, #fff 0 7%, rgba(255,255,255,0) 30%), var(--cl-green) !important; color: var(--hr-text); box-shadow: inset -3px -6px 10px var(--cl-shade), inset 3px 4px 6px rgba(255,255,255,.95), 0 4px 6px rgba(50,80,40,.3) !important; }
      ${C} .etabs button.sel, ${C} .favkind button.sel { background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.7) 0 6%, rgba(255,255,255,0) 28%), var(--cl-coral) !important; color: #fff !important; }
      ${C} :is(.pbadge, .gbadge) { border-radius: 999px; }
      ${C} :is(.pitem.on, .profrow.act) { background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.7) 0 6%, rgba(255,255,255,0) 28%), var(--cl-coral) !important; color: #fff !important; }
      ${C} :is(.pitem.on, .profrow.act) :is(ha-icon, small, b, span) { color: #fff !important; }
      ${C} :is(.pbtn.pri, .editdone:not(.warn), .helpall, .addact, .profdlg .editrow button:last-child) { background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.7) 0 6%, rgba(255,255,255,0) 28%), var(--cl-coral) !important; color: #fff !important; }
      ${C} :is(.helpall, .addact, .editdone:not(.warn)) :is(ha-icon, span) { color: #fff !important; }
      ${on(C, [".win", ".helpbox", ".infopanel", ".hmenu"])} { background: #c3d8bb !important; }
      ${C} :is(.helpbox, .infopanel, .hint-row, .profdlg) ha-icon { color: var(--hr-text) !important; }
      ${C} .sdot.lit { box-shadow: inset -1px -1px 2px rgba(110,20,5,.4), 0 0 6px var(--hr-accent); }
      /* device with a known power state: a dent with a bubble that travels and turns coral */
      ${C} .rpow .pwrow { display: flex; align-items: center; gap: 14px; padding: 8px 6px; } ${C} .pwlab { flex: 1; min-width: 0; color: var(--hr-text); font-weight: 600; }
      ${C} .pwio { display: flex; gap: 10px; } ${C} .key.pwio { width: 52px; min-height: 44px; flex-direction: column; gap: 1px; padding: 0; }
      ${C} .pwknob { flex: none; position: relative; width: 70px; height: 38px; border-radius: 999px; background: #a9c79f; box-shadow: inset 0 3px 6px rgba(40,70,35,.5), inset 0 -2px 3px rgba(255,255,255,.5); }
      ${C} .pwknob .knob { position: absolute; left: 3px; top: 3px; width: 32px; height: 32px; padding: 0; min-height: 0; border-radius: 50% !important; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform .3s cubic-bezier(.3, 1.6, .5, 1); }
      ${C} .pwknob .knob ha-icon { --mdc-icon-size: 16px; }
      ${C} .pwknob.on .knob { transform: translateX(32px); color: #fff !important; background: radial-gradient(circle at 30% 25%, rgba(255,255,255,.7) 0 12%, rgba(255,255,255,0) 40%), var(--cl-coral) !important; animation: claysw .35s ease-out 1; }
      ${C} .pwknob.on .knob ha-icon { color: #fff !important; } ${C} .pwknob.pend .knob { animation: claypend .6s ease-in-out infinite alternate; }
      @keyframes claypend { from { filter: brightness(.9); } to { filter: brightness(1.2); } }
      @media (prefers-reduced-motion: reduce) { ${C} *, ${C} *::after { animation: none !important; transition: none !important; } }

      /* ---------- Nixie: app keys of the Fire TV in graphite with a dim amber legend, no brand colours ---------- */
      ${X} .key.svc, ${X} .appcell.svc { background: linear-gradient(180deg, #2c2520, #1b1612) !important; color: #c8964a !important; border: 1px solid #5a4630 !important; box-shadow: inset 0 1px 0 rgba(255,220,160,.15), 0 2px 4px rgba(0,0,0,.5) !important; }
      ${X} .key.svc ha-icon, ${X} .key.svc b, ${X} .key.svc small, ${X} .key.svc span { color: #c8964a !important; filter: none; }
      ${X} .appcell.svc.on { border-color: #ff9a3a !important; box-shadow: inset 0 0 0 1px #ff9a3a, 0 0 10px rgba(255,154,58,.45) !important; }
      ${X} .appcell.svc.on ha-icon, ${X} .appcell.svc.on b, ${X} .appcell.svc.on small { color: #ffb84a !important; filter: drop-shadow(0 0 4px #ff9a3a); }

      /* ---------- Thermal: the edit header sits on a dark plate so the lettering is readable on the heat gradient ---------- */
      ${W} .edittool { background: #0a0614; border-radius: 3px; padding: 8px; }

      /* ---------- Fire TV badge (0.22): no plate, no frame, just the symbol in the skin's colour with a glow, laid over the original ---------- */
      :is(${T2}, ${R2}, ${W}, ${X}, ${N2}, ${G}, ${C}) .fdot { background: transparent !important; box-shadow: none !important; outline: none !important; border: 0 !important; clip-path: none !important; border-radius: 50% !important; width: 16px; height: 16px; }
      :is(${T2}, ${R2}, ${W}, ${X}, ${N2}, ${G}, ${C}) .fdot ha-icon { --mdc-icon-size: 14px; width: 14px; height: 14px; filter: drop-shadow(0 0 1.5px rgba(0,0,0,.95)) drop-shadow(0 0 3px var(--fdc)); }
      :is(${T2}, ${R2}, ${W}, ${X}, ${N2}, ${G}, ${C}) .fdot.f-unknown { opacity: .8; }
      :is(${T2}, ${R2}, ${W}, ${X}, ${N2}, ${G}, ${C}) .fdot.f-unknown ha-icon { filter: drop-shadow(0 0 1.5px rgba(0,0,0,.9)); }
      :is(${T2}, ${R2}, ${W}, ${X}, ${N2}, ${G}, ${C}) :is(.infoitem, .sbtn) .sample .fdot { background: #14110d !important; width: 20px; height: 20px; }
      ${T2} .fdot { --fdc: #3dff6b; color: #3dff6b !important; } ${N2} .fdot { --fdc: #ffb000; color: #ffb000 !important; } ${W} .fdot { --fdc: #ff7a1c; color: #ffe85a !important; }
      ${R2} .fdot, ${X} .fdot { --fdc: #ff9a3a; color: #ffd27a !important; } ${G} .fdot { --fdc: #8ff0ff; color: #bff6ff !important; } ${C} .fdot { --fdc: #ff8a7a; color: #e04a3a !important; }
      :is(${T2}, ${R2}, ${W}, ${X}, ${N2}, ${G}, ${C}) .fdot ha-icon { color: inherit !important; }
      ${T2} .hubtabs button.sel .fdot { color: #03200a !important; --fdc: #b8ffc8; } :is(${R2}, ${X}) .hubtabs button.sel .fdot { color: #2a170a !important; --fdc: #ffe29a; }

      /* ---------- Header symbols (0.22): round, no plate and no frame around profile, help, gear and room tools; transport keys without outline ---------- */
      :is(${T2}, ${N2}, ${W}, ${X}) :is(.ib, .profchip) { border: 0 !important; background: transparent !important; box-shadow: none !important; clip-path: none !important; border-radius: 50% !important; }
      :is(${T2}, ${N2}, ${W}, ${X}) .ib.sel, :is(${T2}, ${N2}, ${W}, ${X}) .ib.hl { background: color-mix(in srgb, var(--hr-accent) 26%, transparent) !important; box-shadow: 0 0 8px color-mix(in srgb, var(--hr-accent) 60%, transparent) !important; }
      :is(${W}, ${N2}) .transport .key { border-color: transparent !important; box-shadow: none !important; }

      /* ---------- Fire TV app keys (0.22): Glass = glass plate lit from behind in the brand colour, Clay = glossy bubble in the brand colour ---------- */
      ${G} :is(.key.svc, .appcell.svc) { background: radial-gradient(130% 150% at 50% -10%, color-mix(in srgb, var(--c) 52%, transparent), color-mix(in srgb, var(--c) 12%, #0b0e14) 72%), #0b0e14 !important; border: 0 !important; border-radius: 2px !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.2), inset 0 0 0 1px color-mix(in srgb, var(--c) 28%, transparent), 0 0 10px color-mix(in srgb, var(--c) 30%, transparent) !important; color: color-mix(in srgb, var(--c) 58%, #fff) !important; text-shadow: 0 0 6px color-mix(in srgb, var(--c) 70%, transparent); transition: box-shadow 1s, background 1s; position: relative; overflow: hidden; }
      ${G} :is(.key.svc, .appcell.svc) :is(b, small, span, ha-icon) { color: inherit !important; }
      ${G} .appcell.svc.on { background: radial-gradient(130% 150% at 50% -10%, color-mix(in srgb, var(--c) 85%, transparent), color-mix(in srgb, var(--c) 30%, #0b0e14) 72%), #0b0e14 !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.3), inset 0 0 0 1px color-mix(in srgb, var(--c) 60%, transparent), 0 0 20px 2px color-mix(in srgb, var(--c) 55%, transparent) !important; color: #fff !important; }
      ${G} .appcell.svc.on::after { content: ""; position: absolute; inset: 0; background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.28) 50%, transparent 65%); transform: translateX(-100%); animation: glsheen 3.6s ease-in-out infinite; pointer-events: none; }
      @keyframes glsheen { 0%, 55% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      ${C} :is(.key.svc, .appcell.svc) { background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.55), transparent 46%), var(--c) !important; border: 0 !important; border-radius: 999px !important; box-shadow: inset -3px -6px 10px rgba(0,0,0,.25), inset 3px 4px 8px rgba(255,255,255,.35), 0 6px 10px rgba(60,80,50,.35) !important; }
      ${C} .appcell.svc.on { box-shadow: inset -3px -6px 10px rgba(0,0,0,.25), inset 3px 4px 8px rgba(255,255,255,.4), 0 0 0 3px color-mix(in srgb, var(--c) 40%, transparent), 0 0 16px 2px color-mix(in srgb, var(--c) 60%, transparent) !important; animation: claywob .5s ease-out 1; }
      ${C} .appcell.svc:active { transform: scale(1.05, .92) translateY(2px); box-shadow: inset 2px 4px 10px rgba(0,0,0,.3), 0 2px 4px rgba(60,80,50,.3) !important; }

      /* ---------- Clay (0.22): volume as a bubble that fills (lighter to redder with the level), imprinted lettering in dents, selected device = selected activity ---------- */
      ${C} .volslider { --cf: color-mix(in srgb, #e4573d calc(var(--v, 0) * 1%), #f7b7a5); }
      ${C} .volslider.h::-webkit-slider-runnable-track { background:
        linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,0) 42%, rgba(80,10,0,.22)) 0 0 / max(0px, calc(var(--v, 0) * 1% - 15px)) 100% no-repeat,
        radial-gradient(circle 15px at calc(var(--v, 0) * 1% - 15px) 50%, var(--cf) 14.5px, transparent 15px),
        linear-gradient(90deg, #f7b7a5, var(--cf)) 0 0 / max(0px, calc(var(--v, 0) * 1% - 15px)) 100% no-repeat,
        var(--cl-dent); box-shadow: inset 0 4px 7px rgba(40,70,35,.5); }
      ${C} .volslider.v::-webkit-slider-runnable-track { background:
        linear-gradient(90deg, rgba(255,255,255,.55), rgba(255,255,255,0) 42%, rgba(80,10,0,.22)) 0 100% / 100% max(0px, calc(var(--v, 0) * 1% - 15px)) no-repeat,
        radial-gradient(circle 15px at 50% calc(100% - var(--v, 0) * 1% + 15px), var(--cf) 14.5px, transparent 15px),
        linear-gradient(0deg, #f7b7a5, var(--cf)) 0 100% / 100% max(0px, calc(var(--v, 0) * 1% - 15px)) no-repeat,
        var(--cl-dent); box-shadow: inset 4px 0 7px rgba(40,70,35,.5); }
      ${C} .volslider::-moz-range-progress { background: var(--cf); }
      ${on(C, [".key.ghost", ".tile.locked", ".key:disabled", ".actbtn.miss", ".pill.ghost"])}, ${on(C, [".key.ghost *", ".tile.locked *", ".key:disabled *", ".actbtn.miss *", ".pill.ghost *"])} { color: rgba(45,75,40,.6) !important; text-shadow: 0 1px 0 rgba(255,255,255,.6); }
      ${on(C, [".key.ghost ha-icon", ".tile.locked ha-icon", ".key:disabled ha-icon", ".actbtn.miss ha-icon", ".pill.ghost ha-icon"])} { filter: drop-shadow(0 1px 0 rgba(255,255,255,.6)); }
      ${C} .tile.dev.inuse:not(.sel) ha-icon { color: #e0788f !important; }
      ${C} .tile.dev.inuse:not(.sel) { color: var(--hr-text) !important; } ${C} .tile.dev.inuse:not(.sel) :is(span, small) { color: var(--hr-text) !important; }
      ${C} .tile.dev.sel, ${C} .tile.dev.inuse.sel { background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.7) 0 6%, rgba(255,255,255,0) 28%), radial-gradient(circle at 50% 120%, rgba(120,20,5,.4), transparent 60%), var(--cl-coral) !important;
        box-shadow: inset -3px -6px 10px rgba(110,20,5,.4), inset 3px 4px 6px rgba(255,200,190,.6), 0 2px 3px rgba(50,80,40,.35), 0 6px 18px rgba(228,87,61,.45) !important; transform: scale(.98, .95) translateY(2px); }
      ${C} .tile.dev.sel ha-icon, ${C} .tile.dev.sel span, ${C} .tile.dev.sel small { color: #fff !important; }
`;


export const SKIN_KIT = { on, PRESSED, ACTIVE, SEL, PRIMARY, SURF, FIELD, BTN, SPOT, SHEEN };
