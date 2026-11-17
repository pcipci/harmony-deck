// Icon tables and guesses: activities, devices, actions, rooms.

// Keywords in the name of an activity (lower case, first hit wins, so specific ones come first).
export const ACTIVITY_ICONS = {
  nintendo: "mdi:nintendo-switch", switch: "mdi:nintendo-switch", wii: "mdi:nintendo-wii", playstation: "mdi:sony-playstation", ps5: "mdi:sony-playstation", ps4: "mdi:sony-playstation",
  xbox: "mdi:microsoft-xbox", steam: "mdi:steam", games: "mdi:gamepad-variant", spiel: "mdi:gamepad-variant", gaming: "mdi:gamepad-variant", konsole: "mdi:gamepad-variant",
  "fire tv": "mdi:television-play", firetv: "mdi:television-play", "apple tv": "mdi:apple", apple: "mdi:apple", chromecast: "mdi:cast", cast: "mdi:cast",
  netflix: "mdi:netflix", youtube: "mdi:youtube", spotify: "mdi:spotify", kodi: "mdi:kodi", plex: "mdi:plex", disney: "mdi:movie-open-play",
  bluray: "mdi:disc-player", "blu-ray": "mdi:disc-player", "blu ray": "mdi:disc-player", bd: "mdi:disc-player", dvd: "mdi:disc-player", disc: "mdi:disc-player",
  hue: "mdi:lightbulb-group", licht: "mdi:lightbulb-group", kerzen: "mdi:candle", candle: "mdi:candle",
  sat: "mdi:satellite-variant", receiver: "mdi:satellite-variant", kabel: "mdi:set-top-box", tv: "mdi:television", fernseh: "mdi:television",
  echo: "mdi:speaker-wireless", alexa: "mdi:speaker-wireless", musik: "mdi:music", music: "mdi:music", radio: "mdi:radio", schallplatte: "mdi:record-player", platten: "mdi:record-player",
  heimkino: "mdi:theater", kino: "mdi:theater", cinema: "mdi:theater", film: "mdi:movie-open", movie: "mdi:movie-open", video: "mdi:movie-open",
  pc: "mdi:desktop-tower-monitor", mac: "mdi:desktop-tower-monitor", computer: "mdi:desktop-tower-monitor",
};

export const activityIcon = (name, deviceGuess = null) => {
  const k = String(name).trim().toLowerCase();
  if (ACTIVITY_ICONS[k]) return ACTIVITY_ICONS[k];
  // Whole words first ("tv", "pc", "sat" must not match inside other words), then parts of words.
  const words = k.split(/[^a-zäöüß0-9]+/).filter(Boolean);
  const short = ["tv", "pc", "sat", "bd", "cast", "hue", "wii", "mac", "ps4", "ps5"];
  const wordHit = Object.keys(ACTIVITY_ICONS).find((x) => short.includes(x) && words.includes(x));
  if (wordHit) return ACTIVITY_ICONS[wordHit];
  const hit = Object.keys(ACTIVITY_ICONS).find((x) => !short.includes(x) && k.includes(x));
  if (hit) return ACTIVITY_ICONS[hit];
  const dev = deviceGuess && deviceGuess(name);
  return dev && dev !== "mdi:remote" ? dev : "mdi:remote";
};

export const ACTION_ICONS = [["mdi:lightbulb", "Lampe"], ["mdi:lightbulb-group", "Lampengruppe"], ["mdi:lamp", "Stehlampe"], ["mdi:ceiling-light", "Deckenlicht"], ["mdi:led-strip", "LED-Streifen"], ["mdi:string-lights", "Lichterkette"],
  ["mdi:candle", "Kerzen"], ["mdi:fireplace", "Kamin"], ["mdi:palette", "Szene / Farben"], ["mdi:movie-open", "Film-Szene"], ["mdi:popcorn", "Kino-Abend"], ["mdi:power", "Ein/Aus"], ["mdi:power-socket-eu", "Steckdose"],
  ["mdi:play-circle", "Skript starten"], ["mdi:fan", "Ventilator"], ["mdi:air-conditioner", "Klimaanlage"], ["mdi:radiator", "Heizung"], ["mdi:window-shutter", "Rollladen"], ["mdi:curtains", "Vorhang"], ["mdi:blinds", "Jalousie"],
  ["mdi:projector-screen", "Leinwand"], ["mdi:garage", "Garage"], ["mdi:lock", "Schloss"], ["mdi:robot-vacuum", "Saugroboter"], ["mdi:television", "Fernseher"], ["mdi:speaker", "Lautsprecher"], ["mdi:flash", "Blitz"]];

export const DEVICE_ICONS = [["mdi:television", "Fernseher / TV"], ["mdi:television-classic", "Röhrenfernseher"], ["mdi:monitor", "Monitor"], ["mdi:projector", "Beamer"], ["mdi:projector-screen", "Leinwand"],
  ["mdi:desktop-tower-monitor", "Mac / Computer"], ["mdi:laptop", "Laptop"], ["mdi:tablet", "Tablet"], ["mdi:cellphone", "Handy"], ["mdi:raspberry-pi", "Raspberry Pi"], ["mdi:nas", "NAS / Server"],
  ["mdi:television-play", "Streaming (Fire TV)"], ["mdi:cube-outline", "Fire TV Cube"], ["mdi:usb-flash-drive-outline", "Fire TV Stick"], ["mdi:television-box", "Streaming-Box (Roku, Shield)"], ["mdi:apple", "Apple TV"],
  ["mdi:cast", "Chromecast"], ["mdi:cast-connected", "Cast aktiv"], ["mdi:kodi", "Kodi"], ["mdi:plex", "Plex"], ["mdi:netflix", "Netflix"], ["mdi:youtube", "YouTube"], ["mdi:spotify", "Spotify"],
  ["mdi:set-top-box", "Kabel- / Set-Top-Box"], ["mdi:satellite-variant", "Receiver / SAT"], ["mdi:antenna", "Antenne / DVB-T"], ["mdi:disc-player", "Blu-ray / DVD"], ["mdi:video-vintage", "Videorekorder"], ["mdi:cassette", "Kassette"],
  ["mdi:microsoft-xbox", "Xbox"], ["mdi:sony-playstation", "PlayStation"], ["mdi:nintendo-switch", "Nintendo Switch"], ["mdi:nintendo-wii", "Wii"], ["mdi:nintendo-game-boy", "Handheld"], ["mdi:steam", "Steam / PC-Spiele"],
  ["mdi:gamepad-variant", "Gamepad"], ["mdi:controller-classic", "Retro-Konsole"],
  ["mdi:amplifier", "Verstärker"], ["mdi:speaker", "Lautsprecher"], ["mdi:speaker-wireless", "Smart Speaker / Echo"], ["mdi:soundbar", "Soundbar"], ["mdi:speaker-multiple", "Surround / Multiroom"],
  ["mdi:radio", "Radio"], ["mdi:radio-tower", "Tuner"], ["mdi:record-player", "Plattenspieler"], ["mdi:headphones", "Kopfhörer"], ["mdi:theater", "Heimkino"],
  ["mdi:hdmi-port", "HDMI-Umschalter"], ["mdi:router-wireless", "Router"], ["mdi:power-socket-eu", "Steckdose"], ["mdi:cctv", "Kamera"],
  ["mdi:lightbulb", "Licht"], ["mdi:led-strip", "LED-Streifen"], ["mdi:string-lights", "Lichterkette"], ["mdi:candle", "Kerzen"], ["mdi:fireplace", "Kamin"], ["mdi:fan", "Ventilator"], ["mdi:air-conditioner", "Klimaanlage"],
  ["mdi:radiator", "Heizung"], ["mdi:robot-vacuum", "Saugroboter"], ["mdi:curtains", "Vorhang"], ["mdi:popcorn", "Popcorn / Kino-Szene"], ["mdi:remote", "Fernbedienung"]];

export function roomIcon(name) {
  const k = (name || "").toLowerCase();
  const m = [["wohn", "mdi:sofa"], ["living", "mdi:sofa"], ["schlaf", "mdi:bed"], ["bed", "mdi:bed"], ["küche", "mdi:silverware-fork-knife"], ["kitchen", "mdi:silverware-fork-knife"], ["büro", "mdi:desk"], ["office", "mdi:desk"],
    ["kind", "mdi:teddy-bear"], ["bad", "mdi:shower"], ["garten", "mdi:flower"], ["keller", "mdi:stairs-down"], ["gast", "mdi:account-multiple"]];
  const hit = m.find(([x]) => k.includes(x));
  return hit ? hit[1] : "mdi:home-outline";
}
