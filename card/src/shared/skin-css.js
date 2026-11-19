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
      ${T} .tile.on { background: #3dff6b; color: #021a05; text-shadow: none; }
      ${T} .tile.on:not(.dev)::before { content: "\\25B6"; color: #021a05; }
      ${T} .tile.on ha-icon, ${T} .tile.on span { color: #021a05; filter: none; text-shadow: none; }
      ${T} .sw i { border-radius: 0; background: #021a05; border: 1px solid #1fa63f; }
      ${T} .sw i::after { border-radius: 0; width: 20px; height: 20px; top: 3px; background: #1fa63f; }
      ${T} .sw input:checked + i { background: rgba(61,255,107,.2); }
      ${T} .sw input:checked + i::after { transform: translateX(20px); background: #3dff6b; box-shadow: 0 0 8px #3dff6b; }
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
      ${R} .tile { border: 2px solid #c8a24a; background: radial-gradient(circle at 30% 25%, #4a3322, #1f1209); box-shadow: inset 0 2px 4px rgba(255,255,255,.12), 0 3px 6px rgba(0,0,0,.6); }
      ${R} .tile.on { position: relative; color: #3a1802; border: 3px solid #d9d2bc; text-shadow: 0 1px 0 rgba(255,220,150,.7);
        background: radial-gradient(ellipse at 50% 18%, rgba(255,255,255,.75) 0 7%, rgba(255,255,255,0) 30%), radial-gradient(ellipse at 50% 120%, rgba(255,240,170,.9), rgba(255,240,170,0) 55%), radial-gradient(circle at 50% 55%, #ffb347 0, #ff8a12 45%, #a8480a 85%, #5a2403 100%);
        box-shadow: 0 0 22px 4px rgba(255,150,30,.65), inset 0 0 14px rgba(255,200,90,.7), inset 0 -6px 12px rgba(120,40,0,.55); }
      ${R} .tile.on ha-icon { color: #3a1802; filter: none; }
      ${R} .tile.on::after { content: ""; position: absolute; inset: 3px; border-radius: inherit; pointer-events: none; opacity: .5;
        background: repeating-linear-gradient(0deg, rgba(60,40,10,.5) 0 1px, transparent 1px 10px), repeating-linear-gradient(90deg, rgba(60,40,10,.5) 0 1px, transparent 1px 10px); }
      ${R} .status.chip { box-shadow: 0 0 10px rgba(255,184,74,.55); }
      ${R} .status.chip.active::before { content: ""; flex: none; width: 14px; height: 14px; border-radius: 50%; margin-right: 6px;
        background: radial-gradient(circle at 35% 30%, #fff 0 12%, rgba(255,255,255,0) 35%), radial-gradient(circle at 50% 55%, #ffcf70, #ff8a12 60%, #7a3a05); box-shadow: 0 0 10px 2px rgba(255,150,30,.9); }
      ${R} .key, ${R} .rocker { border: 2px solid #c8a24a; background: linear-gradient(180deg, #efe3c4, #c9b78d); color: #2a170a; box-shadow: 0 4px 0 #6b4a1a, 0 6px 8px rgba(0,0,0,.5); }
      ${R} .key ha-icon, ${R} .rocker ha-icon { color: #2a170a !important; }
      ${R} .rocker .rk { background: transparent !important; box-shadow: none !important; border: none !important; }
      ${R} .key.mute.round, ${R} .key.mute { background: linear-gradient(180deg, #efe3c4, #c9b78d) !important; color: #2a170a !important; }
      ${R} .key.color { border-color: #2a170a; }
      ${R} .dpad { background: radial-gradient(circle at 40% 35%, #3a2a1c, #150c06); border: 3px solid #c8a24a; box-shadow: 0 0 0 4px #2a170a, 0 4px 10px rgba(0,0,0,.6); }
      /* toggle switch: brass plate, lever up = ON (the plate glows), lever down = OFF */
      ${R} .sw { width: 40px; height: 52px; margin-left: 6px; }
      ${R} .sw i { border-radius: 10px; background: linear-gradient(180deg, #e6c869, #a98530); border: 2px solid #5c4210; box-shadow: inset 0 2px 3px rgba(255,255,255,.5), 0 3px 5px rgba(0,0,0,.6); }
      ${R} .sw i::before { content: "AUS"; position: absolute; left: 0; right: 0; bottom: 2px; text-align: center; font: 700 8px Georgia, serif; color: #3a2808; letter-spacing: .06em; }
      ${R} .sw input:checked + i::before { content: "AN"; top: 2px; bottom: auto; }
      ${R} .sw i::after { width: 12px; height: 24px; left: 11px; top: 14px; border-radius: 6px; background: linear-gradient(90deg, #777, #fafafa 50%, #777); box-shadow: 0 3px 4px rgba(0,0,0,.6); transform: translateY(8px); }
      ${R} .sw input:checked + i::after { transform: translateY(-8px); box-shadow: 0 -3px 4px rgba(0,0,0,.5); background: linear-gradient(90deg, #777, #fafafa 50%, #777); }
      ${R} .sw input:checked + i { box-shadow: inset 0 2px 3px rgba(255,255,255,.5), 0 0 12px rgba(255,150,30,.6); }
      ${R} .key.pwronoff { display: none; } ${R} .swpwr { padding: 6px 4px; }
      /* readable text on the light brass-cream surfaces: buttons of the editors, favourites and the small buttons */
      ${R} .mini, ${R} .editdone, ${R} button.txt, ${R} .egrp button:not(.tile):not(.key):not(.sel) { color: #2a170a; }
      ${R} .mini:not(.txt) ha-icon, ${R} .mini.txt ha-icon { color: inherit; }
      ${R} .key.isfav, ${R} .editmark { color: #2a170a; }
      @media (prefers-reduced-motion: reduce) { ${T}, ${T}::before, ${T}::after, ${T} .skin-tear, ${R} .skin-dial i { animation: none !important; transition: none !important; } }
`;
