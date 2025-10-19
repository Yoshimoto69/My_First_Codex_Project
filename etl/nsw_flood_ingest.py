"""Example Firecrawl-based ingestion job for NSW flood overlays."""
from __future__ import annotations

import asyncio
import datetime as dt
from typing import Any, Dict, List

import httpx

SOURCE_URL = "https://portal.spatial.nsw.gov.au/arcgis/rest/services/FloodData/MapServer/0/query"
PARAMS = {
    "where": "1=1",
    "outFields": "OBJECTID,SEVERITY,AUTHORITY,SHAPE.AREA",
    "f": "geojson",
}


async def fetch() -> Dict[str, Any]:
    async with httpx.AsyncClient(timeout=60) as client:
        response = await client.get(SOURCE_URL, params=PARAMS)
        response.raise_for_status()
        return response.json()


def transform(feature: Dict[str, Any]) -> Dict[str, Any]:
    props = feature.get("properties", {})
    return {
        "parcel_id": props.get("CAD_ID"),
        "overlay_type": "flood",
        "authority": props.get("AUTHORITY", "NSW Spatial Services"),
        "severity": props.get("SEVERITY"),
        "geom": feature.get("geometry"),
        "captured_at": dt.datetime.utcnow().isoformat() + "Z",
        "source_url": SOURCE_URL,
    }


def load(records: List[Dict[str, Any]]) -> None:
    # Placeholder: integrate with Supabase via REST/RPC.
    for record in records:
        print(f"Upserting overlay {record['parcel_id']} ({record['severity']})")


async def main() -> None:
    data = await fetch()
    features = data.get("features", [])
    transformed = [transform(f) for f in features if f.get("properties", {}).get("CAD_ID")]
    load(transformed)


if __name__ == "__main__":
    asyncio.run(main())
