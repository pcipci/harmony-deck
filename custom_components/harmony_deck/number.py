"""Number: how long a release lasts."""

from .lockent import ReleaseMinutes, setup_platform

async_setup_entry = setup_platform(ReleaseMinutes, "release_minutes")
