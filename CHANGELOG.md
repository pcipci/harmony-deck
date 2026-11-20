# Changelog

## 0.19.1

### Added
- **"Should be off" per device:** on the page of a linked network device a choice "When it should be off": *Report* (as before), *Just a note* (listed in the gear window without warning colour, count or fix button; the sensor "Differences" does not count it) or *Don't check*.

### Changed
- **Nostromo:** dark text and icons on every amber surface (Done button, hint buttons, "Switch everything off", the room tab's icon, the active side of the Activities/Devices switch). Before, they were amber on amber and could not be seen.
- **Nixie:** the lit tube (running activity or selected device) stays dark with an orange digit and name even if an old "fill" active style is stored; before it could turn orange with orange text.
- **Terminal:** the red confirm button (e.g. delete a profile) has dark text instead of white on bright green.
- **Thermal:** a device that belongs to the running activity shows one heat dot, the selected device three, as in the activity tiles. Long names with a hyphen or space ("Panasonic-Mini-System") are split into two larger lines instead of one tiny one.
- **Fire TV badge on the room tab** (not reachable) is a readable dashed badge in Thermal, Nostromo, Terminal, Tube radio and Nixie, no longer a dark square.
- **Fewer "should be off but is on":** for 60 seconds after an activity change this difference is not reported (Harmony is still switching devices off; the card and the sensor check again once the minute is over). "Should be on" and wrong inputs are reported as before.
- **Home screen counts as off:** a Fire TV / Android TV player that is idle on its home screen or screensaver (e.g. woken by HDMI-CEC), or in standby, no longer counts as "on" when it should be off.

## 0.19.0

### Added
- **Quiet hub errors:** when a Harmony hub drops the connection ("connection lost"), the card no longer shows Home Assistant's red error. Commands are retried in the background (queued per hub, in order); if the hub stays away, one calm hint appears in the card ("Hub not reachable right now, still trying") and disappears when it answers again.
- **Nixie:** the keys are graphite rectangles with a chrome edge, placed in the grid. Keys that are sent directly (Fire TV over ADB) have a dim glowing legend, a pressed or active key glows bright. Devices with a known power state show a toggle switch (lamp, hex nut, lever) instead of On/Off/Toggle. Tubes, digits and the frames of activities follow the same chrome look.

### Changed
- **Thermal:** thicker segment letters, and Cyrillic (Russian) names are drawn in the segment font too.
- **Lock mark** follows the skin colours (Thermal, Nostromo, Terminal, Tube radio, Nixie).

## 0.18.2

### Fixed
- **Nixie and Tube radio:** the bottom corners of the last row of tiles were cut off. The tile area clipped its content with the large tile radius; it no longer does and has a little space below for the shadow.

## 0.18.1

### Changed
- **One entry "Colour scheme":** the plain colour variants (Dark, Light, Catppuccin, Nord, Synthwave, Paper) are now one skin in the picker with a second dropdown "Palette". Stored skin keys are unchanged, nothing to migrate.
- **One look field:** the second "Skin for this room" dropdown is gone. The skin dropdown stays one; a switch "Only for this room" decides whether the choice applies to this room or to all.
- **Fields follow the skin:** the effect skins (Terminal, Tube radio, Thermal, Nixie, Nostromo) no longer show coloured icons, tile style, running-activity style, key shape and glow, because they define these themselves.

### Added
- **Thermal: cool-down effect:** a pressed key or tile lights up white-yellow and then cools down slowly (about 1.8 s), like residual heat. Not with "reduce motion".
- **Badges follow the skin:** the Fire TV dot at the room icon and the count at the gear are angular heat-coloured tags in Thermal, angular green in Terminal, angular amber in Nostromo and small brass buttons in Tube radio and Nixie.

### Fixed
- **Thermal:** segment letters now cover every short text (the segmented Activities/Devices switch and long names were skipped before, umlauts included), the space between words is wider, and a pressed key or tile flashes in heat colours (visual feedback).
- **Nixie:** tubes keep their tube shape in every layout (the bottom corners were cut by another rule).

## 0.18.0

### Added
- **Skin per room (optional):** Settings › Look › "Skin for this room" lets every room (hub) have its own skin, so you see at a glance which room you are in. The default is "Same as default" (nothing changes). A skin set in the card's YAML still wins. Stored per room in the new integration setting `roomSkins`.
- **Fade between rooms:** when the next room has another skin, the card fades out (0.15 s), switches and fades in. With "reduce motion" in the system the switch is immediate.

## 0.17.0

### Added
- **Skin Thermal (Wärmebild):** heat-vision look: violet-blue night with soft heat colours (blue, teal, green, yellow, orange, red), short names in angular 14-segment letters (up to 12 characters, longer names keep the normal font), running activity red with three red dots in a triangle, part of the activity in orange, free ones cool teal, volume as a heat bar, "hold to switch off" as a target lock (the three dots light one after the other, then a white flash).
- **Skin Nixie:** dark wood, activities and devices as number tubes with glowing digits, brass toggle switches (hex nut, chrome lever wide at the tip, a lamp that is always visible: bright when on, dim red when off), pressed brass keys.
- **Skin Nostromo:** amber monochrome ship computer without screen flicker: blinking block cursor behind the running activity, typing effect when switching, ASCII-style hold bar, very faint refresh line and afterglow.
- **Settings follow the skin:** options that a skin does not use are hidden (for example "Coloured icons" and the key shape in the effect skins).
- `docs/SKIN_CHECKLIST.md`: elements every skin mock must show (direct keys, state keys, volume slider, switches, segment switch, power knob, hold effect, markings, window, tabs).

### Changed
- **Fewer plain skins:** "Remote" and "Device" are now one skin, **Dark**. A saved "Remote" or "Device" is switched to Dark automatically (the integration keeps the old value, the card maps it).
- **Tube radio:** an active direct key of the Fire TV (for example Standby) is now a pressed brass key with a border like the other keys (app keys stay dark glass).

### Notes
- Not yet tested on real hardware. The segment letters are drawn by the card (no font file).

## 0.16.3

### Fixed
- **"Switch a running activity by holding" was lost:** the integration did not store this setting (it was missing in its list of keys), so it was gone after a reload. A test now checks that every switch of the card settings is stored.
- **The card jumped to the top** once after pressing a key: a redraw because of a changed device state did not keep the scroll position. Every redraw keeps it now (except the deliberate jump to the remote).
- **Fire TV in standby or screensaver:** the first direct key or app only woke the device and nothing else happened. The card now sends "Wake" first, waits a moment and then sends the key; starting an activity wakes a sleeping linked Fire TV first as well.

### Changed
- **Tube radio:** the settings switch is smaller and has no dark dot in either state; inactive activity tiles are dark glass with a visible grille; devices of the running activity glow inside the glass instead of around it.
- **Terminal:** devices of the running activity pulse inside the tile (phosphor glow), no glow outside.

### Notes
- Not yet tested on real hardware.

## 0.16.2

### Added
- **Key assignment table** in the Info area: for the running activity it lists per device which keys go straight to the device and which over Harmony ("Switching on always goes over Harmony"). **Network devices** are a table too (device, platform, address, state, capabilities); on a narrow screen each device becomes a card with labelled lines.
- **Help (lifebuoy):** the power key of a device that is switched off directly over the network carries a small network symbol, with a legend.
- **Version hint:** when the card in the browser is older than the integration the gear shows a hint with a Reload button.

### Changed
- **One window for everything:** gear, help and profile open in the same frame (title, close cross, same position and width, long content scrolls inside). Only one is open at a time: the same symbol closes it, another symbol switches to it. The profile is a list in this window instead of the system drop-down.
- **Room tabs:** the selected room shows its full name ("EG Wohnzimmer"), the others the first word ("OG"), so the tool symbols no longer cover tabs.
- **Tube radio:** settings switches are round brass buttons to press (pressed in with an amber ring = on); the dial shows the activity name below the scale; keys without a state glow around the edge while pressed; clearly visible flicker of the devices of the running activity, also in Terminal (green).
- The "Direct" block of a device stays open when you press one of its keys.

### Fixed
- **Device state did not update** while Harmony considered the device inactive (two activities, e.g. Fire TV with TV and Fire TV device): the card now watches every linked player of the hub (state, source, mute, app), not only those of the running activity. This also fixes Mute and the power switch showing stale states.

### Notes
- Not yet tested on real hardware. If the surface does not change after an update, reload the page (hard reload); from this version on the card tells you when it is older than the integration.

## 0.16.1

### Added
- **Info is its own area** (gear window › Info, like Favourites and Actions); the tab "Info" is gone from Settings. It lists the hubs, the **network devices** linked to a Harmony device (platform, address for administrators, state, capabilities), the status symbols, explanations and raw data.
- **Cube remote: key "TV on/off"** (infrared power key of the Cube remote, switches the TV) next to Standby and Wake, in all skins. Shown only for the Cube model.
- **Capabilities of every linked device** in one list, also on the Fire TV settings page.

### Changed
- **Direct commands when the device is reachable:** Off goes straight to the player (media_player), On always over Harmony (the device may sleep or be in WLAN standby). Mute, Play, Pause and Stop go direct too when the player reports the capability, volume only with "Volume directly"; otherwise Harmony as before.
- **Tube radio:** the device switch flips at once and shows a pulsing lamp until the device confirms; the dial shows only the running activity; settings switches are sunken brass buttons with a lamp; state keys with a thin dark rim and a faint light lower edge, Fire TV app keys always dark glass with dim letters (the running app glows), Mute pressed with an amber ring; hold to start an activity heats the key up to white-hot.
- **Terminal:** hold to start an activity fills the tile with a lighter green; state keys are green blocks.
- **Flicker** of lamps and tiles is slower and smooth (7 to 10 s), only slightly dimmed; Terminal stays green, tube radio amber.
- **All other skins:** keys with a known state (Mute, Play/Pause, Standby, app) show as pressed keys.
- **Skins are modular:** logic files no longer name a skin; they ask for traits (`shared/skin-traits.js`: power knob, key hold time, dial, glass). Power state and direct routing moved to `deck/device-state.js`. A test fails when a logic file compares a skin name.

### Fixed
- Mute state was not drawn: the card did not redraw when only the mute state of a linked player changed.

### Notes
- Not yet tested on real hardware.

## 0.16.0

### Changed
- **Gear instead of the info button; hints get a fixed place.** The gear sits at the right of the room tab row. At rest it opens the entries (Settings, Favourites, Actions, Info). When something needs attention it takes the colour of the most serious hint (red error, orange difference, blue notice), pulses until seen and shows the count; its window lists the hints with their action on top and the entries below. The window lies over the card, so the remote never moves. The "Fire TV runs, Harmony is on …" bar under the switch and the target/actual box in the device list moved into this window.
- **Technical hub data** (IP, firmware, MAC, counts, entity, with Copy) moved to Settings › Info › Hubs, one folded entry per hub (a hub that is down opens by itself).
- **Rooms in the tabs:** the room (area) of the hub when it has one, else its name; a name set in Settings still wins.
- **Look list:** Terminal and Tube radio come right after Homebase.
- **Terminal:** hold to switch off fills the tile from black to green, then it shrinks to a line (the segment bar is gone); devices in the running activity flicker faintly instead of showing a dot; the "OFF" word in the off tile is gone; lists (look, profile) in the screen's style.
- **Tube radio:** On/Off of a device is a sunken brass button with an orange lamp behind it when the state is known from the linked player, otherwise two short keys I and O (no German words); On/Off and Toggle share one row. Keys with a state (selected source, running app, favourites) are dark glass behind a grille with orange lit letters. Lamps and running tiles flicker faintly (off with "reduce motion"). The magic eye is amber. The dial shows the room, the needle sits at the running activity and its name stands next to it. Lists, gear and window follow the look.

### Fixed
- The tab "Network control" in Settings opens on its overview again after leaving the settings (it stayed on the last device page).
- The collapsed header no longer sticks: in views with tabs its offset below the Home Assistant bar was wrong and pushed it over the keys.
- Fire TV settings no longer list the coloured keys (they are no property of the Fire TV). An existing assignment keeps working.

### Notes
- Not yet tested on real hardware.

## 0.15.5

### Fixed
- **Tube radio: the On/Off switch of a device did nothing** (Toggle worked). The switch "clicked" the hidden On/Off key, but keys send when they are pressed down, so the click never reached them. The switch now sends the command itself (with a test).
- The tube radio switch had German labels (AN/AUS) in every language; it now has a lamp instead of text.

### Changed
- **Status line shows only what runs:** one chip each for the running Harmony activity, the Fire TV (app badge, pause, standby) and every linked network device that is on, with its source ("LG TV · HDMI 1"; tap opens the device). Everything off = no chips. Nothing is shown for "off" or "unknown" any more.
- **Tools moved up:** lock, profile, help, info and the collapse arrow sit at the right of the room tab row, apart from the device controls.
- **Collapsed header** is one text line ("Bluray · Fire TV Netflix · LG TV HDMI 1", or "all off" in muted colour), without the room name (the tabs already show it).
- **Mute inside the volume rocker** (all skins): between + and -, or under the slider; both rockers (volume, program) now have the same height. Mute shows as active while the linked player reports muted.
- **Terminal:** green throughout (device On/Off keys, the off tile shows "OFF", Fire TV direct app keys and app badges in Pip-Boy style without brand colours); the tool icons have no frame, active = brighter glow; the vertical volume slider is an LED meter (all blocks dim, the set level bright, no extra thumb); Mute active = green block.
- **Tube radio:** On/Off switch with a pilot lamp (green glowing = on, red = off) and no text; the vertical volume is a straight rail with a scale of tick marks; Mute is a round brass button (raised = sound, pressed in = muted); keys with a state (selected source, favourites, Mute) are pressed in while active, other keys go down on a tap (about 120 ms); every running device in the status line has a green pilot lamp. Lamps stay for the tiles.
- On narrow cards only the selected room tab shows its name, so all rooms stay reachable next to the tools.

### Notes
- Not yet tested on real hardware.

## 0.15.4

### Fixed
- **Fire TV keys stopped working after linking the Fire TV in Network control** (arrows, OK, Home went via Harmony although "ADB directly" was set). Linking created an empty Fire TV settings block on the link, and the card (and the integration's lock logic) took that block and ignored the existing settings (ADB preference, model, IR volume, hidden apps, package names). Now the existing settings of the same player move onto the new link, and an empty block never hides them. A different player in the old place does not leak in.
- Terminal: the icon of the switch-off tile sits in the middle again.

### Changed
- **Hold effects per skin** (switch off, locked tiles, actions with hold): Terminal fills the whole tile with green blocks from left to right and shrinks to a line when it fires; the red power symbols are green now. Tube radio: the lamp heats up from dark through orange to red while held and goes out with a faint afterglow. Other skins keep the ring.
- Settings always open on the first tab (Appearance), except via a shortcut that names a tab (before, the last tab was kept).

*0.15.3 is included:* capability sensors, collapsed header fix, readable radio buttons, skin polish, "ADB directly" preselected for new Fire TV setups.

### Notes
- Not yet tested on real hardware.

## 0.15.3

### Fixed
- **Collapsed header covered the first row of keys (tablet).** The bar now sticks below the Home Assistant bar only while the page is scrolled; at the top it stays in its place.
- **Tube radio:** the buttons of the device pages (Network control: Read again, On/Off, Mute, sources) and "Settings / Favourites / Actions" were dark on dark or light on light; they are now brass buttons with dark text.

### Changed
- **Terminal:** switches are a lit slider on black (left = dim, right = glowing green); the vertical volume slider is a column of green blocks like the horizontal one; the small buttons in the status line (pause, power) have no green frame.
- **Tube radio:** toggle switches are horizontal (lever left = off, right = on); the vertical volume slider has the amber fill and brass knob.
- **Fire TV:** "ADB directly" is the preselected way for the shared keys in a new setup, with a note that keys via Harmony can arrive late or not at all (the hub sends infrared or Bluetooth). Existing settings are not changed.
- The volume slider asks the integration again a little sooner after a change of activity or player state.

### Added
- **One diagnostic sensor per capability** (yes / no) on the "Name (Network)" device, so the capabilities can be read on the Home Assistant device page. They are disabled by default; enable the ones you want.

### Notes
- Not yet tested on real hardware.


## 0.15.2

### Changed (skins, card only)
- **Tube radio:** every tile (activities, devices) is now a pilot lamp under a wire grille: unlit = dark amber glass, running or selected = glowing. The On/Off switch is a real toggle (brass nut, chrome lever, AN above / AUS below). The Activities/Devices switch is a bakelite rocker plate that slides over. The horizontal volume slider is a wedge from small to big with a brass knob. Keyboard keys are round, like typewriter keys.
- **Terminal:** "active" now looks the same everywhere: green block with dark text for the running activity, the selected device, the active tab and active keys. Switches are hollow when off and filled when on. The Activities/Devices switch is a block that jumps over, the volume slider is a bar of green blocks.

### Notes
- Not yet tested on real hardware. The vertical volume slider keeps its simple look in both skins.


## 0.15.1

### Fixed
- **Slider and inputs were missing when the TV was off at the start.** The integration now remembers capabilities and the source list of each linked player (also across restarts) and reads them again whenever the player changes (for example switched on). The volume slider asks again when the player's state changes. A greyed note "last seen" marks remembered values.
- **Sensor "Capabilities": all capabilities are visible.** One attribute per capability with a fixed key and a name translated by Home Assistant (yes/no), plus `count`. The state stays short ("7 of 10").
- **Tube radio:** dark text on the light buttons in Settings and Favourites; On/Off of a device as a toggle switch (lever up = on, state taken from the linked player).

### Added
- **Device page: list of all capabilities** ("Capabilities: 7 of 10", remembered ones marked "last seen") and the button **Read again**: forgets the remembered values and reads capabilities and inputs from the device now (administrators; best with the device switched on). Useful to compare two devices of the same kind.

### Notes
- Not yet tested on real hardware. Whether the attribute list shows in the Home Assistant dialog could be checked in tests only, not in the real interface.

## 0.15.0

### Added
- **Two effect skins: Terminal and Tube radio** (Settings › Appearance › Look). Terminal: green phosphor glass with a dark bezel, scanlines, snow, a rolling bar, a torn band and now and then a flicker; angular keys, the cross with cut corners and a square OK, activities as list lines with the running one inverted, rectangular switches. Tube radio: wood and brass, the running activity as a glass pilot lamp with a wire grille, a lamp bulb in the status field, a dial with a needle and a **magic eye** that follows the volume of the linked player (half open without one), brass toggle switches (lever up = on). The effects only lie over the card, taps and text are not touched, and the animations stop when the system asks for reduced motion.
- **Volume slider in the device view.** Every device linked in Network control with "Set volume directly" on gets the slider there too (before only the volume device of the running activity), whatever activity runs. Same rules: held to the volume limit by the integration, for every user, also while the lock is on (like the volume keys). New command `direct/volume` takes an optional `device`; `direct/sliders` now answers `{hub: {activity, devices}}`.

### Notes
- Not yet tested on real hardware. The tests cover the rules of the integration and the card (slider in both views, both skins in the quality run).

## 0.14.0

### Added
- **Volume slider instead of +/-.** When the volume device of the running activity is linked in Network control with "Set volume directly" switched on and the player can take a level, the remote shows a slider instead of the two volume keys (mute stays). While you move it the level is sent about every 300 ms (only if it changed) and the final level on release; device updates are ignored while you drag and followed again right after. If the integration cannot take it (any more) the card goes back to +/- by itself.
- **LG Netcast** (which reacts slowly) sets the level only on release; the device page says so.

### Changed
- **The integration decides, for every user.** New commands `direct/sliders` and `direct/volume`: only the volume device of the running activity, only with "Set volume directly" on, always held to the volume limit of Settings › Behaviour, and also while the lock is on (like the volume keys). Other devices and the controls of the device page stay administrator-only.

### Notes
- Not yet tested on real hardware. The tests cover the rules of the integration (device, limit, rights, lock) and the card (dragging, throttle, release, fallback).

## 0.13.0

### Changed
- **The Fire TV settings belong to the device.** Apps, keys, packages, colour keys and the lock-when-offline switch are now stored on the link of the Fire TV in Settings › Network control, not per hub. Existing settings move there once at start; anything that cannot move (the Harmony device is not linked to that player) stays where it was and keeps working.
- **The lock and the repair "Fire TV not reachable" read the Fire TV from its link.** The lock asks for the device that reports the running app; allowed apps are stored per device. A linked Android TV player counts as the hub's Fire TV even before its page was saved.
- Linking an Android TV / Fire TV player gives it its (empty) Fire TV settings right away, so the status bar, the lock and the repair know it without opening the page.

### Notes
- Not yet tested on real hardware, above all the lock after the move. The tests cover the migration, the lock reading from the link, the repair and the card's reading and saving.
- Downgrading to 0.12 after the move: the Fire TV settings would not be found (they stay on the link). Keep a backup of `.storage/harmony_deck.settings` if you want to go back.

## 0.12.1

### Fixed
- **The Fire TV page shows only its own device.** No list of all ADB devices any more, the test applies to this device only; the rows "Entity" and "Harmony device" are gone from the page (they are set in the list).
- **Device page stays current, also while the lock is active.** State, volume, mute and the picked source follow Home Assistant live instead of the values read when the page was opened.
- **Sources of a player that is off.** Home Assistant publishes no source list while a player is off. The last list seen is remembered (also across restarts) and shown greyed with the note "last seen"; inputs (HDMI …) come first, apps and "Live TV" below.

### Changed
- **Sensor "Capabilities"** shows a short value ("6 of 10") instead of a long text; one attribute per capability says yes/no, in Home Assistant's language. The codes stay in the attribute `capabilities`.

## 0.12.0

### Changed
- **The Fire TV is a device of the network control.** In Settings › Network control it is linked like any other device. The former tab "Fire TV" is now the **page of the Fire TV**, opened with the cog next to the device (apps, text input, keys, connection and test as before). A Fire TV set up before 0.12 is linked once automatically; its settings stay.
- **One device in Home Assistant.** A linked Fire TV has one device, "Name (Network)", that also holds its "ADB reachable" sensor. The separate "(ADB)" device goes (empty only; entities and history are kept). Unlinked, the Fire TV is shown as before.
- **The tab Network control is one line per device:** name, player, a dot for "answers" and the cog. Suggestions are one quiet line with two small icon buttons (use it, don't suggest again). The long texts under every device moved to the device's page.
- **Stricter suggestions, again:** the room alone is no longer evidence (it only adds points), and a player named only after a room ("Living room") is never suggested for a single device. Kind, model or a name word that is not the maker or the room are needed.
- **The lock asks for capabilities, not for "Fire TV".** New capabilities "reads the running app" and "lists the apps"; today only the Fire TV reports them. The security card names the device in the section "Allowed apps". Lock behaviour for the Fire TV is unchanged.

### Added
- **Device page for every player** (cog): one row per capability with the buttons for it: state, on/off, volume (slider, held to the volume limit), mute and the sources as buttons. The buttons control the real device (administrators only). Plus "Inputs of the activities" and "Set volume directly instead of via IR", moved here.
- **LG Netcast: inputs among the channels.** The source list of Netcast is the channel list; entries that look like inputs (HDMI, AV, Component, SCART, USB …) are now shown and compared, the channels are ignored.

### Notes
- Not yet tested on real hardware, above all the lock and the Fire TV after the move. The tests cover the lock rules, the move of the entities and the settings migration.
- If an automation used the "(ADB)" device of a linked Fire TV, it now sits on "(Network)"; entity ids do not change.

## 0.11.0

### Changed
- **Stricter suggestions in Network control.** A media player is suggested only with real evidence: same room as the hub, same model, same kind of device, or a shared name word that is not the maker. The maker alone is no longer enough (an LG Blu-ray player no longer gets an LG AirPlay target suggested), and players that can neither switch nor pick a source are not suggested.
- **Pure playback targets are hidden** from the player list: AirPlay, DLNA renderers and music servers (by integration, for example `dlna_dmr`, `music_assistant`, `snapcast`, `squeezebox`, or "AirPlay"/"DLNA" in the name).
- **Hub sensors "Activities" and "Devices" show names** instead of a number: a short list ("Bluray, Games and 4 more", in Home Assistant's language); the number and the full list are attributes (`count`, `names`). Same entities as before. If an automation compared their number, use the attribute `count`.
- **Display review:** in the card editor all texts are at least 12 px and tabs, buttons and small text buttons at least 40 px high; spacing in the Network control tab tidied up.

### Added
- **Suggestions can be switched off:** "Show suggestions" (all hubs) and "Don't suggest again" per device, with "Suggest again".
- **A Home Assistant device per linked network device**, "Name (Network)", like the "(ADB)" devices of the Fire TVs, with the diagnostic sensors **Platform**, **Capabilities** and **State**. Added and removed with the link.
- **A button per action** on the hub's device: pressing it starts the action like a tap on the card, refused while another action runs. The buttons follow the stored actions.
- **Sensor "Actions" per hub:** the names of the stored actions as a short list; id, name, number of steps and button per action as attributes.
- README: sections on actions and network control with three new screenshots, new rows in the comparison table (catch-up for 0.5 to 0.10).

### Notes
- Not yet tested on real hardware: the new devices, buttons and the suggestion rules were checked with tests and a simulated Home Assistant.

## 0.10.0

### Added
- **Sensor "Network control"** (diagnostic, like "Fire TV connections"): one sensor, its state is the number of linked devices; the attributes list per device the Harmony device, the entity, the **detected platform** (for example `lg_netcast`), the **capabilities**, the state now and known **peculiarities**. Also part of the downloadable diagnostics.
- **Sensor "Differences" per hub:** its state is the number of differences between what the current activity needs and what the linked devices do (0 = all fine); the attributes list them (device, kind, target, actual, possible fix). The check now runs in the integration itself (after the state stayed unchanged for 4 seconds), so you can build automations and notifications without the card.
- **"Detected: ..." in the tab Network control:** shows the integration the media player comes from and what to know about it. For LG Netcast: the source list is the channel list (no HDMI inputs), mute can only be toggled (Harmony Deck checks first), and switching on is only possible if the integration's turn-on action is set up.

### Notes
- No Repairs message for linked devices: a TV that is off is normally unreachable, which is no fault.

## 0.9.0

### Changed
- **Renamed:** the settings tab "Direct devices" is now **Network control**, the step "Device" is now **Network command**. Nothing else changes; stored data is the same.
- **Better suggestions:** the matching media player is now rated by room (same area as the hub), kind (TV, receiver, speaker, player, from Harmony's device type, the names and the player's device class), model, maker and name. A Blu-ray player of the same maker no longer competes with the TV, and two TVs in two rooms are told apart by their rooms. The list in the tab shows the players that fit first ("Matching"), the rest below ("Others").
- **Mute is only sent when needed.** Players that only know "toggle mute" (LG Netcast) would otherwise unmute a muted TV when a step says "mute".

- **Hint where the volume really goes:** in the step "Network command" (volume, mute) and next to "Set volume directly instead of via IR", a note says if an activity sends the volume through another device ("In Fire TV the volume goes through "Yamaha receiver", not through this device."). Read from the activities of the hub; it is only a hint, nothing is blocked. Matters in rooms where a soundbar or receiver does the sound.

### Notes
- LG Netcast needs no extension: Home Assistant's own integration already reads and sets the volume, so the generic adapter covers it. For Netcast the source list in Home Assistant is the channel list, not the HDMI inputs, so the input check stays silent there.

## 0.8.0

### Added
- **Target against actual state:** if a linked direct device does not do what the current activity needs (still on after "off", off although the activity switches it on, wrong input), a small box under the status says so and offers the fix: "Switch on", "Switch off" or "Switch to <source>". The fix is sent only when you tap it; nothing is switched by itself. The state must stay as it is for 4 seconds first, so a device that is still starting up is not reported. Devices the hub never switches (or switches by hand) are left alone.
- **Inputs of the activities** (Settings › Direct devices): which source of the media player belongs to which Harmony input ("InputHdmi2" = "Fire TV"). Without a choice Harmony Deck guesses by the names; with no clear guess nothing is reported for that input.
- Websocket `harmony_deck/direct/check` and `harmony_deck/direct/fix`. While the lock is on, a fix may only switch off (the lock decides, not the card).

## 0.7.0

### Added
- **Direct devices** (Settings › Direct devices): link a Harmony device (e.g. the TV) to a Home Assistant media player. The keys stay with the hub; the player adds what infrared cannot: the state, a real volume level and the source. The integration lists the players that can do something useful, shows what each one can do and what it reports now, and suggests a match when maker/model or name fit clearly. Nothing is linked without you.
- **Step "Device":** switch on, switch off, set volume (within the volume limit), mute or pick a source of a linked device. What is offered follows from what the player can do; a source is checked against its source list.
- **"Set volume directly instead of via IR"** per linked device: the step "Volume (IR)" then sets the level on the device instead of counting down and up.
- New setting `directDevices`, websocket `harmony_deck/direct/overview`. The generic adapter uses only standard Home Assistant features, so it works for any `media_player` (webOS, Samsung, Sonos, …). Brand specific extensions (extra values a player does not offer in Home Assistant) plug into `direct.py`; none is shipped yet. The Fire TV link is unchanged.

## 0.6.0

### Added
- **Step "Wait until":** waits until a condition holds (at most 1–120 s), then goes on or stops with an error. Replaces guessed pauses.
- **Step "If":** checks a condition once; if it does not hold, skip the next 1–10 steps, end the action, or stop with an error and an own message. Actions still only move forward (no loops).
- **Conditions** are generic: any Home Assistant entity, its state or an attribute, compared with a value (is, is not, greater, less, at least, at most). Nothing is tied to a kind of device.
- Steps an "if" skipped are shown crossed out in the step list; the sequence sensor has a new attribute `skipped`.

## 0.5.3

Contains what was planned as 0.5.2 (values) and 0.5.3 (volume over infrared).

### Added
- **Values in Home Assistant steps:** brightness, light colour (white in Kelvin or a colour with quick colours, hue and saturation), media player volume, source and mute, cover position, climate temperature, fan speed, number value. Only what the entity reports it can do is offered; only switched-on values are sent. New operation "Only set values".
- **Volume limit for actions** (Settings › Behaviour, 80 % by default), checked by the integration before a run.
- **Step type "Volume (IR)":** down to 0, then up to the level, for infrared devices; per device highest volume, units per press and time between presses (stored for the whole installation). Sent in groups of ten presses, so Stop works quickly.
- The integration checks values before a run (can the entity do it, is it within its limits) and before each call (for example a source the player does not offer).

## 0.5.1

### Added
- **Step list of a sequence.** The small arrow on a sequence (a tap while it runs, or a failed run) opens its steps below the buttons: done / current / open, Stop while it runs. When idle: send a single step, continue from a step, retry or skip a failed step. Below: the devices the keys belong to (power and input keys, the name leads to the remote).
- **Favorites of an action:** keys of any devices, picked in the action and shown under the opened action, grouped by device.

### Changed
- Step editor: every step is one row (tap to open), move arrows at the right of the row, "Test this step" and "Delete step" as two text buttons at the bottom of the open step.
- Pause is a slider (fine up to 10 s, coarse up to 5 min) with a large value, ±0.1 s buttons and a tap-to-type value.

## 0.5.0

### Added
- **Actions with steps (sequences).** An action is a list of steps: Harmony key (device, key, repeat), pause, Home Assistant entity (light, switch, script, scene, automation, button). The integration carries them out, also when the page is closed; one action runs per hub at a time, a second start is refused.
- The card shows the progress on the button ("3/7") and on the tile ("3/7 · step"), holding a running button stops it, a failed step turns it red with the reason.
- Where an action appears: under the remote (all activities or one) and, new, as a tile in the activity list.
- Step editor in the edit mode "Actions": add, move, test one step, test the whole draft, own labels; pickers with search, filter chips and "recently used".
- Services `harmony_deck.run_action` and `harmony_deck.stop_action`, websocket `harmony_deck/action/run|stop`, and a sensor "Sequence" per hub (state and progress as attributes).
- Lock entities: event "Intervention" (fires with `what` each time the lock switches something off, for notifications) and sensor "Interventions today".

### Changed
- Actions are stored per installation (not per profile). Actions of 0.4 become one step by themselves. Their buttons now run through the integration.

## 0.4.1

### Changed
- Settings rebuilt: the new tab "Behaviour" holds everything about how the card is operated (vibration, hold to switch, keyboard control, collapse header, jump to the running activity, device names in the help); "Look" only has the appearance, in groups (style, tiles, keys). All rows look the same (label left, control right, a thin divider), the whole row can be tapped, and every on/off option is a switch, also in the Fire TV tab.
- Actions are an edit mode of their own (next to Settings and Favorites) with its own Done / Cancel. The tab in the settings and the detour through Favorites are gone.
- The hint about options fixed in the card YAML now appears only in the tab where such an option is.
- The repair hint "Fire TV not reachable" appears after three refreshes in a row (about 6 minutes, before 30) and disappears the moment the Fire TV answers again.

### Added
- Favorites editor: "Hide keys" hides single keys of a device (per profile). They disappear in the device view and in the remotes of the activities. This is not the lock.
- Fire TV tab: a wrong package assignment can be removed (chain button), and the package name of every app is shown as a tooltip.

## 0.4.0

First public version.

### Added
- Settings: the tab "Actions" (own buttons for Home Assistant entities) is now a tab of its own, and the info panel has an "Actions" button. Every settings tab starts with a short explanation.
- Fire TV tab: when the selected Fire TV is not reachable, a hint says what to check.
- Brand images (`brand/`: icon, logo, dark logo) and `icons.json` for all entities.
- English and German manual (`docs/MANUAL.md`, `docs/HANDBUCH.md`), new README in English, German and Russian with screenshots.

### Changed
- The README states which setups were tested (Fire TV Cube 3) and what is optional.
- HACS validation no longer ignores the brand check.

## 0.3.6

### Fixed
- Main card: while the lock works, activities that are not allowed are now really locked (tile with lock, cannot be started). Since 0.3.4 the card did not receive the allowed list, so only the lock symbol in the status line showed. The list is now an attribute (`allowed_activities`) of the entity "Lock active", so changes in the security card apply at once.

### Added
- Settings, Fire TV: option "Lock activity when not reachable" (default off). If the Fire TV is linked over ADB and its state is "unavailable", the Fire TV activity is greyed out (TV-off symbol) and cannot be started. Standby does not count. Without an ADB link nothing changes.

## 0.3.5

### Added
- Security card (administrators): section "Debug: package names" with the app running now and the full list of packages of the Fire TV (search, copy button per name). The integration now also reads `pm list packages` (all packages, cached next to the installed apps).
- Main card: in the opened help ring a click on a device name opens the remote of that device. The device view says "Active in <activity>" when the device belongs to the running activity; a click leads back to the activity remote (navigation only, nothing is switched).

### Changed
- The Fire TV home screen (`com.amazon.tv.launcher`) is now an entry of the allowed apps, ticked by default. Unticking it (after a confirmation) also unticks all other apps, and the other apps can only be ticked while it is ticked. Stored lists of older versions get the home screen added once.

## 0.3.4

### Fixed
- "Harmony powering off" stayed in the status line: a stale "PowerOff" in the starting state is ignored (main card and lock).
- The lock took the wrong activity when a stale "PowerOff" hid a running one (lock and test).
- Activities the security lock does not allow are shown locked in the main card and cannot be started there.
- Apps seen running on the Fire TV count as confirmed (no longer dimmed); legend corrected.

## 0.3.3

### Added
- Lock: devices that the Fire TV switches on itself (for example TV and amplifier by infrared) can be chosen in the security card ("Switch off as well"). When the lock switches off the Fire TV they also get `PowerOff` over the hub, even without a running activity.
- The integration remembers every app it sees running on the Fire TV; such apps are offered in the list of allowed apps (the installed list lacks pre-installed apps).
- Intervention list: icons of the activities and apps instead of the remote symbol.

### Changed
- The key locks of the links apply to the remote of a running activity only, not to the device view.

## 0.3.2

### Added
- Security card: button "Check the lock now" (websocket `harmony_deck/lock/test`): shows what the lock would switch off at this moment, changes nothing.
- Security card: the allowed activities use the icons chosen in the main card; legend for the bright / dimmed apps.
- Main card: option `hold_switch` (also in the settings): switching from a running activity to another needs a long press.
- Main card: option `security_path`: a tap on the lock symbol opens that dashboard path.
- The sensors "Activities" and "Devices" carry the names in the attribute `names`.
- Skin variable `--hr-frame` (background of the card).

### Changed
- Better icon guessing for activities (Nintendo, Switch, Wii, PlayStation, Apple TV, Echo, Alexa, Spotify, YouTube, cinema, PC, Mac); keywords are tried before the guess from the devices.
- The skins Sonnenpapier (paper), Knetmasse (clay), Kiesel (pebble) and Milchglas (glass) are more distinct from each other.

## 0.3.1

### Added
- Option "Volume without an activity via" (Settings → Fire TV, model Fire TV Cube): while only the Fire TV runs, volume up, down and mute go through the infrared sender of the Cube 3 straight to the TV, without the hub. Off by default.

## 0.3.0

### Added
- Security card `custom:harmony-deck-security`: state of the lock per hub, mode, release, allowed activities, allowed Fire TV apps, schedule and the list of interventions. Only administrators can change anything.
- Lock: allowed activities per hub (default: none), schedule with lock times per weekday (also over midnight), modes Off / Always / Schedule, new entity "Lock mode" (select).
- Lock: list of the last 100 interventions with separator rows (lock switched on or off, release), stored by the integration.
- Main card: lock symbol in the status line while the lock works, open lock with the time during a release.
- Websocket API `harmony_deck/lock/get`, `lock/set`, `lock/release`, `lock/clear_log`, `harmony_deck/fire_apps`, `harmony_deck/fire_test`. The integration reads the installed Fire TV apps and caches them; the cards only display.
- Tests that run inside a real Home Assistant core, and a check that every text of the cards is translated.

### Changed
- The card sources are split into modules (`card/src`) and bundled with esbuild. The rendered output was compared character by character with 0.2.0.
- The allowed apps of the lock moved from the main card (Settings → Fire TV) to the security card.
- The lock is stored per hub (config entry) instead of per entity id, with migration from 0.2.0.
- `manifest.json`: real links, `after_dependencies` on `harmony` and `androidtv`.

### Fixed
- Lock entities had no names (wrong format in the translation files).
- A timer of the lock entities ran outside the event loop.
- Renaming the remote entity of a hub silently dropped its lock.
- Fire TV keys and apps sent commands while the card was in settings mode.
- Favourites per activity were not cleaned when a device or command disappeared; device favourites were invisible in the editor of the activity favourites.
- Action buttons did not refresh when the state of their entity changed.
- Hard-coded German texts (keyboard labels, Fire TV keys, icon names, card editor) are translated now; unused texts removed.

## 0.2.0
- Lock, step 1: per hub a switch, a release with duration, automatic switch-off of the hub, allowed Fire TV apps.

## 0.1.x
- Main card: hubs as tabs, activities, devices, help, links, Fire TV direct (ADB), favourites, profiles, skins, real keyboard, hold to switch off. The versions after 0.1 are listed above.
