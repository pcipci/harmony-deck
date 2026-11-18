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

**ⓘ** opens the hub info and the three ways to edit:
- **Settings**: look, behaviour, symbols, hub, Fire TV, info. Every tab starts with one sentence about what it is for. Each option is one row: tap anywhere on the row to switch it.
- **Favorites**: mark keys with a star, per device or per activity. The third button, **Hide keys**, hides keys you never use (see section 6).
- **Actions**: own buttons and sequences of Harmony keys, pauses and Home Assistant entities, in an edit mode of their own.

**Done** saves, **Cancel** drops every change of this session. Settings are stored in Home Assistant and apply on all devices.

## 3. Activities and remote

- Tapping a tile starts the activity. The running one is highlighted.
- **Switch off:** **hold** the power tile (or the power button of the collapsed header) until the ring is full, so it does not happen by accident.
- **Hold to switch** (Settings › Behaviour): while an activity runs, another one starts only after a long press.
- The remote sends volume, D‑pad, channel and transport to the device the hub uses for this in the activity.
- **Collapse header** (on by default): when a remote is open, the header shrinks to one line. Tap it to expand.

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

**Direct devices (0.7):** under Settings › **Direct devices** you link a Harmony device to a Home Assistant media player (for example your TV). The keys keep going through the hub; the player adds the state, a real volume level and the source. Per device you see what the player can do and what it reports now. If maker/model or name fit clearly, a suggestion with "Use it" appears; otherwise you pick the player yourself. Linked devices can be used in the step **Device** (switch on/off, volume, mute, source). With "Set volume directly instead of via IR" the step "Volume (IR)" sets the level on the device and no longer counts keys. The volume limit applies to both.

Actions of 0.4 are converted to a single step by themselves. Actions are the same for all profiles.

## 8. Fire TV

Settings › **Fire TV**:
1. Choose the entity (the `media_player` of the Android TV integration) and the Harmony device it belongs to.
2. **Test connection**. If the Fire TV is not reachable, a hint below says what to check.
3. **Read installed apps** fetches the apps from the device. Choose which apps appear as buttons, assign the colour keys, add own apps by package name. Tap and hold (or hover over) an app name to see its package. A wrong package assignment is removed with the small chain button next to the app.
4. Optional: **Model** (for example Cube), **Volume without an activity via** the IR sender (Cube only), **Also show in activities** and **Lock activity when not reachable** (both switches).

The Fire TV has its own status line with play/pause and standby, even when Harmony knows nothing about it.

Tested with a Fire TV Cube (3rd generation). Other models may differ.

## 9. Links

Settings › **Activities** › Link: connect an activity with another entity (for example the Fire TV with the Fire TV activity). The card then shows a hint when both disagree ("Fire TV is running, Harmony is on Blu‑ray") with a button to match them. While the activity runs, other activities or key groups can be locked.

## 10. Look and profiles

- Settings › **Look**: skin (11), tile style, layout, running-activity style, key shape, labels, glow, coloured icons.
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
5. **Allowed apps (Fire TV):** the home screen is allowed by default; without it no other app can be allowed. Newly installed apps are blocked. Apps that ran once appear in the list by themselves.
6. **Switch off as well:** devices that also go off when the lock acts on the Fire TV (for example TV and amplifier).
7. **Interventions:** the last 100, with **Allow** right in the list.
8. **Debug: package names** (administrators): the real package name of the running app and of all packages, to copy.

The lock is a household aid, not a security product.

## 12. Entities

Per hub: Lock, Lock mode, Release duration, Release, Lock active (with the allowed activities as attribute), Sequence (state and progress of the actions), Released until, Last intervention, Interventions today, Intervention (event: fires with `what` each time the lock switches something off, so an automation can notify you), Hub configuration readable, Activities, Devices. Per Fire TV: ADB reachable. Plus diagnostic entities and repair hints. All can be used in automations.

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
