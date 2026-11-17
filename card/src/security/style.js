// Security card, style: only what the shared style sheet of the main card does not already have.

export const securityStyle = `<style>
  ha-card.sec { gap: 14px; }
  .sechead { display: flex; align-items: center; gap: 10px; font-size: 1.05em; } .sechead ha-icon { color: var(--hr-accent); --mdc-icon-size: 24px; flex: none; }
  .sechead span { color: var(--hr-muted); font-size: 0.85em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sec section { gap: 12px; }
  .sec .esec { background: var(--hr-tile-bg); }
  .sec details.esec > summary { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 6px; } .sec details.esec > summary::-webkit-details-marker { display: none; }
  .sec details.esec > summary::after { content: "▾"; margin-left: auto; color: var(--hr-muted); } .sec details.esec:not([open]) > summary::after { content: "▸"; }
  .secstate { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--hr-tile-radius, 16px); background: var(--hr-tile-bg); border: 1px solid transparent; }
  .secstate ha-icon { --mdc-icon-size: 26px; flex: none; } .secstate b { flex: 1; min-width: 0; overflow-wrap: anywhere; } .secstate span { color: var(--hr-muted); font-size: 0.8em; text-align: right; }
  .secstate.s-on { border-color: var(--hr-danger); } .secstate.s-on ha-icon { color: var(--hr-danger); }
  .secstate.s-free { border-color: var(--hr-accent); } .secstate.s-free ha-icon, .secstate.s-idle ha-icon { color: var(--hr-accent); }
  .secstate.s-off ha-icon { color: var(--hr-muted); }
  .secnote { display: flex; align-items: center; gap: 8px; } .secnote ha-icon { --mdc-icon-size: 18px; flex: none; } .secnote.err { color: var(--hr-danger); }
  .secrel { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; } .secrel .ehint { flex: 1 1 140px; min-width: 0; }
  .secrel select, .sectimes input { font: inherit; padding: 8px 10px; border-radius: 10px; background: var(--hr-select-bg, var(--hr-card-bg, var(--card-background-color))); color: var(--hr-text); border: 1px solid var(--divider-color, #444); min-width: 0; box-sizing: border-box; }
  .secrel select { flex: 1 1 130px; }
  .sec .chipbox { max-height: none; } .sec .fchip span { display: inline-flex; align-items: center; gap: 5px; } .sec .fchip span ha-icon { margin: 0; } .sec .fchip span { background: var(--hr-card-bg, var(--card-background-color)); } .sec .fchip input:checked + span { background: var(--hr-accent); color: var(--hr-on-accent); }
  .sec .fchip input:disabled + span { cursor: default; opacity: .8; } .sec .fchip.noinst input:not(:checked) + span { opacity: .6; }
  .sec .favkind button { background: var(--hr-card-bg, var(--card-background-color)); } .sec .favkind button.sel { background: var(--hr-accent); color: var(--hr-on-accent); } .sec .favkind button[disabled] { cursor: default; }
  .secnow { display: flex; align-items: center; gap: 8px; font-size: 0.9em; } .secnow ha-icon { --mdc-icon-size: 20px; color: var(--hr-fire, var(--hr-accent)); flex: none; }
  .secwin { display: flex; flex-direction: column; gap: 8px; padding: 10px; border-radius: 12px; background: var(--hr-card-bg, var(--card-background-color)); }
  .secdays { display: flex; flex-wrap: wrap; gap: 4px; } .secdays .fchip span { background: var(--hr-tile-bg); padding: 6px 9px; }
  .sectimes { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; } .sectimes label { display: flex; align-items: center; gap: 6px; font-size: 0.85em; color: var(--hr-muted); flex: 1 1 110px; min-width: 0; } .sectimes input { flex: 1; width: 100%; }
  .sectimes .pbtn { flex: none; }
  .seclegend .lc { display: inline-block; padding: 2px 9px; border-radius: 999px; background: var(--hr-card-bg, var(--card-background-color)); } .seclegend .lc.off { opacity: .6; }
  .sectest { margin-top: 8px; } .sectest.warn { color: var(--hr-danger); }
  .secloglist { display: flex; flex-direction: column; }
  .seclog { display: flex; align-items: center; gap: 8px; padding: 6px 2px; font-size: 0.88em; border-bottom: 1px solid color-mix(in srgb, var(--hr-muted) 16%, transparent); }
  .seclog:last-child { border-bottom: none; } .seclog time { flex: none; width: 5.6em; color: var(--hr-muted); font-variant-numeric: tabular-nums; font-size: 0.92em; }
  .seclog ha-icon { --mdc-icon-size: 18px; flex: none; color: var(--hr-muted); } .seclog span { flex: 1; min-width: 0; overflow-wrap: anywhere; } .seclog .pbtn { min-height: 28px; padding: 0 8px; font-size: 0.85em; flex: none; }
  .seclog.sep { color: var(--hr-muted); font-size: 0.8em; text-transform: uppercase; letter-spacing: .05em; } .seclog.sep.k-on { color: var(--hr-danger); } .seclog.sep.k-on ha-icon { color: var(--hr-danger); }
  .seclog.k-fire ha-icon, .seclog.k-hub ha-icon { color: var(--hr-text); }
  .secnow code, .secpkg code { font-size: 0.85em; overflow-wrap: anywhere; min-width: 0; }
  .secpkgs { display: flex; flex-direction: column; max-height: 260px; overflow-y: auto; } .secpkg { display: flex; align-items: center; gap: 8px; padding: 3px 0; } .secpkg[hidden] { display: none; } .secpkg code { flex: 1; } .secpkg .pbtn { min-height: 28px; padding: 0 8px; flex: none; }
  .secsearch { font: inherit; padding: 8px 10px; border-radius: 10px; background: var(--hr-select-bg, var(--hr-card-bg, var(--card-background-color))); color: var(--hr-text); border: 1px solid var(--divider-color, #444); width: 100%; box-sizing: border-box; }
  .secnow .secpkg { flex: 1; min-width: 0; }
</style>`;
