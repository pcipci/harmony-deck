"""(run: python -m pytest tests, or python tests/test_translations.py) Every language file must have the same keys as English and keep the placeholders."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parents[1] / "custom_components" / "harmony_deck"
CARD = ROOT / "frontend" / "translations"
INTEGRATION = ROOT / "translations"


def _flat(obj, prefix=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            yield from _flat(v, f"{prefix}{k}.")
    elif isinstance(obj, list):
        yield prefix.rstrip("."), obj
    else:
        yield prefix.rstrip("."), obj


def _load(path):
    return dict(_flat(json.loads(path.read_text(encoding="utf-8"))))


def _check(folder):
    english = _load(folder / "en.json")
    for path in sorted(folder.glob("*.json")):
        own = _load(path)
        assert set(own) == set(english), f"{path.name}: missing {set(english) - set(own)}, unknown {set(own) - set(english)}"
        for key, value in own.items():
            if isinstance(value, str):
                assert sorted(re.findall(r"\{\w*\}", value)) == sorted(re.findall(r"\{\w*\}", english[key])), f"{path.name}: placeholders of {key}"


def test_card_languages():
    _check(CARD)


def test_integration_languages():
    _check(INTEGRATION)


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
