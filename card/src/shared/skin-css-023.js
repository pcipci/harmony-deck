// Skins of 0.23: "pebble" (Kiesel) is now a skin of its own: grey river stones with irregular shapes, carved hollows,
// water in the volume groove, painted symbols; plus the softer hold effects of Glass and Clay (no ring around the
// symbol: the whole key turns red / the backlight grows).
// Same rules as the other skin files: effects stay inside the card, motion stops with "reduce motion".
import { SKIN_KIT } from "./skin-css-020.js";

const { on, PRESSED, ACTIVE, SEL, PRIMARY, SURF, FIELD, BTN, SPOT, SHEEN } = SKIN_KIT;

const P = 'ha-card[data-skin="pebble"]';
const G = 'ha-card[data-skin="glass"]';
const C = 'ha-card[data-skin="clay"]';

// Paint filter for the symbols and names: wavy edge, stone shows through in tiny spots (small symbols keep it low so they stay readable).
export const PEBBLE_DEFS = `<svg class="pebdefs" width="0" height="0" aria-hidden="true" style="position:absolute;width:0;height:0"><defs>
  <filter id="kiPaint" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="3" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="1.6" result="d"/><feTurbulence type="fractalNoise" baseFrequency=".5" numOctaves="3" seed="8" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 5 0 0 0 -.8" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>
  <filter id="kiPaintS" x="-5%" y="-10%" width="110%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".12" numOctaves="2" seed="5" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="1" result="d"/><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="9" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 4 0 0 0 -.2" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>
  <filter id="kiPaintL" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".07" numOctaves="2" seed="3" result="w"/><feDisplacementMap in="SourceGraphic" in2="w" scale="2.4" result="d"/><feTurbulence type="fractalNoise" baseFrequency=".45" numOctaves="3" seed="8" result="g"/><feColorMatrix in="g" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 5 0 0 0 -.9" result="m"/><feComposite in="d" in2="m" operator="in"/></filter>
</defs></svg>`;

const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .30 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`;
const NONE = "linear-gradient(transparent, transparent)";

// What counts as a stone: everything you can press. The status line, panels and fields are carved hollows instead.
const STONE = [".key:where(:not(.ghost):not(.svc))", ".kk:where(:not(.ghost))", ".pill:where(:not(.ghost))", ".chip:where(:not(.status))", ".d:where(:not(.ghost))", ".actbtn:where(:not(.miss))", ".tile:where(:not(.locked))", ".linkbar button", ".pbtn", ".ib", ".hubtabs button", ".seg .th", ".hint-row button"];
const HOLLOW = [".slimbar", ".rocker:not(.none)", ".secstate"];
const PBTN = [...BTN.filter((s) => s !== ".nettab"), ".sbtn"];
const GHOST = [".key.ghost", ".tile.locked", ".key:disabled", ".actbtn.miss", ".pill.ghost"];

// Eight different shapes and flaws, handed out by position so neighbours differ.
const SHAPES = [
  ["63% 37% 48% 52% / 58% 42% 62% 38%", "#cdd1d2", "#9ea5a7", "radial-gradient(circle at 88% 70%, rgba(0,0,0,.3) 0 1.5px, transparent 2.5px), radial-gradient(circle at 12% 30%, rgba(0,0,0,.26) 0 1px, transparent 2px)"],
  ["41% 59% 57% 43% / 46% 61% 39% 54%", "#c8cdcf", "#98a0a4", "radial-gradient(circle at 70% 30%, rgba(0,0,0,.24) 0 1px, transparent 2px), radial-gradient(ellipse at 25% 72%, rgba(255,255,255,.2), transparent 40%)"],
  ["55% 45% 36% 64% / 66% 40% 60% 34%", "#d0cfca", "#a1a19b", "radial-gradient(circle at 82% 28%, rgba(150,95,50,.14) 0 8px, transparent 15px), radial-gradient(circle at 20% 70%, rgba(0,0,0,.3) 0 1.5px, transparent 2.5px)"],
  ["47% 53% 62% 38% / 38% 57% 43% 62%", "#c6cdcf", "#97a2a6", "radial-gradient(ellipse at 96% 46%, rgba(255,255,255,.35) 0 5px, rgba(255,255,255,.1) 10px, transparent 14px)"],
  ["60% 40% 52% 48% / 50% 64% 36% 50%", "#cdcdcc", "#a0a2a1", "radial-gradient(ellipse at 70% 60%, rgba(60,60,55,.22), transparent 40%), radial-gradient(circle at 30% 24%, rgba(0,0,0,.26) 0 1px, transparent 2px)"],
  ["38% 62% 44% 56% / 60% 36% 64% 40%", "#caced0", "#9aa2a5", "radial-gradient(ellipse at 3% 55%, rgba(255,255,255,.35) 0 5px, rgba(255,255,255,.1) 10px, transparent 14px)"],
  ["52% 48% 66% 34% / 44% 52% 48% 56%", "#cfd2d1", "#a3a8a8", NONE],
  ["44% 56% 40% 60% / 64% 46% 54% 36%", "#c9cdce", "#9ba3a5", "radial-gradient(circle at 24% 76%, rgba(0,0,0,.28) 0 1px, transparent 2px), radial-gradient(circle at 15% 78%, rgba(0,0,0,.24) 0 1px, transparent 2px)"],
];
const shapes = SHAPES.map(([r, a, b, f], i) => `${STONE.map((s) => `${P} ${s}:nth-child(8n+${i + 1})`).join(", ")} { --pr: ${r}; --s1: ${a}; --s2: ${b}; --fl: ${f}; }`).join("\n      ");

// Droplets: a few clear drops sit on the stone (running activity, running app)
const DROP = (x, y, s) => `radial-gradient(circle closest-side at 32% 28%, rgba(255,255,255,.95) 0 1px, transparent 2px) ${x}% ${y}% / ${s}px ${s}px no-repeat, radial-gradient(circle closest-side at 50% 52%, rgba(255,255,255,.3) 0 55%, rgba(20,30,32,.55) 94%, transparent 100%) ${x}% ${y}% / ${s}px ${s}px no-repeat`;
const DROPS = [DROP(8, 26, 13), DROP(86, 20, 15), DROP(94, 70, 9), DROP(20, 88, 9), DROP(60, 92, 11)].join(", ");

// Function colours of the painted symbols
const CREAM = "#f6efdb", GREEN = "#6fdc7a", YELLOW = "#ffd84a", RED = "#ff7a6b", BLUE = "#6ec6ff";
const ACTCOL = ["#ff7a6b", "#ffd84a", "#4fd1c5", "#ffa94d", "#6ec6ff", "#c9a3ff"];

export const SKIN_CSS_023 = `
      /* ---------- Kiesel: grey river stones, carved hollows, water in the grooves ---------- */
      ${P} { --pb-a: #183a3c; --pb-b: #0d2022; --hr-fire: #19b6c9; --kv: #1d8a86; color: var(--hr-text); font-family: system-ui, "Segoe UI", Roboto, Arial, sans-serif;
        background-color: #0d2022; background-image: ${NOISE}, radial-gradient(ellipse at 20% 0, rgba(60,160,150,.28), transparent 55%), linear-gradient(170deg, #183a3c, #0d2022); }
      ${P}.pb-a { background-image: ${NOISE}, radial-gradient(ellipse at 20% 0, rgba(130,150,150,.25), transparent 55%), linear-gradient(170deg, #3a4043, #252a2c); }
      ${P}.pb-b { background-image: ${NOISE}, radial-gradient(ellipse at 80% 0, rgba(170,140,100,.22), transparent 55%), linear-gradient(170deg, #3b3733, #221f1d); }
      ${P}.pb-d { background-image: ${NOISE}, radial-gradient(ellipse at 30% 10%, rgba(190,170,130,.28), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(60,120,120,.3), transparent 55%), linear-gradient(170deg, #5a5750, #34332f); }
      ${P} * { backdrop-filter: none; }

      /* the stone itself */
      ${on(P, STONE)} { --pr: 56% 44% 52% 48% / 54% 50% 50% 46%; border: none !important; border-radius: var(--pr) !important; color: #2b3032; text-shadow: 0 1px 0 rgba(255,255,255,.45);
        background: var(--fl, ${NONE}), ${NOISE}, radial-gradient(ellipse at 26% 18%, rgba(255,255,255,.55), transparent 44%), radial-gradient(ellipse at 78% 96%, rgba(0,0,0,.28), transparent 60%), linear-gradient(150deg, var(--s1, #cbcfd0), var(--s2, #9ba2a4)) !important;
        box-shadow: inset 0 1px 1px rgba(255,255,255,.7), inset 0 -3px 6px rgba(0,0,0,.28), 0 6px 9px rgba(0,0,0,.5), 0 1px 0 rgba(255,255,255,.07) !important;
        transition: transform .2s, box-shadow .2s, filter 1s ease-out; }
      ${shapes}
      /* nearly square stones (device tiles, apps) get calmer shapes, so they do not turn into leaves */
      ${P} .tile.dev:nth-child(4n+1) { --pr: 54% 46% 50% 50% / 52% 52% 48% 48%; } ${P} .tile.dev:nth-child(4n+2) { --pr: 47% 53% 52% 48% / 50% 46% 54% 50%; } ${P} .tile.dev:nth-child(4n+3) { --pr: 51% 49% 46% 54% / 54% 50% 50% 46%; } ${P} .tile.dev:nth-child(4n+4) { --pr: 49% 51% 54% 46% / 46% 54% 46% 54%; }
      ${on(P, STONE.map((s) => `${s} :is(span, small, b, i)`))} { color: inherit; }
      ${on(P, STONE.map((s) => `${s} ha-icon`))} { color: #3b4346; }

      /* pressed: the stone sinks and stays a little wet for a second */
      ${on(P, PRESSED)} { transform: translateY(3px) scale(.98) !important; filter: brightness(.84) saturate(1.15); transition: transform .1s, box-shadow .1s, filter .1s !important;
        box-shadow: inset 0 3px 8px rgba(0,0,0,.4), 0 1px 2px rgba(0,0,0,.5) !important; }

      /* running / selected: wet stone with a teal glow, clear droplets on it */
      ${on(P, [...ACTIVE, ...SEL, ".tile.going"])} { --fl: ${DROPS}; color: #17403e !important; text-shadow: 0 0 6px rgba(70,220,205,.35);
        box-shadow: inset 0 1px 1px rgba(255,255,255,.7), inset 0 -3px 6px rgba(0,0,0,.25), 0 5px 7px rgba(0,0,0,.5), 0 0 14px rgba(60,200,190,.4) !important; }
      ${on(P, [...ACTIVE, ...SEL].map((s) => `${s} :is(span, small, b, i, ha-icon)`))} { color: #17403e !important; }
      ${on(P, [".tile.dev.inuse:not(.sel)"])} { --fl: ${NONE}; box-shadow: inset 0 1px 1px rgba(255,255,255,.7), inset 0 -3px 6px rgba(0,0,0,.28), inset 0 -14px 16px -10px rgba(60,190,180,.6), 0 6px 9px rgba(0,0,0,.5) !important; color: #2b3032 !important; }
      ${on(P, [".tile.dev.inuse:not(.sel) ha-icon"])} { color: var(--kv) !important; }
      ${P} .tile.dev::after, ${P} .tile.dev.inuse::after, ${P} .tile.dev.sel::after { display: none; }

      /* not available: carved into the stone */
      ${on(P, GHOST)} { border: none !important; border-radius: 40% 60% 46% 54% / 56% 44% 56% 44% !important; opacity: 1; filter: none; color: #5d686b !important; text-shadow: 0 1px 0 rgba(255,255,255,.12);
        background: ${NOISE}, linear-gradient(180deg, #1f2426, #2b3133) !important; box-shadow: inset 0 5px 9px rgba(0,0,0,.75), inset 0 -1px 1px rgba(255,255,255,.14) !important; }
      ${on(P, GHOST.map((s) => `${s} :is(*, ha-icon)`))} { color: #5d686b !important; filter: none; }

      /* the d-pad: five different pebbles lie in a round hollow */
      ${P} .dpad { border-radius: 50% !important; background: ${NOISE}, linear-gradient(180deg, #1b2022, #2d3436) !important; box-shadow: inset 0 8px 14px rgba(0,0,0,.7), inset 0 -1px 2px rgba(255,255,255,.12) !important; }
      ${P} .dpad::before, ${P} .dpad::after { display: none; }
      ${P} .dpad .d { box-shadow: inset 0 1px 1px rgba(255,255,255,.7), inset 0 -3px 6px rgba(0,0,0,.28), 0 6px 9px rgba(0,0,0,.5) !important; }
      ${P} .dpad .d.ok { box-shadow: inset 0 1px 1px rgba(255,255,255,.7), inset 0 -3px 6px rgba(0,0,0,.28), 0 6px 9px rgba(0,0,0,.5) !important; }
      ${P} .dpad .d.up { --pr: 50% 50% 46% 54% / 56% 56% 44% 44% !important; } ${P} .dpad .d.left { --pr: 56% 44% 48% 52% / 50% 46% 54% 50% !important; }
      ${P} .dpad .d.right { --pr: 44% 56% 52% 48% / 52% 48% 54% 46% !important; } ${P} .dpad .d.down { --pr: 48% 52% 56% 44% / 44% 44% 56% 56% !important; } ${P} .dpad .d.ok { --pr: 58% 42% 50% 50% / 48% 56% 44% 52% !important; }

      /* status line, panels, tables, hints: hollows carved into the stone; fields too */
      ${P} .status.chip { border: none !important; border-radius: 40px 44px 38px 42px / 42px 38px 44px 40px !important; color: #9aabac; text-shadow: none;
        background: ${NOISE}, linear-gradient(180deg, #1f2426, #2b3133) !important; box-shadow: inset 0 5px 9px rgba(0,0,0,.75), inset 0 -1px 1px rgba(255,255,255,.14) !important; }
      ${on(P, HOLLOW)} { border: none !important; border-radius: 36px 40px 34px 38px / 38px 34px 40px 36px !important; color: #9aabac; text-shadow: none;
        background: ${NOISE}, linear-gradient(180deg, #1f2426, #2b3133) !important; box-shadow: inset 0 5px 9px rgba(0,0,0,.75), inset 0 -1px 1px rgba(255,255,255,.14) !important; }
      ${P} .secstate b { color: var(--hr-text); } ${P} .secstate.s-on ha-icon { color: var(--hr-danger); } ${P} .secstate.s-free ha-icon, ${P} .secstate.s-idle ha-icon { color: var(--hr-accent); }
      ${P} .slimbar > ha-icon, ${P} .slimbar .sw { color: #7ee0d6 !important; }
      ${P} .key.color { min-height: 16px; --cc: #888; background: var(--fl, ${NONE}), ${NOISE}, radial-gradient(ellipse at 26% 18%, rgba(255,255,255,.5), transparent 50%), linear-gradient(150deg, color-mix(in srgb, var(--cc) 75%, #fff), var(--cc)) !important; }
      ${P} .key.color.red { --cc: #d9534f; } ${P} .key.color.green { --cc: #3fae68; } ${P} .key.color.yellow { --cc: #e6b830; } ${P} .key.color.blue { --cc: #3f84d9; }
      ${on(P, [...SURF, ".block"])} { border: none !important; border-radius: 30px 34px 28px 32px / 32px 28px 34px 30px !important; color: var(--hr-text);
        background: ${NOISE}, linear-gradient(180deg, #232a2c, #1c2224) !important; box-shadow: inset 0 4px 10px rgba(0,0,0,.6), inset 0 -1px 1px rgba(255,255,255,.1) !important; }
      ${on(P, [".win", ".helpbox", ".infopanel", ".hmenu", ".profdlg"])} { background: ${NOISE}, linear-gradient(180deg, #2a3234, #222a2c) !important; }
      ${P} .textopen, ${P} .dfield, ${P} .kbsw { border: none !important; border-radius: 22px 26px 20px 24px / 24px 20px 26px 22px !important; color: var(--hr-text) !important; background: ${NOISE}, linear-gradient(180deg, #1b2022, #2d3436) !important; box-shadow: inset 0 4px 7px rgba(0,0,0,.7), inset 0 -1px 1px rgba(255,255,255,.12) !important; }
      ${P} .textopen :is(span, ha-icon), ${P} .dfield :is(ha-icon, input) { color: var(--hr-text) !important; }
      ${P} .kbsw button { color: #9aabac; } ${P} .kbsw button.sel { color: #e4fbf8; background: rgba(79,209,197,.22); }
      ${on(P, FIELD)} { border: none !important; border-radius: 22px 26px 20px 24px / 24px 20px 26px 22px !important; color: var(--hr-text) !important;
        background: ${NOISE}, linear-gradient(180deg, #1b2022, #2d3436) !important; box-shadow: inset 0 4px 7px rgba(0,0,0,.7), inset 0 -1px 1px rgba(255,255,255,.12) !important; }
      ${on(P, PBTN)} { border: none !important; border-radius: 52% 48% 54% 46% / 56% 50% 50% 44% !important; color: #2b3032; text-shadow: 0 1px 0 rgba(255,255,255,.45);
        background: ${NOISE}, radial-gradient(ellipse at 26% 18%, rgba(255,255,255,.55), transparent 44%), radial-gradient(ellipse at 78% 96%, rgba(0,0,0,.28), transparent 60%), linear-gradient(150deg, #cbcfd0, #9ba2a4) !important;
        box-shadow: inset 0 1px 1px rgba(255,255,255,.7), inset 0 -3px 6px rgba(0,0,0,.28), 0 4px 7px rgba(0,0,0,.5) !important; }
      ${on(P, PBTN.map((s) => `${s} :is(span, small, b, ha-icon)`))} { color: #2b3032 !important; }
      ${on(P, [...PRIMARY, ".etabs button.sel", ".favkind button.sel", ".pitem.on", ".profrow.act"])} { --s1: #8fa9a8; --s2: #55706f; color: #e4fbf8 !important; text-shadow: 0 0 8px rgba(70,220,205,.6) !important;
        box-shadow: inset 0 2px 3px rgba(255,255,255,.25), inset 0 -4px 8px rgba(0,0,0,.45), 0 3px 5px rgba(0,0,0,.5), 0 0 14px rgba(60,200,190,.35) !important; }
      ${on(P, [...PRIMARY, ".etabs button.sel", ".favkind button.sel", ".pitem.on", ".profrow.act"].map((s) => `${s} :is(span, small, b, ha-icon)`))} { color: #e4fbf8 !important; }
      ${P} .hubtabs .ico { background: none !important; box-shadow: none !important; }
      ${P} .hubtabs button { color: #2b3032; } ${P} .hubtabs button.sel { color: #17403e; }
      ${P} .hint-row { border-radius: 30px 34px 28px 32px / 32px 28px 34px 30px; }
      ${P} .hint-row ha-icon, ${P} :is(.helpbox, .infopanel, .profdlg) ha-icon { color: var(--hr-text); }
      ${P} :is(.pbadge, .gbadge) { border-radius: 50%; }
      ${P} .sdot.lit { box-shadow: 0 0 6px var(--hr-accent); }

      /* painted symbols: function colours; cream for everything without a function */
      ${on(P, [".key ha-icon", ".kk ha-icon", ".pill ha-icon", ".d ha-icon", ".chip ha-icon", ".actbtn ha-icon", ".linkbar button ha-icon", ".seg .th ha-icon"])} { color: ${CREAM} !important; filter: url(#kiPaint) drop-shadow(0 0 .6px rgba(0,0,0,.55)); }
      ${P} .d.ok { font-weight: 800; }
      ${P} .d.ok, ${P} .d.ok span { color: ${CREAM} !important; text-shadow: 0 0 .6px rgba(0,0,0,.7), 0 1px 1px rgba(0,0,0,.35); }
      ${P} .key[data-cmd*="Power"] ha-icon, ${P} .key[data-cmd*="Stop"] ha-icon, ${P} .key[data-cmd*="Record"] ha-icon, ${P} .key[data-cmd*="Mute"] ha-icon, ${P} .key.pon ha-icon, ${P} .key.warn ha-icon, ${P} .tile.off ha-icon { color: ${RED} !important; }
      ${P} .key[data-cmd*="Play"] ha-icon { color: ${GREEN} !important; }
      ${P} .key[data-cmd*="Pause"] ha-icon { color: ${YELLOW} !important; }
      ${P} .key[data-cmd*="Info"] ha-icon, ${P} .key[data-cmd*="Guide"] ha-icon { color: ${BLUE} !important; }
      ${P} .ib ha-icon { color: ${CREAM}; filter: url(#kiPaint) drop-shadow(0 0 .6px rgba(0,0,0,.55)); }
      ${P} .ib.gear[class*="sev-"] ha-icon, ${P} .ib.help ha-icon { color: ${BLUE}; }
      ${P} .tile.dev ha-icon, ${P} .tile.off ha-icon { filter: url(#kiPaint) drop-shadow(0 0 .6px rgba(0,0,0,.55)); }
      ${P} .tile.dev ha-icon { color: ${CREAM}; }
      ${P} .tile.dev.inuse:not(.sel) ha-icon { color: #bdf3ee !important; }
      ${P} .key .small, ${P} .key small { font-size: .78em; text-transform: none; }

      /* Fire TV app keys: whole stone painted in the brand colour with an organic edge, a droplet when the app runs */
      ${P} :is(.key.svc, .appcell.svc) { border: 0 !important; border-radius: 56% 44% 52% 48% / 54% 50% 50% 46% !important; color: #fff !important; text-shadow: 0 1px 2px rgba(0,0,0,.6);
        background: radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.35), transparent 46%), radial-gradient(ellipse 94% 88% at 48% 52%, color-mix(in srgb, var(--c) 82%, #000) 0 86%, transparent 100%), ${NOISE}, linear-gradient(150deg, #cbcfd0, #9ba2a4) !important;
        box-shadow: inset 0 1px 1px rgba(255,255,255,.5), inset 0 -3px 6px rgba(0,0,0,.28), 0 6px 9px rgba(0,0,0,.5) !important; }
      ${P} :is(.key.svc, .appcell.svc) :is(b, small, span, ha-icon) { color: #fff !important; filter: none; }
      ${P} .appcell.svc.on { background: ${DROPS}, radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.35), transparent 46%), radial-gradient(ellipse 94% 88% at 48% 52%, color-mix(in srgb, var(--c) 82%, #000) 0 86%, transparent 100%), ${NOISE}, linear-gradient(150deg, #cbcfd0, #9ba2a4) !important; box-shadow: inset 0 1px 1px rgba(255,255,255,.5), inset 0 -3px 6px rgba(0,0,0,.25), 0 0 14px 1px rgba(60,200,190,.5) !important; }

      /* volume: water in a groove, a grey pebble as the feeler (no waves, no bubbles) */
      ${P} .volslider { -webkit-appearance: none; appearance: none; background: transparent; --wt: linear-gradient(0deg, rgba(0,50,70,.82), rgba(20,140,150,.55) 55%, rgba(120,225,225,.38)); }
      ${P} .volslider.h::-webkit-slider-runnable-track { height: 34px; border-radius: 22px 26px 18px 28px / 24px 20px 28px 22px; background: linear-gradient(180deg, rgba(0,50,70,.82), rgba(20,140,150,.55) 55%, rgba(120,225,225,.38)) 0 0 / calc(var(--v, 0) * 1%) 100% no-repeat, ${NOISE}, linear-gradient(180deg, #171c1e, #2a3133); box-shadow: inset 0 5px 8px rgba(0,0,0,.75), inset 0 -1px 1px rgba(255,255,255,.14); }
      ${P} .volslider.v::-webkit-slider-runnable-track { width: 36px; border-radius: 24px 30px 18px 28px / 22px 26px 30px 20px; background: linear-gradient(90deg, rgba(0,50,70,.82), rgba(20,140,150,.55) 55%, rgba(120,225,225,.38)) 0 100% / 100% calc(var(--v, 0) * 1%) no-repeat, ${NOISE}, linear-gradient(90deg, #171c1e, #2a3133); box-shadow: inset 6px 0 9px rgba(0,0,0,.75), inset -1px 0 1px rgba(255,255,255,.14); }
      ${P} .volslider::-webkit-slider-thumb { -webkit-appearance: none; width: 42px; height: 34px; border: 0; border-radius: 62% 38% 48% 52% / 46% 60% 40% 54%; cursor: pointer;
        background: ${NOISE}, radial-gradient(ellipse at 28% 20%, rgba(255,255,255,.5), transparent 45%), linear-gradient(150deg, #b4bab9, #8a9291); box-shadow: inset 0 -2px 4px rgba(0,0,0,.3), 0 4px 6px rgba(0,0,0,.6); }
      ${P} .volslider.v::-webkit-slider-thumb { margin-left: -3px; }
      ${P} .volslider.h::-moz-range-track { height: 34px; border-radius: 22px; background: linear-gradient(180deg, #171c1e, #2a3133); box-shadow: inset 0 5px 8px rgba(0,0,0,.75); }
      ${P} .volslider::-moz-range-progress { background: rgba(20,140,150,.6); height: 34px; border-radius: 22px; }
      ${P} .volslider::-moz-range-thumb { width: 42px; height: 34px; border: 0; border-radius: 55%; background: linear-gradient(150deg, #b4bab9, #8a9291); }

      /* switch: a groove with a grey pebble; "yes" = water in the groove, the stone stays dry and grey */
      ${P} .sw i { border-radius: 20px 24px 18px 22px / 22px 18px 24px 20px; background: ${NOISE}, linear-gradient(180deg, #171c1e, #2d3436); box-shadow: inset 0 5px 8px rgba(0,0,0,.75), inset 0 -1px 1px rgba(255,255,255,.14); }
      ${P} .sw i::after { top: 4px; left: 4px; width: 22px; height: 20px; border-radius: 55% 45% 50% 50% / 50% 55% 45% 50%; background: ${NOISE}, radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.5), transparent 45%), linear-gradient(150deg, #cdd1d1, #9aa2a4); box-shadow: inset 0 -2px 4px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.6); transition: transform .25s ease-out; }
      ${P} .sw input:checked + i { background: linear-gradient(180deg, rgba(0,50,70,.82), rgba(20,140,150,.55) 55%, rgba(120,225,225,.38)), ${NOISE}, linear-gradient(180deg, #171c1e, #2d3436); box-shadow: inset 0 5px 8px rgba(0,0,0,.6), inset 0 -1px 1px rgba(255,255,255,.14), 0 0 8px rgba(50,200,190,.3); }
      ${P} .sw input:checked + i::after { transform: translateX(18px); }
      ${P} .pwknob { flex: none; position: relative; width: 70px; height: 38px; border-radius: 22px 26px 20px 24px / 24px 20px 26px 22px; background: ${NOISE}, linear-gradient(180deg, #171c1e, #2d3436); box-shadow: inset 0 5px 8px rgba(0,0,0,.75), inset 0 -1px 1px rgba(255,255,255,.14); }
      ${P} .pwknob.on { background: linear-gradient(180deg, rgba(0,50,70,.82), rgba(20,140,150,.55) 55%, rgba(120,225,225,.38)), ${NOISE}, linear-gradient(180deg, #171c1e, #2d3436); }
      ${P} .pwknob .knob { position: absolute; left: 4px; top: 4px; width: 34px; height: 30px; padding: 0; min-height: 0; border: 0 !important; border-radius: 55% 45% 50% 50% / 50% 55% 45% 50% !important; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform .25s ease-out;
        background: ${NOISE}, radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.5), transparent 45%), linear-gradient(150deg, #cdd1d1, #9aa2a4) !important; box-shadow: inset 0 -2px 4px rgba(0,0,0,.3), 0 3px 5px rgba(0,0,0,.6) !important; color: #3b4346 !important; }
      ${P} .pwknob.on .knob { transform: translateX(28px); } ${P} .pwknob .knob ha-icon { --mdc-icon-size: 16px; color: #3b4346 !important; filter: none; }
      ${P} .pwknob.pend .knob { animation: kipend .6s ease-in-out infinite alternate; } @keyframes kipend { from { filter: brightness(.9); } to { filter: brightness(1.15); } }

      /* Fire TV badge: transparent symbol over the original */
      ${P} .fdot { background: transparent !important; box-shadow: none !important; outline: none !important; border: 0 !important; border-radius: 50% !important; width: 16px; height: 16px; --fdc: #7ee0d6; color: #bdf3ee !important; }
      ${P} .fdot ha-icon { --mdc-icon-size: 14px; width: 14px; height: 14px; color: inherit !important; filter: drop-shadow(0 0 1.5px rgba(0,0,0,.95)) drop-shadow(0 0 3px var(--fdc)); }
      ${P} .fdot.f-unknown { opacity: .8; } ${P} .hubtabs button.sel .fdot { color: #0c4a46 !important; --fdc: #bff6ee; }

      /* hold: the stone sinks, water rings spread round it; when it fires the droplets are gone (the running look ends) */
      ${P} .holdoff.holding, ${P} .tile.holdsw.holding, ${P} .tile.locked.holding, ${P} .actbtn.holding { transform: translateY(3px) scale(.97); filter: brightness(.85) saturate(1.2); }
      ${P} .holdoff.holding { box-shadow: inset 0 3px 8px rgba(0,0,0,.4), 0 0 0 calc(var(--p, 0) * .09px) rgba(100,220,210,.42), 0 0 0 calc(var(--p, 0) * .18px) rgba(100,220,210,.2) !important; }
      ${P} .tile.holdsw::after, ${P} .tile.locked::after, ${P} .actbtn.holding::after { background: color-mix(in srgb, #1d8a86 55%, transparent); border-radius: inherit; }
      ${P} .holdoff.fired { filter: brightness(.7); }

      /* painted names (setting): A one colour, B rainbow, C large painted picture with the name engraved below; off = engraved names */
      ${P}.pp-a .tile:not(.off):not(.dev):not(.locked) span { color: var(--pc, #b5342a) !important; text-shadow: none; filter: url(#kiPaintS); font-weight: 700; }
      ${P}.pp-b .tile:not(.off):not(.dev):not(.locked) span { background: linear-gradient(90deg, #c0392b, #d9822b 20%, #c9a21f 40%, #2f9e6f 60%, #2b78c9 80%, #8a4fc9); -webkit-background-clip: text; background-clip: text; color: transparent !important; -webkit-text-fill-color: transparent; text-shadow: none; filter: url(#kiPaintL); font-weight: 700; }
      ${P}.pp-c .tile:not(.off):not(.dev):not(.locked) { flex-direction: column; gap: 2px; min-height: 76px; }
      ${P}.pp-c .tile:not(.off):not(.dev):not(.locked) ha-icon { --mdc-icon-size: 38px; }
      ${P}.pp-c .tile:not(.off):not(.dev):not(.locked) span { font-size: .82em; letter-spacing: .02em; }
      ${P}.pp-off .tile:not(.off):not(.dev):not(.locked) ha-icon { color: #4d5759 !important; filter: none; }
      ${P} .tile:not(.off):not(.dev):not(.locked) ha-icon { filter: url(#kiPaintL) drop-shadow(0 0 .6px rgba(0,0,0,.5)); }
      ${P}.pp-a .tile:not(.off):not(.dev):not(.locked):nth-child(6n+1), ${P}.pp-c .tile:not(.off):not(.dev):not(.locked):nth-child(6n+1) { --pc: ${ACTCOL[0]}; }
      ${P} .tile:not(.off):not(.dev):not(.locked):nth-child(6n+1) ha-icon { color: ${ACTCOL[0]}; } ${P} .tile:not(.off):not(.dev):not(.locked):nth-child(6n+2) ha-icon { color: ${ACTCOL[1]}; }
      ${P} .tile:not(.off):not(.dev):not(.locked):nth-child(6n+3) ha-icon { color: ${ACTCOL[2]}; } ${P} .tile:not(.off):not(.dev):not(.locked):nth-child(6n+4) ha-icon { color: ${ACTCOL[3]}; }
      ${P} .tile:not(.off):not(.dev):not(.locked):nth-child(6n+5) ha-icon { color: ${ACTCOL[4]}; } ${P} .tile:not(.off):not(.dev):not(.locked):nth-child(6n+6) ha-icon { color: ${ACTCOL[5]}; }
      ${P} .tile.on:not(.off) ha-icon, ${P} .tile.going:not(.off) ha-icon { filter: url(#kiPaintL) drop-shadow(0 0 .6px rgba(0,0,0,.5)); }
      ${P}.pp-a .tile:not(.off):not(.dev):not(.locked):nth-child(6n+2) span { --pc: #9a7a00; } ${P}.pp-a .tile:not(.off):not(.dev):not(.locked):nth-child(6n+3) span { --pc: #0f7a72; }
      ${P}.pp-a .tile:not(.off):not(.dev):not(.locked):nth-child(6n+4) span { --pc: #b3601a; } ${P}.pp-a .tile:not(.off):not(.dev):not(.locked):nth-child(6n+5) span { --pc: #1f5fa3; } ${P}.pp-a .tile:not(.off):not(.dev):not(.locked):nth-child(6n+6) span { --pc: #7a3fa3; }
      ${P}.pp-a :is(.etitle, .esub), ${P}.pp-c :is(.etitle, .esub) { color: ${CREAM}; filter: url(#kiPaintS); }
      ${P}.pp-b :is(.etitle, .esub) { background: linear-gradient(90deg, #ff8a7a, #ffc46b 25%, #f3e27a 45%, #7be0a8 65%, #78b8ff 85%, #c9a3ff); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; filter: url(#kiPaintS); }
      ${P}.pp-off :is(.etitle, .esub) { color: #9aabac; }

      @media (prefers-reduced-motion: reduce) { ${P} *, ${P} *::after { animation: none !important; transition: none !important; } }

      /* ---------- Softer hold effects (0.23): no ring round the symbol; the whole key turns red step by step / the backlight grows ---------- */
      ${G} .holdoff.holding { --gc: var(--gl-red); --k: calc(var(--p, 0) * .85); background: ${SPOT}, ${SHEEN}, var(--gl-base) !important; color: color-mix(in srgb, #fff calc(var(--p, 0) * 1%), var(--gl-rest)) !important;
        border-color: color-mix(in srgb, var(--gl-red) calc(var(--p, 0) * .6%), rgba(255,255,255,.2)) !important;
        box-shadow: inset 0 0 calc(var(--p, 0) * .3px) color-mix(in srgb, var(--gl-red) calc(var(--p, 0) * .4%), transparent), 0 0 calc(var(--p, 0) * .5px) color-mix(in srgb, var(--gl-red) calc(var(--p, 0) * .8%), transparent) !important; }
      ${G} .holdoff.holding ha-icon { color: color-mix(in srgb, #fff calc(var(--p, 0) * 1%), var(--gl-red)) !important; }
      ${G} .holdoff.fired { --gc: var(--gl-red); --k: 85; background: ${SPOT}, ${SHEEN}, var(--gl-base) !important; box-shadow: inset 0 0 26px color-mix(in srgb, var(--gl-red) 40%, transparent), 0 0 40px color-mix(in srgb, var(--gl-red) 80%, transparent) !important; }
      ${G} .holdoff.fired ha-icon { color: #fff !important; }
      ${C} .holdoff.holding { background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.7) 0 6%, rgba(255,255,255,0) 28%), radial-gradient(circle at 50% 120%, rgba(120,20,5,.4), transparent 60%), color-mix(in srgb, var(--cl-coral) calc(var(--p, 0) * 1%), var(--cl-green)) !important;
        transform: scale(.97, .92) translateY(4px); }
      ${C} .holdoff.holding ha-icon { color: color-mix(in srgb, #fff calc(var(--p, 0) * 1%), var(--hr-text)) !important; }
      ${C} .holdoff.fired { background: radial-gradient(circle at 30% 22%, rgba(255,255,255,.7) 0 6%, rgba(255,255,255,0) 28%), var(--cl-coral) !important; } ${C} .holdoff.fired ha-icon { color: #fff !important; }
      ${C} .tile.holdsw::after, ${C} .tile.locked::after, ${C} .actbtn.holding::after { background: color-mix(in srgb, var(--cl-coral) 85%, transparent); border-radius: inherit; }
`;
