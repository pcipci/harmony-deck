# Skin checklist

Every skin mock (and every real skin) must show the same elements, so skins stay comparable. A skin is only finished when all points are covered; gaps found in an audit go on the list for the next version.

## State rule (the same in every skin)

Three levels for everything that can be selected or running: **rest**, **belongs to the running activity** (weak), **selected / shown** (bright). A pressed key is the strongest level and fades out after release. No special borders, dots or squares per element type: activity tiles, device tiles, room tabs and settings tabs follow the same rule. Logic only asks skin traits, never skin names.

## Elements

1. Activity tiles: free, running, part of the running activity, selected, "going" (just started)
2. Device tiles and the room tabs (selected / other); devices that belong to the running activity, one of them selected, a device without activity selected, a device that belongs to several activities
3. Direct keys: free, pressed/active state (a key that has a state, for example Play), app keys; function colours (OK green, navigation blue, off red)
4. State keys and the mute key (pressed / not pressed look must stay the same family in every skin)
5. Volume slider (including +/- keys and the value), horizontal and vertical, only where a level is known
6. Settings switch (off / on), the Yes/No switch and the segment switch (Activities / Devices)
7. Power knob (device view)
8. Hold to switch off: progress and the final effect
9. Badges and markings: network symbol, lock, hint badge on the gear, Fire TV badge, count badges (everything has to match the skin, not only the keys)
10. Windows: gear (settings editor with all tabs, selects, inputs, cards, switches), lifebuoy (hints), profile window with all its contents (list, new profile, buttons), the info table, help
11. Hint and info rows in all four message colours (info, running, hint, error)
12. Security card: the same skin as the main card (keys, tiles, header)
13. Key feedback: pressed light and the fade-out after release
14. Reduced motion: the skin must work without any animation
15. Contrast: text and symbols readable on every plate level (QA run with contrast check)

## Audit

Run `node qa.js` (all skins, widths, languages) and the real-card renders for each skin: activities, device page, settings editor, profile window. Report gaps per skin.
