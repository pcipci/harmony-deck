# Contributing

Bug reports and ideas are welcome as GitHub issues. Please include the version of Harmony Deck and Home Assistant, which Fire TV model you use (if any) and the diagnostics file (Settings → Devices & services → Harmony Deck → ⋮ → Download diagnostics). Remove names you do not want to share.

Code:
- Integration: `custom_components/harmony_deck/` (Python). Tests: `pip install -r requirements_test.txt && python -m pytest tests`.
- Cards: sources in `card/src`, `cd card && npm ci && npm run check` builds and lints the bundle in `custom_components/harmony_deck/frontend/`. Never edit the bundle by hand.
- Texts only in `custom_components/harmony_deck/frontend/translations/*.json`. A new language is one copy of `en.json`.
