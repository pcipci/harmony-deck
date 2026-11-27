"""Switch: lock a hub; settings of linked LG Netcast TVs (0.27)."""

from .lockent import LockSwitch, setup_platform
from .techent import setup_platform as _tech_platform

_lock_setup = setup_platform(LockSwitch, "lock")


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    await _lock_setup(hass, entry, async_add_entities)
    await _tech_platform("switch")(hass, entry, async_add_entities)     # 0.27: settings of linked LG Netcast TVs
