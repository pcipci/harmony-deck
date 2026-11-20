// Style sheet of the cards.
import { SKIN_CSS } from "../shared/skin-css.js";

export const styleMixin = {
  _style() {
    const cols = Number(this._config.columns) || 3;
    return `<style>
      :host { --hr-accent: var(--primary-color); --hr-on-accent: var(--text-primary-color, #fff); --hr-text: var(--primary-text-color);
        --hr-muted: var(--secondary-text-color); --hr-tile-bg: var(--secondary-background-color); --hr-key-bg: var(--secondary-background-color);
        --hr-radius: 14px; --hr-tile-radius: 16px; --hr-panel-bg: transparent; --hr-danger: var(--error-color, #db4437); }
      ha-card { position: relative; padding: 16px; display: flex; flex-direction: column; gap: 22px; color: var(--hr-text);
        background: var(--hr-frame, var(--hr-card-bg, var(--card-background-color))); }
      .edit { position: absolute; top: 8px; right: 8px; border: none; background: var(--hr-tile-bg); color: var(--hr-muted); cursor: pointer; opacity: 0.85; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
      .edit:hover { opacity: 1; }
      section { display: flex; flex-direction: column; gap: 14px; }
      .below { display: flex; flex-direction: column; gap: 16px; } .pwrap, .pcol, .pside, .xwide { display: contents; }
      .physoffer { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: color-mix(in srgb, var(--hr-accent) 14%, transparent); font-size: 0.9em; } .physoffer span { flex: 1; } .physoffer button { border: none; border-radius: 10px; padding: 8px 14px; font: inherit; cursor: pointer; background: var(--hr-key-bg); color: var(--hr-text); } .physoffer button.yes { background: var(--hr-accent); color: var(--hr-on-accent); }
            @container (min-width: 900px) {
        .lay-auto section:has(> .below), .lay-wide section:has(> .below) { display: grid; grid-template-columns: 210px minmax(0, 1fr); column-gap: 22px; row-gap: 0; align-items: start;
          grid-template-areas: "hdr hdr" "box box" "link link" "seg below" "cap below" "pager below"; grid-template-rows: auto auto auto auto auto 1fr; }
        .lay-auto section:has(> .below) > *, .lay-wide section:has(> .below) > * { min-width: 0; margin-bottom: 12px; }
        .lay-auto section:has(> .below) > .hdr, .lay-wide section:has(> .below) > .hdr { grid-area: hdr; display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
        .lay-auto section:has(> .below) > .hdr .hubtabs, .lay-wide section:has(> .below) > .hdr .hubtabs { margin: 0; flex: 0 1 auto; } .lay-auto section:has(> .below) .hubtabs button, .lay-wide section:has(> .below) .hubtabs button { flex: 0 0 auto; }
        .lay-auto section > .helpbox, .lay-wide section > .helpbox, .lay-auto section > .infopanel, .lay-wide section > .infopanel { grid-area: box; }
        .lay-auto section > .linkbar, .lay-wide section > .linkbar { grid-area: link; }
        .lay-auto section > .seg, .lay-wide section > .seg { grid-area: seg; }
        .lay-auto section > .stripcap, .lay-wide section > .stripcap { grid-area: cap; display: block; font-size: 0.68em; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; color: var(--hr-muted); margin-bottom: 6px; }
        .lay-auto section > .pager, .lay-wide section > .pager { grid-area: pager; }
        .lay-auto section > .below, .lay-wide section > .below { grid-area: below; margin-bottom: 0; }
        .lay-auto .rooms-lab, .lay-wide .rooms-lab, .lay-auto .hubtabs small, .lay-wide .hubtabs small { display: inline; }
        .lay-auto section:has(> .below) .seg .lab span, .lay-wide section:has(> .below) .seg .lab span { display: none; }
        .lay-auto section:has(> .below) .grid, .lay-wide section:has(> .below) .grid { grid-template-columns: 1fr !important; }
        .lay-auto section:has(> .below) .grid .tile, .lay-wide section:has(> .below) .grid .tile { flex-direction: row; justify-content: flex-start; gap: 10px; min-height: 46px; padding: 8px 12px; text-align: left; grid-column: auto !important; }
        .lay-auto section:has(> .below) .grid .tile.off, .lay-wide section:has(> .below) .grid .tile.off { justify-content: center; }
        .lay-auto section:has(> .below) .devlist, .lay-wide section:has(> .below) .devlist { grid-template-columns: 1fr !important; }
        .lay-auto section:has(> .below) .tile.dev, .lay-wide section:has(> .below) .tile.dev { flex-direction: row; justify-content: flex-start; gap: 10px; min-height: 46px; padding: 8px 12px; text-align: left; flex-wrap: wrap; }
        .lay-auto section:has(> .below) .tile.dev small, .lay-wide section:has(> .below) .tile.dev small { flex-basis: 100%; padding-left: 34px; margin-top: -6px; text-align: left; }
        .lay-auto .below .directbox .cells, .lay-wide .below .directbox .cells { grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); }
        .lay-auto .below, .lay-wide .below { display: grid; grid-template-columns: minmax(300px, 460px) repeat(auto-fill, minmax(250px, 1fr)); grid-auto-flow: dense; gap: 16px; align-items: start; }
        .lay-auto .below > .pwrap, .lay-wide .below > .pwrap, .lay-auto .below .pside, .lay-wide .below .pside, .lay-auto .below .xwide, .lay-wide .below .xwide { display: contents; }
        .lay-auto .below .pcol, .lay-wide .below .pcol { display: flex; flex-direction: column; gap: 16px; grid-column: 1; grid-row: span 4; }
        .lay-auto .below .pcol .panel, .lay-wide .below .pcol .panel { margin: 0; max-width: none; }
        .lay-auto .below > .devremote, .lay-wide .below > .devremote { display: contents; }
        .lay-auto .below .devhead, .lay-wide .below .devhead, .lay-auto .below .block.power, .lay-wide .below .block.power { grid-column: 1 / -1; }
        .lay-auto .below .block.kbd, .lay-wide .below .block.kbd, .lay-auto .below .block.sym, .lay-wide .below .block.sym,
        .lay-auto .below .block.wide, .lay-wide .below .block.wide, .lay-auto .below .block.short, .lay-wide .below .block.short,
        .lay-auto .below .block.direct, .lay-wide .below .block.direct, .lay-auto .below .block.numpad, .lay-wide .below .block.numpad { grid-column: 1 / -1; }
      }
      .lay-narrow .pwrap { display: contents; }
      .head { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-right: 28px; }
      .hub { font-size: 1.1em; font-weight: 500; }
      .status { display: inline-flex; align-items: center; gap: 8px; font-size: 0.85em; padding: 5px 12px 5px 10px; border-radius: 999px; background: transparent; color: var(--hr-muted);
        border: 1px solid var(--divider-color, rgba(128,128,128,.35)); }
      .sdot { width: 8px; height: 8px; border-radius: 50%; background: var(--hr-muted); opacity: .55; flex: none; }
      .status.active { background: color-mix(in srgb, var(--hr-accent) 14%, transparent); color: var(--hr-accent); border-color: color-mix(in srgb, var(--hr-accent) 45%, transparent); }
      .status.active .sdot { background: var(--hr-accent); opacity: 1; box-shadow: 0 0 8px var(--hr-accent); }
      .status.busy .sdot { animation: pulse 1s ease-in-out infinite; }
      .locked { opacity: 0.35; filter: grayscale(1); pointer-events: none; }
      .tile.locked { pointer-events: auto; cursor: not-allowed; opacity: 0.7; filter: none; position: relative; overflow: hidden; background: linear-gradient(rgba(108,140,255,.16), rgba(108,140,255,.16)), var(--hr-tile-bg); }
      .tile .lockic { position: absolute; top: 6px; right: 6px; --mdc-icon-size: 16px !important; color: #8fa6ff !important; }
      .tile.locked::after { content: ""; position: absolute; inset: 0; background: color-mix(in srgb, var(--hr-accent) 45%, transparent); transform: scaleY(0); transform-origin: bottom; pointer-events: none; }
      .tile.locked.holding::after { transform: scaleY(1); transition: transform .7s linear; }
      .tile.holdsw { position: relative; overflow: hidden; -webkit-touch-callout: none; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
      .tile.holdsw::after { content: ""; position: absolute; inset: 0; background: color-mix(in srgb, var(--hr-accent) 45%, transparent); transform: scaleY(0); transform-origin: bottom; pointer-events: none; }
      .tile.holdsw.holding::after { transform: scaleY(1); transition: transform .7s linear; }
      .tile.seclocked { cursor: not-allowed; }
      .tile.seclocked[data-hint]::before { content: attr(data-hinttext); position: absolute; left: 4px; right: 4px; bottom: 4px; z-index: 2; background: #222; color: #fff; padding: 3px 6px; border-radius: 8px; font-size: 0.7rem; text-align: center; pointer-events: none; }
      .tile.holdsw[data-hint]::before { content: attr(data-hinttext); position: absolute; left: 4px; right: 4px; bottom: 4px; z-index: 2; background: #222; color: #fff; padding: 3px 6px; border-radius: 8px; font-size: 0.7rem; text-align: center; pointer-events: none; }
      .tile.ts-text { min-height: 56px; } .tile.ts-icon { min-height: 64px; } .tile.ts-icon ha-icon { --mdc-icon-size: 32px; }
      .colorful .cell ha-icon, .colorful .helpkey.inp ha-icon { color: var(--hr-accent); }
      .colorful .power .key ha-icon { color: var(--hr-text); }
      .colorful .key.pon ha-icon { color: #43a047; } .colorful .key.poff ha-icon { color: #e53935; }
      .colorful .rocker .rk ha-icon { color: var(--hr-text); }
      .kbd { gap: 6px; } .kbhead { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
      .kbsw { display: flex; gap: 2px; padding: 2px; border-radius: 8px; background: var(--hr-tile-bg); }
      .kbsw button { border: none; font: inherit; font-size: 0.7em; padding: 3px 8px; border-radius: 6px; background: none; color: var(--hr-muted); cursor: pointer; } .kbsw button.sel { background: var(--hr-accent); color: var(--hr-on-accent); }
      .kbrow { display: flex; gap: 4px; } .kbrow.f .kk { font-size: 0.68em; }
      .kbtools { display: flex; gap: 8px; justify-content: flex-end; } .physsw { display: flex; align-items: center; gap: 8px; text-transform: none; letter-spacing: 0; font-size: 1.05em; color: var(--hr-text); }
      .physlive { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: 14px; background: color-mix(in srgb, var(--hr-accent) 12%, transparent); color: var(--hr-accent); }
      .physlive div { flex: 1; color: var(--hr-text); font-size: 0.9em; } .physlive small { display: block; color: var(--hr-muted); } .block.physon { outline: 2px solid var(--hr-accent); outline-offset: -2px; }
      .kk.ic { flex-direction: column; gap: 1px; } .kk.ic span { font-size: 0.6em; color: var(--hr-muted); line-height: 1; } .kk.ic ha-icon { --mdc-icon-size: 17px !important; }
      .kk.isfav.shiftkey { background: var(--hr-accent); color: var(--hr-on-accent); } .kk.shiftkey.isfav span { color: var(--hr-on-accent); }
      @container (max-width: 380px) { .kk.ic span { display: none; } }
      .block.sym .cells { grid-template-columns: repeat(auto-fill, minmax(40px, 1fr)); } .block.wide .cells { grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); } .kbrow.m .kk { max-width: none; }
      .block.short .cells { grid-template-columns: repeat(auto-fill, minmax(84px, 1fr)); } .block.short .cell { white-space: nowrap; }
      .kk { flex: 1 1 0; min-width: 0; min-height: 38px !important; padding: 0 !important; font-size: 0.85em; justify-content: center; } .kk.ghost { background: none; }
      .kk.space { flex: 4 1 0; } .kk.enter { flex: 1.5 1 0; } .kbrow.m .kk { font-size: 0.72em; }
      .infohead { display: flex; align-items: center; gap: 10px; padding-bottom: 8px; margin-bottom: 4px; border-bottom: 1px solid color-mix(in srgb, var(--hr-muted) 25%, transparent); }
      .infohead .sdot.ok { background: #43a047; opacity: 1; box-shadow: 0 0 8px #43a047; } .infohead .sdot.bad { background: var(--hr-danger); opacity: 1; }
      .infohead b { flex: 1; font-weight: 500; } .infohead span { color: var(--hr-muted); font-size: 0.9em; }
      .directbox { display: flex; flex-direction: column; gap: 8px; } .block.direct summary { cursor: pointer; }
      .dnow { display: flex; align-items: center; gap: 8px; font-size: 0.85em; color: var(--hr-accent); } .dnow ha-icon { --mdc-icon-size: 18px; }
      .key.svc { background: var(--c); color: var(--fg); }
      .key.svc ha-icon { color: var(--fg); --mdc-icon-size: 26px; } .key.svc small { font-size: 0.72em; opacity: .9; } .appcell.svc { min-height: 46px; } .key.svc b { font-size: 0.92em; font-weight: 700; letter-spacing: -0.01em; text-align: center; line-height: 1.1; }
      .appcell.svc.on { box-shadow: inset 0 0 0 2px #fff, 0 0 12px 1px var(--c); }
      .appcell.svc.starting { animation: svcpulse 1.1s ease-in-out infinite; }
      @keyframes svcpulse { 0%, 100% { box-shadow: inset 0 0 0 2px #fff8, 0 0 6px 0 var(--c); filter: brightness(1); } 50% { box-shadow: inset 0 0 0 2px #fff, 0 0 20px 4px var(--c); filter: brightness(1.25); } }
      .key.color span { font-size: 0.62em; font-weight: 700; color: #fff; text-shadow: 0 0 2px rgba(0,0,0,.6); }
      .ic-row.on { transform: translateY(1px); box-shadow: inset 0 2px 5px rgba(0,0,0,.4), inset 0 0 0 2px var(--hr-accent); background: linear-gradient(color-mix(in srgb, var(--hr-accent) 18%, transparent), color-mix(in srgb, var(--hr-accent) 18%, transparent)), var(--hr-key-bg); }
      .ic-row.on ha-icon { color: var(--hr-accent) !important; }
      .dtext { display: flex; gap: 6px; } .dtext input { flex: 1; min-width: 0; font: inherit; padding: 10px 12px; border-radius: var(--hr-radius); border: 1px solid var(--divider-color, #444); background: var(--hr-tile-bg); color: var(--hr-text); }
      .dtext .key { width: 42px; flex: none; } .dtext .key ha-icon { --mdc-icon-size: 22px; } .appcell, .ic-row { flex-direction: column; min-height: 58px; gap: 4px; } .appcell ha-icon, .ic-row ha-icon { --mdc-icon-size: 22px; } .appcell span, .ic-row span { font-size: 0.78em; }
      .raw pre { max-height: 220px; overflow: auto; font-size: 0.72em; margin: 8px 0 0; color: var(--hr-muted); white-space: pre-wrap; } .raw summary { cursor: pointer; }
      .linkbar { display: flex; align-items: center; gap: 10px; padding: 8px 8px 8px 14px; border-radius: 999px; font-size: 0.85em;
        background: color-mix(in srgb, var(--hr-accent) 14%, var(--hr-tile-bg)); }
      .linkbar ha-icon { --mdc-icon-size: 18px; color: var(--hr-accent); flex: none; }
      .linkbar { flex-wrap: wrap; border-radius: 22px; } .linkbar span { flex: 1 1 150px; min-width: 0; } .linkbar button { margin-left: auto; }
      .linkbar button { border: none; cursor: pointer; font: inherit; padding: 6px 14px; border-radius: 999px; background: var(--hr-accent); color: var(--hr-on-accent); white-space: nowrap; }
      .helpbtn { display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box; border: none; cursor: pointer; font: inherit; font-size: 0.9em; padding: 10px 14px;
        border-radius: 999px; background: var(--hr-tile-bg); color: var(--hr-muted); }
      .helpbtn span { flex: 1; text-align: left; }
      .helpbtn ha-icon { --mdc-icon-size: 20px; }
      .helpbtn.sel { color: var(--hr-accent); }
      .helpbox { display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 18px; background: color-mix(in srgb, var(--hr-accent) 8%, var(--hr-tile-bg));
        border: 1px solid color-mix(in srgb, var(--hr-accent) 22%, transparent); animation: drop .18s ease-out; }
      @keyframes drop { from { opacity: 0; transform: translateY(-6px); } }
      .htitle { font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.08em; color: var(--hr-muted); }
      .hlist { display: flex; flex-direction: column; gap: 8px; }
      .hrow { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border-radius: 14px; background: var(--hr-card-bg, var(--card-background-color)); }
      .hdev { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
      .hdev ha-icon { --mdc-icon-size: 28px; color: var(--hr-accent); flex: none; }
      .hdev span { font-size: 0.9em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; flex-direction: column; }
      .hdev span small { font-size: 0.78em; color: var(--hr-muted); } .nocmd { color: var(--hr-muted); font-size: 0.75em; }
      .hkeys { display: flex; gap: 6px; flex: none; }
      .helpkey { flex: none; min-width: 46px; min-height: 40px; gap: 6px; font-size: 0.85em; padding: 0 12px; }
      .helpkey ha-icon { --mdc-icon-size: 20px; }
      .helpkey b { font-weight: 500; white-space: nowrap; }
      .helpall { display: flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; font: inherit; padding: 12px; border-radius: var(--hr-radius);
        background: var(--hr-accent); color: var(--hr-on-accent); }
      .helpall ha-icon { --mdc-icon-size: 20px; }
      .busy { animation: pulse 1.4s ease-in-out infinite; }
      .grid { display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: 10px; }
      .tile { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; min-height: 80px; padding: 10px 6px;
        border: none; border-radius: var(--hr-tile-radius); cursor: pointer; font: inherit; color: var(--hr-text); background: var(--hr-tile-bg);
        transition: background 0.2s, color 0.2s, transform 0.1s; }
      .tile:active { transform: scale(0.97); }
      .tile ha-icon { --mdc-icon-size: 28px; color: var(--hr-muted); }
      .tile span { font-size: 0.85em; line-height: 1.2; text-align: center; overflow-wrap: anywhere; }
      .tile.on { background: color-mix(in srgb, var(--hr-accent) 14%, var(--hr-tile-bg)); color: var(--hr-accent); box-shadow: inset 0 0 0 2px var(--hr-accent), 0 0 14px color-mix(in srgb, var(--hr-accent) 40%, transparent); }
      .tile.on ha-icon { color: var(--hr-accent); }
      .as-icon .tile.on { background: var(--hr-tile-bg); color: var(--hr-text); box-shadow: none; font-weight: 700; }
      .as-icon .tile.on ha-icon { color: var(--hr-accent); filter: drop-shadow(0 0 5px var(--hr-accent)) drop-shadow(0 0 12px color-mix(in srgb, var(--hr-accent) 55%, transparent)); }
      .as-icon .tile.dev.sel { outline: none; background: var(--hr-tile-bg); font-weight: 700; } .as-icon .tile.dev.sel ha-icon { color: var(--hr-accent); filter: drop-shadow(0 0 5px var(--hr-accent)) drop-shadow(0 0 12px color-mix(in srgb, var(--hr-accent) 55%, transparent)); }
      .as-icon .tile.on.ts-text { background: var(--hr-tile-bg); color: var(--hr-accent); box-shadow: none; font-weight: 700; text-shadow: 0 0 6px var(--hr-accent), 0 0 14px color-mix(in srgb, var(--hr-accent) 60%, transparent); }
      .as-fill .tile.on { background: var(--hr-accent); color: var(--hr-on-accent); box-shadow: none; } .as-fill .tile.on ha-icon { color: var(--hr-on-accent); }
      .tile.going { animation: pulse 1.4s ease-in-out infinite; outline: 2px solid var(--hr-accent); outline-offset: -2px; }
      .tile.off { flex-direction: row; gap: 10px; }
      .tile.off ha-icon { color: var(--hr-danger); --mdc-icon-size: 34px; } .tile.off.fired ha-icon { color: #fff; }
      .edit-tile { position: relative; } .edit-tile.hid { opacity: 0.4; }
      .edit-tile input { position: absolute; top: 8px; left: 8px; accent-color: var(--hr-accent); }
      .editbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--hr-muted); font-size: 0.9em; }
      .editbar select { font: inherit; padding: 4px 8px; border-radius: 8px; background: var(--hr-select-bg, var(--hr-tile-bg)); color: var(--hr-text); border: 1px solid var(--divider-color, #444); }
      .panel { display: grid; --c1: 64px; --c3: 64px; grid-template-columns: var(--c1) minmax(0, 1fr) var(--c3); align-items: center; gap: 10px; padding: 14px 8px; border-radius: 24px; background: var(--hr-panel-bg); }
      .rocker { display: flex; flex-direction: column; align-items: stretch; gap: 6px; padding: 6px; border-radius: var(--hr-rocker-radius, 32px); background: var(--hr-tile-bg); height: 100%; justify-content: space-between; }
      .rocker.none { background: none; }
      .rl { font-size: 0.8em; font-weight: 600; text-align: center; color: var(--hr-muted); text-transform: uppercase; letter-spacing: 0.05em; }
      .key { border: none; cursor: pointer; touch-action: manipulation; color: var(--hr-text); background: var(--hr-key-bg);
        display: flex; align-items: center; justify-content: center; font: inherit; border-radius: var(--hr-radius); box-shadow: var(--hr-key-shadow, none); }
      .key ha-icon { --mdc-icon-size: 26px; }
      .key:active, .key.lit { background: var(--hr-accent); color: var(--hr-on-accent); }
      .ks-flat .key, .ks-flat .tile, .ks-flat .rocker, .ks-flat .dpad { box-shadow: none; background-image: none; }
      .ks-raised .key:not(.ghost):not(.lit) { box-shadow: inset 0 1px 0 rgba(255,255,255,.14), inset 0 -2px 0 rgba(0,0,0,.25), 0 2px 4px rgba(0,0,0,.35); background-image: linear-gradient(rgba(255,255,255,.07), rgba(0,0,0,.08)); }
      .ks-raised .key:active { transform: translateY(1px); box-shadow: inset 0 2px 3px rgba(0,0,0,.35); }
      .key { --lc: var(--hr-accent); transition: box-shadow .2s, background .2s, color .2s, filter .2s; } .key.svc { --lc: var(--c); }
      .g-ring .key:active, .g-glow .key:active, .g-see .key:active, .g-both .key:active { background: var(--hr-key-bg); color: var(--hr-text); }
      .g-ring .key.svc:active, .g-glow .key.svc:active, .g-see .key.svc:active, .g-both .key.svc:active { background: var(--c); color: var(--fg); }
      .g-ring .key.lit, .g-ring .tile.lit { background: var(--hr-key-bg); color: var(--lc, var(--hr-accent)); box-shadow: inset 0 0 0 2px var(--lc, var(--hr-accent)); }
      .g-see .key.lit, .g-see .tile.lit { background: color-mix(in srgb, var(--lc, var(--hr-accent)) 10%, transparent); color: var(--lc, var(--hr-accent)); text-shadow: 0 0 8px var(--lc, var(--hr-accent)); box-shadow: inset 0 0 0 2px var(--lc, var(--hr-accent)), inset 0 0 18px color-mix(in srgb, var(--lc, var(--hr-accent)) 45%, transparent); }
      .g-glow .key.lit, .g-glow .tile.lit { background: var(--hr-key-bg); color: var(--lc, var(--hr-accent)); box-shadow: 0 0 14px 2px var(--lc, var(--hr-accent)), inset 0 0 0 1px var(--lc, var(--hr-accent)); }
      .g-both .key.lit, .g-both .tile.lit { background: color-mix(in srgb, var(--lc, var(--hr-accent)) 10%, transparent); color: var(--lc, var(--hr-accent)); text-shadow: 0 0 8px var(--lc, var(--hr-accent)); box-shadow: 0 0 16px 3px color-mix(in srgb, var(--lc, var(--hr-accent)) 70%, transparent), inset 0 0 0 2px var(--lc, var(--hr-accent)), inset 0 0 18px color-mix(in srgb, var(--lc, var(--hr-accent)) 45%, transparent); }
      .g-ring .key.svc.lit, .g-glow .key.svc.lit, .g-see .key.svc.lit, .g-both .key.svc.lit { background: color-mix(in srgb, var(--c) 18%, var(--hr-tile-bg, #222)); color: #fff; }
      .g-ring .key.svc.lit ha-icon, .g-see .key.svc.lit ha-icon, .g-glow .key.svc.lit ha-icon, .g-both .key.svc.lit ha-icon { color: #fff; }
      .g-ring .key.color.lit, .g-glow .key.color.lit, .g-see .key.color.lit, .g-both .key.color.lit { color: inherit; text-shadow: none; }
      .key.ghost { background: none; cursor: default; }
      .rk { min-height: 52px; border-radius: var(--hr-rk-radius, 26px); } .rk.spacer { min-height: 52px; }
      .padwrap { display: flex; flex-direction: column; align-items: center; gap: 12px; }
      .pills { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; width: 100%; }
      .pill.ghost { display: none; }
      .pill { min-height: 38px; font-size: 0.8em; gap: 6px; }
      .pill ha-icon { --mdc-icon-size: 18px; }
      .dpad { position: relative; width: min(100%, 220px); aspect-ratio: 1; border-radius: var(--hr-dpad-radius, 50%); background: var(--hr-tile-bg);
        display: grid; grid-template: "a u c" 1fr "l o r" 1fr "e d g" 1fr / 1fr 1fr 1fr; place-items: center; }
      .d { width: 100%; height: 100%; background: none; border-radius: var(--hr-d-big, 50%); } .d ha-icon { --mdc-icon-size: 32px; }
      .d.up { grid-area: u; border-radius: var(--hr-d-big, 50%) var(--hr-d-big, 50%) var(--hr-d-small, 8px) var(--hr-d-small, 8px); } .d.down { grid-area: d; border-radius: var(--hr-d-small, 8px) var(--hr-d-small, 8px) var(--hr-d-big, 50%) var(--hr-d-big, 50%); }
      .d.left { grid-area: l; border-radius: var(--hr-d-big, 50%) var(--hr-d-small, 8px) var(--hr-d-small, 8px) var(--hr-d-big, 50%); } .d.right { grid-area: r; border-radius: var(--hr-d-small, 8px) var(--hr-d-big, 50%) var(--hr-d-big, 50%) var(--hr-d-small, 8px); }
      .d.ok { grid-area: o; width: 84%; height: 84%; border-radius: var(--hr-ok-radius, 50%); background: var(--hr-key-bg); font-weight: 600; letter-spacing: 0.04em; }
      .transport { display: flex; gap: 8px; } .transport .key { flex: 1; min-height: 46px; }
      .colors { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
      .color { width: 100%; height: 12px; border-radius: 6px; min-height: 0; }
      .color.red { background: #e53935; } .color.green { background: #43a047; } .color.yellow { background: #fdd835; } .color.blue { background: #1e88e5; }
      .compactvol .hrow { display: flex; gap: 8px; } .compactvol .key { flex: 1; min-height: 46px; }
      .devices { border-top: 1px solid var(--divider-color, rgba(128,128,128,.3)); padding-top: 10px; }
      .devices summary { cursor: pointer; color: var(--hr-muted); font-size: 0.9em; padding: 4px 0; }
      .dgroup { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
      .dname { font-size: 0.75em; text-transform: uppercase; letter-spacing: 0.06em; color: var(--hr-muted); }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .chip { padding: 8px 14px; font-size: 0.85em; gap: 6px; border-radius: 999px; } .chip ha-icon { --mdc-icon-size: 18px; }
      ha-card { container-type: inline-size; }
      .hdr { display: contents; }
      .hubtabs { display: flex; align-items: center; gap: 6px; overflow-x: auto; scrollbar-width: none; margin-bottom: -4px; }
      .rooms-lab { display: none; font-size: 0.68em; font-weight: 600; letter-spacing: .12em; color: var(--hr-muted); text-transform: uppercase; margin-right: 4px; }
      .hubtabs button { flex: 1 0 auto; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; font: inherit; padding: 6px 12px 6px 6px; border-radius: 999px; cursor: pointer; white-space: nowrap; background: transparent; color: var(--hr-muted); position: relative; }
      .hubtabs .ico { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--hr-tile-bg); }
      .hubtabs ha-icon { --mdc-icon-size: 18px; }
      .hubtabs small { display: none; font-size: 0.78em; opacity: .75; }
      .hubtabs button.sel { color: var(--hr-text); font-weight: 700; } .hubtabs button.sel .ico { background: var(--hr-accent); color: var(--hr-on-accent); }
      .hubtabs .ico { position: relative; } .hubtabs button.live:not(.sel) .ico::after { display: none; } .hubtabs button.live:not(.sel) .ico ha-icon { color: var(--hr-accent); filter: drop-shadow(0 0 5px var(--hr-accent)); } .hubtabs button.live.sel .ico { box-shadow: 0 0 10px color-mix(in srgb, var(--hr-accent) 70%, transparent); }
      .erow span ha-icon { display: inline-flex; vertical-align: middle; --mdc-icon-size: 20px; margin-right: 4px; }
      .hubtabs button.off { opacity: 0.45; }
      .stripcap { display: none; }
      :host { --hr-fire: #ff9900; }
      ha-card[data-skin="pebble"], ha-card[data-skin="classic"] { --hr-fire: #19b6c9; }
      .fdot { position: absolute; right: -5px; bottom: -5px; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--hr-card-bg, var(--card-background-color, #1e2126)); color: var(--hr-fire); box-shadow: 0 0 0 1px var(--hr-card-bg, var(--card-background-color, #1e2126)); }
      .fdot ha-icon { --mdc-icon-size: 12px; width: 12px; height: 12px; filter: drop-shadow(0 0 3px var(--hr-fire)); }
      .fdot.f-unknown { color: var(--hr-muted); opacity: .75; } .fdot.f-unknown ha-icon { filter: none; }
      .infoitem .sample { flex: none; width: 24px; height: 24px; position: relative; display: flex; align-items: center; justify-content: center; } .infoitem .sample .fdot { position: static; } .infoitem .sample ha-icon { color: var(--hr-muted); }
      .infoitem .sample .ico.lit { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--hr-tile-bg); } .infoitem .sample .ico.lit ha-icon { --mdc-icon-size: 16px; color: var(--hr-accent); filter: drop-shadow(0 0 4px var(--hr-accent)); }
      .sdot.lit { background: var(--hr-accent); opacity: 1; box-shadow: 0 0 8px var(--hr-accent); }
      .firechip { box-sizing: border-box; display: inline-flex; align-items: center; gap: 4px; font-size: 0.8em; color: var(--hr-muted); padding: 2px 4px 2px 10px; border-radius: 999px; border: 1px solid var(--hr-tile-bg); max-width: 100%; }
      .appbadge { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: var(--c); color: var(--fg); font-style: normal; overflow: hidden; }
      .appbadge b { font-size: 9px; letter-spacing: -0.02em; line-height: 1; } .appbadge ha-icon { --mdc-icon-size: 13px; color: var(--fg); }
      .firechip > ha-icon { --mdc-icon-size: 16px; } .firechip > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .firechip.f-playing, .firechip.f-on { color: var(--hr-fire); border-color: currentColor; }
      .firechip .ib { padding: 2px; min-width: 0; width: 28px; height: 28px; background: none; --mdc-icon-size: 18px; color: inherit; }
      .tip { margin-left: 6px; cursor: help; color: var(--hr-muted); font-size: 0.9em; position: relative; text-transform: none; letter-spacing: 0; font-weight: 400; outline: none; }
      .tip:hover::after, .tip:focus::after { content: attr(data-tip); position: absolute; left: 0; top: 1.7em; z-index: 20; width: max-content; max-width: min(260px, 70vw); white-space: normal; padding: 8px 10px; border-radius: 8px; font-size: 12px; line-height: 1.35; color: var(--primary-text-color); background: var(--card-background-color, #fff); box-shadow: 0 4px 16px rgba(0,0,0,.35); border: 1px solid var(--divider-color, rgba(128,128,128,.4)); }
      label.erow.approw { display: flex; align-items: center; justify-content: flex-start; gap: 8px; flex: 1 1 45%; min-height: 0; }
      .appname { display: inline-flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
      .abadge { flex: none; --mdc-icon-size: 18px; width: 18px; height: 18px; vertical-align: middle; cursor: help; }
      .abadge.s-unv { color: #e0a100; } .abadge.s-ok { color: #3fa968; } .abadge.s-bad { color: #d6483f; }
      .pkgleg { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; } .pkgleg .abadge { margin-left: 8px; }
      .mini { background: none; border: none; color: var(--hr-muted); cursor: pointer; padding: 0 2px; --mdc-icon-size: 16px; }
      .pkgbox { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
      .sgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
      .sbtn { display: flex; align-items: center; gap: 8px; text-align: left; font: inherit; font-size: 0.82em; color: var(--hr-text); background: var(--hr-tile-bg); border: none; border-radius: 12px; padding: 8px 10px; cursor: pointer; } .sbtn.sel { box-shadow: inset 0 0 0 1.5px var(--hr-accent); }
      .sbtn .sample { flex: none; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; position: relative; } .sbtn .sample .fdot { position: static; } .sbtn .sample > ha-icon { color: var(--hr-muted); --mdc-icon-size: 20px; }
      .sbtn .sample .ico.lit { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; } .sbtn .sample .ico.lit ha-icon { --mdc-icon-size: 16px; color: var(--hr-accent); filter: drop-shadow(0 0 4px var(--hr-accent)); }
      .lockyaml { --mdc-icon-size: 14px; margin-left: 6px; color: var(--hr-muted); vertical-align: -2px; }
      .yamlhint { display: flex; gap: 8px; align-items: flex-start; padding: 6px 2px 2px; } .yamlhint ha-icon { --mdc-icon-size: 16px; color: var(--hr-accent); flex: none; margin-top: 1px; }
      .pkgmapbox { display: flex; flex-direction: column; gap: 6px; } .pkgmapbox > summary { cursor: pointer; font-size: 0.9em; padding: 6px 0; color: var(--hr-text); }
      .iconrow { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; font-size: 0.9em; color: var(--hr-muted); }
      .iconrow .iname { display: inline-flex; align-items: center; gap: 6px; min-width: 0; } .iconrow .iname ha-icon { --mdc-icon-size: 20px; flex: none; }
      .iconbtn { display: inline-flex; align-items: center; gap: 8px; font: inherit; color: var(--hr-text); background: var(--hr-tile-bg); border: none; border-radius: 12px; padding: 6px 10px; cursor: pointer; min-width: 0; max-width: 62%; } .iconbtn > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .iconbtn ha-icon { --mdc-icon-size: 20px; flex: none; }
      .icongrid { flex: 1 0 100%; display: grid; grid-template-columns: repeat(auto-fill, minmax(44px, 1fr)); gap: 6px; padding: 6px 0 4px; }
      .iconcell { position: relative; display: flex; align-items: center; justify-content: center; height: 44px; border: none; border-radius: 12px; background: var(--hr-tile-bg); color: var(--hr-text); cursor: pointer; --mdc-icon-size: 24px; } .iconcell.sel { box-shadow: inset 0 0 0 2px var(--hr-accent); color: var(--hr-accent); } .iconcell small { position: absolute; right: 4px; bottom: 2px; font-size: 0.6em; opacity: .6; }
      .favhint { display: flex; align-items: center; gap: 8px; padding: 8px 12px; } .favhint ha-icon { --mdc-icon-size: 18px; color: var(--hr-accent); flex: none; }
      .sexpl { min-height: 2.6em; } .sexpl b { color: var(--hr-text); }
      details.infobox > summary { cursor: pointer; }
      .infoitem { display: flex; gap: 10px; padding: 6px 0; font-size: 0.85em; } .infoitem ha-icon { flex: none; color: var(--hr-accent); --mdc-icon-size: 20px; } .infoitem b { display: block; } .infoitem div > div { color: var(--hr-muted); }
      .adbrow { display: flex; align-items: center; gap: 8px; padding: 3px 0; } .adbrow small { color: var(--hr-muted); } .adbdot { width: 9px; height: 9px; border-radius: 50%; background: #43a047; flex: none; } .adbdot.bad { background: #e53935; }
      .adbtest { gap: 8px; padding: 8px 14px; margin: 6px 0; display: inline-flex; } .adbres { margin-left: 8px; font-size: 0.85em; color: var(--hr-muted); }
      .etabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; } .etabs button { flex: 1 0 auto; border: none; font: inherit; padding: 8px 12px; border-radius: 999px; background: var(--hr-tile-bg); color: var(--hr-muted); cursor: pointer; white-space: nowrap; } .etabs button.sel { background: var(--hr-accent); color: var(--hr-on-accent); font-weight: 600; }
      .mmbox { display: grid; gap: 6px; margin: 8px 0; } .mmrow { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 10px; background: color-mix(in srgb, var(--warning-color, #f5a623) 16%, transparent); font-size: 13px; } .mmrow span { flex: 1; } .mmrow ha-icon { color: var(--warning-color, #f5a623); --mdc-icon-size: 20px; }
      .nettab { width: 100%; border-collapse: collapse; font-size: .85em; } .nettab th { text-align: left; font-weight: 600; color: var(--hr-muted); padding: 4px 8px 6px; border-bottom: 1px solid color-mix(in srgb, var(--hr-muted) 35%, transparent); } .nettab td { padding: 8px; vertical-align: top; border-bottom: 1px solid color-mix(in srgb, var(--hr-muted) 18%, transparent); }
      .nettab .ndev { display: flex; align-items: center; gap: 6px; } .nettab .ndev ha-icon { --mdc-icon-size: 18px; flex: none; color: var(--hr-muted); } .nettab .ndev small { color: var(--hr-muted); } .nstate.on { color: var(--hr-accent); font-weight: 600; }
      .kbchip { display: inline-flex; align-items: center; gap: 3px; margin: 0 6px 4px 0; padding: 2px 8px; border-radius: 999px; background: var(--hr-tile-bg); } .kbchip ha-icon { --mdc-icon-size: 14px; color: var(--hr-accent); } .kbnone { color: var(--hr-muted); }
      @container (max-width: 560px) { .nettab thead { display: none; } .nettab, .nettab tbody, .nettab tr, .nettab td { display: block; } .nettab tr { padding: 6px 0; border-bottom: 1px solid color-mix(in srgb, var(--hr-muted) 30%, transparent); } .nettab td { border: 0; padding: 2px 4px; } .nettab td[data-l]::before { content: attr(data-l) ": "; color: var(--hr-muted); } .nettab td.ndev::before { content: none; } }
      .et-look [data-t]:not([data-t="look"]), .et-behave [data-t]:not([data-t="behave"]), .et-acts [data-t]:not([data-t="acts"]), .et-devs [data-t]:not([data-t="devs"]), .et-fire [data-t]:not([data-t="fire"]), .et-dd [data-t]:not([data-t="dd"]), .et-misc [data-t]:not([data-t="misc"]), .et-info [data-t]:not([data-t="info"]) { display: none; }
      ha-card:not(.ed).hl-auto .block.dkeys > .dname, ha-card:not(.ed).hl-auto .block.favs > .dname, ha-card:not(.ed).hl-auto .block.actions > .dname { display: none; }
      ha-card:not(.ed).hl-never .block > .dname { display: none; }
      .krow { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
      .cells > .newrow { grid-column-start: 1; }
      .actbtn.acton { box-shadow: inset 0 0 0 2px var(--hr-accent), 0 0 12px color-mix(in srgb, var(--hr-accent) 45%, transparent); color: var(--hr-accent); } .actbtn.acton ha-icon { color: var(--hr-accent); } .actbtn.miss { opacity: .45; }
      .actbtn { flex-direction: column; gap: 4px; min-height: 58px; } .actbtn span { font-size: 0.78em; text-align: center; }
      .actrow { display: flex; align-items: center; gap: 10px; padding: 6px 0; } .actrow span { flex: 1; min-width: 0; } .actrow b { display: block; font-weight: 600; } .actrow small { display: block; color: var(--hr-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .actrow .key { width: 38px; height: 38px; flex: none; } .actrow.ask .key { width: auto; padding: 0 12px; }
      .actrow > .actopen { flex: 1; min-width: 0; display: flex; align-items: center; gap: 10px; border: none; background: none; color: inherit; font: inherit; text-align: left; padding: 4px 0; cursor: pointer; } .actrow .chev { color: var(--hr-muted); }
      .actrow.ask { padding: 8px 10px; border-radius: 12px; background: color-mix(in srgb, var(--hr-danger, #e55) 14%, transparent); } .key.warn { background: var(--hr-danger, #e55); color: #fff; }
      .actformhead { display: flex; align-items: center; gap: 8px; } .actformhead .etitle { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .ddline { display: flex; align-items: center; gap: 8px; } .ddname { display: inline-flex; align-items: center; gap: 6px; flex: 0 1 44%; min-width: 0; font-size: 0.8em; font-weight: 600; color: var(--hr-muted); } .ddname span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .ddslot { flex: none; width: 9px; } .ddslot.cog { width: 40px; } .ddline select { flex: 1 1 0; min-width: 0; min-height: 40px; }
      .ddsug { display: flex; align-items: center; gap: 6px; margin: 2px 0 0; color: var(--hr-muted); font-size: 0.85em; } .ddsugtx { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .mini.ic { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 40px; height: 40px; border-radius: 999px; background: var(--hr-tile-bg); color: var(--hr-text); --mdc-icon-size: 20px; }
      .ddpagehead { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; } .ddpagetitle { font-weight: 600; } .ddpagetitle small { color: var(--hr-muted); font-weight: 400; }
      .ddcaps { margin-bottom: 8px; } .ddcaps summary { cursor: pointer; font-weight: 600; } .ddcapgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 4px 10px; padding: 6px 0; } .ddcap { display: flex; align-items: center; gap: 6px; font-size: 13px; } .ddcap.no { opacity: .5; } .ddcap.yes ha-icon { color: var(--hr-accent); } .ddcap.seen { opacity: .7; font-style: italic; } .ddrescan { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; } .ddcap ha-icon { --mdc-icon-size: 18px; }
      .mini.seen { opacity: .6; font-style: italic; } .ddctl { align-items: center; flex-wrap: wrap; } .ddctls { display: inline-flex; flex-wrap: wrap; align-items: center; justify-content: flex-end; gap: 6px; flex: 1; min-width: 0; } .ddctls input[type=range] { flex: 1; min-width: 90px; } .ddnow { color: var(--hr-muted); }
      .mini.txt.sel { background: var(--hr-accent); color: var(--hr-on-accent, #fff); }
      .mini.txt { display: inline-flex; align-items: center; gap: 4px; width: auto; padding: 4px 10px; border: none; border-radius: 999px; font: inherit; font-size: 0.85em; background: var(--hr-tile-bg); color: var(--hr-text); cursor: pointer; --mdc-icon-size: 16px; }
      .steplist { display: flex; flex-direction: column; gap: 6px; }
      .step { border-radius: 12px; background: var(--hr-tile-bg); overflow: hidden; }
      .stephead { display: flex; align-items: center; gap: 6px; padding: 4px 6px; min-height: 44px; }
      .stephead.run { box-shadow: inset 3px 0 0 var(--hr-accent); background: color-mix(in srgb, var(--hr-accent) 14%, transparent); }
      .stephead.err { box-shadow: inset 3px 0 0 var(--hr-danger, #e55); background: color-mix(in srgb, var(--hr-danger, #e55) 14%, transparent); }
      .stephead.todo .steplab span { color: var(--hr-muted); font-style: italic; }
      .stepno { flex: none; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75em; font-weight: 700; background: var(--hr-card-bg, var(--card-background-color)); color: var(--hr-muted); }
      .steplab { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; border: none; background: none; color: var(--hr-text); font: inherit; font-size: 0.9em; text-align: left; padding: 6px 2px; cursor: pointer; --mdc-icon-size: 18px; }
      .steplab span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .steplab .chev { color: var(--hr-muted); }
      .actmore { position: absolute; top: 3px; right: 3px; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%; --mdc-icon-size: 16px; color: var(--hr-muted); cursor: pointer; background: color-mix(in srgb, var(--hr-text) 8%, transparent); z-index: 1; }
      .seqpanel { display: flex; flex-direction: column; gap: 8px; }
      .seqhead { display: flex; align-items: center; gap: 8px; } .seqname { flex: 1; min-width: 0; display: flex; flex-direction: column; } .seqname b, .seqname small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .seqname small { color: var(--hr-muted); } .seqhead.error .seqname small { color: var(--hr-danger, #e55); }
      .seqstop { color: var(--hr-danger, #e55); }
      .seqlist { display: flex; flex-direction: column; } .seqrow { display: flex; align-items: center; gap: 8px; padding: 4px 2px; min-height: 40px; border-top: 1px solid color-mix(in srgb, var(--divider-color, #888) 30%, transparent); } .seqrow:first-child { border-top: none; }
      .seqmark { flex: none; --mdc-icon-size: 20px; color: var(--hr-muted); } .seqrow.done .seqmark { color: var(--hr-accent); } .seqrow.current .seqmark { color: var(--hr-accent); animation: seqpulse 1.4s ease-in-out infinite; } .seqrow.error .seqmark { color: var(--hr-danger, #e55); } .seqrow.current { background: color-mix(in srgb, var(--hr-accent) 12%, transparent); border-radius: 10px; } @keyframes seqpulse { 50% { opacity: .35; } }
      .seqlab { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.9em; --mdc-icon-size: 18px; } .seqlab > span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .seqerr { flex-basis: 100%; color: var(--hr-danger, #e55); }
      .seqtools { flex: none; display: flex; gap: 2px; } .seqtools .ib { width: 34px; height: 34px; padding: 0; min-width: 0; --mdc-icon-size: 18px; background: none; color: var(--hr-muted); } .seqtools .ib:disabled { opacity: .3; }
      .vrow { display: flex; flex-direction: column; gap: 6px; padding: 8px 0; border-top: 1px solid color-mix(in srgb, var(--divider-color, #888) 35%, transparent); }
      .vhead { display: flex; align-items: center; gap: 10px; cursor: pointer; } .vhead > span:nth-child(2) { flex: 1; } .vhead b { font-size: 1.15em; } .vrow:not(.on) .vhead > span:nth-child(2) { color: var(--hr-muted); }
      .vbody { display: flex; flex-direction: column; gap: 8px; } .vslide { padding: 0; } .vrow .vslide .pval { display: none; } .vsub { font-size: 0.8em; color: var(--hr-muted); }
      .vseg { display: flex; gap: 3px; padding: 3px; border-radius: 10px; background: var(--hr-card-bg, var(--card-background-color)); } .vseg button { flex: 1; border: none; border-radius: 8px; padding: 7px; background: none; color: var(--hr-text); font: inherit; font-size: 0.88em; cursor: pointer; } .vseg button.sel { background: var(--hr-accent); color: var(--hr-on-accent); }
      .vdots { display: flex; flex-wrap: wrap; gap: 6px; } .vdot { width: 26px; height: 26px; border-radius: 50%; border: none; padding: 0; cursor: pointer; box-shadow: inset 0 0 0 1px rgba(255,255,255,.25); } .vdot.sel { box-shadow: 0 0 0 2px var(--hr-bg, #1e2126), 0 0 0 4px var(--hr-accent); }
      .vhue input[type=range] { appearance: none; -webkit-appearance: none; height: 12px; border-radius: 6px; background: linear-gradient(90deg, red, #ff0, lime, cyan, blue, #f0f, red); } .vhue .pval { display: none; }
      .irsetup summary { font-weight: 500; }
      .seqrow.skipped { opacity: .55; } .seqrow.skipped .seqlab > span { text-decoration: line-through; }
      .stepmoves { flex: none; display: flex; gap: 4px; } .stepmoves .ib { width: 34px; height: 34px; border-radius: 10px; padding: 0; min-width: 0; --mdc-icon-size: 18px; background: none; color: var(--hr-muted); } .stepmoves .ib:disabled { opacity: .3; }
      .stephead.open { background: color-mix(in srgb, var(--hr-accent) 10%, transparent); }
      .stepacts { display: flex; gap: 8px; padding-top: 10px; margin-top: 4px; border-top: 1px solid color-mix(in srgb, var(--divider-color, #888) 45%, transparent); } .stepacts .key { flex: 1; min-width: 0; } .stepacts .del { color: var(--hr-danger, #e55); }
      .pslide { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 6px 0; } .pval { border: none; background: none; color: var(--hr-text); font: inherit; font-size: 2em; font-weight: 700; cursor: pointer; text-align: center; padding: 2px 10px; border-radius: 10px; } .pvalin { width: 6em; background: var(--hr-card-bg, var(--card-background-color)); }
      .pbar { display: flex; align-items: center; gap: 8px; width: 100%; } .pbar input[type=range] { flex: 1; min-width: 0; accent-color: var(--hr-accent); } .pnudge { flex: none; border: none; border-radius: 10px; padding: 8px 10px; background: var(--hr-card-bg, var(--card-background-color)); color: var(--hr-text); font: inherit; font-size: 0.85em; cursor: pointer; }
      .ptrack { flex: 1; min-width: 0; position: relative; padding-bottom: 1.3em; } .ptrack input { width: 100%; margin: 0; } .pends { position: absolute; left: 0; right: 0; bottom: 0; height: 1.2em; font-size: 0.7em; color: var(--hr-muted); } .pends span { position: absolute; transform: translateX(-50%); white-space: nowrap; } .pends span:last-child { transform: translateX(-100%); } .pends span:first-child { transform: none; }
      .stepbody { display: flex; flex-direction: column; gap: 8px; padding: 6px 10px 12px; border-top: 1px solid color-mix(in srgb, var(--divider-color, #888) 45%, transparent); }
      .stepbody > .ehint.err, .step > .ehint.err { padding: 0 10px 8px; }
      .ehint.err { color: var(--hr-danger, #e55); }
      .steptypes { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px; }
      .steptype { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 8px; border: none; border-radius: 14px; background: var(--hr-tile-bg); color: var(--hr-text); font: inherit; cursor: pointer; text-align: center; --mdc-icon-size: 26px; }
      .steptype ha-icon { color: var(--hr-accent); } .steptype small { color: var(--hr-muted); font-size: 0.75em; line-height: 1.25; }
      .addstep { gap: 8px; padding: 10px 16px; }
      .actbtns { display: flex; gap: 8px; } .actbtns .key { flex: 1; gap: 8px; padding: 10px 12px; } .actbtns .key:disabled { opacity: .4; }
      .pchips { display: flex; flex-wrap: wrap; gap: 6px; } .pgroups { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
      .pchip { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; padding: 7px 12px; border: none; border-radius: 999px; background: var(--hr-card-bg, var(--card-background-color)); color: var(--hr-text); font: inherit; font-size: 0.85em; cursor: pointer; --mdc-icon-size: 18px; }
      .pchip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pchip.hot { box-shadow: inset 0 0 0 1px var(--hr-accent); } .pchip.sel { background: var(--hr-accent); color: var(--hr-on-accent); }
      .pchip[hidden], .pgroup[hidden], .prec[hidden] { display: none; }
      .psearch { font: inherit; padding: 8px 12px; border-radius: 10px; background: var(--hr-select-bg, var(--hr-card-bg)); color: var(--hr-text); border: 1px solid var(--divider-color, #444); width: 100%; box-sizing: border-box; }
      .stepper { display: inline-flex; align-items: center; gap: 10px; } .stepper button { width: 32px; height: 32px; border: none; border-radius: 50%; background: var(--hr-card-bg, var(--card-background-color)); color: var(--hr-text); font: inherit; font-size: 1.1em; cursor: pointer; } .stepper b { min-width: 1.5em; text-align: center; }
      .actbtn { position: relative; overflow: hidden; } .actbtn .actbar { position: absolute; left: 0; bottom: 0; height: 3px; width: var(--p, 0%); background: var(--hr-accent); transition: width .4s; }
      .actbtn.running { outline: 2px solid var(--hr-accent); outline-offset: -2px; } .actbtn.running ha-icon { animation: pulse 1.4s ease-in-out infinite; }
      .actbtn.failed { outline: 2px solid var(--hr-danger, #e55); outline-offset: -2px; color: var(--hr-danger, #e55); }
      .actbtn.fin { animation: actfin 1.2s ease-out 1; } @keyframes actfin { 0% { box-shadow: 0 0 0 0 var(--hr-accent); } 100% { box-shadow: 0 0 0 14px transparent; } }
      .actbtn.holding::after { content: ""; position: absolute; inset: 0; background: color-mix(in srgb, var(--hr-danger, #e55) 35%, transparent); transform-origin: bottom; animation: acthold .7s linear 1 forwards; pointer-events: none; } @keyframes acthold { from { transform: scaleY(0); } to { transform: scaleY(1); } }
      .actbtn[data-hint]::before { content: attr(data-hinttext); position: absolute; left: 4px; right: 4px; bottom: 6px; z-index: 2; background: #222; color: #fff; padding: 3px 6px; border-radius: 8px; font-size: 0.7rem; text-align: center; pointer-events: none; white-space: normal; }
      .acttile .acttag { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--hr-accent); opacity: .8; }
      .plist { display: flex; flex-direction: column; gap: 2px; max-height: 300px; overflow-y: auto; }
      .pent { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; padding: 8px 10px; border: none; border-radius: 10px; background: none; color: var(--hr-text); font: inherit; font-size: 0.88em; text-align: left; cursor: pointer; }
      .pent:hover { background: var(--hr-card-bg, var(--card-background-color)); } .pent[hidden] { display: none; }
      .pent span { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .pent small, .pid { display: block; color: var(--hr-muted); font-size: 0.8em; overflow-wrap: anywhere; }
      .addact { gap: 8px; padding: 10px 16px; margin-top: 6px; background: var(--hr-accent); color: var(--hr-on-accent); } .addact ha-icon { color: var(--hr-on-accent); }
      .fdev { margin: 6px 0; } .fdev summary { cursor: pointer; padding: 6px 0; font-weight: 600; }
      .chipbox { max-height: 170px; overflow: auto; display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0; } .fchip input { display: none; } .fbr { flex-basis: 100%; height: 0; } .fchip span ha-icon { --mdc-icon-size: 16px; margin-right: 5px; vertical-align: -3px; } .fchip span { display: inline-block; padding: 6px 10px; border-radius: 999px; background: var(--hr-tile-bg); font-size: 0.8em; cursor: pointer; } .fchip input:checked + span { background: var(--hr-accent); color: var(--hr-on-accent); } .fchip.via span { background: transparent; color: var(--hr-muted); box-shadow: inset 0 0 0 1px var(--hr-accent); cursor: default; }
      .lockmark[data-secnav] { cursor: pointer; } .lockmark { display: inline-flex; align-items: center; gap: 3px; flex: none; margin: 0 8px 0 4px; --mdc-icon-size: 18px; font-size: 0.9em; } .lockmark.on { color: var(--hr-danger); } .slimbar .lockmark { margin: 0 2px; } .slimbar .lockmark small { display: none; }
      .block.dkeys .cells { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
      .editbox { display: flex; flex-direction: column; gap: 14px; padding: 14px; border-radius: 18px; background: var(--hr-tile-bg); }
      .esec { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 14px; background: var(--hr-card-bg, var(--card-background-color)); }
      .etitle { font-size: 0.72em; text-transform: uppercase; letter-spacing: 0.08em; color: var(--hr-accent); font-weight: 600; }
      .etitle.outside { margin: 4px 4px -4px; color: var(--hr-muted); }
      .egroup { display: flex; flex-direction: column; gap: 6px; }
      .erow > span { min-width: 0; overflow-wrap: anywhere; }
      .sbtn > span:last-child { min-width: 0; overflow-wrap: anywhere; }
      .erow { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 40px; font-size: 0.9em; color: var(--hr-text); }
      .erow > span:first-child { flex: 1 1 auto; color: var(--hr-text); }
      .erow > select, .erow > input[type=text], .erow > input[type=number], .erow > .entpick, .erow > .picker { flex: 0 0 min(55%, 240px); }
      label.erow { cursor: pointer; } label.erow.swrow { -webkit-tap-highlight-color: transparent; }
      .egrp { display: flex; flex-direction: column; }
      .egrp > .erow { padding: 6px 0; } .egrp > .erow + .erow { border-top: 1px solid color-mix(in srgb, var(--divider-color, #888) 55%, transparent); }
      .esub { font-size: 0.8em; font-weight: 600; color: var(--hr-muted); margin: 6px 0 2px; } .egrp:first-child > .esub, .etitle + .egrp > .esub { margin-top: 0; }
      select option, select optgroup { background-color: var(--hr-select-bg, var(--card-background-color, #1f2227)); color: var(--hr-text); }
      .erow input[type=text], .erow input[type=number], .erow select { font: inherit; padding: 8px 10px; border-radius: 10px; background: var(--hr-select-bg, var(--hr-tile-bg)); color: var(--hr-text); border: 1px solid var(--divider-color, #444); min-width: 0; width: 100%; box-sizing: border-box; }
      .picker { display: block; min-width: 0; } .picker ha-entity-picker { display: block; width: 100%; }
      .sw { flex: none; position: relative; width: 48px; height: 28px; }
      .sw input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; z-index: 1; }
      .sw i { position: absolute; inset: 0; border-radius: 999px; background: var(--divider-color, #555); transition: background .2s; }
      .sw i::after { content: ""; position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%; background: #fff; transition: transform .2s; }
      .sw input:checked + i { background: var(--hr-accent); } .sw input:checked + i::after { transform: translateX(20px); }
      .chks { display: flex; flex-wrap: wrap; gap: 6px; }
      .chk { position: relative; font-size: 0.82em; padding: 5px 12px; border-radius: 999px; background: var(--hr-tile-bg); color: var(--hr-muted); cursor: pointer; }
      .chk input { position: absolute; inset: 0; opacity: 0; margin: 0; cursor: pointer; }
      .chk:has(input:checked) { background: var(--hr-accent); color: var(--hr-on-accent); }
      .ehint { font-size: 0.8em; color: var(--hr-muted); }
      .infobtn { border: none; background: none; color: var(--hr-muted); cursor: pointer; padding: 4px; display: flex; border-radius: 50%; }
      .infobtn.sel { color: var(--hr-accent); }
      .head { flex-wrap: nowrap; } .hright { display: flex; align-items: center; gap: 4px; }
      .infopanel { display: flex; flex-direction: column; gap: 2px; padding: 10px 14px; border-radius: 16px; background: var(--hr-tile-bg); font-size: 0.85em; }
      .irow { display: flex; justify-content: space-between; gap: 16px; padding: 4px 0; border-bottom: 1px solid color-mix(in srgb, var(--hr-muted) 18%, transparent); }
      .irow:last-child { border-bottom: none; } .irow span { color: var(--hr-muted); } .irow b { font-weight: 500; text-align: right; overflow-wrap: anywhere; }
      .seg { position: relative; display: grid; grid-template-columns: 1fr 1fr; padding: 4px; border-radius: var(--hr-seg-radius, 14px); background: color-mix(in srgb, var(--hr-tile-bg) 60%, #000 10%);
        border: 1px solid var(--divider-color, rgba(128,128,128,.25)); touch-action: pan-y; user-select: none; cursor: grab; }
      .seg .th { position: absolute; top: 4px; bottom: 4px; left: 4px; width: calc(50% - 4px); border-radius: calc(var(--hr-seg-radius, 14px) - 3px); background: var(--hr-accent); box-shadow: 0 2px 8px rgba(0,0,0,.4); }
      .seg .lab { position: relative; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 8px; font-size: 0.95em; color: var(--hr-muted); transition: color .2s; pointer-events: none; }
      .seg .lab.a { color: var(--hr-on-accent); }
      .seg .lab ha-icon { --mdc-icon-size: 24px; }
      @container (max-width: 380px) { .seg .lab span { display: none; } }
      .pager { overflow: hidden; border-radius: var(--hr-tile-radius); }
      .pager .track { display: flex; align-items: flex-start; }
      .pager .pane { flex: 0 0 100%; min-width: 0; box-sizing: border-box; padding: 2px; }
      .toprow { display: flex; align-items: center; gap: 8px; min-width: 0; } .toprow > .hubtabs, .toprow > .hub { flex: 1 1 auto; min-width: 0; } .toprow > .hubtabs { margin-bottom: 0; } .toprow > .bbtns { flex: none; }
      .toprow .bbtns, .slimrow .bbtns { display: flex; align-items: center; gap: 2px; flex: none; } .bbtns .ib { width: 36px; height: 36px; } .bbtns .ib.subtle { width: 30px; } .bbtns .lockmark { margin: 0 4px; }
      .bar .netchip { font: inherit; cursor: pointer; text-align: left; color: var(--hr-text); }
      .slimbar .sw.none { color: var(--hr-muted); text-align: left; } .slimbar .sw:first-child { text-align: left; }
      .bar { display: flex; align-items: flex-start; gap: 8px; padding: 6px; border-radius: var(--hr-seg-radius, 14px); border: 1px solid var(--divider-color, rgba(128,128,128,.3)); }
      .bar .chips { display: flex; flex-wrap: wrap; gap: 6px; flex: 1 1 0; min-width: 0; } .bar .bbtns { display: flex; gap: 6px; flex: none; }
      .bar .chip { box-sizing: border-box; flex: 1 1 190px; min-width: 0; height: 38px; display: flex; align-items: center; gap: 8px; padding: 0 4px 0 10px; border-radius: 999px; border: 1px solid var(--divider-color, rgba(128,128,128,.35)); background: transparent; color: var(--hr-muted); font-size: 0.85em; }
      .bar .chip > ha-icon { --mdc-icon-size: 18px; flex: none; } .bar .chip .ct { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .bar .chip:not(:has(.ib)) { padding-right: 12px; }
      .bar .status.active { background: color-mix(in srgb, var(--hr-accent) 14%, transparent); color: var(--hr-accent); border-color: color-mix(in srgb, var(--hr-accent) 45%, transparent); }
      .bar .status.busy > ha-icon { animation: pulse 1s ease-in-out infinite; }
      .bar .firechip .ib { margin-left: auto; }
      .bar .firechip.f-playing, .bar .firechip.f-on { color: var(--hr-fire); border-color: color-mix(in srgb, var(--hr-fire) 55%, transparent); background: color-mix(in srgb, var(--hr-fire) 10%, transparent); }
      .hubtabs button:not(.sel) .rn2 { display: none; } @container (max-width: 260px) { .toprow .hubtabs button:not(.sel) .rn { display: none; } } @container (max-width: 480px) { .bar .chip { flex: 1 0 100%; }  .toprow .hubtabs button:not(.sel) { padding-right: 6px; } .bbtns .ib { width: 32px; } .profchip { width: 32px; padding: 0; justify-content: center; } .profchip span { display: none; } }
      .ib { border: none; font: inherit; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; border-radius: calc(var(--hr-seg-radius, 14px) - 3px); background: var(--hr-tile-bg); color: var(--hr-muted); }
      .ib.hl, .ib.sel { color: var(--hr-accent); } .ib ha-icon { --mdc-icon-size: 22px; }
      .profnow { display: flex; align-items: center; gap: 10px; padding: 8px 4px; } .profnow > ha-icon { --mdc-icon-size: 28px; color: var(--hr-accent); flex: none; }
      .profnow > span { flex: 1; min-width: 0; display: flex; flex-direction: column; } .profnow small, .profrow small { color: var(--hr-muted); font-size: 0.8em; overflow-wrap: anywhere; }
      .proflist { display: flex; flex-direction: column; gap: 6px; margin: 6px 0; }
      .profrow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 6px 8px; border-radius: var(--hr-tile-radius, 12px); background: var(--hr-tile-bg); border: 1px solid transparent; }
      .profrow.act { border-color: color-mix(in srgb, var(--hr-accent) 60%, transparent); }
      .profrow .pname { flex: 1 1 140px; min-width: 0; display: flex; flex-wrap: wrap; align-items: center; gap: 2px 8px; } .profrow .pname ha-icon { --mdc-icon-size: 20px; color: var(--hr-muted); }
      .profrow.act .pname ha-icon { color: var(--hr-accent); } .profrow .pname small { flex-basis: 100%; padding-left: 28px; }
      .pbtns { display: flex; gap: 6px; align-items: center; margin-left: auto; }
      .pbtn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 36px; padding: 0 10px; border-radius: var(--hr-radius); border: 1px solid var(--divider-color, rgba(128,128,128,.4)); background: transparent; color: var(--hr-text); font: inherit; font-size: 0.9em; cursor: pointer; }
      .pbtn ha-icon { --mdc-icon-size: 18px; } .pbtn[disabled] { opacity: .4; cursor: default; } .pbtn.pri { background: var(--hr-accent); color: var(--hr-on-accent); border-color: transparent; }
      .pbadge { font-size: 0.75em; text-transform: uppercase; letter-spacing: .06em; color: var(--hr-accent); padding: 0 6px; }
      .profnew { display: flex; gap: 8px; margin: 6px 0; } .profnew input { flex: 1; min-width: 0; font: inherit; padding: 8px 10px; border-radius: 10px; background: var(--hr-select-bg, var(--hr-tile-bg)); color: var(--hr-text); border: 1px solid var(--divider-color, #444); box-sizing: border-box; }
      .profdlg { flex-basis: 100%; display: flex; flex-direction: column; gap: 8px; padding: 10px; margin-top: 6px; border-radius: 12px; border: 1px solid var(--divider-color, rgba(128,128,128,.4)); background: color-mix(in srgb, var(--hr-accent) 8%, transparent); box-sizing: border-box; }
      .profdlg input { font: inherit; padding: 8px 10px; border-radius: 10px; background: var(--hr-select-bg, var(--hr-tile-bg)); color: var(--hr-text); border: 1px solid var(--divider-color, #444); box-sizing: border-box; width: 100%; }
      .profwarn, .proferr { display: flex; gap: 8px; align-items: flex-start; } .profwarn ha-icon, .proferr ha-icon { --mdc-icon-size: 16px; flex: none; margin-top: 1px; color: var(--hr-accent); } .proferr ha-icon { color: var(--hr-danger, #e53935); }
      .irow.prow select { font: inherit; padding: 4px 8px; border-radius: 8px; background: var(--hr-select-bg, var(--hr-tile-bg)); color: var(--hr-text); border: 1px solid var(--divider-color, #444); max-width: 60%; }
      .slimbar { display: flex; align-items: center; gap: 8px; width: 100%; box-sizing: border-box; min-height: 44px; padding: 0 12px; border-radius: var(--hr-seg-radius, 14px); border: 1px solid var(--divider-color, rgba(128,128,128,.3)); background: transparent; color: var(--hr-text); font: inherit; cursor: pointer; }
      .slimbar > ha-icon { --mdc-icon-size: 20px; flex: none; color: var(--hr-muted); } .slimbar b { flex: none; max-width: 40%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .slimbar .sw { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--hr-accent); font-size: 0.9em; text-align: right; }
      .slimbar .sw { align-self: center; line-height: 1.2; } .slimbar b { line-height: 1.2; }
      section.collapsed { gap: 14px; }
      [hidden] { display: none !important; }
      ha-card { overflow: visible; }
      section > .below { scroll-margin-top: calc(var(--header-height, 56px) + env(safe-area-inset-top, 0px) + 8px); }
      section.collapsed > .below { scroll-margin-top: calc(var(--header-height, 56px) + env(safe-area-inset-top, 0px) + 62px); }
      section.collapsed > .hdr { display: block; padding: 6px 0; margin: -6px 0; }
      .devhead .devclose { margin-left: auto; }
      .tabhint { margin: 2px 0 6px; } .adbhelp { display: flex; gap: 8px; align-items: flex-start; margin: 6px 0; } .adbhelp ha-icon { --mdc-icon-size: 18px; flex: none; color: var(--hr-accent); }
      .devhead .actlink { display: inline-flex; align-items: center; gap: 6px; min-width: 0; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--hr-accent); background: color-mix(in srgb, var(--hr-accent) 14%, transparent); color: var(--hr-text); font: inherit; font-size: 0.8em; cursor: pointer; }
      .devhead .actlink span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } .devhead .actlink ha-icon { --mdc-icon-size: 16px; color: var(--hr-accent); flex: none; }
      .hdev.go { overflow: hidden; width: 100%; background: none; border: 0; padding: 0; margin: 0; font: inherit; color: inherit; text-align: left; cursor: pointer; border-radius: 10px; }
      .hdev.go:focus-visible { outline: 2px solid var(--hr-accent); outline-offset: 2px; } .hdev .golink { --mdc-icon-size: 18px; color: var(--hr-muted); margin-left: auto; }
      .volcol { display: flex; flex-direction: column; gap: 8px; height: 100%; } .volcol .rocker { flex: 1; height: auto; min-height: 0; }
      .rk.mute.round { min-height: 46px; border-radius: 999px; background: var(--hr-tile-bg); }
      .rocker .rk.mute.round { flex: none; align-self: center; width: 40px; height: 40px; min-height: 40px; padding: 0; border-radius: 50%; background: var(--hr-key-bg); --mdc-icon-size: 20px; }
      .rocker.slr .rk.mute.round { margin-top: 6px; } .rocker.slr { flex-direction: column; }
      .sw .lamp { display: none; }
      /* gear: menu and hints in one place; colour = most serious hint, pulse while unseen, count at the corner */
      .toprow { position: relative; }
      .ib.gear { position: relative; } .ib.gear .gbadge { position: absolute; top: 1px; right: 1px; min-width: 15px; height: 15px; padding: 0 3px; box-sizing: border-box; border-radius: 8px; font: 700 10px/15px system-ui, sans-serif; font-style: normal; text-align: center; color: #fff; background: var(--gc, var(--hr-accent)); }
      .ib.gear.sev-r { --gc: #e53935; } .ib.gear.sev-o { --gc: #fb8c00; } .ib.gear.sev-b { --gc: var(--hr-accent); }
      .ib.gear[class*="sev-"] ha-icon { color: var(--gc); filter: drop-shadow(0 0 5px var(--gc)); }
      .ib.gear.fresh ha-icon { animation: gearpulse 1.6s ease-in-out infinite; } @keyframes gearpulse { 50% { opacity: .45; filter: none; } }
      .hmenu { position: absolute; left: 0; right: 0; top: calc(100% + 6px); z-index: 30; width: auto; max-height: min(72vh, 560px); overflow: auto; box-sizing: border-box; padding: 8px; border-radius: 14px; background: var(--hr-card-bg, var(--card-background-color, #1e2126)); border: 1px solid var(--divider-color, rgba(128,128,128,.4)); box-shadow: 0 8px 24px rgba(0,0,0,.45); display: grid; gap: 4px; }
      .whead { display: flex; align-items: center; gap: 8px; padding: 0 2px 6px; border-bottom: 1px solid var(--divider-color, rgba(128,128,128,.3)); position: sticky; top: -8px; background: inherit; z-index: 1; } .wtitle { flex: 1; font-weight: 600; font-size: .95em; } .whead .wclose { width: 32px; height: 32px; } .wbody { display: grid; gap: 6px; padding-top: 6px; }
      .hmenu { overflow-x: hidden; } .win .hrow, .win .hkeys { flex-wrap: wrap; min-width: 0; } .win .hdev { min-width: 0; flex: 1 1 150px; } .wbody { min-width: 0; }
      .win .helpbox { background: none; border: none; padding: 0; box-shadow: none; } .win .helpbox .htitle { display: none; }
      .plist { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; } .pitem.on { outline: 2px solid var(--hr-accent); } .pitem .pchk { margin-left: auto; color: var(--hr-accent) !important; } .pitem:disabled { opacity: .5; }
      .helpkey.viadirect { position: relative; } .helpkey .dmark { position: absolute; right: 2px; bottom: 2px; --mdc-icon-size: 13px; color: var(--hr-accent); } .dleg { display: flex; align-items: center; gap: 6px; } .dleg ha-icon { --mdc-icon-size: 16px; color: var(--hr-accent); flex: none; }
      .profchip.sel { box-shadow: inset 0 0 0 2px var(--hr-accent); }
      .mhints { display: grid; gap: 4px; padding-bottom: 4px; border-bottom: 1px solid var(--divider-color, rgba(128,128,128,.3)); } .mhints:last-child { border: none; padding: 0; }
      .hint-row { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; padding: 8px; border-radius: 10px; font-size: 0.85em; color: var(--hr-text); }
      .hint-row > ha-icon { --mdc-icon-size: 18px; flex: none; } .hint-row.r > ha-icon { color: #e53935; } .hint-row.o > ha-icon { color: #fb8c00; } .hint-row.b > ha-icon { color: var(--hr-accent); }
      .hint-row > span { flex: 1 1 160px; min-width: 0; } .hint-row button { margin-left: auto; border: none; cursor: pointer; font: inherit; padding: 6px 12px; border-radius: 999px; background: var(--hr-accent); color: var(--hr-on-accent); }
      .mentries { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; } .mentry { display: flex; align-items: center; gap: 8px; border: none; font: inherit; font-size: 0.85em; cursor: pointer; padding: 10px; border-radius: 10px; background: var(--hr-tile-bg); color: var(--hr-text); text-align: left; } .mentry ha-icon { --mdc-icon-size: 18px; color: var(--hr-muted); flex: none; }
      .mnone { padding: 12px; text-align: center; color: var(--hr-muted); font-size: 0.85em; }
      details.hubinfo { margin-bottom: 8px; } details.hubinfo > summary { cursor: pointer; list-style: none; } details.hubinfo > summary::-webkit-details-marker { display: none; } details.hubinfo:not([open]) > summary { border-bottom: none; padding-bottom: 0; margin-bottom: 0; } details.hubinfo > summary::after { content: "\\25BE"; margin-left: 6px; color: var(--hr-muted); } details.hubinfo[open] > summary::after { content: "\\25B4"; }
      @media (prefers-reduced-motion: reduce) { .ib.gear.fresh ha-icon { animation: none; } }
      .key.muted { color: var(--hr-accent); transform: translateY(1px); box-shadow: inset 0 2px 5px rgba(0,0,0,.4), inset 0 0 0 2px var(--hr-accent); }
      .sidecol { display: flex; flex-direction: column; gap: 6px; height: 100%; justify-content: space-between; }
      .key.tall { flex: 1; min-height: 40px; flex-direction: column; gap: 1px; border-radius: var(--hr-rk-radius, 14px); padding: 2px; } .key.tall ha-icon { --mdc-icon-size: 20px; }
      .key .sub { font-size: 0.62em; color: var(--hr-muted); line-height: 1.05; text-align: center; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .panel.mid3 { --c3: 76px; } .panel.wide3 { --c3: 92px; }
      .panel.nol { grid-template-columns: minmax(0, 1fr) var(--c3); } .panel.nor { grid-template-columns: var(--c1) minmax(0, 1fr); } .panel.nol.nor { grid-template-columns: minmax(0, 1fr); }
      .minipad { display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap; } .minipad.v { flex-direction: column; }
      .minipad .key { min-width: 64px; min-height: 54px; border-radius: var(--hr-rk-radius, 26px); font-weight: 600; } .minipad .key.ok { min-width: 84px; background: var(--hr-key-bg); }
      .hint.nokeys { color: var(--hr-muted); font-size: 0.9em; padding: 8px 4px; }
      .slimrow { display: flex; align-items: center; gap: 6px; } .slimrow .slimbar { flex: 1; min-width: 0; }
      .ib.offb { color: #e53935; }
      .devhead.emb { margin-top: 4px; }
      .hfoot { display: flex; flex-wrap: wrap; gap: 8px; justify-content: space-between; align-items: center; }
      .hlink { display: inline-flex; align-items: center; gap: 6px; border: none; background: none; color: var(--hr-muted); font: inherit; font-size: 0.82em; cursor: pointer; padding: 4px 2px; } .hlink ha-icon { --mdc-icon-size: 18px; } .hlink.on { color: var(--hr-accent); }
      .hlink select { font: inherit; font-size: 1em; padding: 3px 6px; border-radius: 8px; background: var(--hr-select-bg, var(--hr-tile-bg)); color: var(--hr-text); border: 1px solid var(--divider-color, #444); }
      .hrow.dim { opacity: 0.55; } .hsw { display: inline-flex; flex: none; }
      .hsw input { position: absolute; opacity: 0; width: 0; height: 0; } .hsw i { width: 38px; height: 22px; border-radius: 11px; background: var(--hr-key-bg); position: relative; transition: background .15s; }
      .hsw i::after { content: ""; position: absolute; top: 3px; left: 3px; width: 16px; height: 16px; border-radius: 50%; background: var(--hr-muted); transition: transform .15s, background .15s; }
      .hsw input:checked + i { background: var(--hr-accent); } .hsw input:checked + i::after { transform: translateX(16px); background: var(--hr-on-accent); }
      ha-card[data-skin="glass"] { background-color: #121826; background-image: radial-gradient(circle at 12% 8%, rgba(124,196,255,.55), transparent 46%), radial-gradient(circle at 92% 28%, rgba(176,124,255,.45), transparent 50%), radial-gradient(circle at 28% 96%, rgba(64,224,208,.38), transparent 52%); }
      select, select option, select optgroup { background-color: var(--hr-opt-bg, var(--hr-select-bg, var(--card-background-color, Canvas))); color: var(--hr-text, CanvasText); }
      .lockapps small { display: block; opacity: 0.7; font-size: 0.75em; overflow-wrap: anywhere; }
      .holdoff { position: relative; -webkit-touch-callout: none; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
      .hring { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); pointer-events: none; opacity: 0; }
      .hring circle { fill: none; stroke: var(--hr-danger, #e53935); stroke-width: 3; stroke-linecap: round; stroke-dasharray: 125.7; stroke-dashoffset: calc(125.7 - 1.257 * var(--p, 0)); }
      .hring.big { inset: 0; margin: auto; width: 60px; height: 60px; } .hring.big circle { stroke-dasharray: 169.6; stroke-dashoffset: calc(169.6 - 1.696 * var(--p, 0)); }
      .holding .hring { opacity: 1; }
      .holdoff.holding { background: color-mix(in srgb, var(--hr-danger, #e53935) calc(var(--p, 0) * 0.3%), var(--hr-tile-bg)); }
      .ib.holdoff.fired, .tile.holdoff.fired { background: var(--hr-danger, #e53935); color: #fff; } .holdoff.fired ha-icon { color: #fff !important; }
      .holdoff ha-icon { position: relative; }
      .holdoff[data-hint]::after { content: attr(data-hinttext); position: absolute; top: calc(100% + 4px); right: 0; z-index: 20; white-space: nowrap; background: #222; color: #fff; padding: 4px 8px; border-radius: 8px; font-size: 0.75rem; font-weight: 400; pointer-events: none; }
      .textopen { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; border: none; font: inherit; cursor: pointer; min-height: 34px; border-radius: var(--hr-seg-radius, 12px); background: var(--hr-tile-bg); color: var(--hr-muted); }
      .textopen ha-icon { --mdc-icon-size: 20px; } .textblock { margin-top: 8px; } .textblock.open .dtext { margin: 0; }
      ha-card .dtext { display: flex; gap: 8px; align-items: stretch; } .dfield { position: relative; flex: 1; min-width: 0; display: flex; align-items: center; }
      .dfield ha-icon { position: absolute; left: 12px; --mdc-icon-size: 20px; color: var(--hr-muted); pointer-events: none; }
      ha-card .dtext .dfield input { width: 100%; box-sizing: border-box; height: 46px; padding: 0 12px 0 40px; }
      ha-card .dtext .key { width: 46px; height: 46px; flex: none; border-radius: var(--hr-rk-radius, 14px); }
      .raw pre { user-select: text; -webkit-user-select: text; } .copyraw { margin-top: 6px; }
      .volslider { accent-color: var(--hr-accent, var(--primary-color)); touch-action: none; margin: 0; } .volslider.h { flex: 1; width: 100%; min-height: 52px; } .volslider.v { writing-mode: vertical-lr; direction: rtl; width: 100%; flex: 1; min-height: 0; } .rocker.slr { align-items: center; justify-content: center; padding: 10px 6px; } .kbvol .volslider.v { min-height: 80px; }
      .volbar { display: flex; gap: 8px; } .volbar .key { flex: 1; min-height: 52px; border-radius: var(--hr-rk-radius, 26px); }
      .kbact { display: flex; gap: 6px; align-items: stretch; } .kbact .kbd { flex: 1; min-width: 0; padding: 0; background: none; }
      .kbvol { display: flex; flex-direction: column; gap: 4px; width: 42px; flex: none; } .kbvol .key { flex: 1; min-height: 0; border-radius: 9px; } .kbvol .key ha-icon { --mdc-icon-size: 20px; }
      .kbarr { display: flex; gap: 4px; flex: 3.4 1 0; min-width: 0; } .kbarr > .kk { min-height: 38px; } .kbarr .kk.ic span { display: none; }
      .kbud { flex: 1 1 0; display: flex; flex-direction: column; gap: 4px; min-width: 0; } .kbud .kk { min-height: 17px !important; flex: 1 1 0; } .kbud .kk ha-icon { --mdc-icon-size: 14px !important; }
      .dpad::before { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
        background: linear-gradient(45deg, transparent calc(50% - 1px), var(--hr-panel-sep, var(--hr-card-bg, var(--card-background-color, #1c1c1c))) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)),
          linear-gradient(-45deg, transparent calc(50% - 1px), var(--hr-panel-sep, var(--hr-card-bg, var(--card-background-color, #1c1c1c))) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)); }
      .dpad .d { position: relative; z-index: 1; } .dpad .d.ok { box-shadow: 0 0 0 4px var(--hr-panel-sep, var(--hr-card-bg, var(--card-background-color, #1c1c1c))); }
      .tile, .key, .panel, .rocker, .dpad { backdrop-filter: var(--hr-blur, none); -webkit-backdrop-filter: var(--hr-blur, none); }
      .ib[disabled] { opacity: 0.35; cursor: default; pointer-events: none; }
      .ib.subtle { background: none; width: 30px; height: 38px; color: var(--hr-muted); opacity: 0.8; } .ib.subtle:hover { opacity: 1; } .ib.subtle[disabled] { opacity: 0.3; } .ib.subtle ha-icon { --mdc-icon-size: 20px; }
      .kbtext { display: flex; gap: 6px; } .kbtext input { flex: 1; min-width: 0; font: inherit; padding: 8px 10px; border-radius: 10px; background: var(--hr-select-bg, var(--hr-tile-bg)); color: var(--hr-text); border: 1px solid var(--divider-color, #444); box-sizing: border-box; }
      .kbtext .key { flex: none; width: 46px; min-height: 38px; } .kbtextmsg { font-size: 0.78em; color: var(--hr-muted); min-height: 1.2em; margin-top: -2px; }
      .kbrow.med { gap: 4px; } .kbrow.med .kk { max-width: 64px; } .kbrow.med .kk.ic span { display: none; }
      .kbarrows { display: grid; grid-template-columns: repeat(3, 44px); grid-template-rows: repeat(2, 38px); gap: 4px; margin-left: auto; margin-top: 2px; } .kbarrows .kk { min-width: 0; }
      .profchip { position: relative; display: inline-flex; align-items: center; gap: 6px; height: 38px; padding: 0 10px; box-sizing: border-box; max-width: 140px; border-radius: calc(var(--hr-seg-radius, 14px) - 3px); background: var(--hr-tile-bg); color: var(--hr-muted); cursor: pointer; }
      .profchip ha-icon { --mdc-icon-size: 20px; flex: none; } .profchip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.85em; }
      .profchip select { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; font-size: 16px; }
      .favkind { display: flex; gap: 6px; } .favkind button { flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; font: inherit; padding: 10px 12px; border-radius: 999px; background: var(--hr-tile-bg); color: var(--hr-muted); cursor: pointer; }
      .favkind button { min-width: 0; padding: 10px 8px; gap: 6px; } .favkind button span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .favkind button.sel { background: var(--hr-accent); color: var(--hr-on-accent); } .favkind ha-icon { --mdc-icon-size: 20px; }
      .entpick { position: relative; min-width: 0; }
      .entlist { position: absolute; z-index: 30; left: 0; right: 0; top: calc(100% + 4px); max-height: 260px; overflow: auto; border-radius: 12px; background: var(--card-background-color, #fff); border: 1px solid var(--divider-color, rgba(128,128,128,.4)); box-shadow: 0 6px 24px rgba(0,0,0,.4); }
      .entopt { display: flex; flex-direction: column; align-items: flex-start; width: 100%; box-sizing: border-box; text-align: left; font: inherit; color: var(--primary-text-color); background: none; border: none; padding: 8px 12px; cursor: pointer; }
      .entopt small { color: var(--secondary-text-color); font-size: 0.8em; overflow-wrap: anywhere; } .entopt:hover, .entopt:focus { background: color-mix(in srgb, var(--hr-accent) 14%, transparent); outline: none; } .entopt.none { color: var(--secondary-text-color); }
      .editview { gap: 12px; } .profdlg .editrow button { min-width: 0; white-space: normal; overflow-wrap: anywhere; line-height: 1.2; padding-left: 8px; padding-right: 8px; }
      .edittool { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: var(--hr-seg-radius, 14px); border: 1px solid var(--divider-color, rgba(128,128,128,.3)); background: color-mix(in srgb, var(--hr-accent) 8%, transparent); }
      .edmode { display: flex; align-items: center; gap: 8px; font-size: 0.8em; text-transform: uppercase; letter-spacing: .06em; color: var(--hr-accent); } .edmode ha-icon { --mdc-icon-size: 18px; }
      .askq { font-size: 0.95em; }
      .editrow { display: flex; gap: 8px; } .editrow > button { flex: 1 1 0; min-width: 0; height: 44px; box-sizing: border-box; }
      .editcancel { display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--divider-color, rgba(128,128,128,.4)); cursor: pointer; font: inherit; padding: 0 12px; border-radius: var(--hr-radius); background: transparent; color: var(--hr-text); }
      .editdone.warn { background: var(--hr-danger, #e53935); color: #fff; }
      .editdone { display: flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; font: inherit; padding: 0 12px; border-radius: var(--hr-radius); background: var(--hr-accent); color: var(--hr-on-accent); }
      .infoedits { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; margin-top: 8px; } .infoedits .infoedit { margin-top: 0; min-width: 0; }
      .infoedit { display: flex; align-items: center; justify-content: center; gap: 8px; border: none; cursor: pointer; font: inherit; margin-top: 8px; padding: 10px; border-radius: var(--hr-radius); background: var(--hr-key-bg); color: var(--hr-text); }
      .infoedit ha-icon { --mdc-icon-size: 20px; color: var(--hr-accent); }
      .devlayout { display: grid; gap: 14px; grid-template-columns: 1fr; }
      .devlist { display: grid; grid-template-columns: repeat(${cols}, minmax(0, 1fr)); gap: 10px; align-content: start; }
      .tile.dev { min-height: 84px; position: relative; } .tile.dev small { font-size: 0.68em; color: var(--hr-accent); text-align: center; line-height: 1.2; }
      .tile.dev.inuse::after { content: ""; position: absolute; top: 9px; right: 9px; width: 9px; height: 9px; border-radius: 50%; background: var(--hr-accent); }
      .tile.dev.sel { outline: 2px solid var(--hr-accent); outline-offset: -2px; }
      .devremote { display: flex; flex-direction: column; gap: 16px; }
      .devhead { display: flex; align-items: center; gap: 12px; }
      .devname { font-weight: 500; }
      .back { display: inline-flex; align-items: center; gap: 4px; border: none; background: var(--hr-tile-bg); color: var(--hr-text); font: inherit; font-size: 0.85em; padding: 6px 14px 6px 8px; border-radius: 999px; cursor: pointer; }
      .back ha-icon { --mdc-icon-size: 18px; }
      .hint { color: var(--hr-muted); padding: 24px 0; text-align: center; }
      .block { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: 18px; background: color-mix(in srgb, var(--hr-tile-bg) 55%, transparent); }
      .block.power { padding: 0; background: none; }
      .cells { display: grid; grid-template-columns: repeat(auto-fill, minmax(118px, 1fr)); gap: 8px; } .cells > .cell { min-width: 0; text-align: center; }
      .cell { min-height: 42px; padding: 0 8px; font-size: 0.82em; gap: 6px; border-radius: var(--hr-radius); white-space: normal; overflow-wrap: anywhere; line-height: 1.15; text-align: center; display: flex; justify-content: center; align-items: center; }
      .cell ha-icon { --mdc-icon-size: 18px; flex: none; }
      .cell { position: relative; } .cell.hid { opacity: .45; } .cell .star.eye { color: var(--hr-muted); } .cell.hid .star.eye { color: var(--hr-danger, #e55); }
      .cell .star { position: absolute; top: 3px; right: 3px; --mdc-icon-size: 15px; color: var(--hr-accent); }
      .cell.isfav { box-shadow: inset 0 0 0 1.5px var(--hr-accent); }
      .block.favs { background: color-mix(in srgb, var(--hr-accent) 10%, transparent); }
      .power .cells { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .numpad summary { cursor: pointer; color: var(--hr-muted); font-size: 0.9em; padding: 4px 0; }
      .numpad summary { margin-bottom: 8px; } .nums { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; max-width: 280px; margin: 0 auto; width: 100%; } .nums .cell { min-height: 48px; font-size: 1.05em; }
      @container (max-width: 619px) { .devlist { grid-template-columns: repeat(3, minmax(0, 1fr)); } .tile.dev { min-height: 72px; padding: 8px 4px; } .tile.dev span { font-size: 0.78em; } .tile.dev ha-icon { --mdc-icon-size: 24px; } }
      @container (min-width: 620px) { .devlist { grid-template-columns: repeat(4, minmax(0, 1fr)); } .devremote .panel { max-width: 460px; margin: 0 auto; } }
      .empty { margin: 0; color: var(--hr-muted); }
      /* 0.11 readability: text at least 12 px, tap targets at least 40 px in the editor (display review) */
      .etitle { font-size: max(12px, 0.72em); } .raw pre { font-size: max(12px, 0.72em); }
      .mini.txt { font-size: max(12px, 0.85em); min-height: 40px; padding: 4px 14px; }
      .ddrow .esub { display: flex; align-items: center; gap: 6px; } .ddquirk { margin-top: 4px; } .ddcaps { margin-top: 6px; }
      .etabs button, .iconbtn, .copyraw, .devhead .actlink { min-height: 40px; }
      .tile.dev small, .key.svc small, .hubtabs small { font-size: max(11px, 0.68em); }
      @keyframes pulse { 50% { opacity: 0.55; } }
      @media (max-width: 420px) { .tile { min-height: 74px; } .panel { --c1: 56px; --c3: 56px; gap: 6px; } .panel.mid3 { --c3: 66px; } .panel.wide3 { --c3: 78px; } }
      ${SKIN_CSS}
    </style>`;
  },
};
