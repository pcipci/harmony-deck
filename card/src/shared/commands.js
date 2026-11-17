// Harmony command names: aliases per action, icons per key, readable labels.

// Command names differ per device (OK / Select / Enter); first match wins.
export const ALIASES = {
  up: ["DirectionUp"], down: ["DirectionDown"], left: ["DirectionLeft"], right: ["DirectionRight"],
  ok: ["OK", "Select", "Enter"],
  back: ["Back", "Return", "Exit"],
  home: ["Home"],
  menu: ["Menu", "DiscMenu", "Info/Menu", "TitleMenu"],
  volume_up: ["VolumeUp"], volume_down: ["VolumeDown"], mute: ["Mute"],
  channel_up: ["ChannelUp", "BouquetUp"], channel_down: ["ChannelDown", "BouquetDown"],
  play: ["Play", "CdPlay", "IpodPlay"], pause: ["Pause", "CdPause", "IpodPause"], stop: ["Stop"],
  rewind: ["Rewind", "SkipBack", "SkipBackward", "ChapterPrev"],
  forward: ["FastForward", "SkipForward", "ChapterNext"],
  red: ["Red"], green: ["Green"], yellow: ["Yellow"], blue: ["Blue"],
};

// Icons for device keys. A block only shows icons when most of its keys have one.
export const KEY_ICONS = [
  [/^Input.*Hdmi|^Hdmi/i, "mdi:hdmi-port"], [/^Input.*(Av|Component|Video|Scart)/i, "mdi:audio-video"],
  [/^Input.*(Pc|Rgb)/i, "mdi:monitor"], [/^Input.*(Tuner)|^(FmMode|TuneMode)/i, "mdi:radio"], [/^Input.*Tv/i, "mdi:television"],
  [/^Input.*Cd/i, "mdi:disc"], [/^Input.*Aux/i, "mdi:audio-input-stereo-minijack"], [/^Input.*Ipod|^IpodMenu/i, "mdi:apple"], [/^Input/i, "mdi:import"],
  [/^(Rec|Record)$/i, "mdi:record-rec"], [/^Info/i, "mdi:information-outline"], [/^(Settings|Setup|ServiceMenu|Option|T\.?Opt)/i, "mdi:cog-outline"],
  [/^Subtitle/i, "mdi:subtitles-outline"], [/^Sleep|^AutoOff/i, "mdi:power-sleep"], [/^Guide|^UserGuide/i, "mdi:television-guide"],
  [/^(Text|Teletext)/i, "mdi:text-box-outline"], [/^Fav/i, "mdi:heart-outline"], [/^(Eject|Open\/Close)/i, "mdi:eject"], [/^Repeat/i, "mdi:repeat"],
  [/^Audio$/i, "mdi:volume-high"], [/^PageUp/i, "mdi:chevron-double-up"], [/^PageDown/i, "mdi:chevron-double-down"], [/^3D/i, "mdi:video-3d"],
  [/^Ratio/i, "mdi:aspect-ratio"], [/^(MyApps|Apps?)/i, "mdi:apps"], [/^Surround/i, "mdi:surround-sound"], [/^Stereo/i, "mdi:speaker"],
  [/^Dsp-?Movie/i, "mdi:movie-open"], [/^Dsp-?Music/i, "mdi:music"], [/^LiveTv/i, "mdi:television-classic"], [/^(Tv\/?Rad|Radio)/i, "mdi:radio"],
  [/^Exit/i, "mdi:close"], [/^Clear/i, "mdi:backspace-outline"], [/^Delete/i, "mdi:delete-outline"], [/^Search/i, "mdi:magnify"],
  [/^Candle/i, "mdi:candle"], [/^Disco(Power|OnOff)/i, "mdi:power"], [/^Disco/i, "mdi:party-popper"],
  [/^(Title|TitleMenu)$/i, "mdi:movie-roll"], [/^(DiscMenu|PopUp|PopUpMenu)$/i, "mdi:disc"], [/^Display$/i, "mdi:monitor-eye"], [/^MusicId/i, "mdi:music-circle-outline"],
  [/^ChapterPrev/i, "mdi:chevron-double-left"], [/^ChapterNext/i, "mdi:chevron-double-right"], [/^SkipBack/i, "mdi:skip-previous"], [/^SkipForward/i, "mdi:skip-next"],
  [/^Q\.?View$/i, "mdi:swap-horizontal"], [/^List$/i, "mdi:format-list-bulleted"], [/^@$/, "mdi:at"], [/^AD$/i, "mdi:account-voice"], [/^In-?(Start|Stop)/i, "mdi:wrench-outline"],
  [/^(Q\.?Menu|SmartMenu|Smart)$/i, "mdi:view-grid-outline"], [/^Simplink/i, "mdi:link-variant"], [/^A$/, "mdi:alpha-a-circle"], [/^B$/, "mdi:alpha-b-circle"], [/^X$/, "mdi:alpha-x-circle"], [/^Y$/, "mdi:alpha-y-circle"],
  [/^DVR$/i, "mdi:record-circle-outline"], [/^LastChannel/i, "mdi:undo-variant"], [/^Movies/i, "mdi:movie-open"], [/^(OneGuide|TVListings)/i, "mdi:television-guide"], [/^Replay/i, "mdi:replay"],
  [/^Standby/i, "mdi:power-sleep"], [/^(TVShows|TV)$/i, "mdi:television-classic"], [/^View$/i, "mdi:eye-outline"], [/^Xbox$/i, "mdi:microsoft-xbox"], [/^ChannelLevel/i, "mdi:tune-vertical"],
  [/^Dock/i, "mdi:usb-port"], [/^Dsp-?Entertainment/i, "mdi:movie-roll"], [/^Dsp-?Off/i, "mdi:speaker-off"], [/^Enhancer/i, "mdi:auto-fix"], [/^iPodUp/i, "mdi:arrow-up-bold-circle-outline"], [/^iPodDown/i, "mdi:arrow-down-bold-circle-outline"],
  [/^SubWooferUp/i, "mdi:speaker-wireless"], [/^SubWooferDown/i, "mdi:speaker-wireless"], [/^UniVolume/i, "mdi:volume-source"], [/^ArrowLeft/i, "mdi:arrow-left"], [/^ArrowRight/i, "mdi:arrow-right"],
  [/^BouquetUp/i, "mdi:folder-arrow-up-outline"], [/^BouquetDown/i, "mdi:folder-arrow-down-outline"], [/^Help/i, "mdi:help-circle-outline"], [/^Video$/i, "mdi:video-outline"], [/^Greater10/i, "mdi:numeric-10-box-outline"],
  [/^(Clock\/?Timer|TimerPlay)/i, "mdi:timer-outline"], [/^Program/i, "mdi:playlist-edit"], [/^AutoPreset/i, "mdi:radio-tower"], [/^(Bass|D\.Bass)/i, "mdi:equalizer"], [/^Dimmer/i, "mdi:brightness-6"],
  [/^PlayMode/i, "mdi:shuffle-variant"], [/^PresetEq/i, "mdi:equalizer-outline"], [/^ReMaster/i, "mdi:sine-wave"], [/^Cd(Play|Pause)/i, "mdi:disc-player"], [/^Ipod(Play|Pause)/i, "mdi:apple"],
  [/Bluetooth|^Bt/i, "mdi:bluetooth"], [/^Usb/i, "mdi:usb"], [/^(Net|Network|Lan)/i, "mdi:lan"], [/^Phono/i, "mdi:album"], [/^(Optical|Coax|Digital)/i, "mdi:audio-input-rca"], [/^Airplay/i, "mdi:cast-audio"],
  [/^LeftClick/i, "mdi:mouse-left-click-outline"], [/^RightClick/i, "mdi:mouse-right-click-outline"], [/^CloseProgram/i, "mdi:close-box-outline"], [/^CloseWindow/i, "mdi:window-close"],
  [/^MinimizeAll/i, "mdi:window-minimize"], [/^ShowDock/i, "mdi:dock-bottom"], [/^Fullscreen/i, "mdi:fullscreen"], [/^ZoomIn/i, "mdi:magnify-plus-outline"], [/^ZoomOut/i, "mdi:magnify-minus-outline"], [/^Desktop/i, "mdi:monitor-multiple"],
  [/^(Command|Ctrl|Control|CTRL)\+C$/i, "mdi:content-copy"], [/^(Command|Ctrl|Control|CTRL)\+V$/i, "mdi:content-paste"], [/^(Command|Ctrl|Control|CTRL)\+X$/i, "mdi:content-cut"], [/^(Command|Ctrl|Control|CTRL)\+Z$/i, "mdi:undo"],
  [/^(Command|Ctrl|Control|CTRL)\+Y$/i, "mdi:redo"], [/^(Command|Ctrl|Control|CTRL)\+A$/i, "mdi:select-all"], [/^(Command|Ctrl|Control|CTRL)\+S$/i, "mdi:content-save-outline"], [/^(Command|Ctrl|Control|CTRL)\+F$/i, "mdi:magnify"],
  [/^(Command|Ctrl|Control|CTRL)\+W$/i, "mdi:window-close"], [/^(Command|Ctrl|Control|CTRL)\+Q$/i, "mdi:power"], [/^(Command|Ctrl|Control|CTRL)\+N$/i, "mdi:file-plus-outline"], [/^(Command|Ctrl|Control|CTRL)\+O$/i, "mdi:folder-open-outline"],
  [/^(Command|Ctrl|Control|CTRL)\+P$/i, "mdi:printer-outline"], [/^(Command|Ctrl|Control|CTRL)\+T$/i, "mdi:tab-plus"], [/^(Command|Ctrl|Control|CTRL)\+R$/i, "mdi:refresh"], [/^(Command|Ctrl|Control|CTRL)\+L$/i, "mdi:link-variant"],
  [/^(Command|Ctrl|Control|CTRL)\+(Space)$/i, "mdi:magnify"], [/^(Command|Ctrl|Control|CTRL)\+M$/i, "mdi:window-minimize"], [/^(Command|Ctrl|Control|CTRL)\+H$/i, "mdi:eye-off-outline"], [/^(Command|Ctrl|Control|CTRL)\+[\d]$/i, "mdi:numeric-1-box-outline"], [/^(Command|Ctrl|Control|CTRL)\+/i, "mdi:apple-keyboard-command"],
  [/^Spotify/i, "mdi:spotify"], [/^Netflix/i, "mdi:netflix"], [/^Youtube/i, "mdi:youtube"], [/^Eject|^OpenClose/i, "mdi:eject"], [/^(Shuffle|Random)/i, "mdi:shuffle"], [/^(Mute)$/i, "mdi:volume-off"],
];

export const keyIcon = (cmd, overrides = {}, device = "") =>
  overrides[`${device}/${cmd}`] || overrides[cmd] || (KEY_ICONS.find(([re]) => re.test(cmd)) || [])[1] || null;

// Icons for the favourite chips of common commands (only used in the editor).
export const CHIP_ICONS = [[/^vol(ume)?[\s_-]?up/i, "mdi:volume-plus"], [/^vol(ume)?[\s_-]?down/i, "mdi:volume-minus"], [/^(ok|select|enter)$/i, "mdi:circle-outline"], [/^(back|return)$/i, "mdi:arrow-u-left-top"],
  [/^(direction|dir|arrow|cursor)?[\s_-]?up$/i, "mdi:chevron-up"], [/^(direction|dir|arrow|cursor)?[\s_-]?down$/i, "mdi:chevron-down"], [/^(direction|dir|arrow|cursor)?[\s_-]?left$/i, "mdi:chevron-left"], [/^(direction|dir|arrow|cursor)?[\s_-]?right$/i, "mdi:chevron-right"],
  [/^(power)?off$/i, "mdi:power"], [/^power(on|toggle)?$/i, "mdi:power"], [/^stop$/i, "mdi:stop"], [/^play$/i, "mdi:play"], [/^pause$/i, "mdi:pause"], [/^(rewind|rew)$/i, "mdi:rewind"], [/^(fast[\s_-]?forward|ff|forward)$/i, "mdi:fast-forward"],
  [/^home$/i, "mdi:home-outline"], [/^menu$/i, "mdi:menu"], [/^(channel|ch)[\s_-]?up$/i, "mdi:chevron-up"], [/^(channel|ch)[\s_-]?down$/i, "mdi:chevron-down"], [/^info/i, "mdi:information-outline"]];

export const chipIcon = (c) => (CHIP_ICONS.find(([re]) => re.test(c)) || [])[1] || null;

export const prettyCommand = (c) => {
  if (/\+/.test(c)) {
    const m = c.replace(/Command\+/gi, "⌘+").replace(/(Control|Ctrl)\+/gi, "⌃+").replace(/(Option|Alt)\+/gi, "⌥+").replace(/Shift\+/gi, "⇧+").replace(/([⌘⌃⌥⇧])\+/g, "$1");
    if (m !== c) return m.replace(/space$/i, " Space").replace(/([⌘⌃⌥⇧])([a-z])$/, (x, a, b) => a + b.toUpperCase());
  }
  const s = c.replace(/^Input/, "").replace(/Hdmi/i, "HDMI ").replace(/^Component/, "Comp. ").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Za-z])-([A-Za-z])/g, "$1 $2")
    .replace(/^i Pod/, "iPod").replace(/^Power /, "").trim();
  return /^\d[\d-]*$/.test(s) ? `Input ${s}` : s || c;
};

export const powerCls = (c) => (/^Power(On)$|^(On|DiscoPowerOn)$/i.test(c) ? "pon" : /^Power(Off)$|^(Off|DiscoPowerOff)$/i.test(c) ? "poff" : "");
