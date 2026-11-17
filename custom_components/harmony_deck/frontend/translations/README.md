# Translations of the Harmony Deck card

Every language is one JSON file here: `de.json`, `en.json`, `ru.json`, ...
The card loads `en.json` first and then the file of the wanted language on top,
so **missing keys fall back to English**. A partial translation is fine.

## Adding a language

1. Copy `en.json` to `<code>.json`, e.g. `fr.json` (two-letter code, as Home Assistant uses).
2. Translate the **values**. Never change the keys.
3. Keep the placeholders `{0}` and `{1}` (names or numbers inserted by the card).
4. Reload the dashboard (hard refresh). The card follows the Home Assistant language,
   or set `language: fr` in the card configuration.
5. Run `python tests/test_translations.py`. It lists keys that are missing or unknown.
   `python tests/test_card_texts.py` checks the other direction: every text the card sources use exists in `en.json`.

Nothing else has to be registered. In the card configuration form the language dropdown
only lists Deutsch, English, Русский; other languages work by `language: <code>` in YAML
or by the Home Assistant language.

## Structure

| Key group | Meaning |
|-----------|---------|
| plain strings | labels and buttons |
| `skins`, `tabs`, `layouts`, `models` ... | objects: one label per option, keep the inner keys |
| `tips` | texts of the (i) bubbles in the settings |
| `kb`, `fireKeys`, `iconNames` | labels of keyboard keys, Fire TV keys and icons |
| `cardEditor` | texts of the form in Home Assistant's card dialog |
| `sec` | texts of the security card |
| `legend` | list of entries (icon, title, text) in the info section; the icon stays |

## Integration texts (entities, repairs)

The names of the status entities and the repair messages are in
`custom_components/harmony_deck/translations/<code>.json` (the normal Home Assistant
format, with `{hub}` as placeholder). Add a copy there for the same language.
