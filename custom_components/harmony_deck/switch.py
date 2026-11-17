"""Switch: lock a hub."""

from .lockent import LockSwitch, setup_platform

async_setup_entry = setup_platform(LockSwitch, "lock")
