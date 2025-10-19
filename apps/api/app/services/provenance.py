"""Provenance lookup service."""
from __future__ import annotations

from typing import Any, Dict, List

from . import utils

_data = utils.load_seed("data_provenance.json")


def lookup(entity_type: str, entity_id: str) -> List[Dict[str, Any]]:
    results = [row for row in _data if row.get("entity_type") == entity_type and row.get("entity_id") == entity_id]
    return results
