# Changelog

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
