"""Button: release the lock for a while."""

from .lockent import ReleaseButton, setup_platform

async_setup_entry = setup_platform(ReleaseButton, "release")
