"""Select: the mode of the lock (off, always, schedule), one per hub."""

from .lockent import LockMode, setup_platform

async_setup_entry = setup_platform(LockMode, "lock_mode")
