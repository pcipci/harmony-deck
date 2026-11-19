// Extra styling of the two effect skins "terminal" (green phosphor screen) and "radio" (1950s tube radio).
// The other skins are plain variable sets (skins.js); these two also change shapes and add decoration, so they live here.
// Effects only lie over the card (pointer-events: none), taps and text are not touched; animations stop with "reduce motion".

const T = 'ha-card[data-skin="terminal"]';
const R = 'ha-card[data-skin="radio"]';

export const SKIN_CSS = `
      ${T} .skin-glare, ${T} .skin-tear, ${R} .skin-head { display: none; }
      /* Terminal: phosphor glass with scanlines, snow, a rolling bar, now and then a flicker */
      ${T} { position: relative; overflow: hidden; font-family: "Courier New", ui-monospace, monospace; border-radius: 44px / 36px; border: 12px solid #101510;
        background-image: repeating-linear-gradient(0deg, rgba(0,0,0,.30) 0 1px, transparent 1px 3px), radial-gradient(ellipse at center, rgba(61,255,107,.10), transparent 70%);
        box-shadow: inset 0 0 70px 14px rgba(0,0,0,.6), inset 0 0 0 2px #1fa63f, 0 0 0 3px #2a3a2a; animation: skflick 6s infinite steps(1); }
      ${T}::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 90px; pointer-events: none; z-index: 5;
        background: linear-gradient(180deg, transparent, rgba(61,255,107,.10), transparent); animation: skroll 7s linear infinite; }
      ${T}::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 6; opacity: .14; mix-blend-mode: screen; animation: sksnow .6s infinite steps(3);
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .2  0 0 0 1 0  0 0 0 0 .3  0 0 0 .9 0'/></filter><rect width='160' height='160' filter='url(%23n)'/></svg>"); }
      ${T} .skin-glare { display: block; position: absolute; inset: 0; z-index: 8; pointer-events: none; border-radius: inherit;
        background: radial-gradient(ellipse 60% 35% at 28% 6%, rgba(190,255,200,.18), transparent 70%), radial-gradient(ellipse at center, transparent 52%, rgba(0,0,0,.5) 100%), linear-gradient(115deg, rgba(255,255,255,.06), transparent 28%); }
      ${T} .skin-tear { display: block; position: absolute; left: 0; right: 0; top: 46%; height: 14px; z-index: 7; pointer-events: none; background: rgba(61,255,107,.06);
        box-shadow: -5px 0 0 rgba(255,60,60,.22), 5px 0 0 rgba(60,120,255,.22); animation: sktear 9s infinite steps(1); }
      ${T} * { text-shadow: -1px 0 rgba(255,60,60,.4), 1px 0 rgba(60,140,255,.4), 0 0 6px rgba(61,255,107,.5); letter-spacing: .02em; }
      ${T} ha-icon { filter: drop-shadow(0 0 4px rgba(61,255,107,.7)); }
      ${T} .key, ${T} .tile, ${T} .rocker, ${T} .seg, ${T} button { border: 1px solid #1fa63f; background-image: none;
        box-shadow: 0 0 8px rgba(61,255,107,.25), inset 0 0 8px rgba(61,255,107,.10); }
      ${T} .key { border-radius: 0; }
      ${T} .key.color { box-shadow: 0 0 10px currentColor; }
      /* the cross: framed fields with cut corners, a square OK */
      ${T} .dpad { background: none; border: none; box-shadow: none; }
      ${T} .dpad .key { clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px)); }
      ${T} .dpad .key.ok, ${T} .dpad [data-cmd*="Ok"] { clip-path: none; border: 2px solid #3dff6b; box-shadow: 0 0 16px rgba(61,255,107,.6); }
      /* activities as list lines, the running one inverted */
      ${T} .grid { grid-template-columns: 1fr !important; gap: 4px !important; }
      ${T} .tile:not(.dev) { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 10px; text-align: left; padding: 8px 12px; min-height: 44px; }
      ${T} .tile:not(.dev)::before { content: ">"; color: #1fa63f; margin-right: 2px; }
      ${T} .tile.on, ${T} .tile.dev.sel, ${T} .actbtn.acton, ${T} .key.sel, ${T} .mini.sel { background: #3dff6b; color: #021a05; text-shadow: none; box-shadow: 0 0 14px rgba(61,255,107,.55); outline: none; }
      ${T} .tile.on:not(.dev)::before { content: "\\25B6"; color: #021a05; }
      ${T} .tile.on ha-icon, ${T} .tile.on span, ${T} .tile.on small, ${T} .tile.dev.sel ha-icon, ${T} .tile.dev.sel span, ${T} .tile.dev.sel small, ${T} .actbtn.acton *, ${T} .key.sel *, ${T} .mini.sel * { color: #021a05 !important; filter: none; text-shadow: none; }
      /* switches: a lit slider on black: left = off (dim), right = on (glowing green) */
      ${T} .sw:has(> input) i { border-radius: 0; background: #010a02; border: 1px solid #1fa63f; box-shadow: inset 0 0 6px rgba(0,0,0,.9); }
      ${T} .sw:has(> input) i::after { border-radius: 0; width: 20px; height: 20px; top: 3px; background: #14602a; box-shadow: none; }
      ${T} .sw:has(> input) input:checked + i { background: #010a02; border-color: #3dff6b; box-shadow: 0 0 10px rgba(61,255,107,.55), inset 0 0 8px rgba(61,255,107,.25); }
      ${T} .sw:has(> input) input:checked + i::after { transform: translateX(20px); background: #3dff6b; box-shadow: 0 0 10px 2px #3dff6b; }
      /* status line: the small buttons (pause, power) carry no frame */
      ${T} .status button, ${T} .chip button, ${T} .chips button { border: none; box-shadow: none; background: transparent; }
      /* the Activities / Devices switch: the block jumps over */
      ${T} .seg { background: #021a05; border: 1px solid #3dff6b; border-radius: 0; padding: 3px; box-shadow: none; }
      ${T} .seg .th { border-radius: 0; background: #3dff6b; box-shadow: 0 0 12px rgba(61,255,107,.6); }
      ${T} .seg .lab { border-radius: 0; color: #3dff6b; } ${T} .seg .lab.a { color: #021a05; font-weight: 700; } ${T} .seg .lab.a * { text-shadow: none; }
      /* volume slider: a bar of green blocks (like a loading bar) */
      ${T} .volslider.h { -webkit-appearance: none; appearance: none; height: 28px; min-height: 28px; border: 1px solid #3dff6b; background: repeating-linear-gradient(90deg, #3dff6b 0 8px, transparent 8px 11px) 3px 3px / calc((100% - 6px) * var(--v, 0) / 100) calc(100% - 6px) no-repeat, #021a05; box-shadow: 0 0 8px rgba(61,255,107,.4); }
      ${T} .volslider.h::-webkit-slider-runnable-track { height: 28px; background: transparent; } ${T} .volslider.h::-moz-range-track { height: 28px; background: transparent; }
      ${T} .volslider.h::-webkit-slider-thumb { -webkit-appearance: none; width: 6px; height: 28px; border-radius: 0; background: #b8ffc9; border: none; box-shadow: 0 0 8px #3dff6b; }
      ${T} .volslider.h::-moz-range-thumb { width: 6px; height: 28px; border-radius: 0; background: #b8ffc9; border: none; }
      ${T} .volslider.v { -webkit-appearance: none; appearance: none; width: 30px; border: 1px solid #3dff6b; background: repeating-linear-gradient(0deg, #3dff6b 0 8px, transparent 8px 11px) 3px calc(100% - 3px) / calc(100% - 6px) calc((100% - 6px) * var(--v, 0) / 100) no-repeat, #021a05; box-shadow: 0 0 8px rgba(61,255,107,.4); }
      ${T} .volslider.v::-webkit-slider-runnable-track { width: 100%; background: transparent; } ${T} .volslider.v::-moz-range-track { background: transparent; }
      ${T} .volslider.v::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 6px; border-radius: 0; background: #b8ffc9; border: none; box-shadow: 0 0 8px #3dff6b; }
      ${T} .volslider.v::-moz-range-thumb { width: 30px; height: 6px; border-radius: 0; background: #b8ffc9; border: none; }
      /* hold to switch off: green like everything else; blocks fill the whole tile left to right, then the picture shrinks to a line */
      ${T} .holdoff ha-icon, ${T} .tile.off ha-icon { color: #3dff6b !important; }
      ${T} .tile.off.holdoff { justify-content: center; gap: 12px; position: relative; overflow: hidden; }
      ${T} .tile.off.holdoff::before { content: "" !important; margin: 0 !important; }
      ${T} .holdoff .hring { display: none; }
      ${T} .holdoff.holding { background: #021a05 !important; }
      ${T} .tile.holdoff.holding::after, ${T} .tile.locked.holding::after, ${T} .actbtn.holding::after { content: ""; position: absolute; inset: 0; right: auto; width: calc(var(--p, 0) * 1%); transform: none; animation: none; border-radius: 0;
        background: repeating-linear-gradient(90deg, rgba(61,255,107,.55) 0 8px, transparent 8px 11px); box-shadow: 0 0 10px rgba(61,255,107,.5); }
      ${T} .tile.locked.holding::after, ${T} .actbtn.holding::after { width: 100%; transition: clip-path .7s linear; clip-path: inset(0 0 0 0); }
      ${T} .holdoff.fired { background: #3dff6b !important; color: #021a05; transform: scaleY(.14); transition: transform .35s ease-in; box-shadow: 0 0 22px 6px rgba(184,255,201,.8); }
      ${T} .holdoff.fired ha-icon, ${T} .holdoff.fired span { opacity: 0; }
      @keyframes skroll { from { transform: translateY(-120px); } to { transform: translateY(1400px); } }
      @keyframes sksnow { 0% { background-position: 0 0; } 33% { background-position: -40px 25px; } 66% { background-position: 30px -50px; } 100% { background-position: 0 0; } }
      @keyframes skflick { 0%, 92%, 100% { filter: none; transform: none; } 93% { filter: brightness(1.25); transform: translateX(2px); } 94% { filter: brightness(.8); transform: translateX(-3px) skewX(1deg); } 95% { filter: none; transform: none; } }
      @keyframes sktear { 0%, 70%, 100% { opacity: 0; } 71% { opacity: 1; top: 30%; } 73% { opacity: 1; top: 62%; } 75% { opacity: 0; } }

      /* Radio: wood and brass, glass pilot lamps, a magic eye, wire grille, toggle switches */
      ${R} { font-family: Georgia, "Times New Roman", serif; border-radius: 22px;
        background-image: repeating-linear-gradient(92deg, rgba(0,0,0,.10) 0 2px, rgba(255,255,255,.03) 2px 5px), linear-gradient(180deg, #6b4226, #3d2412);
        box-shadow: inset 0 0 0 6px #2a170a, inset 0 0 0 8px #c8a24a, 0 6px 18px rgba(0,0,0,.5); padding: 22px; }
      ${R} .skin-head { display: flex; align-items: center; gap: 16px; padding: 4px 6px 0; }
      ${R} .skin-dial { flex: 1; height: 44px; border-radius: 8px; border: 2px solid #c8a24a; position: relative; overflow: hidden;
        background: linear-gradient(180deg, #2a1a10, #120a05); box-shadow: inset 0 0 12px rgba(0,0,0,.8); }
      ${R} .skin-dial::before { content: ""; position: absolute; inset: 0;
        background: repeating-linear-gradient(90deg, rgba(241,227,193,.55) 0 1px, transparent 1px 12px), repeating-linear-gradient(90deg, rgba(241,227,193,.9) 0 1px, transparent 1px 60px); background-size: 100% 10px, 100% 18px; background-repeat: no-repeat; background-position: 0 0, 0 0; }
      ${R} .skin-dial b { position: absolute; top: 20px; left: 12px; font: 600 11px Georgia, serif; letter-spacing: .2em; color: #ffcf70; text-shadow: 0 0 6px rgba(255,150,30,.8); text-transform: uppercase; }
      ${R} .skin-dial i { position: absolute; top: 0; bottom: 0; left: var(--needle, 40%); width: 2px; background: #ff7a1a; box-shadow: 0 0 8px 2px rgba(255,120,20,.8); transition: left .8s; }
      ${R} .skin-eye { position: relative; flex: none; width: 54px; height: 54px; border-radius: 50%; border: 3px solid #c8a24a;
        box-shadow: 0 0 0 3px #2a170a, 0 0 14px rgba(120,255,120,.55); filter: drop-shadow(0 0 6px rgba(120,255,120,.6));
        --w: calc((1 - var(--eye, .5)) * 150deg);
        background: radial-gradient(circle at 50% 50%, #0c1f0c 0 15%, transparent 16%), conic-gradient(from 0deg, #6dff6d 0 calc(180deg - var(--w) / 2), #0f3a14 0 calc(180deg + var(--w) / 2), #6dff6d 0), radial-gradient(circle, #0a1a0a, #041004); }
      ${R} .skin-eye::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(ellipse at 35% 22%, rgba(255,255,255,.55), transparent 38%); }
      /* every tile is a pilot lamp under a wire grille: unlit = dark amber glass, lit (running / selected) = glowing */
      ${R} .tile { position: relative; border: 3px solid #b9b19a; color: #e2c58a; text-shadow: 0 1px 0 rgba(0,0,0,.8);
        background: radial-gradient(ellipse at 50% 16%, rgba(255,255,255,.38) 0 6%, rgba(255,255,255,0) 28%), radial-gradient(circle at 50% 58%, #7a4414 0, #43230a 55%, #1d0f05 100%);
        box-shadow: inset 0 0 14px rgba(0,0,0,.8), inset 0 -6px 10px rgba(0,0,0,.5), 0 3px 6px rgba(0,0,0,.6); }
      ${R} .tile:not(.locked):not(.edit-tile)::after { content: ""; position: absolute; inset: 3px; border-radius: inherit; pointer-events: none; opacity: .55;
        background: repeating-linear-gradient(0deg, rgba(0,0,0,.65) 0 1.5px, transparent 1.5px 10px), repeating-linear-gradient(90deg, rgba(0,0,0,.65) 0 1.5px, transparent 1.5px 10px); }
      ${R} .tile ha-icon { color: inherit; }
      ${R} .tile.on, ${R} .tile.dev.sel, ${R} .actbtn.acton { position: relative; color: #3a1802; border: 3px solid #d9d2bc; text-shadow: 0 1px 0 rgba(255,220,150,.7); outline: none;
        background: radial-gradient(ellipse at 50% 18%, rgba(255,255,255,.75) 0 7%, rgba(255,255,255,0) 30%), radial-gradient(ellipse at 50% 120%, rgba(255,240,170,.9), rgba(255,240,170,0) 55%), radial-gradient(circle at 50% 55%, #ffb347 0, #ff8a12 45%, #a8480a 85%, #5a2403 100%);
        box-shadow: 0 0 22px 4px rgba(255,150,30,.65), inset 0 0 14px rgba(255,200,90,.7), inset 0 -6px 12px rgba(120,40,0,.55); }
      ${R} .tile.on ha-icon, ${R} .tile.dev.sel ha-icon, ${R} .tile.on small, ${R} .tile.dev.sel small, ${R} .actbtn.acton * { color: #3a1802; filter: none; }
      ${R} .tile.on::after, ${R} .tile.dev.sel::after { opacity: .4; }
      ${R} .status.chip { box-shadow: 0 0 10px rgba(255,184,74,.55); }
      ${R} .status.chip.active::before { content: ""; flex: none; width: 14px; height: 14px; border-radius: 50%; margin-right: 6px;
        background: radial-gradient(circle at 35% 30%, #fff 0 12%, rgba(255,255,255,0) 35%), radial-gradient(circle at 50% 55%, #ffcf70, #ff8a12 60%, #7a3a05); box-shadow: 0 0 10px 2px rgba(255,150,30,.9); }
      ${R} .key, ${R} .rocker { border: 2px solid #c8a24a; background: linear-gradient(180deg, #efe3c4, #c9b78d); color: #2a170a; box-shadow: 0 4px 0 #6b4a1a, 0 6px 8px rgba(0,0,0,.5); }
      ${R} .key ha-icon, ${R} .rocker ha-icon { color: #2a170a !important; }
      ${R} .rocker .rk { background: transparent !important; box-shadow: none !important; border: none !important; }
      ${R} .key.mute.round, ${R} .key.mute { background: linear-gradient(180deg, #efe3c4, #c9b78d) !important; color: #2a170a !important; }
      ${R} .key.color { border-color: #2a170a; }
      ${R} .dpad { background: radial-gradient(circle at 40% 35%, #3a2a1c, #150c06); border: 3px solid #c8a24a; box-shadow: 0 0 0 4px #2a170a, 0 4px 10px rgba(0,0,0,.6); }
      /* toggle switch, horizontal: brass nut, chrome lever pointing right = ON (AN, nut glows) or left = OFF (AUS) */
      ${R} .sw:has(> input) { position: relative; width: 82px; height: 36px; margin-left: 6px; flex: none; }
      ${R} .sw:has(> input) i { background: none; border: none; box-shadow: none; }
      ${R} .sw:has(> input) i::before { content: ""; position: absolute; top: 7px; left: 30px; width: 22px; height: 22px; border-radius: 50%; inset: auto; bottom: auto; right: auto; top: 7px; left: 30px;
        background: radial-gradient(circle at 40% 35%, #f6e2a2, #a98530 70%, #5c4210); box-shadow: 0 3px 5px rgba(0,0,0,.7); }
      ${R} .sw:has(> input) input:checked + i::before { box-shadow: 0 3px 5px rgba(0,0,0,.7), 0 0 12px 3px rgba(255,150,30,.7); }
      ${R} .sw:has(> input) i::after { content: ""; position: absolute; height: 10px; width: 24px; top: 13px; left: 6px; border-radius: 5px; transform: none; background: linear-gradient(180deg, #666, #f7f7f7 50%, #666); box-shadow: 0 3px 4px rgba(0,0,0,.6); }
      ${R} .sw:has(> input) input:checked + i::after { left: 52px; transform: none; box-shadow: 0 3px 4px rgba(0,0,0,.6); }
      ${R} .sw:has(> input)::before { content: "AUS"; position: absolute; left: 0; top: 50%; margin-top: -6px; width: 26px; text-align: center; font: 700 9px Georgia, serif; color: #c8a24a; letter-spacing: .08em; }
      ${R} .sw:has(> input)::after { content: "AN"; position: absolute; right: 0; top: 50%; margin-top: -6px; width: 24px; text-align: center; font: 700 9px Georgia, serif; color: #c8a24a; letter-spacing: .08em; }
      /* the Activities / Devices switch: a bakelite rocker plate sliding over */
      ${R} .seg { background: linear-gradient(#120804, #2b150a); border: 3px solid #b9b19a; border-radius: 16px; box-shadow: inset 0 3px 8px #000, 0 2px 0 #5a3a1a; padding: 5px; }
      ${R} .seg .th { border: 1px solid #6b5420; border-radius: 11px; box-shadow: 0 4px 0 #6b5420, 0 6px 8px rgba(0,0,0,.6), inset 0 1px 0 #fff;
        background: repeating-linear-gradient(90deg, transparent 0 6px, rgba(90,60,10,.25) 6px 7px), linear-gradient(180deg, #fff7df, #e0cf9f 55%, #b79e5e); }
      ${R} .seg .lab { color: #c8a24a; text-shadow: 0 1px 0 #000; letter-spacing: .08em; } ${R} .seg .lab.a { color: #3a1802; text-shadow: 0 1px 0 rgba(255,255,255,.7); }
      /* volume slider: a wedge from small to big with a brass knob */
      ${R} .volslider.h { -webkit-appearance: none; appearance: none; height: 34px; min-height: 34px; background: transparent; }
      ${R} .volslider.h::-webkit-slider-runnable-track { height: 22px; clip-path: polygon(0 88%, 100% 0, 100% 100%, 0 100%); box-shadow: inset 0 2px 4px #000;
        background: linear-gradient(90deg, #ff9a1f, #ffd27a calc(var(--v, 0) * 1%), #2a1408 calc(var(--v, 0) * 1%)); }
      ${R} .volslider.h::-moz-range-track { height: 22px; clip-path: polygon(0 88%, 100% 0, 100% 100%, 0 100%); background: #2a1408; }
      ${R} .volslider.h::-moz-range-progress { height: 22px; clip-path: polygon(0 88%, 100% 0, 100% 100%, 0 100%); background: linear-gradient(90deg, #ff9a1f, #ffd27a); }
      ${R} .volslider.h::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; margin-top: -4px; border-radius: 50%; border: 2px solid #2a170a; background: radial-gradient(circle at 38% 32%, #fff3c4, #c9a23c 55%, #5c4210); box-shadow: 0 3px 5px rgba(0,0,0,.7); }
      ${R} .volslider.h::-moz-range-thumb { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #2a170a; background: radial-gradient(circle at 38% 32%, #fff3c4, #c9a23c 55%, #5c4210); }
      ${R} .volslider.v { -webkit-appearance: none; appearance: none; width: 30px; background: transparent; }
      ${R} .volslider.v::-webkit-slider-runnable-track { width: 12px; border-radius: 6px; box-shadow: inset 0 2px 4px #000; background: linear-gradient(0deg, #ff9a1f, #ffd27a calc(var(--v, 0) * 1%), #2a1408 calc(var(--v, 0) * 1%)); }
      ${R} .volslider.v::-moz-range-track { width: 12px; border-radius: 6px; background: #2a1408; } ${R} .volslider.v::-moz-range-progress { width: 12px; background: #ff9a1f; }
      ${R} .volslider.v::-webkit-slider-thumb { -webkit-appearance: none; width: 30px; height: 30px; margin-left: -9px; border-radius: 50%; border: 2px solid #2a170a; background: radial-gradient(circle at 38% 32%, #fff3c4, #c9a23c 55%, #5c4210); box-shadow: 0 3px 5px rgba(0,0,0,.7); }
      ${R} .volslider.v::-moz-range-thumb { width: 26px; height: 26px; border-radius: 50%; border: 2px solid #2a170a; background: radial-gradient(circle at 38% 32%, #fff3c4, #c9a23c 55%, #5c4210); }
      /* round typewriter keys on the keyboard */
      ${R} .kbrow .key, ${R} .kbarr .key, ${R} .kbud .key { border-radius: 999px; border: 3px solid #8f8f8f; background: radial-gradient(circle at 35% 28%, #fffaf0, #d9cba5 70%); box-shadow: 0 0 0 2px #2a170a, 0 4px 0 #3b2a14, 0 6px 8px rgba(0,0,0,.5); min-height: 38px; }
      ${R} .key.pwronoff { display: none; } ${R} .swpwr { padding: 6px 4px; }
      /* readable text on the light brass-cream surfaces: buttons of the editors, favourites and the small buttons */
      ${R} .mini, ${R} .editdone, ${R} button.txt, ${R} .egrp button:not(.tile):not(.key):not(.sel) { color: #2a170a; }
      ${R} .mini:not(.txt) ha-icon, ${R} .mini.txt ha-icon { color: inherit; }
      ${R} .key.isfav, ${R} .editmark { color: #2a170a; }
      ${R} .mini.ic, ${R} .mini.txt { background: linear-gradient(180deg, #efe3c4, #c9b78d); color: #2a170a; border: 2px solid #c8a24a; box-shadow: 0 3px 0 #6b4a1a; text-shadow: none; }
      ${R} .mini.txt.sel { background: linear-gradient(180deg, #ffd27a, #ff9a1f); color: #3a1802; }
      ${R} .infoedit, ${R} .infoedit * { color: #2a170a; text-shadow: none; }
      /* hold to switch off: the lamp heats up from dark through orange to red, then goes out with a faint afterglow */
      ${R} .holdoff .hring { display: none; }
      ${R} .tile.holdoff.holding { border-color: #d9d2bc; color: #fff3e0;
        background: radial-gradient(ellipse at 50% 16%, rgba(255,255,255,.5) 0 6%, rgba(255,255,255,0) 28%), radial-gradient(circle at 50% 58%, rgba(255,70,20,calc(var(--p, 0) / 110)) 0, rgba(180,40,10,calc(var(--p, 0) / 130)) 55%, #1d0f05 100%) !important;
        box-shadow: 0 0 calc(var(--p, 0) * .3px) calc(var(--p, 0) * .06px) rgba(255,70,20,.85), inset 0 0 14px rgba(0,0,0,.6) !important; }
      ${R} .tile.holdoff.holding ha-icon { color: #fff3e0 !important; filter: drop-shadow(0 0 6px #ff6a2a); }
      ${R} .tile.holdoff.fired { background: radial-gradient(circle at 50% 58%, #3a1208, #120804) !important; border-color: #8a8472; box-shadow: 0 0 10px 1px rgba(255,120,60,.35), inset 0 0 14px #000 !important; color: #6b4a2a; }
      ${R} .tile.holdoff.fired ha-icon { color: #6b4a2a !important; filter: none; }
      @media (prefers-reduced-motion: reduce) { ${T}, ${T}::before, ${T}::after, ${T} .skin-tear, ${R} .skin-dial i { animation: none !important; transition: none !important; } }
`;
