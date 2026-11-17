// Security card, events: every change is sent to the integration at once.
import { LAUNCHER } from "./const.js";

export const securityBindMixin = {
  _bind() {
    const root = this.shadowRoot;
    const hub = this._hubSel;
    const h = this._hubs().find((x) => x.id === hub);
    root.querySelectorAll("[data-hubtab]").forEach((b) => b.addEventListener("click", () => { this._hubSel = b.dataset.hubtab; this._logAll = false; this._key = ""; this._render(); }));
    root.querySelectorAll("details[data-open]").forEach((d) => d.addEventListener("toggle", () => { this._open = { ...(this._open || {}), [d.dataset.open]: d.open }; }));
    // Debug: filter the package rows in place (no re-render, so the typed text stays) and copy a name.
    root.querySelector("[data-pkg-search]")?.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      root.querySelectorAll(".secpkgs .secpkg").forEach((r) => { r.hidden = !!q && !r.dataset.pkg.toLowerCase().includes(q); });
    });
    root.querySelectorAll("[data-copy]").forEach((b) => b.addEventListener("click", () => this._copy(b)));
    if (!h) return;
    root.querySelectorAll("[data-mode]").forEach((b) => b.addEventListener("click", () => this._set(hub, { mode: b.dataset.mode })));
    root.querySelector("[data-minutes]")?.addEventListener("change", (e) => this._set(hub, { minutes: Number(e.target.value) }));
    root.querySelector("[data-test]")?.addEventListener("click", () => this._test(hub));
    root.querySelector("[data-release]")?.addEventListener("click", () => this._call("release", { hub }));
    root.querySelector("[data-release-end]")?.addEventListener("click", () => this._call("release", { hub, end: true }));
    const checked = (attr) => [...root.querySelectorAll(`input[${attr}]:checked`)].map((i) => i.getAttribute(attr));
    root.querySelectorAll("input[data-allow-act]").forEach((i) => i.addEventListener("change", () => {
      // Activities the hub does not report right now stay on the list.
      const hidden = h.activities.filter((a) => !h.all_activities.includes(a));
      this._set(hub, { activities: [...checked("data-allow-act"), ...hidden] });
    }));
    root.querySelectorAll("input[data-off-dev]").forEach((i) => i.addEventListener("change", () => this._set(hub, { off_devices: checked("data-off-dev") })));
    root.querySelectorAll("input[data-allow-app]").forEach((i) => i.addEventListener("change", () => {
      // Taking the start screen off also takes every other app off: ask first.
      if (i.hasAttribute("data-launcher") && !i.checked) {
        const t = this._text;
        if (!window.confirm(t.sec.launcherAsk)) { i.checked = true; return; }
        this._set(hub, { apps: [] });
        return;
      }
      this._set(hub, { apps: checked("data-allow-app") });
    }));
    root.querySelectorAll("[data-read-apps]").forEach((b) => b.addEventListener("click", () => this._readApps(b.dataset.readApps)));
    // Schedule: the windows are read back from the form, changed and sent as a whole.
    const windows = () => [...root.querySelectorAll("[data-win]")].map((w) => ({
      days: [...w.querySelectorAll("input[data-day]:checked")].map((i) => Number(i.dataset.day)),
      from: w.querySelector("[data-from]").value || "00:00",
      to: w.querySelector("[data-to]").value || "00:00",
    }));
    // A window without a day would be dropped by the integration; keep it in the form until a day is chosen.
    const sendWindows = (list) => { if (list.every((w) => w.days.length)) this._set(hub, { schedule: list }); };
    root.querySelectorAll("[data-win] input").forEach((i) => i.addEventListener("change", () => sendWindows(windows())));
    root.querySelectorAll("[data-win-del]").forEach((b) => b.addEventListener("click", () => this._set(hub, { schedule: windows().filter((_, n) => n !== Number(b.dataset.winDel)).filter((w) => w.days.length) })));
    root.querySelector("[data-win-add]")?.addEventListener("click", () => {
      this._open = { ...(this._open || {}), schedule: true };
      this._set(hub, { schedule: [...windows().filter((w) => w.days.length), { days: [0, 1, 2, 3, 4, 5, 6], from: "20:00", to: "07:00" }] });
    });
    root.querySelector("[data-log-all]")?.addEventListener("click", () => { this._logAll = !this._logAll; this._key = ""; this._render(); });
    root.querySelector("[data-log-clear]")?.addEventListener("click", () => this._call("clear_log", { hub }));
    root.querySelectorAll("[data-allow-pkg]").forEach((b) => b.addEventListener("click", () => this._set(hub, { apps: [...new Set([...(h.apps.includes(LAUNCHER) ? [] : [LAUNCHER]), ...h.apps, b.dataset.allowPkg])] })));
    root.querySelectorAll("[data-allow-name]").forEach((b) => b.addEventListener("click", () => this._set(hub, { activities: [...new Set([...h.activities, b.dataset.allowName])] })));
  },
};
