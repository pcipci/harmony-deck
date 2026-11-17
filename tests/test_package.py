"""Package checks (run: python -m pytest tests, or python tests/test_package.py): manifest is valid JSON, versions agree, no file is empty."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parents[1] / "custom_components" / "harmony_deck"


def test_manifest_and_versions():
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["domain"] == "harmony_deck"
    card = (ROOT / "frontend" / "harmony-deck-card.js").read_text(encoding="utf-8")
    assert re.search(r'VERSION = "%s"' % re.escape(manifest["version"]), card), "card VERSION differs from manifest version"
    source = ROOT.parents[1] / "card" / "src" / "shared" / "version.js"
    if source.exists():  # the bundle must have been built from the current sources
        assert manifest["version"] in source.read_text(encoding="utf-8"), "card/src/shared/version.js differs from manifest version"


def test_no_empty_files():
    empty = [str(p.relative_to(ROOT)) for p in ROOT.rglob("*") if p.is_file() and "__pycache__" not in p.parts and p.stat().st_size == 0]
    assert not empty, f"empty files: {empty}"


def test_json_files_parse():
    for path in ROOT.rglob("*.json"):
        json.loads(path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
