"""Texts of the cards: every text the sources use exists in the translations, and no translation is left unused.

Run: python -m pytest tests, or python tests/test_card_texts.py. Skipped when the card sources are not there.
"""
import json
import re
from pathlib import Path

REPO = Path(__file__).parents[1]
SRC = REPO / "card" / "src"
EN = REPO / "custom_components" / "harmony_deck" / "frontend" / "translations" / "en.json"

# Keys that are read through a variable (the name is built at run time).
DYNAMIC = {"discEject", "discMenu", "discTop", "discPopup", "discSub", "discAudio", "discAngle", "discInfo"}
# Words after "t." that are not texts.
NOT_TEXT = {"__ok"}


def _sources():
    return "\n".join(p.read_text(encoding="utf-8") for p in sorted(SRC.rglob("*.js")))


def _used(code):
    top = set(re.findall(r"(?<![\w$.])t\??\.([A-Za-z_]\w*)", code))
    top |= set(re.findall(r"this\._t\(\)\??\.([A-Za-z_]\w*)", code))
    top |= set(re.findall(r"this\._text\??\.([A-Za-z_]\w*)", code))
    top |= set(re.findall(r"this\._txt\??\.([A-Za-z_]\w*)", code))
    security = "\n".join(p.read_text(encoding="utf-8") for p in sorted((SRC / "security").rglob("*.js")))
    sec = set(re.findall(r"(?<![\w$.])s\.([A-Za-z_]\w*)", security)) | set(re.findall(r"\bt\.sec\??\.([A-Za-z_]\w*)", code))
    editor = set(re.findall(r"t\.cardEditor\.([A-Za-z_]\w*)", code)) | set(re.findall(r"cardEditor\.([A-Za-z_]\w*)", code))
    return top - NOT_TEXT, sec, editor


def test_every_used_text_exists():
    if not SRC.exists():
        return
    english = json.loads(EN.read_text(encoding="utf-8"))
    top, sec, editor = _used(_sources())
    # The card editor reads its own group through a local "t", so its keys may live there.
    missing = sorted(k for k in top if k not in english and k not in english["cardEditor"])
    assert not missing, f"texts used in the sources but missing in en.json: {missing}"
    missing = sorted(k for k in sec if k not in english["sec"])
    assert not missing, f"texts of the security card missing in en.json (sec): {missing}"
    missing = sorted(k for k in editor if k not in english["cardEditor"])
    assert not missing, f"texts of the card editor missing in en.json (cardEditor): {missing}"


def test_no_unused_text():
    if not SRC.exists():
        return
    english = json.loads(EN.read_text(encoding="utf-8"))
    code = _sources()
    top, sec, _ = _used(code)
    quoted = set(re.findall(r'"([A-Za-z_]\w*)"', code))  # keys named in tables, e.g. the tips
    unused = sorted(k for k in english if k not in top and k not in DYNAMIC and k not in quoted)
    assert not unused, f"texts in en.json that no source uses: {unused}"
    unused = sorted(k for k in english["sec"] if k not in sec)
    assert not unused, f"texts in en.json (sec) that the security card does not use: {unused}"
    editor = (SRC / "config-editor" / "editor.js").read_text(encoding="utf-8")
    unused = sorted(k for k in english["cardEditor"] if not re.search(r"\.%s\b" % k, editor))
    assert not unused, f"texts in en.json (cardEditor) that the card editor does not use: {unused}"


def test_tips_point_to_existing_rows():
    """Every (i) bubble named in the settings exists in the translations and the other way round."""
    if not SRC.exists():
        return
    english = json.loads(EN.read_text(encoding="utf-8"))
    code = (SRC / "deck" / "settings-editor.js").read_text(encoding="utf-8")
    start = code.index("_applyTips(root)")
    block = code[start:code.index("\n  },", start)]
    named = set(re.findall(r':\s*"(\w+)"', block)) | set(re.findall(r'tip\([^;]*?,\s*"(\w+)"\)', block))
    assert named, "no tips found in the sources"
    missing = sorted(named - set(english["tips"]))
    unused = sorted(set(english["tips"]) - named)
    assert not missing, f"tips used but not translated: {missing}"
    assert not unused, f"tips translated but not used: {unused}"


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
