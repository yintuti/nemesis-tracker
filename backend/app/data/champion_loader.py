import json
import os
import re

_BASE_DIR = os.path.dirname(__file__)
_CLASSES_PATH = os.path.join(_BASE_DIR, "champion_classes.json")

with open(_CLASSES_PATH, "r", encoding="utf-8") as f:
    CHAMPION_CLASSES: dict[str, str] = json.load(f)

NORMALIZED_CHAMPION_CLASSES = {
    re.sub(r"[^a-z0-9]", "", champion.lower()): champion_class
    for champion, champion_class in CHAMPION_CLASSES.items()
}


def get_champion_class(champion_name: str) -> str:
    """
    Return the champion class.
    Return 'Unknown' when the champion is not mapped.
    """
    if champion_name in CHAMPION_CLASSES:
        return CHAMPION_CLASSES[champion_name]

    normalized_name = re.sub(r"[^a-z0-9]", "", champion_name.lower())
    return NORMALIZED_CHAMPION_CLASSES.get(normalized_name, "Unknown")
