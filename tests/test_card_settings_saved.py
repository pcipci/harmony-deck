"""Every switch of the card settings must be a key the integration stores (a missing key is silently dropped)."""

import re
from pathlib import Path

from custom_components.harmony_deck.const import SETTING_KEYS

CARD = Path(__file__).parent.parent / "card" / "src"


def test_every_card_setting_is_stored():
    text = "\n".join(p.read_text(encoding="utf-8") for p in (CARD / "deck").glob("*.js"))
    keys = set(re.findall(r'data-setting=\\?"(\w+)\\?"', text))
    assert keys, "no data-setting keys found"
    assert keys <= set(SETTING_KEYS), sorted(keys - set(SETTING_KEYS))
