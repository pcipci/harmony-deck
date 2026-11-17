"""Shared test setup. The Home Assistant tests need `pytest-homeassistant-custom-component`; without it they are skipped."""

import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

# Imported here first, so that Home Assistant's loader finds this folder and not the empty one of the test package.
import custom_components  # noqa: E402,F401

try:
    import pytest_homeassistant_custom_component  # noqa: F401

    HAVE_HA_TESTS = True
except ImportError:
    HAVE_HA_TESTS = False

collect_ignore = [] if HAVE_HA_TESTS else ["test_integration_ha.py"]
