"""Number: how long a release lasts; settings of linked LG Netcast TVs (0.27)."""

from .lockent import ReleaseMinutes, setup_platform
from .techent import setup_platform as _tech_platform

_lock_setup = setup_platform(ReleaseMinutes, "release_minutes")


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    await _lock_setup(hass, entry, async_add_entities)
    await _tech_platform("number")(hass, entry, async_add_entities)     # 0.27: settings of linked LG Netcast TVs
