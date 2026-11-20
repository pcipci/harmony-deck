// Service calls with a quiet safety net (0.19): the card calls Home Assistant without its own red error toast, retries a failed
// Harmony command twice in the background, sends the commands of one hub one after the other, and shows ONE calm hint when the
// hub stays unreachable (it disappears by itself or with the next command that works).

const WAITS = [0, 700, 1600];
const HINT_MS = 15000;

export const callMixin = {
  _call(domain, service, data = {}) {
    const key = data.entity_id || domain;
    const harmony = domain === "remote" && service === "send_command";
    const run = async () => {
      const waits = this._retryWaits || WAITS;
      for (let i = 0; i < waits.length; i++) {
        if (waits[i]) await new Promise((r) => setTimeout(r, waits[i]));
        try {
          // 5th argument false: Home Assistant shows no error toast for this call (we handle failures ourselves)
          await this._hass.callService(domain, service, data, undefined, false);
          if (domain === "remote") this._hubOk(key);
          return true;
        } catch (e) {
          if (i === waits.length - 1) { if (domain === "remote") this._hubFail(key); return false; }
        }
      }
      return false;
    };
    if (!harmony) return run();
    this._callQ = this._callQ || {};
    const p = (this._callQ[key] || Promise.resolve()).then(run, run);
    this._callQ[key] = p;
    return p;
  },

  _hubFail(key) {
    this._hubDown = { ...(this._hubDown || {}), [key]: Date.now() };
    clearTimeout(this._hubDownTm);
    this._hubDownTm = setTimeout(() => { this._hubDown = {}; this._rerender?.(); }, HINT_MS);
    this._rerender?.();
  },

  _hubOk(key) {
    if (!this._hubDown?.[key]) return;
    const { [key]: gone, ...rest } = this._hubDown; // eslint-disable-line no-unused-vars
    this._hubDown = rest;
    this._rerender?.();
  },

  _hubDownHtml(t) {
    return this._hubDown && Object.keys(this._hubDown).length ? `<div class="hubwarn" role="status"><ha-icon icon="mdi:lan-disconnect"></ha-icon><span>${t.hubDown}</span></div>` : "";
  },
};
