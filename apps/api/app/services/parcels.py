"""Parcel service utilities using seed data."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from . import utils

_parcels = utils.load_seed("parcels.json")
_overlays = utils.load_seed("overlays.json")
_da_apps = utils.load_seed("da_applications.json")
_provenance = utils.load_seed("data_provenance.json")


def _matches_overlay(parcel_id: str, overlay: Optional[str]) -> bool:
    if overlay is None:
        return True
    return any(o["overlay_type"] == overlay for o in _overlays if o["parcel_id"] == parcel_id)


def _matches_zoning(record: Dict[str, Any], zoning: Optional[List[str]]) -> bool:
    if not zoning:
        return True
    return record.get("zoning_code") in zoning


def _within_area(record: Dict[str, Any], min_area: Optional[float]) -> bool:
    if min_area is None:
        return True
    return float(record.get("area_sqm", 0)) >= min_area


def _within_slope(record: Dict[str, Any], max_slope: Optional[float]) -> bool:
    if max_slope is None:
        return True
    return float(record.get("slope_pct", 0)) <= max_slope


def _matches_query(record: Dict[str, Any], query: Optional[str]) -> bool:
    if not query:
        return True
    q = query.lower()
    return q in (record.get("address", "").lower()) or q in (record.get("cad_id", "").lower())


def search(
    *,
    bbox: Optional[str],
    zoning: Optional[List[str]],
    min_area: Optional[float],
    max_slope: Optional[float],
    overlay: Optional[str],
    query: Optional[str],
) -> List[Dict[str, Any]]:
    # bbox ignored in mock but retained for interface compliance
    results: List[Dict[str, Any]] = []
    for record in _parcels:
        if not (_matches_zoning(record, zoning) and _within_area(record, min_area) and _within_slope(record, max_slope)):
            continue
        if not _matches_overlay(record["id"], overlay):
            continue
        if not _matches_query(record, query):
            continue
        results.append(record)
    return results


def risk_card(parcel_id: str) -> Optional[Dict[str, Any]]:
    parcel = next((p for p in _parcels if p["id"] == parcel_id), None)
    if not parcel:
        return None
    overlays = [o for o in _overlays if o["parcel_id"] == parcel_id]
    da_precedents = [da for da in _da_apps if da.get("parcel_id") == parcel_id]
    provenance = [p for p in _provenance if p["entity_id"] in {parcel_id, f"{parcel_id}:flood"}]
    metrics = {
        "area_sqm": parcel.get("area_sqm"),
        "frontage_m": parcel.get("frontage_m"),
        "slope_pct": parcel.get("slope_pct"),
    }
    owner_masked = "Alex M." if parcel_id == "parcel-1" else "Jamie L."
    return {
        "parcel": parcel,
        "metrics": metrics,
        "overlays": overlays,
        "da_precedents": da_precedents,
        "owner_masked": owner_masked,
        "provenance": provenance,
    }


def search_da(lga: Optional[str], status: Optional[str], since: Optional[str]) -> List[Dict[str, Any]]:
    results = _da_apps
    if lga:
        results = [da for da in results if da.get("lga_code") == lga]
    if status:
        results = [da for da in results if da.get("status", "").lower() == status.lower()]
    if since:
        since_date = datetime.fromisoformat(since)
        results = [da for da in results if datetime.fromisoformat(da["received_on"]) >= since_date]
    return results
