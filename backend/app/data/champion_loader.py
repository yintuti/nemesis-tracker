import json
import os

_BASE_DIR = os.path.dirname(__file__)
_CLASSES_PATH = os.path.join(_BASE_DIR, "champion_classes.json")

with open(_CLASSES_PATH, "r", encoding="utf-8") as f:
    CHAMPION_CLASSES: dict[str, str] = json.load(f)


def get_champion_class(champion_name: str) -> str:
    """
    Return the champion class.
    Return 'Unknown' when the champion is not mapped.
    """
    return CHAMPION_CLASSES.get(champion_name, "Unknown")
