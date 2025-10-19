"""Feasibility calculation helpers."""
from __future__ import annotations

import uuid
from typing import Any, Dict, List

from ..main import FeasoResult
from . import utils

_provenance = utils.load_seed("data_provenance.json")


def run(payload: Dict[str, Any]) -> FeasoResult:
    build_cost = payload["build_cost_m2"] * payload.get("gross_floor_area_sqm", payload.get("units_n", 10) * 90)
    siteworks = build_cost * (payload.get("siteworks_pct", 0) / 100)
    finance = (build_cost + siteworks) * (payload.get("finance_pct", 0) / 100)
    contingency = build_cost * (payload.get("contingency_pct", 10) / 100)
    total_cost = build_cost + siteworks + finance + contingency

    revenue = payload.get("sales_price_m2", 0) * payload.get("gross_floor_area_sqm", payload.get("units_n", 10) * 90)
    gst = revenue * (payload.get("gst_pct", 10) / 100)
    net_revenue = revenue - gst

    residual = net_revenue - total_cost
    equity = payload.get("equity_contribution_pct", 20) / 100 * total_cost
    irr_pct = _estimate_irr(net_revenue, total_cost, payload.get("holding_months", 18))
    profit_margin = (residual / total_cost) * 100 if total_cost else 0

    sensitivity: List[Dict[str, float]] = []
    for delta in (-10, 0, 10):
        adjusted_revenue = net_revenue * (1 + delta / 100)
        adjusted_irr = _estimate_irr(adjusted_revenue, total_cost, payload.get("holding_months", 18))
        sensitivity.append({"metric": "revenue", "delta_pct": float(delta), "irr_pct": adjusted_irr})

    provenance = [p for p in _provenance if p["entity_id"] == payload["parcel_id"]]
    provenance.append(
        {
            "id": str(uuid.uuid4()),
            "source_name": "Feaso v1 Model",
            "source_url": "https://docs.devfindr.com/feaso-methodology",
            "fetched_at": payload.get("run_at", "2024-01-20T00:00:00Z"),
            "license": "Internal",
            "terms": "",
            "refresh_cadence": "on-demand",
        }
    )

    return FeasoResult(
        feaso_run_id=str(uuid.uuid4()),
        irr_pct=round(irr_pct, 2),
        residual=round(residual, 2),
        profit_margin_pct=round(profit_margin, 2),
        sensitivity=sensitivity,
        provenance=provenance,
    )


def _estimate_irr(net_revenue: float, total_cost: float, months: int) -> float:
    if total_cost <= 0 or months <= 0:
        return 0.0
    annual_factor = 12 / months
    irr = (net_revenue / total_cost) ** annual_factor - 1
    return round(irr * 100, 2)
