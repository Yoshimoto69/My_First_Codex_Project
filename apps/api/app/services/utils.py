"""Utility helpers for service layer."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List

BASE_PATH = Path(__file__).resolve().parents[4]  # repo root
SEEDS_PATH = BASE_PATH / "seeds"


def load_seed(filename: str) -> List[Dict[str, Any]]:
    path = SEEDS_PATH / filename
    if not path.exists():
        return []
    with path.open() as f:
        return json.load(f)
