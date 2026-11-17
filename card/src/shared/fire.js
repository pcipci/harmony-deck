// Fire TV data: keys, ADB key codes, model key sets, known apps and package names.

// Fire TV direct control (Home Assistant "androidtv" integration, service androidtv.adb_command).
export const FIRE_KEYS = [
  ["Suchen", "mdi:magnify", 84], ["Einstellungen", "mdi:cog-outline", 176], ["Menü", "mdi:menu", 82], ["Home", "mdi:home-outline", 3], ["Zurück", "mdi:arrow-u-left-top", 4],
  ["Play/Pause", "mdi:play-pause", 85], ["Stop", "mdi:stop", 86], ["Zurückspulen", "mdi:rewind", 89], ["Vorspulen", "mdi:fast-forward", 90], ["Vorheriger", "mdi:skip-previous", 88], ["Nächster", "mdi:skip-next", 87],
  ["Standby", "mdi:power-sleep", 223], ["Aufwecken", "mdi:power", 224],
  ["Kanal +", "mdi:chevron-up", 166], ["Kanal −", "mdi:chevron-down", 167], ["Guide", "mdi:television-guide", 172],
  ["Lauter", "mdi:volume-plus", 24], ["Leiser", "mdi:volume-minus", 25], ["Stumm", "mdi:volume-mute", 164],
];

// Harmony action -> Android key code, used as ADB fallback when the Harmony device has no such command.
export const ADB_KEYS = { up: 19, down: 20, left: 21, right: 22, ok: 23, back: 4, home: 3, menu: 82, play: 126, pause: 127, stop: 86, rewind: 89, forward: 90, volume_up: 24, volume_down: 25, mute: 164, channel_up: 166, channel_down: 167 };

// Key sets per model group (approximation of the original remotes; "all" shows everything).
export const FIRE_ROWS = [["Suchen", "Einstellungen", "Guide"], ["Vorheriger", "Play/Pause", "Nächster"], ["Standby", "Aufwecken"]];

export const FIRE_MODELS = {
  cube: ["Suchen", "Einstellungen", "Menü", "Home", "Zurück", "Play/Pause", "Stop", "Zurückspulen", "Vorspulen", "Vorheriger", "Nächster", "Kanal +", "Kanal −", "Guide", "Lauter", "Leiser", "Stumm", "Standby", "Aufwecken"],
  stick: ["Suchen", "Einstellungen", "Menü", "Home", "Zurück", "Play/Pause", "Zurückspulen", "Vorspulen", "Lauter", "Leiser", "Stumm", "Standby", "Aufwecken"],
  lite: ["Suchen", "Menü", "Home", "Zurück", "Play/Pause", "Zurückspulen", "Vorspulen"],
};

export const FIRE_APPS = [
  { name: "Netflix", abbr: "N", color: "#e50914", icon: "mdi:netflix", cmd: "monkey -p com.netflix.ninja -c android.intent.category.LAUNCHER 1" },
  { name: "Prime Video", abbr: "prime", color: "#00a8e1", icon: "mdi:amazon", cmd: "am start -n com.amazon.firebat/com.amazon.pyrocore.IgnitionActivity" },
  { name: "YouTube", abbr: "YT", color: "#ff0000", icon: "mdi:youtube", cmd: "monkey -p com.amazon.firetv.youtube -c android.intent.category.LAUNCHER 1" },
  { name: "Disney+", abbr: "D+", color: "#113ccf", icon: "", cmd: "monkey -p com.disney.disneyplus -c android.intent.category.LAUNCHER 1" },
  { name: "Paramount+", abbr: "P+", color: "#0064ff", icon: "", cmd: "monkey -p com.cbs.ott -c android.intent.category.LAUNCHER 1", guess: true },
  { name: "Apple TV", abbr: "tv", color: "#3a3a3c", icon: "", cmd: "monkey -p com.apple.atve.amazon.appletv -c android.intent.category.LAUNCHER 1" },
  { name: "Spotify", abbr: "S", color: "#1db954", icon: "mdi:spotify", cmd: "am start -n com.spotify.tv.android/.SpotifyTVActivity" },
  { name: "Amazon Music", fg: "#1b1b1b", abbr: "AM", color: "#25d1da", icon: "", cmd: "am start -n com.amazon.bueller.music/com.amazon.music.MainActivity" },
  { name: "Audible", fg: "#1b1b1b", abbr: "Au", color: "#f8991d", icon: "", cmd: "monkey -p com.audible.application.firetv -c android.intent.category.LAUNCHER 1" },
  { name: "Plex", fg: "#1b1b1b", abbr: "Px", color: "#e5a00d", icon: "mdi:plex", cmd: "monkey -p com.plexapp.android -c android.intent.category.LAUNCHER 1" },
  { name: "Twitch", abbr: "Tw", color: "#9146ff", icon: "mdi:twitch", cmd: "monkey -p tv.twitch.android.viewer -c android.intent.category.LAUNCHER 1" },
  { name: "Kodi", abbr: "K", color: "#17b2e7", icon: "mdi:kodi", cmd: "monkey -p org.xbmc.kodi -c android.intent.category.LAUNCHER 1" },
  { name: "Joyn", abbr: "J", color: "#e6007e", icon: "", cmd: "monkey -p de.prosiebensat1digital.seventv -c android.intent.category.LAUNCHER 1", guess: true },
  { name: "RTL+", abbr: "RTL", color: "#d6001c", icon: "", cmd: "monkey -p de.cbc.tvnow.firetv -c android.intent.category.LAUNCHER 1", guess: true },
  { name: "ARD", abbr: "ARD", color: "#00338d", icon: "", cmd: "monkey -p de.swr.avp.ard.tv -c android.intent.category.LAUNCHER 1", guess: true },
  { name: "ZDF", abbr: "ZDF", color: "#fa7d19", icon: "", cmd: "monkey -p com.zdf.android.mediathek -c android.intent.category.LAUNCHER 1", guess: true },
];

// Android package behind a launch command (monkey -p pkg ... / am start -n pkg/activity).
export const appPackage = (cmd) => ((cmd.match(/-p\s+([\w.]+)/) || cmd.match(/-n\s+([\w.]+)\//) || [])[1]) || null;

// Readable names for Android packages (what the Fire TV reports as running app) plus system apps.
export const APP_ALIASES = {
  "com.amazon.firetv.youtube": "YouTube", "com.google.android.youtube.tv": "YouTube", "com.google.android.youtube.tvunplugged": "YouTube TV",
  "com.amazon.avod": "Prime Video", "com.amazon.avod.thirdpartyclient": "Prime Video", "com.amazon.firebat": "Prime Video", "com.amazon.pyrocore": "Prime Video",
  "com.netflix.ninja": "Netflix", "com.disney.disneyplus": "Disney+", "com.cbs.ott": "Paramount+", "com.apple.atve.amazon.appletv": "Apple TV",
  "com.spotify.tv.android": "Spotify", "com.amazon.bueller.music": "Amazon Music", "com.audible.application.firetv": "Audible", "com.plexapp.android": "Plex",
  "tv.twitch.android.viewer": "Twitch", "org.xbmc.kodi": "Kodi",
};

export const SYS_APPS = { "com.amazon.tv.launcher": ["launcher", "mdi:home-outline"], "com.amazon.venezia": ["store", "mdi:store-outline"], "com.amazon.tv.settings.v2": ["settings", "mdi:cog-outline"], "com.android.tv.settings": ["settings", "mdi:cog-outline"], "com.amazon.ftv.screensaver": ["screensaver", "mdi:monitor-shimmer"] };

export const prettyPkg = (p) => {
  const skip = new Set(["com", "org", "net", "de", "tv", "android", "app", "apps", "amazon", "google", "www", "ninja", "firetv", "ott", "mobile", "client", "viewer", "application"]);
  const parts = String(p).split(".").filter((x) => x && !skip.has(x.toLowerCase()));
  const w = parts.pop() || String(p).split(".").pop() || String(p);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

// Readable name of a package: own name (set in the main card), known app, system app, else a guess from the package name.
export const appLabel = (pkg, t, own = {}) => own[pkg] || APP_ALIASES[pkg] || (FIRE_APPS.find((a) => appPackage(a.cmd) === pkg) || {}).name
  || (SYS_APPS[pkg] && t?.appSys?.[SYS_APPS[pkg][0]]) || prettyPkg(pkg);

// Packages of the built-in app list (offered in the security card even before the device was read).
export const knownPackages = () => FIRE_APPS.map((a) => appPackage(a.cmd)).filter(Boolean);

// Fire TV Cube (3rd generation): its IR keypad ("ir_keypad") turns these key events into infrared for the TV.
// Works without a Harmony activity. Key codes: mute 113, volume down 114, volume up 115.
export const IR_DEVICE = "/dev/input/event2";
export const IR_KEYS = { mute: 113, volume_down: 114, volume_up: 115 };
export const irCommand = (code, dev = IR_DEVICE) => `sendevent ${dev} 1 ${code} 1 && sendevent ${dev} 0 0 0 && sendevent ${dev} 1 ${code} 0 && sendevent ${dev} 0 0 0`;
