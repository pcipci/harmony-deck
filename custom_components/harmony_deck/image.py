"""Image: the TV picture of a linked network TV (optional per device, see screen.py)."""

from .screenent import setup_platform

async_setup_entry = setup_platform("tv_picture")
