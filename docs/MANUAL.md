# Harmony Deck – Manual

[Deutsch](HANDBUCH.md)

This manual explains Harmony Deck by task. The version history is in the [CHANGELOG](../CHANGELOG.md).

## 1. Installation

1. HACS → ⋮ → **Custom repositories** → `https://github.com/pcipci/harmony-deck`, type **Integration**. Or copy `custom_components/harmony_deck/` to `/config/custom_components/`.
2. Restart Home Assistant.
3. Settings → Devices & services → **Add integration** → **Harmony Deck**. There is nothing to configure.

You need the **Logitech Harmony Hub** integration. For the Fire TV also the **Android TV** integration (ADB) and "ADB debugging" on the Fire TV (Settings › My Fire TV › Developer options).

After an update: restart Home Assistant and reload the page (Ctrl+F5; in the app pull down the page).

## 2. First steps

Add the card to a dashboard:

```yaml
type: custom:harmony-deck-card
```

Every hub becomes a tab (room). At the top you see what is running, below the activities as tiles, below them the remote of the running activity.

The **gear** (top right, next to the room tabs) opens a small window with the three ways to edit and **Info**. Since 0.16 it also carries the hints: when something needs attention (hub not reachable, a linked player runs another activity than Harmony, a target/actual difference) the gear takes the colour of the most serious hint (red = error, orange = difference, blue = notice), pulses until you have looked and shows the count; the window then lists the hints with their action (e.g. "Match Harmony") above the entries. It lies over the card, so nothing moves. **One window (0.16.2):** gear, help and profile open in the same frame and only one at a time; the same symbol closes it, another symbol switches. **Info** (since 0.16.1 its own area, no longer a Settings tab) shows technical data of each hub (IP, firmware, MAC, …), the network devices linked to Harmony devices (platform, address for administrators, state, capabilities), the key assignment of the running activity (direct or over Harmony), the status symbols and the raw data. Commands go straight to a reachable linked player where it can do them (Off, Mute, Play, Pause, Stop); On always goes over Harmony.
- **Settings**: look, behaviour, devices, activities, network control (with the Fire TV), hub, info. Every tab starts with one sentence about what it is for. Each option is one row: tap anywhere on the row to switch it.
- **Favorites**: mark keys with a star, per device or per activity. The third button, **Hide keys**, hides keys you never use (see section 6).
- **Actions**: own buttons and sequences of Harmony keys, pauses and Home Assistant entities, in an edit mode of their own.

**Done** saves, **Cancel** drops every change of this session. Settings are stored in Home Assistant and apply on all devices.

## 3. Activities and remote

- Tapping a tile starts the activity. The running one is highlighted.
- **Switch off:** **hold** the power tile (or the power button of the collapsed header) until the ring is full, so it does not happen by accident.
- **Hold to switch** (Settings › Behaviour): while an activity runs, another one starts only after a long press.
- The remote sends volume, D‑pad, channel and transport to the device the hub uses for this in the activity.
- **Rooms (0.16):** the tabs show the room (Home Assistant area) of the hub when it has one, else its name; a name set in Settings still wins.
- **Status line (0.15.5):** one chip per thing that runs: the Harmony activity, the Fire TV (app, pause, standby) and each linked network device with its source ("LG TV · HDMI 1"; tap it to open the device). When everything is off there are no chips. Lock, profile, help, info and the collapse arrow sit at the right of the row with the room tabs.
- **Collapse header** (on by default): when a remote is open, the chips shrink to one text line ("Bluray · Fire TV Netflix · LG TV HDMI 1", or "all off"). Tap it or the arrow to expand.

## 4. Devices

The slider **Activities / Devices** switches to the device view. Tap a device to open its own remote with all its commands in groups (inputs, sound, menus, numbers …). Devices are never locked, not even by the lock.

If the device belongs to the running activity, its header says "Active in …". Tap it to go back to the remote of the activity.

## 5. Life ring (help)

When an activity does not start right (TV off, wrong input), open the **life ring** at the top. It lists the devices of the activity with their power and input keys. **Switch everything on** sends them one after another. Tap a device name to open the remote of that device. **Adjust list** hides devices you do not need here.

## 6. Favourites

**ⓘ › Favorites** → choose a device → tap keys (star). Favourites appear as their own block above the remote.

**Hide keys:** in the same editor choose **Hide keys**, then tap the keys of a device you never use (eye). They disappear in the device view and in the remotes of the activities, for the current profile. Tap again to bring them back. This is not the lock: hidden keys are only not shown. Under Settings › Activities you set favourites that appear only in one activity (for example the HDMI input of the TV in "Fire TV").

## 7. Actions and sequences

**ⓘ › Actions** is an edit mode of its own (Done and Cancel like Settings). An **action** is a button that Harmony Deck starts itself. It has a name, a symbol and a list of **steps**. An action with several steps is a **sequence**.

Step types:
- **Harmony key:** choose a device (the devices of the activity first), then a key. The keys are in the usual groups, with a search field and a row "recently used". "Repeat" sends the key several times.
- **Pause:** a slider (fine steps up to 10 seconds, coarser up to 5 minutes) with the value shown large; −0.1 / +0.1 for fine tuning, tap the value to type an exact number.
- **Home Assistant:** a light, switch, script, scene, automation, button, media player, cover, climate, fan or number, with a search field, filter chips and recently used entities on top. With "Turn on" or "Only set values" a **Values** section appears with what the entity itself can do: brightness and light colour (white in Kelvin *or* a colour), volume, source and mute of a media player, position of a cover, temperature, fan speed, the value of a number. Every value has its own switch; only switched-on values are sent. The volume of media players is limited for actions (Settings › Behaviour, 80 % by default).
- **Wait until:** waits until a condition holds, at most the time you set (1 to 120 seconds). Then it goes on or stops with an error (your choice). It replaces guessed pauses: "wait until the TV is on, max. 20 s", then switch the input. Stop ends the wait at once.
- **If:** looks at a condition once. If it holds, the next step follows. If not, you choose: skip the next 1–10 steps, end the action, or stop with an error and a message of your own. Steps are never repeated or reordered, an action always moves forward.
- **Conditions** (for both) are the same everywhere: one Home Assistant entity, its state or one of its attributes, a comparison (is, is not, greater, less, at least, at most) and a value. Examples: "the TV *is* on", "the Harmony hub, attribute `current_activity`, *is* Fire TV", "the AVR, attribute `volume_level`, *greater than* 0.3". The value can be picked from the current one. Text is compared without regard to case; a missing entity or attribute counts as "nothing" (is: false, is not: true). Skipped steps show crossed out in the step list.
- **Volume (IR):** for devices Harmony controls by infrared. The device cannot tell its volume, so Harmony Deck first presses "down" until it is surely at 0, then "up" to the level; it never gets loud in between. Per device you set (once, for all actions) the highest volume, the units per press and the time between presses. The step shows how long it takes. A muted device may stay muted, depending on the device. Stopping works within a few seconds (the presses are sent in groups of ten).

In the editor, every step is one row: tap it to open it, the arrows at its right move it. At the bottom of an opened step are "Test this step" and "Delete step"; "Test the sequence" runs the whole draft. Every step can have an own label. **Favorites of the action** (keys of any devices) are picked at the end of the form. An action with one step, such as "toggle the candles", works like the buttons of 0.4.

**Where an action appears** (set per action):
- Under the remote in the block "Actions", in all activities or only in one ("Visible in").
- With "Show as a tile in the activity list" also as a tile next to the activities of the hub.

**While it runs:** the button shows "3/7" and a progress bar, the tile also the step ("3/7 · Pause 3 s"). A tap while something runs does not start anything and only explains. **Hold** the running button to stop it; the sequence ends between two steps, a key that was already sent cannot be taken back. Only one action runs per hub at a time. If a step fails, the button turns red and its tooltip says why.

**Step list:** the small arrow on a sequence (or a tap while it runs; a failed one opens by itself) shows its steps below the buttons: done ✓, current ●, open ○, with **Stop** while it runs. When nothing runs, every step can be sent alone, the sequence continued from there, a failed step repeated or skipped. Below the list are the devices the keys belong to, with their power and input keys; the device name leads to its remote. The favorites of the action appear under it, grouped by device.

The integration carries out the steps, so a sequence also finishes when the page is closed. For automations there are the services `harmony_deck.run_action` (hub, action name or id) and `harmony_deck.stop_action`, and per hub the sensor **Sequence** (idle, running, done, stopped, error, with step and progress as attributes). Anyone who is logged in can start a stored action; testing an unsaved draft is for administrators.

**Network control (0.7, renamed in 0.9):** under Settings › **Network control** you link a Harmony device to a Home Assistant media player (for example your TV). The keys keep going through the hub; the player adds the state, a real volume level and the source. Per device you see what the player can do and what it reports now. A suggestion appears when kind, model or a name word fit (the room and the maker only add points: a player named after the room, such as "Living room", is never suggested for a single device); the list shows the matching players first. The suggestion line has two small buttons: ✓ use it, ✕ do not suggest again for this device. Otherwise you pick the player yourself. Linked devices can be used in the step **Network command** (switch on/off, volume, mute, source). With "Set volume directly instead of via IR" the step "Volume (IR)" sets the level on the device and no longer counts keys. The volume limit applies to both.

**Target against actual state (0.8):** if a linked device does not do what the current activity needs (still on after "off", off although the activity switches it on, on another input), a box under the status says so with a button for the fix ("Switch on", "Switch off", "Switch to …"). It reports only after the state stayed the same for 4 seconds, and it switches only when you tap. Under Settings › Direct devices, "Inputs of the activities" lets you say which source of the player belongs to which Harmony input; without a choice Harmony Deck guesses by name and stays silent when unsure. While the lock is on, the fix can only switch off.

**The device page (0.12):** in the tab Network control every linked device has a cog (and a dot: green = the player answers). The cog opens the device's page. For all players except the Fire TV it shows what the player can do, one row per capability with the buttons for it: state, on/off, volume (slider, held to the limit of Settings › Behaviour), mute and the sources as buttons (HDMI 1, HDMI 2 …). The buttons switch the real device (administrators only) and so double as a test. Below are "Inputs of the activities" and "Set volume directly instead of via IR". The player's integration is named in the page header. For LG Netcast the source list in Home Assistant is the channel list; Harmony Deck shows and compares only the entries that look like inputs (HDMI, AV, Component, SCART …) and ignores the channels.

**Device page, since 0.12.1:** state, volume, mute and source follow the player live. A player that is off reports no source list to Home Assistant; the buttons then show the last list seen, greyed, with the note "last seen". The sensor "Capabilities" of the device shows e.g. "6 of 10"; the attributes list every capability with yes/no.

**Where the Fire TV settings live (0.13):** on the link of the Fire TV (Settings › Network control › cog). Existing settings were moved there once; the lock reads the allowed apps from the same place, per device.

**Volume slider (0.14):** if the volume device of the running activity is linked in Settings › Network control with "Set volume directly instead of via IR" on and the player can take a level, the remote shows a slider instead of volume up/down (mute stays). The level is held to the volume limit by the integration, for every user, also while the lock is on. LG Netcast sets the level on release only. Without direct control the keys stay as before.

**Skins Thermal, Nixie, Nostromo (0.17):** Thermal = heat vision (heat colours, short names in segment letters, running activity with three red dots as a triangle); Nixie = number tubes, brass toggle switches with an always visible lamp; Nostromo = amber ship computer (cursor, typing effect, ASCII hold bar). "Remote" and "Device" became **Dark** (saved values are mapped). Options a skin does not use are hidden. **Skin per room (0.18):** Settings › Look › "Skin for this room"; the card fades when the skin changes between rooms.

**0.19:** Nixie keys are graphite with a chrome edge; directly sent keys (Fire TV) glow dimly, pressed keys brightly; devices with a known power state get a toggle switch. Thermal has thicker segment letters and also draws Cyrillic. If a Harmony hub loses its connection, commands are retried quietly and one hint "Hub not reachable right now, still trying" is shown instead of an error.

**0.19.1:** Fewer "should be off but is on" hints: in the first minute after an activity change they are not shown (Harmony is still switching devices off), and a Fire TV or Android TV that only shows its home screen or screensaver (for example woken by HDMI-CEC) counts as off. On the page of a linked network device, "When it should be off" decides per device: *Report* (default), *Just a note* (a plain line in the gear window, no warning colour, no count, no fix button) or *Don't check*. "Should be on" and wrong inputs are reported as before.

**0.20.0:** Two looks were rebuilt. **Glass** = dark acrylic plates with square corners that light from behind in the colour of their function; the setting *Light style* chooses *Plate lights*, *Text lights* or *Mix* (default). **Clay (Knetmasse)** = puffy bubbles you press (they squash and spring back), dents for surfaces and unavailable things, a coral bubble for the running activity. Both show devices with a known power state with a switch in their own style, and the security card now uses the same skin choice as the main card (including the skin of the room shown). Nixie app keys of the Fire TV are graphite with a dim amber legend. Thermal keyboard keys with only an icon are visible again.

**Skins Terminal and Tube radio (0.15):** Settings › Appearance › Look. Terminal: green phosphor screen with interference, activities as list lines (the running one inverted), angular keys. Tube radio: wood and brass, the running activity as a glass lamp, a magic eye that follows the volume, toggle switches. The effects only lie over the card; with "reduce motion" in the system the animations stop. **0.15.2:** in Tube radio every tile is a pilot lamp (lit = running or selected), switches are real toggles, the Activities/Devices switch is a rocker plate; in Terminal "active" is a filled green block everywhere. **0.16.0:** Terminal: hold to switch off fills the tile from black to green and shrinks it to a line; devices in the running activity flicker faintly; lists in the screen's look. Tube radio: On/Off of a device is a sunken brass button with a lamp behind (state known from the linked player) or the two short keys I and O (state unknown), in one row with Toggle; keys with a state are dark glass behind a grille with orange lit letters; lamps flicker faintly; the magic eye is amber; the dial shows the room and the running activity (needle and name); lists, gear and window in the radio look. Terminal and Tube radio come right after Homebase in the Look list. **0.15.5:** Terminal is green throughout (On/Off keys, the off tile with "OFF", Fire TV app keys and badges without brand colours), the icons next to the room tabs have no frame, the vertical volume slider is an LED meter. Tube radio: the On/Off switch has a pilot lamp instead of text (green = on, red = off), the vertical volume is a rail with a scale, Mute is a round brass button inside the volume rocker (pressed in = muted, when the linked player reports it), keys with a state are pressed in while active and other keys go down on a tap. In all skins Mute sits inside the volume rocker and both rockers have the same height. **0.15.4:** hold effects follow the skin (Terminal: green blocks across the tile; Tube radio: the lamp heats up); linking the Fire TV keeps its settings; Settings open on the first tab. **0.15.3:** the capabilities of a network device are also available as one sensor each (yes/no, disabled by default, enable them on the device page). In a new Fire TV setup "ADB directly" is preselected. **Volume slider in the device view (0.15):** a device linked with "Set volume directly" shows the slider there as well, held to the volume limit, also while the lock is on.

**Capabilities and "Read again" (0.15.1):** the device page lists all capabilities ("7 of 10", remembered ones marked "last seen"). A player that is off reports little to Home Assistant; capabilities and inputs seen while it was on are remembered (also across restarts). **Read again** (administrators) forgets them and reads now: switch the device on first, open its page, press the button. The sensor "Capabilities" has one attribute per capability (yes/no) in its dialog.

**Detected platform and sensors (0.10):** the tab Network control shows under each linked player what was detected ("Detected: LG Netcast") and what to know about it. In Home Assistant, the sensors **Network control** (all linked devices with platform, capabilities and state in the attributes) and **Differences** (one per hub, number of differences with the list in the attributes) show the same without the card; use them for automations and notifications.

**Volume and the soundbar (0.9):** the volume keys of the card always go where the hub sends them in the current activity (for example to the soundbar); linking the TV changes nothing there. A network command for the TV only affects the TV. If an activity sends the volume through another device, the step and the tab say so in a note under the volume setting.

**Suggestions (0.11):** a player is suggested only with real evidence: the same room as the hub, the same model, the same kind of device, or a shared name word that is not the maker. The maker alone is never enough, and a player that can neither switch nor pick a source is not suggested. Pure playback targets (AirPlay, DLNA renderers, music servers such as Music Assistant) are not in the list at all. "Show suggestions" at the top of the tab switches them off for all hubs; "Don't suggest again" next to a suggestion switches them off for that device ("Suggest again" undoes it).

**In Home Assistant (0.11):** every linked device gets its own device "Name (Network)", next to the "(ADB)" devices of the Fire TVs, with the diagnostic sensors **Platform** (for example `lg_netcast`, peculiarities as attribute), **Capabilities** (in words, codes as attribute) and **State** (on/off; volume, mute and source as attributes). It appears when you link the device and is removed when you unlink it. Every stored action is a **button** on the hub's device: pressing it starts the action like a tap on the card; while another action runs on the hub the press is refused with a message. The buttons follow the actions (a new action adds one, a deleted one removes it, renaming keeps the entity).

Actions of 0.4 are converted to a single step by themselves. Actions are the same for all profiles.

## 8. Fire TV

Since 0.12 the Fire TV is a device of Settings › **Network control** like any other: choose its `media_player` (Android TV integration) next to the Harmony device it belongs to, then tap the cog. The cog opens the **page of the Fire TV** (the former tab "Fire TV"); **Back** returns to the list. A Fire TV set up before 0.12 is linked automatically, once, and keeps all its settings.

On the page:
1. The entity and the Harmony device (as before).
2. **Test connection**. If the Fire TV is not reachable, a hint below says what to check.
3. **Read installed apps** fetches the apps from the device. Choose which apps appear as buttons, assign the colour keys, add own apps by package name. Tap and hold (or hover over) an app name to see its package. A wrong package assignment is removed with the small chain button next to the app.
4. Optional: **Model** (for example Cube), **Volume without an activity via** the IR sender (Cube only), **Also show in activities** and **Lock activity when not reachable** (both switches).

The Fire TV has its own status line with play/pause and standby, even when Harmony knows nothing about it.

In Home Assistant a linked Fire TV is **one** device, "Name (Network)": its "ADB reachable" sensor sits there together with Platform, Capabilities and State (before 0.12 there were two devices, "(ADB)" and "(Network)").

Tested with a Fire TV Cube (3rd generation). Other models may differ.

## 9. Links

Settings › **Activities** › Link: connect an activity with another entity (for example the Fire TV with the Fire TV activity). The card then shows a hint when both disagree ("Fire TV is running, Harmony is on Blu‑ray") with a button to match them. While the activity runs, other activities or key groups can be locked.

## 10. Look and profiles

- Settings › **Look**: skin (15), skin per room, tile style, layout, running-activity style, key shape, labels, glow, coloured icons.
- Settings › **Behaviour**: vibration, hold to switch, keyboard control, collapse header, jump to the running activity, device names in the help.
- **Symbols** for devices and activities in the tabs "Devices" and "Activities".
- **Profiles** (profile button in the status line): different settings for different people or tablets. Profiles can be assigned to users or fixed with the card option `profile`.

## 11. Lock (security card)

```yaml
type: custom:harmony-deck-security
```

Best on a dashboard page only adults see. Only administrators can change it.

1. **Mode:** Off, Always or Schedule. In a schedule the windows are **lock times** (for example every day 20:00 to 07:00).
2. **Check the lock now:** shows what the lock would switch off right now, without doing it.
3. **Release:** pauses the lock for the chosen time.
4. **Allowed activities:** ticked = may run. Activities that are not allowed show a lock in the main card and cannot be started there. If they are started another way (original remote), the integration switches them off after 3 seconds.
5. **Allowed apps (device that reports apps):** since 0.12 the lock asks for the capability "reads the running app" instead of for "Fire TV"; today only the Fire TV reports it, and the section is named after the device. The home screen is allowed by default; without it no other app can be allowed. the home screen is allowed by default; without it no other app can be allowed. Newly installed apps are blocked. Apps that ran once appear in the list by themselves.
6. **Switch off as well:** devices that also go off when the lock acts on the Fire TV (for example TV and amplifier).
7. **Interventions:** the last 100, with **Allow** right in the list.
8. **Debug: package names** (administrators): the real package name of the running app and of all packages, to copy.

The lock is a household aid, not a security product.

## 12. Entities

Per hub: Lock, Lock mode, Release duration, Release, Lock active (with the allowed activities as attribute), Sequence (state and progress of the actions), Released until, Last intervention, Interventions today, Intervention (event: fires with `what` each time the lock switches something off, so an automation can notify you), Hub configuration readable, Activities and Devices (the names as a short list, "Bluray, Games and 4 more"; the number and the full list as attributes), Actions (the same for the stored actions, with id, steps and button per action), Differences, and one button per action. Per linked network device: a device "Name (Network)" with Platform, Capabilities and State. Per Fire TV: ADB reachable. Plus diagnostic entities and repair hints. All can be used in automations.

## 13. Troubleshooting

| Problem | Solution |
|---|---|
| Card says "No Harmony hubs found" | Set up the "Logitech Harmony Hub" integration, restart Home Assistant |
| Card outdated after an update | Ctrl+F5 or clear the app cache |
| Repair hint "Fire TV not reachable" stays | It appears after about 6 minutes without ADB and disappears as soon as the Fire TV answers again |
| Fire TV "not reachable" | Fire TV on and on the network, ADB debugging on, reload the Android TV integration, then "Test connection" |
| Activity starts but no picture or sound | Open the life ring, switch devices on or choose the input |
| App stays dimmed in the lock list | "Read installed apps"; check the package name in the Debug section |
| Diagnostics for a bug report | Settings › Devices & services › Harmony Deck › ⋮ › Download diagnostics |

## 14. Symbols

| Symbol | Meaning |
|---|---|
| Room icon glows | A Harmony activity runs in this room |
| Pulsing dot | Activity is starting |
| Small TV at the room icon | Fire TV is on (with play: playing) |
| Crossed-out TV | Fire TV not reachable |
| Chain link | A linked entity disagrees with Harmony |
| Lock on a tile or key | locked (by the lock or a link) |
| Red lock in the status line | Lock active |
| Open lock with a time | released until that time |

### 0.20.1
Glass: new setting *Background* (black, black with texture, aluminium, circuit board). Plates are half transparent and lit by a lamp behind them. Rest, belongs to the running activity (weak violet) and selected (bright violet, white lettering with a halo) are the same for activities, devices and tabs. Keys fade out after you release them. Volume is ten lamps behind the glass. Clay: no dot on device tiles, room tab no longer clipped, settings and windows are dents and bubbles.

### 0.20.2
Glass: light style B lights the lettering in the function colour, larger halo, calmer volume lamps, lilac headings, Activities/Devices as two plates, opaque windows, new setting *Colour per activity* (off by default).

### 0.21.0
Profile window: one profile at a time, the whole row of the chosen profile is lit in the skin's selection style (no check marks). Clay and Glass got proper primary buttons and opaque help windows, Thermal a dark edit header. The security card was checked in all own skins.

### 0.23.0
Pebble (Kiesel) is a skin of its own (sand windows, eight stone shapes, painted rooms and buttons, badges as water drops; Settings > Look has *Background fills the view* for all skins): grey river stones with irregular shapes on a Caribbean ground, sand-coloured carved hollows and water in the sand groove of the volume. New settings *Paint flaws* (Clean / Light / Strong), *Painted* (Off / A one colour / B rainbow / C painted pictures, default A) and *Background* (Caribbean, aquamarine, lagoon, dark teal) appear in Settings > Look when Pebble is chosen. Holding "all off" no longer draws a ring: the key turns red step by step. Holding an activity tile tints the whole tile instead of filling it from below. In the Info area network devices are folded lines like the hubs and the area has a single Close button.

### 0.23.4
Thermal draws active things as one soft heat spot (hot core, yellow, green, teal edge) that flares when pressed and cools down, unavailable things cold blue, locked ones violet, and the three heat dots of a selected device fly in. Hint bubbles follow the skin. Glass: Fire TV keys are tinted glass lit from behind, unavailable keys cracked. Narrow phones show only the active room next to the tools. The device page has no header any more (tap the device again to deselect). Settings rows adapt to the card width. New setting *Slider step* (Settings > Behaviour) for TVs that only know volume steps, such as LG Netcast: the slider sends the missing steps one after the other.

### 0.23.5
LG Netcast: the volume slider now reaches the chosen level; after the last step the real level is read again and missing steps follow. Hint texts show in every skin. Lock marks follow the skin colour (Nixie: dark tube with a brass lock). Security card chips are square in Terminal, Nostromo and Thermal, whole lit plates in Glass and bubbles in Clay.

### 0.23.6
LG Netcast timings moved into the options of the integration (Settings > Devices & services > Harmony Deck > Configure, section LG Netcast): gap between steps, number of corrections, wait before the check. The volume slider stays on the chosen level until the TV reports it. The card setting *Slider step* is gone.

### 0.24.0
Options of the integration are now per TV (LG Netcast): pick the TV, then gap between steps (default 100 ms), corrections and the longest wait. After the last step the level is read until it stays the same before missing steps are sent. New, optional per TV: **TV picture**, **Main colour** and **Picture available** entities (switch on in the options of the TV; the picture comes from the media player, new on change or every few seconds). Use the main colour in an automation to colour lamps; without pictures the colour goes unknown after the set time.

### 0.22.0
New setting *Log requests to hubs and network devices* (Settings > Hub, off by default) writes commands and state changes of hubs and linked devices into the Home Assistant log (logger custom_components.harmony_deck.traffic). The Fire TV badge is now only a glowing symbol in every own skin. Clay and Glass got proper Fire TV app keys, Clay a bubble volume bar. Fixed the Home Assistant deprecation warnings.
