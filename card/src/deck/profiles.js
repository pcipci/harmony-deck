// Profiles: choice per browser, management and assignment (administrators).
import { esc } from "../shared/util.js";
import { fmtText } from "../shared/i18n.js";

export const profilesMixin = {
  // Profiles: explicit `profile:` of the card wins, then the choice made in this browser, else the server decides (assigned or default).
  _choiceGet() { try { return localStorage.getItem("harmony_deck_profile") || ""; } catch (e) { return ""; } },

  _choiceSet(name) { try { if (name) localStorage.setItem("harmony_deck_profile", name); else localStorage.removeItem("harmony_deck_profile"); } catch (e) { /* storage blocked */ } },

  _profileReq() { return this._config.profile || this._choiceGet(); },

  _prof() { return this._info?.profile || { active: "Standard", names: ["Standard"], assigned: null, usersOf: {} }; },

  async _profAction(args) {
    try {
      const res = await this._hass.callWS({ type: "harmony_deck/profiles", ...args });
      this._profErr = "";
      return res;
    } catch (e) {
      this._profErr = e?.code || "error";
      return null;
    } finally {
      this._profDlg = null;
    }
  },

  async _profRun(dlg) {
    const old = dlg.name;
    if (dlg.kind === "save") {
      const res = await this._profAction({ action: "create", name: this._profName || "", copy_from: this._prof().active });
      if (res?.name) { this._profName = ""; if (!this._config.profile) this._choiceSet(res.name); }
    } else if (dlg.kind === "rename") {
      const res = await this._profAction({ action: "rename", name: old, new_name: this._profNew || "" });
      if (res?.name && this._choiceGet() === old) this._choiceSet(res.name);
    } else if (dlg.kind === "delete") {
      await this._profAction({ action: "delete", name: old });
      if (this._choiceGet() === old) this._choiceSet("");
    }
    await this._loadInfo();
  },

  // Profile chip in the header: switch profile; administrators can also save a new one or open the profile management.
  _profChip(t) {
    if (this._config.compact) return "";
    const pr = this._prof();
    const admin = this._hass?.user?.is_admin !== false;
    const fixed = this._config.profile;
    if (!admin && (fixed || pr.names.length < 2)) return "";
    const open = !!this._profOpen?.[this._hubSel];
    return `<button type="button" class="profchip ${open ? "sel" : ""}" data-win-prof title="${esc(t.profLabel)}"><ha-icon icon="mdi:account-circle-outline"></ha-icon><span>${esc(pr.active)}</span></button>`;
  },

  // Window of the profile: the profiles to pick (or automatic), new and edit for administrators.
  _profList(t) {
    const pr = this._prof();
    const admin = this._hass?.user?.is_admin !== false;
    const fixed = this._config.profile;
    const chosen = fixed ? pr.active : this._choiceGet();
    const item = (v, label, on, icon, off = false) => `<button type="button" class="mentry pitem ${on ? "on" : ""}" data-profpick="${esc(v)}" ${off ? "disabled" : ""}><ha-icon icon="${icon}"></ha-icon><span>${esc(label)}</span>${on ? '<ha-icon class="pchk" icon="mdi:check"></ha-icon>' : ""}</button>`;
    return `<div class="plist">${fixed ? "" : item("", t.profAutoOpt, !chosen, "mdi:auto-fix")}${pr.names.map((n) => item(n, n, n === chosen, "mdi:account-circle-outline", !!fixed)).join("")}${admin ? item("__new", t.profNewEntry, false, "mdi:plus") + item("__edit", t.profEditEntry, false, "mdi:pencil-outline") : ""}</div>`;
  },

  // Profiles tab: which profile is edited, load / rename / delete, save as new, assign users. Dangerous steps ask first.
  _profilesEdit(t) {
    const pr = this._prof();
    const fixed = this._config.profile;
    const dlg = this._profDlg;
    const userName = (id) => (this._info?.users || []).find((u) => u.id === id)?.name || id;
    const shared = (pr.usersOf?.[pr.active] || []).map(userName);
    const why = fixed ? t.profWhyFixed : this._choiceGet() ? t.profWhyChosen : pr.assigned ? t.profWhyAssigned : t.profWhyAuto;
    const rows = pr.names.map((n) => {
      const users = (pr.usersOf?.[n] || []).map(userName);
      const isDef = n === "Standard";
      const isAct = n === pr.active;
      const renaming = dlg?.kind === "rename" && dlg.name === n;
      return `<div class="profrow ${isAct ? "act" : ""}"><span class="pname"><ha-icon icon="${isAct ? "mdi:account-circle" : "mdi:account-circle-outline"}"></ha-icon><b>${esc(n)}</b>${users.length ? `<small>${esc(users.join(", "))}</small>` : ""}</span>
        <span class="pbtns">${isAct ? `<span class="pbadge">${esc(t.profActive)}</span>` : `<button class="pbtn" data-prof-load="${esc(n)}" ${fixed ? "disabled" : ""}><ha-icon icon="mdi:swap-horizontal"></ha-icon><span>${t.profLoad}</span></button>`}
        ${isDef ? "" : `<button class="pbtn" data-prof-ask="rename" data-name="${esc(n)}" title="${esc(t.profRename)}"><ha-icon icon="mdi:pencil-outline"></ha-icon></button><button class="pbtn" data-prof-ask="delete" data-name="${esc(n)}" title="${esc(t.profDelete)}"><ha-icon icon="mdi:delete-outline"></ha-icon></button>`}</span>
        ${renaming ? this._profDialog(t, dlg, pr) : ""}</div>`;
    }).join("");
    const users = (this._profAll ? this._info?.usersAll : this._info?.users) || [];
    const assign = this._info?.assign || {};
    const moreUsers = (this._info?.usersAll || []).length > (this._info?.users || []).length || this._profAll;
    const assignRows = users.map((u) => `<label class="erow"><span>${esc(u.name)}</span><select data-prof-assign="${esc(u.id)}"><option value="">${t.profAutoOpt}</option>${pr.names.map((n) => `<option value="${esc(n)}" ${assign[u.id] === n ? "selected" : ""}>${esc(n)}</option>`).join("")}</select></label>`).join("");
    return `<div class="esec"><div class="etitle">${t.profTitle}</div>
      <div class="ehint">${t.profIntro}</div>
      <div class="profnow"><ha-icon icon="mdi:account-circle"></ha-icon><span>${t.profEditing}: <b>${esc(pr.active)}</b><small>${esc(why)}</small></span>
        ${!fixed && this._choiceGet() ? `<button class="pbtn" data-prof-auto><ha-icon icon="mdi:auto-fix"></ha-icon><span>${t.profAutoBtn}</span></button>` : ""}</div>
      ${fixed ? `<div class="ehint profwarn"><ha-icon icon="mdi:lock-outline"></ha-icon><span>${esc(fmtText(t.profFixedHint, [fixed]))}</span></div>` : ""}
      ${shared.length ? `<div class="ehint profwarn"><ha-icon icon="mdi:account-multiple-outline"></ha-icon><span>${esc(fmtText(t.profSharedWarn, [shared.join(", ")]))}</span></div>` : ""}
      ${this._profErr ? `<div class="ehint proferr"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><span>${esc(t.profErr?.[this._profErr] || t.profErr?.error || this._profErr)}</span></div>` : ""}
      <div class="proflist">${rows}</div>
      <div class="ehint">${t.profDefaultNote}</div>
      <div class="dname">${t.profSaveAs}</div>
      <div class="profnew"><input type="text" data-prof-name maxlength="40" placeholder="${esc(t.profNamePh)}" value="${esc(this._profName || "")}"><button class="pbtn pri" data-prof-ask="save"><ha-icon icon="mdi:content-save-outline"></ha-icon><span>${t.profSave}</span></button></div>
      ${dlg && dlg.kind !== "rename" ? this._profDialog(t, dlg, pr) : ""}
      ${assignRows ? `<div class="dname">${t.profUsers}</div><div class="ehint">${t.profUsersHint}</div>${assignRows}` : ""}
      ${moreUsers ? `<label class="erow"><span>${t.profAllUsers}</span><span class="sw"><input type="checkbox" data-prof-all ${this._profAll ? "checked" : ""}><i></i></span></label>` : ""}
      ${assignRows && !this._profAll ? `<div class="ehint">${t.profPersonNote}</div>` : ""}</div>`;
  },

  // Confirmation panel for saving, renaming and deleting a profile (the text says what it means for everyone).
  _profDialog(t, dlg, pr) {
    const users = (pr.usersOf?.[dlg.name] || []).map((id) => (this._info?.users || []).find((u) => u.id === id)?.name || id);
    let text = "", ok = t.profSave, cls = "editdone", input = "";
    if (dlg.kind === "save") text = fmtText(t.profAskSave, [this._profName || "", pr.active]);
    else if (dlg.kind === "rename") { text = fmtText(t.profAskRename, [dlg.name]); ok = t.profRename; input = `<input type="text" data-prof-rename maxlength="40" value="${esc(this._profNew ?? dlg.name)}">`; }
    else { text = fmtText(t.profAskDelete, [dlg.name]) + (users.length ? " " + fmtText(t.profAskDeleteUsers, [users.join(", ")]) : ""); ok = t.profDelete; cls = "editdone warn"; }
    return `<div class="profdlg"><div class="askq">${esc(text)}</div>${input}<div class="editrow"><button class="editcancel" data-prof-no>${t.profBack}</button><button class="${cls}" data-prof-yes>${ok}</button></div></div>`;
  },

  // Events of the profile chip and the profile management.
  _bindProfiles(root) {
    root.querySelector("input[data-prof-all]")?.addEventListener("change", (e) => { this._profAll = e.target.checked; this._rerender(); });
    root.querySelectorAll("[data-prof-load]").forEach((b) => b.addEventListener("click", async () => { this._choiceSet(b.dataset.profLoad); this._profErr = ""; await this._loadInfo(); }));
    root.querySelector("[data-prof-auto]")?.addEventListener("click", async () => { this._choiceSet(""); this._profErr = ""; await this._loadInfo(); });
    root.querySelectorAll("[data-prof-ask]").forEach((b) => b.addEventListener("click", () => { this._profErr = ""; this._profNew = undefined; this._profName = root.querySelector("input[data-prof-name]")?.value ?? this._profName; this._profDlg = { kind: b.dataset.profAsk, name: b.dataset.name }; this._rerender(); }));
    root.querySelector("[data-prof-no]")?.addEventListener("click", () => { this._profDlg = null; this._rerender(); });
    root.querySelector("[data-prof-yes]")?.addEventListener("click", () => this._profRun(this._profDlg));
    root.querySelector("input[data-prof-name]")?.addEventListener("input", (e) => { this._profName = e.target.value; });
    root.querySelector("input[data-prof-rename]")?.addEventListener("input", (e) => { this._profNew = e.target.value; });
    root.querySelectorAll("select[data-prof-assign]").forEach((sel) => sel.addEventListener("change", async () => { await this._profAction({ action: "assign", user_id: sel.dataset.profAssign, profile: sel.value || null }); await this._loadInfo(); }));
    root.querySelectorAll("[data-win-prof]").forEach((b) => b.addEventListener("click", () => { this._winToggle(this._hubSel, "prof"); this._rerender(); }));
    root.querySelectorAll("[data-profpick]").forEach((b) => b.addEventListener("click", async () => {
      const v = b.dataset.profpick;
      this._winSet(this._hubSel, null);
      if (v === "__new" || v === "__edit") { this._focusProfName = v === "__new"; this._profErr = ""; this._profDlg = null; await this._onEdit("profiles"); return; }
      this._choiceSet(v);
      await this._loadInfo();
    }));
  },
};
