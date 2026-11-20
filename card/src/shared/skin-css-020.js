// Skins of 0.20: "glass" (Glas: dark acrylic plates that light from behind, three light styles a/b/c) and
// "clay" (Knetmasse: bubbles you press, dents for surfaces and states), plus the app keys of the tube skin.
// Same rules as the other skin files: effects stay inside the card, motion stops with "reduce motion".

const G = 'ha-card[data-skin="glass"]';
const C = 'ha-card[data-skin="clay"]';
const X = 'ha-card[data-skin="nixie"]';

// Things that are pressed / shown as steady state in a lit plate (glass) or as a coral bubble (clay)
const PRESSED = [".key:active", ".key.lit", ".kk:active", ".pill:active", ".chip:active", ".d:active", ".actbtn:active", ".tile:active", ".tile.lit", ".linkbar button:active", ".pbtn:active"];
const ACTIVE = [".tile.on", ".actbtn.acton", ".key.sel", ".mini.sel", ".tile.dev.sel", ".tile.going"];
const on = (base, list) => list.map((s) => `${base} ${s}`).join(", ");
const onNot = (base, list, not) => list.map((s) => `${base} ${s}:where(${not})`).join(", ");

// The three light styles for something lit: text colour and halo, strength in --gl-mix (share of the function colour in the plate)
const lit = (list, mix, ink = "var(--gi)") => `
      ${on(G, list)} { background: color-mix(in srgb, var(--gc) ${mix}, var(--gl-base)) !important; border-color: color-mix(in srgb, var(--gc) 55%, transparent) !important;
        box-shadow: inset 0 0 18px color-mix(in srgb, var(--gc) 26%, transparent), 0 0 14px color-mix(in srgb, var(--gc) 32%, transparent), 0 4px 8px rgba(0,0,0,.45) !important; }
      ${G}.gl-a :is(${list.join(", ")}) { color: ${ink} !important; text-shadow: none; }
      ${G}.gl-b :is(${list.join(", ")}) { color: var(--gb) !important; text-shadow: 0 0 3px var(--gc), 0 0 9px var(--gc); }
      ${G}.gl-c :is(${list.join(", ")}) { color: #fff !important; text-shadow: 0 0 5px color-mix(in srgb, var(--gc) 90%, #000), 0 0 11px var(--gc); }
      ${G}.gl-b :is(${list.join(", ")}) ha-icon, ${G}.gl-c :is(${list.join(", ")}) ha-icon { filter: drop-shadow(0 0 4px var(--gc)); }`;

export const SKIN_CSS_020 = `
      /* ---------- Glas: dark acrylic plates, light from behind ---------- */
      ${G} { --gl-green: #2dff7a; --gl-blue: #3da5ff; --gl-red: #ff5a4a; --gl-amber: #ffb340; --gl-rest: #aab6bf; --gl-base: #131a20; --gc: var(--gl-blue); --gb: #5cb4ff; --gi: #fff;
        font-family: "Segoe UI", Roboto, Arial, sans-serif; background-color: #0a0f14; background-image: radial-gradient(circle at 20% 0, #13202b, #070a0e 70%); color: var(--hr-text); }
      ${G} * { backdrop-filter: none; }
      /* function colours: green = OK / play / confirm, blue = navigation, red = off / stop, amber = running */
      ${G} .key[data-cmd*="Ok"], ${G} .key[data-cmd*="Select"], ${G} .key[data-cmd*="Play"], ${G} .key[data-cmd*="Enter"], ${G} .d.ok, ${G} .pbtn.pri { --gc: var(--gl-green); --gb: #2dff7a; --gi: #05261a; }
      ${G} .key[data-cmd*="Power"], ${G} .key[data-cmd*="Stop"], ${G} .key[data-cmd*="Record"], ${G} .key.pon, ${G} .key.warn, ${G} .tile.off, ${G} .editdone.warn { --gc: var(--gl-red); --gb: #ff7a5a; --gi: #fff; }
      ${G} .tile:not(.dev), ${G} .actbtn, ${G} .key.sel, ${G} .mini.sel { --gc: var(--gl-amber); --gb: #ffc24a; --gi: #2a1700; }
      ${G} .tile.dev.inuse { --gc: var(--gl-green); --gb: #2dff7a; --gi: #05261a; }
      ${G} .tile.dev.sel { --gc: var(--gl-blue); --gb: #5cb4ff; --gi: #fff; }
      ${G} .hint-row.r { --gc: var(--gl-red); --gb: #ff7a5a; --gi: #fff; } ${G} .hint-row.o { --gc: var(--gl-amber); --gb: #ffc24a; --gi: #2a1700; } ${G} .hint-row.b { --gc: var(--gl-blue); --gb: #5cb4ff; --gi: #fff; }
      /* the resting plate: dark, light grey lettering */
      ${onNot(G, [".key", ".kk", ".pill", ".chip", ".d", ".actbtn", ".tile", ".seg", ".ib", ".hubtabs .ico", ".linkbar", ".hint-row", ".helpbtn", ".infohead"], ":not(.ghost):not(.svc)")} {
        border: 1px solid rgba(255,255,255,.16) !important; border-radius: 2px !important; background: var(--gl-base) !important; background-image: none !important; color: var(--hr-text);
        box-shadow: 0 4px 8px rgba(0,0,0,.45) !important; transition: background .3s, box-shadow .3s, color .3s, border-color .3s; }
      ${G} .key:not(.ghost):not(.svc), ${G} .kk, ${G} .pill, ${G} .chip, ${G} .d, ${G} .actbtn, ${G} .tile { color: var(--gl-rest); }
      ${G} .key ha-icon, ${G} .kk ha-icon, ${G} .pill ha-icon, ${G} .chip ha-icon, ${G} .d ha-icon, ${G} .actbtn ha-icon, ${G} .tile ha-icon, ${G} .tile.dev ha-icon, ${G} .colorful .cell ha-icon, ${G} .colorful .rocker .rk ha-icon, ${G} .colorful .power .key ha-icon { color: inherit !important; }
      ${G} .tile.off ha-icon { color: var(--gl-red) !important; }
      ${G} .key.ghost, ${G} .dpad, ${G} .rocker { background: none !important; box-shadow: none !important; border-color: transparent !important; }
      ${G} .dpad::before, ${G} .dpad::after { display: none; }
      ${G} .tile, ${G} .actbtn { position: relative; }
      ${G} .color.red { border-bottom: 3px solid var(--gl-red) !important; } ${G} .color.green { border-bottom: 3px solid var(--gl-green) !important; } ${G} .color.yellow { border-bottom: 3px solid var(--gl-amber) !important; } ${G} .color.blue { border-bottom: 3px solid var(--gl-blue) !important; }
      ${G} .tile:active, ${G} .tile.on { transform: none; }
      ${G} .tile.locked, ${G} .key:disabled, ${G} .actbtn.miss { opacity: .55; }
      /* pressed plates: lit as strong as the light style says; steady state (running) dimmer */
      ${lit(PRESSED, "var(--gl-p)")}
      ${lit(ACTIVE, "var(--gl-pa)", "#fff")}
      ${G}.gl-a { --gl-p: 70%; --gl-pa: 42%; } ${G}.gl-b { --gl-p: 22%; --gl-pa: 13%; } ${G}.gl-c { --gl-p: 46%; --gl-pa: 28%; }
      ${G}.gl-a .hint-row { --gl-h: 55%; } ${G}.gl-b .hint-row { --gl-h: 18%; } ${G}.gl-c .hint-row { --gl-h: 36%; }
      ${G} .tile.on { box-shadow: inset 0 0 18px color-mix(in srgb, var(--gc) 22%, transparent), 0 0 10px color-mix(in srgb, var(--gc) 24%, transparent), 0 4px 8px rgba(0,0,0,.45) !important; }
      ${G}.gl-a .tile.on :is(span, small, ha-icon), ${G}.gl-a .actbtn.acton :is(span, ha-icon) { color: #fff !important; }
      ${G}.gl-b .tile.on :is(span, small), ${G}.gl-b .actbtn.acton span { color: var(--gb) !important; } ${G}.gl-b .tile.on, ${G}.gl-b .actbtn.acton { opacity: 1; }
      ${G}.gl-c .tile.on :is(span, small, ha-icon), ${G}.gl-c .actbtn.acton :is(span, ha-icon) { color: #fff !important; }
      /* hint and info lines: the whole plate lights in the colour of the message */
      ${G} .hint-row { background: color-mix(in srgb, var(--gc) var(--gl-h, 36%), var(--gl-base)) !important; border-color: color-mix(in srgb, var(--gc) 55%, transparent) !important; padding: 8px 10px; }
      ${G}.gl-a .hint-row, ${G}.gl-a .hint-row > ha-icon { color: var(--gi) !important; } ${G}.gl-b .hint-row, ${G}.gl-b .hint-row > ha-icon { color: var(--gb) !important; text-shadow: 0 0 3px var(--gc), 0 0 8px var(--gc); }
      ${G}.gl-c .hint-row, ${G}.gl-c .hint-row > ha-icon { color: #fff !important; text-shadow: 0 0 5px var(--gc); }
      ${G} .hint-row button { border-radius: 2px; background: rgba(255,255,255,.14); color: inherit; border: 1px solid rgba(255,255,255,.35); }
      /* device page: green plate + one square = belongs to the running activity, blue + white frame + three squares = shown */
      ${G} .tile.dev.inuse::before, ${G} .tile.dev.sel::before { content: ""; position: absolute; left: 7px; top: 14px; width: 5px; height: 5px; background: #fff; box-shadow: 0 0 5px #fff; pointer-events: none; }
      ${G} .tile.dev.sel::before { box-shadow: 8px 0 0 #fff, 4px -8px 0 #fff, 0 0 5px #fff; }
      ${G} .tile.dev.sel { border-color: #fff !important; box-shadow: inset 0 0 0 1px #fff, 0 0 14px color-mix(in srgb, var(--gc) 35%, transparent), 0 4px 8px rgba(0,0,0,.45) !important; }
      /* hold ("all off"): the whole plate brightens from within, no rising bar */
      ${G} .tile.holdsw::after, ${G} .tile.locked::after { transform: none !important; opacity: 0; background: color-mix(in srgb, var(--gl-red) 70%, transparent) !important; transition: opacity .7s linear; }
      ${G} .tile.holdsw.holding::after, ${G} .tile.locked.holding::after { opacity: 1; }
      ${G} .actbtn.holding::after { transform: none !important; opacity: 0; background: color-mix(in srgb, var(--gl-red) 70%, transparent) !important; animation: glhold .7s linear 1 forwards !important; }
      @keyframes glhold { from { opacity: 0; } to { opacity: 1; } }
      /* header: plates with large white, softly glowing symbols */
      ${G} .hubtabs button { border-radius: 2px; background: none; }
      ${G} .hubtabs .ico { width: 36px; height: 36px; background: #1d2832 !important; border-color: rgba(255,255,255,.28) !important; }
      ${G} .hubtabs ha-icon, ${G} .ib ha-icon { --mdc-icon-size: 22px; color: #fff; filter: drop-shadow(0 0 4px rgba(255,255,255,.7)); }
      ${G} .hubtabs button.sel .ico { background: color-mix(in srgb, var(--gl-amber) 38%, var(--gl-base)) !important; border-color: color-mix(in srgb, var(--gl-amber) 60%, transparent) !important; }
      ${G} .ib { background: #1d2832 !important; border: 1px solid rgba(255,255,255,.28) !important; color: #fff; }
      ${G} .ib.gear[class*="sev-"] ha-icon { color: var(--gc, #fff); }
      ${G} .etabs button, ${G} .favkind button, ${G} .editdone, ${G} .editcancel { border-radius: 2px; }
      ${G} .seg .th { background: color-mix(in srgb, var(--gl-amber) 55%, var(--gl-base)); border-radius: 2px; box-shadow: 0 0 10px rgba(255,179,64,.3); }
      ${G} .seg .lab.a { color: #fff; }
      /* Ja/Nein: an acrylic plate that turns red or green, no sliding */
      ${G} .sw i { border-radius: 2px; background: color-mix(in srgb, var(--gl-red) 38%, var(--gl-base)); border: 1px solid color-mix(in srgb, var(--gl-red) 60%, transparent); box-shadow: 0 0 8px color-mix(in srgb, var(--gl-red) 30%, transparent); }
      ${G} .sw i::after { content: "\\2715"; inset: 0; top: 0; left: 0; width: auto; height: auto; border-radius: 0; background: none; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 800; color: #ffd9d3; transform: none !important; }
      ${G} .sw input:checked + i { background: color-mix(in srgb, var(--gl-green) 38%, var(--gl-base)); border-color: color-mix(in srgb, var(--gl-green) 60%, transparent); box-shadow: 0 0 8px color-mix(in srgb, var(--gl-green) 30%, transparent); animation: glflash .35s ease-out 1; }
      ${G} .sw input:checked + i::after { content: "\\2713"; color: #d9ffe8; }
      @keyframes glflash { 0% { filter: brightness(1.9); } 100% { filter: none; } }
      /* volume: a plate that changes colour with the level (quiet greenish to loud red), no bar */
      ${G} .volslider { -webkit-appearance: none; appearance: none; background: transparent; accent-color: var(--gl-green); }
      ${G} .volslider::-webkit-slider-runnable-track { border-radius: 2px; border: 1px solid rgba(255,255,255,.28); background: color-mix(in srgb, color-mix(in srgb, #ff5a4a calc(var(--v, 0) * 1%), #2dff7a) calc(16% + var(--v, 0) * .34%), var(--gl-base)); box-shadow: 0 4px 8px rgba(0,0,0,.45); }
      ${G} .volslider.h::-webkit-slider-runnable-track { height: 52px; } ${G} .volslider.v::-webkit-slider-runnable-track { width: 100%; }
      ${G} .volslider::-webkit-slider-thumb { -webkit-appearance: none; background: #fff; box-shadow: 0 0 8px #fff; border-radius: 0; }
      ${G} .volslider.h::-webkit-slider-thumb { width: 3px; height: 52px; } ${G} .volslider.v::-webkit-slider-thumb { height: 3px; width: 44px; }
      ${G} .volslider::-moz-range-track { border-radius: 2px; background: color-mix(in srgb, color-mix(in srgb, #ff5a4a calc(var(--v, 0) * 1%), #2dff7a) calc(16% + var(--v, 0) * .34%), var(--gl-base)); border: 1px solid rgba(255,255,255,.28); height: 52px; }
      ${G} .volslider::-moz-range-thumb { background: #fff; border: none; border-radius: 0; width: 3px; height: 52px; }
      /* device with a known power state: one plate that is red (off) or green (on), like the Ja/Nein plate */
      ${G} .rpow .pwrow { display: flex; align-items: center; gap: 14px; padding: 8px 6px; } ${G} .pwlab { flex: 1; min-width: 0; color: var(--gl-rest); font-weight: 600; }
      ${G} .pwio { display: flex; gap: 10px; } ${G} .key.pwio { width: 52px; min-height: 44px; flex-direction: column; gap: 1px; padding: 0; }
      ${G} .pwknob { flex: none; width: 68px; height: 44px; position: relative; }
      ${G} .pwknob .knob { width: 100%; height: 100%; padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; border-radius: 2px; color: #ffd9d3; background: color-mix(in srgb, var(--gl-red) 38%, var(--gl-base)); border: 1px solid color-mix(in srgb, var(--gl-red) 60%, transparent); box-shadow: 0 0 8px color-mix(in srgb, var(--gl-red) 30%, transparent); transition: background .3s, box-shadow .3s; }
      ${G} .pwknob.on .knob { color: #d9ffe8; background: color-mix(in srgb, var(--gl-green) 38%, var(--gl-base)); border-color: color-mix(in srgb, var(--gl-green) 60%, transparent); box-shadow: 0 0 8px color-mix(in srgb, var(--gl-green) 30%, transparent); animation: glflash .35s ease-out 1; }
      ${G} .pwknob .knob ha-icon { color: inherit !important; --mdc-icon-size: 22px; } ${G} .pwknob.pend .knob { animation: glpend .6s ease-in-out infinite alternate; }
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
`;
