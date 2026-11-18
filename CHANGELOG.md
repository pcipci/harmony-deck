# Changelog

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
