// Skins of 0.17: "thermal" (heat vision), "nixie" (number tubes, toggle switches), "nostromo" (amber ship computer),
// plus the pressed-brass fix for active direct keys in the tube radio. Same rules as skin-css.js: effects stay inside
// the card, pointer-events none, motion stops with "reduce motion".

const W = 'ha-card[data-skin="thermal"]';
const X = 'ha-card[data-skin="nixie"]';
const N = 'ha-card[data-skin="nostromo"]';
const R = 'ha-card[data-skin="radio"]';
const T = 'ha-card[data-skin="terminal"]';
// three dots in a triangle (bottom left, bottom right, top) as one background, n = how many are lit
const tri = (n) => [["8px 21px", 1], ["22px 21px", 2], ["15px 9px", 3]].map(([p, i]) => `radial-gradient(circle at ${p}, ${i <= n ? "#ff2a1a 0 3.4px, rgba(255,42,26,.45) 4px 7px" : "rgba(42,26,80,0) 0 3.4px"}, transparent 7.5px)`).join(",");

// heat spot: one soft irregular blob per area (hot core, yellow, green, teal edge); position/size vary per element via --bx/--by/--bw/--bh/--sx/--sy
const BL = "radial-gradient(ellipse var(--bw) var(--bh) at var(--bx) var(--by), #ff3a2a 0%, #ffb02a 28%, #e8e83a 50%, #38d070 72%, #1a8aa0 88%, transparent 100%), radial-gradient(ellipse calc(var(--bw) * .55) calc(var(--bh) * .6) at calc(var(--bx) + var(--sx)) calc(var(--by) + var(--sy)), #ffcf3a 0%, #58d868 60%, transparent 100%)";
const BLO = "radial-gradient(ellipse calc(var(--bw) * .85) calc(var(--bh) * .85) at var(--bx) var(--by), #ff8a2a 0%, #f0c02a 34%, #58d070 62%, #1a9aa8 86%, transparent 100%)";
const BLP = "radial-gradient(ellipse 60% 85% at 50% 55%, #ffd23a 0%, #ff7a1c 42%, #ff3a2a 70%, transparent 100%)";
const BASE = "linear-gradient(135deg, rgba(13,10,58,.92), rgba(10,7,36,.94))";
const DOTBOX = "content: ''; position: absolute; left: 0; top: -1px; width: 56px; height: 52px; background-size: 28px 26px; background-repeat: no-repeat; background-position: 14px 13px; pointer-events: none; transform: scale(.55); transform-origin: 0 0;";

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
      /* heat spot (one soft blob per area, shape and place vary from element to element) */
      ${W} .tile, ${W} .key, ${W} .mini, ${W} .appcell { --bx: 38%; --by: 56%; --bw: 46%; --bh: 64%; --sx: 22%; --sy: -14%; }
      ${W} :is(.tile, .key, .mini, .appcell):nth-child(4n+2) { --bx: 62%; --by: 46%; --bw: 44%; --bh: 70%; --sx: -18%; --sy: 16%; }
      ${W} :is(.tile, .key, .mini, .appcell):nth-child(4n+3) { --bx: 48%; --by: 62%; --bw: 52%; --bh: 60%; --sx: 20%; --sy: -10%; }
      ${W} :is(.tile, .key, .mini, .appcell):nth-child(4n) { --bx: 30%; --by: 44%; --bw: 42%; --bh: 72%; --sx: 24%; --sy: 14%; }
      ${W} .tile.dev.inuse, ${W} .tile.on, ${W} .tile.going { border-color: #4a3a90; color: #fff; background: ${BL}, ${BASE}; box-shadow: none; }
      ${W} .tile.dev.inuse *, ${W} .tile.on *, ${W} .tile.going *, ${W} .tile.dev.sel * { color: #fff !important; text-shadow: 0 0 3px #0a0724, 0 0 7px #0a0724; }
      ${W} .tile.dev.sel:not(.inuse) { border-color: #7a6ad0; color: #fff; background: ${BLO}, ${BASE}; box-shadow: none; }
      /* heat dots: one = belongs to the running activity, three = shown (selected); dots that are not lit stay invisible, the three fly in from outside */
      ${W} .tile.dev.inuse::after { display: none; }
      ${W} .tile.dev.inuse::before, ${W} .tile.dev.sel::before, ${W} .tile.on::before { ${DOTBOX} }
      ${W} .tile.dev.inuse::before { background-image: ${tri(1)}; } ${W} .tile.dev.sel::before, ${W} .tile.on::before { background-image: ${tri(3)}; animation: thfly .7s ease-out both; }
      /* unavailable = cold blue, locked = darker violet (like a cold object in a heat image) */
      ${W} .tile.locked, ${W} .key.locked, ${W} .appcell.locked { opacity: 1; filter: none; background: radial-gradient(ellipse 80% 120% at 50% 60%, #1a1060 0%, #0a0630 75%) !important; border-color: #2a1a70; color: #5a3fb0 !important; box-shadow: none; }
      ${W} .tile.locked.offline, ${W} .key:disabled, ${W} .ib[disabled] { opacity: 1; background: radial-gradient(ellipse 80% 120% at 50% 60%, #1c2a8a 0%, #10104a 70%) !important; border-color: #2a3a9a; color: #4a62c8 !important; }
      ${W} .tile.locked *, ${W} .key.locked *, ${W} .appcell.locked *, ${W} .key:disabled *, ${W} .ib[disabled] * { color: inherit !important; text-shadow: none; }
      ${W} .tile .lockic { color: #5a3fb0 !important; } ${W} .tile.offline .lockic { color: #4a62c8 !important; }
      ${W} .key { background: #0d0a3a; border-color: #5b3fd0; border-radius: 0; clip-path: polygon(7px 0, 100% 0, calc(100% - 7px) 100%, 0 100%); color: #6fd0c0; }
      ${W} .key ha-icon { color: #6fd0c0 !important; }
      /* keys that carry a text label show only the segment text; icon-only keys (arrows, volume, transport) keep the icon */
      ${W} .key:not(.ic):has(span[data-segtxt]) ha-icon { display: none; }
      /* keyboard keys: icon keys keep their icon (the small label is hidden on narrow screens), held modifiers light up like any active key, narrow keys leave room for the slanted corners */
      ${W} .kk.isfav.shiftkey, ${W} .kk.shiftkey.on { background: ${BL}, #0d0a3a !important; border-color: #4a3a90; color: #fff !important; } ${W} .kk.isfav.shiftkey *, ${W} .kk.shiftkey.on * { color: #fff !important; text-shadow: 0 0 3px #0a0724, 0 0 7px #0a0724; }
      ${W} .kbrow .kk span[data-segtxt] svg { max-width: 80%; }
      ${W} .key.sel:not(.mute), ${W} .key.on:not(.mute), ${W} .key.muted, ${W} .appcell.svc.on, ${W} .ic-row.on { background: ${BL}, #0d0a3a !important; border-color: #4a3a90; color: #fff !important; }
      ${W} .key.sel *, ${W} .key.on *, ${W} .key.muted *, ${W} .appcell.svc.on *, ${W} .ic-row.on * { color: #fff !important; text-shadow: 0 0 3px #0a0724, 0 0 7px #0a0724; }
      /* press feedback: a pressed key lights up with a hot heat spot that then shrinks and cools down slowly (to green and teal), like residual heat */
      ${W} .key, ${W} .mini, ${W} .tile { position: relative; isolation: isolate; }
      ${W} .key::after, ${W} .mini::after, ${W} .tile::after { content: ""; position: absolute; inset: 0; z-index: -1; pointer-events: none; background: ${BLP}; opacity: 0; transform: scale(.55); filter: hue-rotate(95deg); transition: opacity 1.8s ease-out, transform 1.8s ease-out, filter 1.8s ease-out; }
      ${W} .key.lit::after, ${W} .key:active::after, ${W} .mini.lit::after, ${W} .mini:active::after, ${W} .tile.lit::after, ${W} .tile:active::after { opacity: 1; transform: scale(1); filter: none; transition: opacity .05s, transform .15s, filter .05s; }
      ${W} .key.lit, ${W} .key:active, ${W} .mini.lit, ${W} .mini:active, ${W} .tile.lit, ${W} .tile:active { border-color: #ff9a2a; }
      ${W} .key *, ${W} .mini *, ${W} .tile * { transition: color 1.8s ease-out; }
      ${W} .key.lit *, ${W} .key:active *, ${W} .mini.lit *, ${W} .mini:active *, ${W} .tile.lit *, ${W} .tile:active * { color: #fff !important; text-shadow: 0 0 3px #2a0600, 0 0 7px #2a0600; transition: color .05s; }
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
      @keyframes thfly { from { background-position: -14px 40px, 56px 40px, 14px -26px; opacity: .2; } to { background-position: 14px 13px, 14px 13px, 14px 13px; opacity: 1; } }
      @keyframes thlock { 0% { background: ${tri(1)}; } 33% { background: ${tri(2)}; } 66%, 100% { background: ${tri(3)}; } }

      /* security card chips: the whole plate carries the look and the selection, the inner span only holds the text */
      :is(ha-card[data-skin="glass"], ha-card[data-skin="clay"], ha-card[data-skin="pebble"], ${W}, ${N}, ${T}, ${X}, ${R}) .sec .fchip span { background: transparent !important; border-radius: inherit; box-shadow: none; }
      /* hint bubbles (locked / unavailable / hold): each skin brings its own plate */
      ${W} { --hint-bg: #0a0724; --hint-fg: #6fd0c0; --hint-bd: 1px solid #2f8f9a; --hint-r: 0; }
      ${N} { --hint-bg: #120a00; --hint-fg: #ffb000; --hint-bd: 1px solid #ffb000; --hint-r: 0; }
      ${T} { --hint-bg: #021a05; --hint-fg: #3dff6b; --hint-bd: 1px solid #3dff6b; --hint-r: 0; }
      ${X} { --hint-bg: #120a08; --hint-fg: #f0d9a8; --hint-bd: 1px solid #8a6a2a; --hint-r: 6px; }
      ${R} { --hint-bg: #2a1a10; --hint-fg: #f1e3c1; --hint-bd: 1px solid #c8a24a; --hint-r: 10px; }
      ha-card[data-skin="glass"] { --hint-bg: rgba(14,20,26,.94); --hint-fg: #e8eef2; --hint-bd: 1px solid rgba(255,255,255,.3); --hint-r: 2px; --hint-sh: 0 0 10px rgba(255,255,255,.15); }
      ha-card[data-skin="clay"] { --hint-bg: #fffaf0; --hint-fg: #4a3a30; --hint-bd: 0; --hint-r: 14px; --hint-sh: 0 3px 8px rgba(60,80,50,.3); }
      ha-card[data-skin="pebble"] { --hint-bg: #e6d5a8; --hint-fg: #5e4620; --hint-bd: 0; --hint-r: 14px 12px 15px 11px; --hint-sh: 0 3px 8px rgba(0,60,70,.4), inset 0 1px 1px rgba(255,255,255,.5); }
      /* small badges (Fire TV dot at the room icon, hint count at the gear) in the skin's own colours */
      ${W} .fdot { border-radius: 0; clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%); background: #1a0a30; color: #ffe85a; box-shadow: 0 0 0 1px #ff7a1c, 0 0 8px 1px rgba(255,122,28,.8); width: 18px; height: 16px; }
      ${W} .fdot ha-icon { filter: drop-shadow(0 0 3px #ff7a1c); }
      ${W} .ib.gear .gbadge { border-radius: 0; clip-path: polygon(3px 0, 100% 0, calc(100% - 3px) 100%, 0 100%); background: linear-gradient(90deg, #ffe85a, #ff4a12); color: #2a0600; box-shadow: 0 0 8px 1px rgba(255,122,28,.8); }
      ${N} .fdot { border-radius: 0; background: #120a00; color: #ffb000; box-shadow: 0 0 0 1px #ffb000; } ${N} .ib.gear .gbadge { border-radius: 0; background: #ffb000; color: #1a0f00; }
      ${T} .fdot { border-radius: 0; background: #021a05; color: #3dff6b; box-shadow: 0 0 0 1px #3dff6b; } ${T} .ib.gear .gbadge { border-radius: 0; background: #3dff6b; color: #021a05; text-shadow: none; }
      ${R} .fdot, ${X} .fdot { background: radial-gradient(circle at 38% 32%, #fff3c4, #c9a23c 60%, #5c4210); color: #2a170a; box-shadow: 0 0 0 1px #2a170a, 0 0 6px rgba(255,150,30,.6); } ${R} .fdot ha-icon, ${X} .fdot ha-icon { filter: none; }
      /* Fire TV not reachable: a clearly readable dashed badge instead of a dim black square */
      ${W} .fdot.f-unknown, ${N} .fdot.f-unknown, ${T} .fdot.f-unknown, ${R} .fdot.f-unknown, ${X} .fdot.f-unknown { opacity: 1; box-shadow: none; outline: 1px dashed currentColor; outline-offset: -1px; }
      ${W} .fdot.f-unknown { color: #b9a8ff; } ${N} .fdot.f-unknown { color: #e0a800; } ${T} .fdot.f-unknown { color: #3dff6b; } ${R} .fdot.f-unknown, ${X} .fdot.f-unknown { color: #2a170a; }
      ${W} .fdot.f-unknown ha-icon, ${N} .fdot.f-unknown ha-icon, ${T} .fdot.f-unknown ha-icon, ${R} .fdot.f-unknown ha-icon, ${X} .fdot.f-unknown ha-icon { color: currentColor !important; filter: none; }
      ${T} .editdone.warn, ${T} .key.warn { color: #021a05; }
      ${W} .lockmark.on { color: #ff5a1c; filter: drop-shadow(0 0 4px #ff5a1c); } ${W} .lockmark.free { color: #ffe85a; }
      ${N} .lockmark.on { color: #ffb000; filter: drop-shadow(0 0 3px #ff8a00); } ${N} .lockmark.free { color: #c9a23c; }
      ${T} .lockmark.on { color: #3dff6b; filter: drop-shadow(0 0 3px #3dff6b); } ${T} .lockmark.free { color: #1fa83c; }
      ${R} .lockmark.on, ${X} .lockmark.on { color: #e8b84a; filter: drop-shadow(0 0 3px rgba(255,150,30,.8)); } ${R} .lockmark.free, ${X} .lockmark.free { color: #9c8450; }
      ${R} .ib.gear .gbadge, ${X} .ib.gear .gbadge { background: radial-gradient(circle at 38% 32%, #fff3c4, #ffb84a 60%, #a8480a); color: #2a170a; box-shadow: 0 0 0 1px #2a170a; }
      /* ---------- Nixie: number tubes and brass toggle switches ---------- */
      ${X} { counter-reset: nx; border: 6px solid #5a3a1c; border-radius: 22px; box-shadow: inset 0 0 40px rgba(0,0,0,.55); background-image: repeating-linear-gradient(90deg, rgba(0,0,0,.08) 0 2px, transparent 2px 7px); font-family: Georgia, "Times New Roman", serif; }
      ${X} .grid { counter-reset: nx; }
      ${X} .tile { background: linear-gradient(180deg, #120a08, #050302), repeating-linear-gradient(0deg, rgba(255,150,40,.05) 0 1px, transparent 1px 4px); border: 1px solid #9a9a9a; border-radius: 26px 26px 6px 6px !important; box-shadow: inset 0 0 14px #000, 0 3px 6px rgba(0,0,0,.6); min-height: 84px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; counter-increment: nx; color: #5a3a1c; }
      ${X} .tile:not(.off)::before { content: counter(nx); font: 600 30px Georgia, serif; color: #6a3a10; text-shadow: none; }
      ${X} .tile ha-icon { display: none; } ${X} .tile.off ha-icon { display: inline-block; }
      ${X} .tile span, ${X} .tile small { font-size: 11px; color: #a8743a; }
      ${X} .tile.on, ${X} .tile.dev.sel, ${X} .tile.dev.inuse { border-color: #ffb050; box-shadow: inset 0 0 18px rgba(255,150,40,.35), 0 0 12px rgba(255,150,40,.45); }
      /* a stored 'fill' active style must not paint the lit tube orange (digit and name would vanish) */
      ${X} .tile.on, ${X} .tile.going, ${X} .tile.dev.sel, ${X} .tile.dev.inuse { background: linear-gradient(180deg, #1a0d06, #050302) !important; }
      ${X} .tile.on::before, ${X} .tile.dev.sel::before, ${X} .tile.dev.inuse::before { color: #ff9a3a; text-shadow: 0 0 8px #ff7a1a, 0 0 16px rgba(255,110,20,.7); }
      ${X} .tile.on span, ${X} .tile.dev.sel span, ${X} .tile.dev.inuse span { color: #ffd9a0; }
      /* keys: graphite rectangles with a chrome edge and an engraved legend; direct keys (sent straight to the device) have a dim glowing legend, active ones glow bright and sit pressed in */
      ${X} .key:not(.color), ${X} .rocker { border: 1px solid #9a9a9a; background: linear-gradient(180deg, #2c2c2e, #161617); color: #d8ccb0; letter-spacing: .04em; box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 3px 0 #050505, 0 4px 5px rgba(0,0,0,.6); transition: transform .12s ease, box-shadow .12s ease; }
      ${X} .key:not(.color) ha-icon, ${X} .rocker ha-icon { color: #d8ccb0 !important; }
      ${X} .key[data-adb]:not(.color):not(.appcell), ${X} .key.ic-row:not(.color) { color: #e59a4a; text-shadow: 0 0 6px rgba(255,130,30,.55); border-color: #b08a5a; }
      ${X} .key[data-adb]:not(.color):not(.appcell) ha-icon, ${X} .key.ic-row:not(.color) ha-icon { color: #e59a4a !important; filter: drop-shadow(0 0 4px rgba(255,130,30,.6)); }
      ${X} .key.sel:not(.mute):not(.color), ${X} .key.on:not(.mute):not(.color), ${X} .key.muted, ${X} .ic-row.on, ${X} .appcell.svc.on, ${X} .key.lit:not(.color), ${X} .key:active:not(.color) { transform: translateY(2px); color: #ffb25a !important; text-shadow: 0 0 8px #ff7a1a, 0 0 16px rgba(255,110,20,.8); border-color: #e8d8b8; background: linear-gradient(180deg, #161617, #1f1f20) !important; box-shadow: inset 0 2px 6px #000, 0 0 0 1px #5a3a1c, 0 0 14px rgba(255,150,40,.5); }
      ${X} .key.sel:not(.color) ha-icon, ${X} .key.on:not(.color) ha-icon, ${X} .key.muted ha-icon, ${X} .ic-row.on ha-icon, ${X} .key.lit ha-icon, ${X} .key:active ha-icon { color: #ffb25a !important; filter: drop-shadow(0 0 5px #ff7a1a); }
      ${X} .rocker .rk.mute.round, ${X} .key.mute.round { background: linear-gradient(180deg, #2c2c2e, #161617) !important; color: #d8ccb0 !important; border: 1px solid #9a9a9a; box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 3px 0 #050505, 0 4px 5px rgba(0,0,0,.6); }
      ${X} .rocker .rk.mute.round.muted, ${X} .key.mute.round.muted { background: linear-gradient(180deg, #161617, #1f1f20) !important; color: #ffb25a !important; border-color: #e8d8b8; transform: translateY(2px); text-shadow: 0 0 8px #ff7a1a; box-shadow: inset 0 2px 6px #000, 0 0 0 1px #5a3a1c, 0 0 14px rgba(255,150,40,.5) !important; }
      ${X} .rocker .rk.mute.round ha-icon, ${X} .key.mute.round ha-icon { color: inherit !important; }
      ${X} .key.color { border: 1px solid rgba(255,255,255,.4); }
      /* On/Off of a device with a known state: a toggle switch (brass hex nut, chrome lever, lamp) */
      ${X} .rpow .pwrow { display: flex; align-items: center; gap: 14px; padding: 8px 6px; } ${X} .pwlab { flex: 1; min-width: 0; color: #e2c58a; font: 600 13px Georgia, serif; letter-spacing: .04em; }
      ${X} .pwio { display: flex; gap: 10px; } ${X} .key.pwio { width: 52px; height: 46px; min-height: 0; flex-direction: column; gap: 1px; padding: 0; } ${X} .key.pwio span { font: 700 10px Georgia, serif; } ${X} .key.pwtg { flex: none; height: 44px; min-height: 0; padding: 0 16px; gap: 6px; }
      ${X} .pwknob { position: relative; flex: none; width: 64px; height: 48px; background: radial-gradient(circle at 50% 50%, #120a04 0 7px, transparent 7.5px) 15px 18px / 34px 30px no-repeat; }
      ${X} .pwknob::before { content: ""; position: absolute; left: 15px; bottom: 0; width: 34px; height: 30px; z-index: 0; clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%); background: radial-gradient(circle at 40% 35%, #f6e2a2, #a98530 70%, #5c4210); }
      ${X} .pwknob::after { content: ""; position: absolute; right: 0; top: 4px; width: 9px; height: 9px; border-radius: 50%; background: #5a0e06; box-shadow: 0 0 4px 1px rgba(150,20,10,.45); transition: background .2s, box-shadow .2s; pointer-events: none; }
      ${X} .pwknob.on::after { background: #ff9a3a; box-shadow: 0 0 10px 3px #ff7a1a; }
      ${X} .pwknob .knob { position: absolute; left: 26px; bottom: 14px; z-index: 2; width: 12px; height: 32px; min-height: 0; padding: 0; border: none; border-radius: 0; background: linear-gradient(90deg, #666, #fafafa 50%, #666); clip-path: polygon(0 0, 100% 0, 72% 100%, 28% 100%); transform-origin: 50% 100%; transform: rotate(-30deg); transition: transform .18s ease; box-shadow: none; filter: none; }
      ${X} .pwknob .knob ha-icon { display: none; } ${X} .pwknob.on .knob { transform: rotate(30deg); }
      ${X} .pwknob.pend::after { animation: nxpend .6s ease-in-out infinite alternate; }
      @keyframes nxpend { from { opacity: .35; } to { opacity: 1; } }
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
      ${N} .hubtabs button.sel .ico { background: #1a0f00; box-shadow: 0 0 0 1px #1a0f00; }
      /* amber fills always carry dark ink, icons included (the generic amber icon rule would make them invisible) */
      ${N} .favkind button.sel, ${N} .favkind button.sel *, ${N} .editdone, ${N} .editdone *, ${N} .hint-row button, ${N} .hint-row button *, ${N} .helpall, ${N} .helpall *, ${N} .pbtn.pri, ${N} .pbtn.pri *, ${N} .seg .lab.a, ${N} .seg .lab.a * { color: #1a0f00 !important; text-shadow: none; filter: none; }
      ${N} .editdone, ${N} .hint-row button, ${N} .helpall, ${N} .pbtn.pri { background: #ffb000; border-color: #ffb000; }
      @keyframes nxcur { 0%, 55% { opacity: 1; } 56%, 100% { opacity: 0; } }
      @keyframes nxtype { from { max-width: 0; } to { max-width: 30ch; } }
      @keyframes nxglow { 0%, 100% { box-shadow: inset 0 0 8px rgba(255,176,0,.3); } 50% { box-shadow: inset 0 0 18px rgba(255,176,0,.6); } }
      @keyframes nxrefresh { from { top: -20%; } to { top: 120%; } }

      /* the pager clips its content with the tile radius: with big radii it cut the bottom corners of the last tile row */
      ${X} .pager, ${R} .pager { border-radius: 0; } ${X} .pager .pane, ${R} .pager .pane { padding: 2px 2px 10px; }
      ${R} .key.kk, ${X} .key.kk { overflow: hidden; padding-left: 3px; padding-right: 3px; letter-spacing: 0; }
      /* ---------- Tube radio: an active Fire TV direct key is a pressed brass key with a border (app keys stay dark glass) ---------- */
      ${R} .key.ic-row.on:not(.mute) { background: linear-gradient(180deg, #e3d5b0, #bba97f) !important; border: 2px solid #8a6a2a !important; color: #2a170a !important; animation: none !important; transform: translateY(3px); box-shadow: inset 0 3px 6px rgba(0,0,0,.45), 0 1px 0 #6b4a1a, 0 0 0 2px rgba(255,184,74,.55), 0 0 10px 2px rgba(255,150,30,.45) !important; }
      ${R} .key.ic-row.on:not(.mute) *, ${R} .key.ic-row.on:not(.mute) ha-icon { color: #2a170a !important; text-shadow: none !important; }
      @media (prefers-reduced-motion: reduce) { ${X} .pwknob::after, ${W} *, ${W} *::before, ${W} *::after, ${N}, ${N}::after, ${N} * { animation: none !important; transition: none !important; } ${X} * { transition: none !important; } }
`;
