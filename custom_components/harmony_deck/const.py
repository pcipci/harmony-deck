"""Constants for Harmony Deck."""

DOMAIN = "harmony_deck"
HARMONY_DOMAIN = "harmony"

STORAGE_KEY = f"{DOMAIN}.settings"
STORAGE_VERSION = 1

CARD_FILE = "harmony-deck-card.js"
CARD_URL = f"/{DOMAIN}/{CARD_FILE}"
TRANSLATIONS_URL = f"/{DOMAIN}/translations"

# Keys that the shared settings may contain (set from the card editor).
SETTING_KEYS = ("skin", "names", "hidden", "hiddenHubs", "devices", "favorites", "keyIcons", "vibrate", "helpNames", "links", "tileStyle", "keyboardControl", "holdSwitch", "direct", "glow", "keyStyle", "deviceIcons", "layout", "activeStyle", "activityFavs", "actions", "labels", "activityIcons", "collapseHeader", "colorIcons", "jumpRunning", "noBlur", "glassLook", "glassBg", "glassActColors", "helpHide", "layoutMode", "offRelated", "helpManual", "hideKeys", "irVolume", "volumeCap", "directDevices", "directSuggest", "roomSkins", "trafficLog")

# Sent when the stored actions changed (buttons and the sensor "Actions" follow).
SIGNAL_ACTIONS = f"{DOMAIN}_actions_changed"
