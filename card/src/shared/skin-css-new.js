// Skins of 0.17: "thermal" (heat vision), "nixie" (number tubes, toggle switches), "nostromo" (amber ship computer),
// plus the pressed-brass fix for active direct keys in the tube radio. Same rules as skin-css.js: effects stay inside
// the card, pointer-events none, motion stops with "reduce motion".

const W = 'ha-card[data-skin="thermal"]';
const X = 'ha-card[data-skin="nixie"]';
const N = 'ha-card[data-skin="nostromo"]';
const R = 'ha-card[data-skin="radio"]';
const T = 'ha-card[data-skin="terminal"]';
// three dots in a triangle (bottom left, bottom right, top) as one background, n = how many are lit
const tri = (n) => [["8px 21px", 1], ["22px 21px", 2], ["15px 9px", 3]].map(([p, i]) => `radial-gradient(circle at ${p}, ${i <= n ? "#ff2a1a 0 3.4px, rgba(255,42,26,.45) 4px 7px" : "#2a1a50 0 3.4px"}, transparent 7.5px)`).join(",");

export const SKIN_CSS_NEW = `
      /* ---------- Wärmebild: violet-blue night, heat colours, segment letters ---------- */
      ${W} { font-family: "Bahnschrift", "DIN Alternate", "Arial Narrow", Arial, sans-serif; letter-spacing: .04em; position: relative; overflow: hidden; border-radius: 10px 26px 10px 26px;
        background-color: #0a0724; background-image: radial-gradient(ellipse 70% 45% at 20% 22%, rgba(255,40,20,.85), rgba(255,210,20,.75) 30%, rgba(25,210,110,.6) 55%, rgba(25,90,255,.45) 78%, transparent 100%), radial-gradient(ellipse 60% 40% at 85% 62%, rgba(255,150,20,.7), rgba(40,220,120,.55) 50%, rgba(30,70,230,.45) 80%, transparent 100%), radial-gradient(ellipse 60% 30% at 30% 92%, rgba(255,60,40,.55), rgba(255,200,30,.4) 45%, transparent 100%); --hr-fire: #ff3a2a; --hr-danger: #ff3a2a; }
      ${W} .segtxt { max-width: 100%; height: auto; vertical-align: middle; filter: drop-shadow(0 0 4px currentColor); }
      ${W} .esub, ${W} .etitle, ${W} .sub, ${W} .blabel, ${W} .dname, ${W} .rooms-lab { color: #ff3a2a; text-transform: uppercase; }
      ${W} .tile, ${W} .key, ${W} .rocker, ${W} .seg, ${W} button { background-image: none; border: 1px solid #2f8f9a; box-shadow: none; }
      ${W} .tile { background: linear-gradient(135deg, rgba(13,10,58,.82), rgba(10,7,36,.86)); color: #6fd0c0; clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); position: relative; }
      ${W} .tile ha-icon, ${W} .tile.dev ha-icon { color: #6fd0c0 !important; }
      ${W} .tile:not(.off) ha-icon { display: none; }
      ${W} .tile.dev.inuse { border-color: #ffa060; color: #ffa060; box-shadow: inset 0 0 14px rgba(255,150,60,.55); }
      ${W} .tile.dev.inuse * { color: #ffa060 !important; }
      ${W} .tile.dev.sel { border-color: #fff; box-shadow: inset 0 0 0 1px #fff; }
      ${W} .tile.on, ${W} .tile.going { border-color: #ff3a2a; color: #ff3a2a; background: linear-gradient(135deg, rgba(120,12,12,.85), rgba(40,6,20,.9)); box-shadow: inset 0 0 18px rgba(255,42,26,.55); }
      ${W} .tile.on *, ${W} .tile.going * { color: #ff3a2a !important; }
      ${W} .tile.on::before { content: ""; position: absolute; left: 8px; top: 6px; width: 28px; height: 26px; background: ${tri(3)}; background-size: 28px 26px; background-repeat: no-repeat; pointer-events: none; transform: scale(.55); transform-origin: 0 0; }
      ${W} .key { background: #0d0a3a; border-color: #5b3fd0; border-radius: 0; clip-path: polygon(7px 0, 100% 0, calc(100% - 7px) 100%, 0 100%); color: #6fd0c0; }
      ${W} .key ha-icon { color: #6fd0c0 !important; }
      /* keys that carry a text label show only the segment text; icon-only keys (arrows, volume, transport) keep the icon */
      ${W} .key:has(span[data-segtxt]) ha-icon { display: none; }
      ${W} .key.sel:not(.mute), ${W} .key.on:not(.mute), ${W} .key.muted, ${W} .appcell.svc.on, ${W} .ic-row.on { background: linear-gradient(90deg, #ffe85a, #ff7a1c) !important; border-color: #ffe36a; color: #2a0600 !important; }
      ${W} .key.sel *, ${W} .key.on *, ${W} .key.muted *, ${W} .appcell.svc.on *, ${W} .ic-row.on * { color: #2a0600 !important; text-shadow: none; }
      /* press feedback: a pressed key lights up white-yellow and then cools down slowly (yellow, orange, red, gone), like residual heat */
      ${W} .key, ${W} .mini, ${W} .tile { position: relative; isolation: isolate; }
      ${W} .key::after, ${W} .mini::after, ${W} .tile::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; background-color: rgba(255,42,26,0); transition: background-color 1.8s ease-out, box-shadow 1.8s ease-out; box-shadow: 0 0 0 0 rgba(255,60,20,0); }
      ${W} .key.lit::after, ${W} .key:active::after, ${W} .mini.lit::after, ${W} .mini:active::after, ${W} .tile.lit::after, ${W} .tile:active::after { background-color: #ffe85a; box-shadow: 0 0 16px 3px rgba(255,122,28,.8); transition: background-color .05s, box-shadow .05s; }
      ${W} .key.lit, ${W} .key:active, ${W} .mini.lit, ${W} .mini:active, ${W} .tile.lit, ${W} .tile:active { border-color: #ffe36a; }
      ${W} .key *, ${W} .mini *, ${W} .tile * { transition: color 1.8s ease-out; }
      ${W} .key.lit *, ${W} .key:active *, ${W} .mini.lit *, ${W} .mini:active *, ${W} .tile.lit *, ${W} .tile:active * { color: #2a0600 !important; transition: color .05s; }
      ${W} .appcell.svc { --c: #0a0724 !important; --fg: #6fd0c0 !important; }
      ${W} .tile.holdoff { background: #0b0830; border-color: #5a4ad0; color: #8fa6ff; position: relative; overflow: hidden; }
      ${W} .tile.holdoff::before { content: ""; position: absolute; left: 50%; top: 50%; width: 28px; height: 26px; margin: -13px 0 0 -40px; background: ${tri(0)}; background-size: 28px 26px; background-repeat: no-repeat; transform: scale(.8); display: block; }
      ${W} .tile.holdoff.holding::before { animation: thlock .7s steps(1) forwards; }
      ${W} .tile.holdoff.holding { animation: none; } ${W} .holdoff .hring { display: none; }
      ${W} .holdoff.fired { background: radial-gradient(circle, #fff, #ffd24a 60%, #ff7a1c) !important; color: #2a0600; transition: background .3s; } ${W} .holdoff.fired * { color: #2a0600 !important; }
      ${W} .seg { background: #0a0724; border: 1px solid #5b3fd0; border-radius: 0; clip-path: polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%); }
      ${W} .seg .th { border-radius: 0; background: linear-gradient(90deg, #ffe85a, #ff4a12); box-shadow: 0 0 10px #ff7a1c; } ${W} .seg .lab { color: #6fd0c0; } ${W} .seg .lab.a { color: #2a0600; }
      ${W} .volslider.h { -webkit-appearance: none; appearance: none; height: 22px; border: 1px solid #5b3fd0; border-radius: 0; background: linear-gradient(90deg, #1a1a8a, #1f7ab0, #1fb07a, #9ad21c, #ffe85a, #ff7a1c, #ff2a1a); }
      ${W} .volslider.h::-webkit-slider-runnable-track { height: 22px; background: transparent; } ${W} .volslider.h::-moz-range-track { height: 22px; background: transparent; }
      ${W} .volslider.h::-webkit-slider-thumb { -webkit-appearance: none; width: 4px; height: 28px; border-radius: 0; background: #fff; box-shadow: 0 0 8px #fff; border: none; margin-top: -3px; }
      ${W} .volslider.h::-moz-range-thumb { width: 4px; height: 28px; border-radius: 0; background: #fff; border: none; }
      ${W} .sw:has(> input) i { border-radius: 0; background: #0a0724; border: 1px solid #ffe36a; box-shadow: none; }
      ${W} .sw:has(> input) i::after { border-radius: 0; background: #4a3a90; box-shadow: none; }
      ${W} .sw:has(> input) input:checked + i::after { background: linear-gradient(90deg, #ffe85a, #ff4a12); box-shadow: 0 0 10px #ff7a1c; }
      ${W} .hmenu { background: #0a0724; border: 1px solid #5b3fd0; border-radius: 0; }
      ${W} select, ${W} .profchip { background-color: #0a0724; border: 1px solid #5b3fd0; border-radius: 0; color: #6fd0c0; }
      ${W} .hubtabs button.sel { background: linear-gradient(90deg, #6a1fb0, #ff3a2a); color: #fff; border-color: transparent; } ${W} .hubtabs button { color: #6fd0c0; }
      /* settings: every field follows the skin (closed dropdown, its list where the browser allows, text fields, labels) */
      ${W} input[type="text"], ${W} input[type="search"], ${W} input[type="number"], ${W} textarea { background: #0a0724; color: #6fd0c0; border: 1px solid #5b3fd0; border-radius: 0; } ${W} select option { background: #0a0724; color: #6fd0c0; }
      ${X} input[type="text"], ${X} input[type="search"], ${X} input[type="number"], ${X} textarea { background: #120a08; color: #f0d9a8; border: 1px solid #8a6a2a; border-radius: 10px; } ${X} select option { background: #120a08; color: #f0d9a8; }
      ${N} input[type="text"], ${N} input[type="search"], ${N} input[type="number"], ${N} textarea { background: #0d0700; color: #ffb000; border: 1px solid #7a5200; border-radius: 0; font-family: inherit; } ${N} select option { background: #120a00; color: #ffb000; }
      ${R} input[type="text"], ${R} input[type="search"], ${R} input[type="number"], ${R} textarea { background: #2a1a10; color: #f1e3c1; border: 1px solid #c8a24a; } ${R} select option { background: #2a1a10; color: #f1e3c1; }
      ${W} .editbox, ${W} .egrp, ${W} .erow { color: #6fd0c0; } ${X} .editbox, ${X} .egrp, ${X} .erow { color: #f0d9a8; } ${N} .editbox, ${N} .egrp, ${N} .erow { color: #ffb000; }
      ${W} .etabs button.sel, ${W} .editbox .sel { background: linear-gradient(90deg, #ffe85a, #ff7a1c); color: #2a0600; } ${N} .etabs button.sel { background: #ffb000; color: #1a0f00; } ${X} .etabs button.sel { background: #ff9a3a; color: #1a0e06; }
      @keyframes thlock { 0% { background: ${tri(0)}; } 33% { background: ${tri(1)}; } 66% { background: ${tri(2)}; } 100% { background: ${tri(3)}; } }

      /* small badges (Fire TV dot at the room icon, hint count at the gear) in the skin's own colours */
      ${W} .fdot { border-radius: 0; clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%); background: #1a0a30; color: #ffe85a; box-shadow: 0 0 0 1px #ff7a1c, 0 0 8px 1px rgba(255,122,28,.8); width: 18px; height: 16px; }
      ${W} .fdot ha-icon { filter: drop-shadow(0 0 3px #ff7a1c); }
      ${W} .ib.gear .gbadge { border-radius: 0; clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%); background: linear-gradient(90deg, #ffe85a, #ff4a12); color: #2a0600; box-shadow: 0 0 8px 1px rgba(255,122,28,.8); }
      ${N} .fdot { border-radius: 0; background: #120a00; color: #ffb000; box-shadow: 0 0 0 1px #ffb000; } ${N} .ib.gear .gbadge { border-radius: 0; background: #ffb000; color: #1a0f00; }
      ${T} .fdot { border-radius: 0; background: #021a05; color: #3dff6b; box-shadow: 0 0 0 1px #3dff6b; } ${T} .ib.gear .gbadge { border-radius: 0; background: #3dff6b; color: #021a05; text-shadow: none; }
      ${R} .fdot, ${X} .fdot { background: radial-gradient(circle at 38% 32%, #fff3c4, #c9a23c 60%, #5c4210); color: #2a170a; box-shadow: 0 0 0 1px #2a170a, 0 0 6px rgba(255,150,30,.6); } ${R} .fdot ha-icon, ${X} .fdot ha-icon { filter: none; }
      ${R} .ib.gear .gbadge, ${X} .ib.gear .gbadge { background: radial-gradient(circle at 38% 32%, #fff3c4, #ffb84a 60%, #a8480a); color: #2a170a; box-shadow: 0 0 0 1px #2a170a; }
      /* ---------- Nixie: number tubes and brass toggle switches ---------- */
      ${X} { counter-reset: nx; border: 6px solid #5a3a1c; border-radius: 22px; box-shadow: inset 0 0 40px rgba(0,0,0,.55); background-image: repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 2px, transparent 2px 7px); font-family: Georgia, "Times New Roman", serif; }
      ${X} .grid { counter-reset: nx; }
      ${X} .tile { background: linear-gradient(180deg, #120a08, #050302), repeating-linear-gradient(0deg, rgba(255,150,40,.05) 0 1px, transparent 1px 4px); border: 2px solid #8a8a8a; border-radius: 40px 40px 10px 10px !important; box-shadow: inset 0 0 14px #000, 0 3px 6px rgba(0,0,0,.6); min-height: 84px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; counter-increment: nx; color: #5a3a1c; }
      ${X} .tile:not(.off)::before { content: counter(nx); font: 600 30px Georgia, serif; color: #6a3a10; text-shadow: none; }
      ${X} .tile ha-icon { display: none; } ${X} .tile.off ha-icon { display: inline-block; }
      ${X} .tile span, ${X} .tile small { font-size: 11px; color: #a8743a; }
      ${X} .tile.on, ${X} .tile.dev.sel, ${X} .tile.dev.inuse { border-color: #ffb050; box-shadow: inset 0 0 18px rgba(255,150,40,.35), 0 0 12px rgba(255,150,40,.45); }
      ${X} .tile.on::before, ${X} .tile.dev.sel::before, ${X} .tile.dev.inuse::before { color: #ff9a3a; text-shadow: 0 0 8px #ff7a1a, 0 0 16px rgba(255,110,20,.7); }
      ${X} .tile.on span, ${X} .tile.dev.sel span, ${X} .tile.dev.inuse span { color: #ffd9a0; }
      ${X} .key, ${X} .rocker { border: 2px solid #c8a24a; background: linear-gradient(180deg, #efe3c4, #c9b78d); color: #2a170a; box-shadow: 0 4px 0 #6b4a1a, 0 6px 8px rgba(0,0,0,.5); transition: transform .12s ease, box-shadow .12s ease; }
      ${X} .key ha-icon, ${X} .rocker ha-icon { color: #2a170a !important; }
      ${X} .key.sel:not(.mute), ${X} .key.on:not(.mute), ${X} .key.muted, ${X} .ic-row.on, ${X} .appcell.svc.on, ${X} .key.lit, ${X} .key:active { transform: translateY(3px); background: linear-gradient(180deg, #e3d5b0, #bba97f) !important; border-color: #8a6a2a; box-shadow: inset 0 3px 6px rgba(0,0,0,.45), 0 1px 0 #6b4a1a, 0 0 0 2px rgba(255,184,74,.5); }
      ${X} .appcell.svc { --c: #120a08 !important; --fg: #ffb84a !important; }
      ${X} .volslider.h { -webkit-appearance: none; appearance: none; height: 20px; border: 2px solid #8a8a8a; border-radius: 10px; background: #0d0704; }
      ${X} .volslider.h::-webkit-slider-runnable-track { height: 20px; background: transparent; } ${X} .volslider.h::-moz-range-track { height: 20px; background: transparent; }
      ${X} .volslider.h::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 26px; border-radius: 6px; background: linear-gradient(90deg, #ffb050, #ff7a1c); box-shadow: 0 0 12px #ff7a1c; border: none; margin-top: -4px; }
      ${X} .volslider.h::-moz-range-thumb { width: 12px; height: 26px; border-radius: 6px; background: #ff9a3a; border: none; }
      /* toggle switch: brass hex nut with a chrome lever that is wide at the tip, plus a lamp that is always visible */
      ${X} .sw:has(> input) { width: 64px; height: 46px; margin-left: 6px; flex: none; position: relative; }
      ${X} .sw:has(> input) i { position: absolute; left: 14px; bottom: 0; width: 34px; height: 30px; border: none; border-radius: 0; background: radial-gradient(circle at 40% 35%, #f6e2a2, #a98530 70%, #5c4210); clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%); box-shadow: none; }
      ${X} .sw:has(> input) i::before { content: ""; display: block; position: absolute; inset: 8px; border-radius: 50%; background: radial-gradient(circle at 40% 35%, #3a2a10, #120a04); width: auto; height: auto; top: 8px; left: 8px; }
      ${X} .sw:has(> input) i::after { content: ""; display: block; position: absolute; left: 11px; bottom: 14px; top: auto; width: 12px; height: 32px; background: linear-gradient(90deg, #666, #fafafa 50%, #666); clip-path: polygon(0 0, 100% 0, 72% 100%, 28% 100%); transform-origin: 50% 100%; transform: rotate(-30deg); transition: transform .18s ease; border-radius: 0; box-shadow: none; }
      ${X} .sw:has(> input) input:checked + i::after { transform: rotate(30deg); left: 11px; }
      ${X} .sw:has(> input)::after { content: ""; position: absolute; right: 0; top: 4px; width: 9px; height: 9px; border-radius: 50%; background: #5a0e06; box-shadow: 0 0 4px 1px rgba(150,20,10,.45); transition: background .2s, box-shadow .2s; pointer-events: none; }
      ${X} .sw:has(> input:checked)::after { background: #ff9a3a; box-shadow: 0 0 10px 3px #ff7a1a; }
      ${X} .hmenu { background: #24150c; border: 2px solid #8a6a2a; } ${X} select, ${X} .profchip { background-color: #120a08; border: 1px solid #8a6a2a; color: #f0d9a8; }
      ${X} .holdoff.holding { background: #120a08 !important; }

      /* ---------- Nostromo: amber ship computer, no screen flicker (cursor, typing, afterglow instead) ---------- */
      ${N} { font-family: "Courier New", ui-monospace, monospace; letter-spacing: .03em; border: 3px solid #5a3a00; border-radius: 6px; background-image: radial-gradient(ellipse at center, rgba(255,176,0,.06), transparent 75%); position: relative; overflow: hidden; --hr-fire: #ffb000; --hr-danger: #ffb000; }
      ${N}::after { content: ""; position: absolute; left: 0; right: 0; top: -20%; height: 24px; pointer-events: none; z-index: 6; background: linear-gradient(180deg, transparent, rgba(255,176,0,.035), transparent); animation: nxrefresh 9s linear infinite; }
      ${N} * { text-shadow: 0 0 5px rgba(255,176,0,.45); }
      ${N} ha-icon { color: #ffb000 !important; filter: drop-shadow(0 0 3px rgba(255,176,0,.6)); }
      ${N} .tile, ${N} .key, ${N} .rocker, ${N} button { border: 1px solid #7a5200; border-radius: 0; background-image: none; color: #ffb000; }
      ${N} .key { background: linear-gradient(#2a1b00, #120a00); box-shadow: 0 2px 0 #3a2600, 0 3px 4px #000; transition: transform .1s, box-shadow .1s; }
      ${N} .key.sel:not(.mute), ${N} .key.on:not(.mute), ${N} .key.muted, ${N} .ic-row.on, ${N} .appcell.svc.on, ${N} .key.lit, ${N} .key:active { background: #0d0700 !important; border-color: #ffb000; color: #ffc840; transform: translateY(2px); box-shadow: inset 0 2px 6px #000, 0 0 8px rgba(255,176,0,.5); }
      ${N} .appcell.svc { --c: #120a00 !important; --fg: #ffb000 !important; border: 1px solid #7a5200; }
      ${N} .grid { grid-template-columns: 1fr !important; gap: 4px !important; }
      ${N} .tile:not(.dev) { display: flex; flex-direction: row; justify-content: flex-start; align-items: center; gap: 10px; padding: 8px 12px; min-height: 40px; text-align: left; }
      ${N} .tile:not(.dev):not(.off)::before { content: ">"; color: #a06a00; }
      ${N} .tile.on, ${N} .tile.going { background: #ffb000; color: #1a0f00; box-shadow: 0 0 12px rgba(255,176,0,.45); text-shadow: none; }
      ${N} .tile.on *, ${N} .tile.going * { color: #1a0f00 !important; text-shadow: none; } ${N} .tile.on::before { content: "\\25B6"; color: #1a0f00; }
      ${N} .tile.on span::after { content: "\\2588"; margin-left: 4px; animation: nxcur 1.1s steps(1) infinite; }
      ${N} .tile.going span { display: inline-block; overflow: hidden; white-space: nowrap; animation: nxtype .25s steps(14) 1; }
      ${N} .tile.dev.sel { background: #ffb000; color: #1a0f00; } ${N} .tile.dev.sel * { color: #1a0f00 !important; text-shadow: none; }
      ${N} .tile.dev.inuse { box-shadow: inset 0 0 14px rgba(255,176,0,.45); animation: nxglow 4s ease-in-out infinite; }
      ${N} .tile.off.holdoff { justify-content: center; position: relative; overflow: hidden; }
      ${N} .tile.off.holdoff::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: calc(var(--p, 0) * 1%); background: repeating-linear-gradient(90deg, rgba(255,176,0,.75) 0 7px, transparent 7px 10px); }
      ${N} .holdoff .hring { display: none; } ${N} .holdoff.fired { background: #ffb000 !important; } ${N} .holdoff.fired * { color: #1a0f00 !important; }
      ${N} .volslider.h { -webkit-appearance: none; appearance: none; height: 24px; border: 1px solid #ffb000; border-radius: 0; background: repeating-linear-gradient(90deg, #ffb000 0 6px, transparent 6px 9px); }
      ${N} .volslider.h::-webkit-slider-runnable-track { height: 24px; background: transparent; } ${N} .volslider.h::-moz-range-track { height: 24px; background: transparent; }
      ${N} .volslider.h::-webkit-slider-thumb { -webkit-appearance: none; width: 6px; height: 24px; border-radius: 0; background: #ffe08a; box-shadow: 0 0 8px #ffb000; border: none; }
      ${N} .volslider.h::-moz-range-thumb { width: 6px; height: 24px; border-radius: 0; background: #ffe08a; border: none; }
      ${N} .sw:has(> input) i { border-radius: 0; background: #0d0700; border: 1px solid #7a5200; box-shadow: none; } ${N} .sw:has(> input) i::after { border-radius: 0; background: #7a5200; box-shadow: none; }
      ${N} .sw:has(> input) input:checked + i { border-color: #ffb000; } ${N} .sw:has(> input) input:checked + i::after { background: #ffb000; box-shadow: 0 0 8px #ffb000; }
      ${N} .seg { background: #0d0700; border: 1px solid #7a5200; border-radius: 0; } ${N} .seg .th { border-radius: 0; background: #ffb000; } ${N} .seg .lab.a { color: #1a0f00 !important; text-shadow: none; }
      ${N} .hmenu { background: #120a00; border: 1px solid #ffb000; border-radius: 0; } ${N} select, ${N} .profchip { background-color: #120a00; border: 1px solid #7a5200; border-radius: 0; color: #ffb000; }
      ${N} .hubtabs button.sel { background: #ffb000; color: #1a0f00; text-shadow: none; }
      @keyframes nxcur { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
      @keyframes nxtype { from { max-width: 0; } to { max-width: 30ch; } }
      @keyframes nxglow { 0%, 100% { box-shadow: inset 0 0 8px rgba(255,176,0,.3); } 50% { box-shadow: inset 0 0 18px rgba(255,176,0,.6); } }
      @keyframes nxrefresh { from { top: -20%; } to { top: 120%; } }

      ${R} .key.kk, ${X} .key.kk { overflow: hidden; padding-left: 3px; padding-right: 3px; letter-spacing: 0; }
      /* ---------- Tube radio: an active Fire TV direct key is a pressed brass key with a border (app keys stay dark glass) ---------- */
      ${R} .key.ic-row.on:not(.mute) { background: linear-gradient(180deg, #e3d5b0, #bba97f) !important; border: 2px solid #8a6a2a !important; color: #2a170a !important; animation: none !important; transform: translateY(3px); box-shadow: inset 0 3px 6px rgba(0,0,0,.45), 0 1px 0 #6b4a1a, 0 0 0 2px rgba(255,184,74,.55), 0 0 10px 2px rgba(255,150,30,.45) !important; }
      ${R} .key.ic-row.on:not(.mute) *, ${R} .key.ic-row.on:not(.mute) ha-icon { color: #2a170a !important; text-shadow: none !important; }
      @media (prefers-reduced-motion: reduce) { ${W} *, ${W} *::after, ${N}, ${N}::after, ${N} * { animation: none !important; transition: none !important; } ${X} * { transition: none !important; } }
`;
