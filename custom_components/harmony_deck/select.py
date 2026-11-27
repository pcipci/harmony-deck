"""Select: the mode of the lock (off, always, schedule), one per hub; settings of linked LG Netcast TVs (0.27)."""

from .lockent import LockMode, setup_platform
from .techent import setup_platform as _tech_platform

_lock_setup = setup_platform(LockMode, "lock_mode")


async def async_setup_entry(hass, entry, async_add_entities) -> None:
    await _lock_setup(hass, entry, async_add_entities)
    await _tech_platform("select")(hass, entry, async_add_entities)     # 0.27: settings of linked LG Netcast TVs
