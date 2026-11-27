// Event wiring after each render: every area binds its own elements (see the _bindXxx function in its module).

export const bindMixin = {
  _bind() {
    const root = this.shadowRoot;
    this._bindSettings(root);
    this._bindInfo(root);
    this._bindFrame(root);
    this._bindActivities(root);
    this._bindHelp(root);
    this._bindFire(root);
    this._bindFireEditor(root);
    this._bindDirectDev(root);
    this._bindMismatch(root);
    this._bindVolSlider(root);
    this._bindMedia(root);
    this._bindMpEdit(root);
    this._bindSkinDecor(root);
    this._bindKeyboard(root);
    this._bindDevices(root);
    this._bindFavorites(root);
    this._bindProfiles(root);
    this._bindActions(root);
    this._bindSeq(root);
    this._bindActionEditor(root);
    this._bindKeys(root);
    this._bindLockMark(root);
  },
};
