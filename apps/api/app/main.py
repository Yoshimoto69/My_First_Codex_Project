"""FastAPI application entry point for DevFindr + PricePro."""
from __future__ import annotations

import os
from functools import lru_cache
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# In lieu of a full database integration we use in-memory mocks seeded from /seeds.
from .services import feaso as feaso_service
from .services import parcels as parcel_service
from .services import provenance as provenance_service
from .services import reports as reports_service


class ParcelSummary(BaseModel):
    id: str
    cad_id: Optional[str]
    address: Optional[str]
    state: Optional[str]
    zoning_code: Optional[str]
    overlays: List[str] = []
    last_sale_price: Optional[float]
    provenance_ids: List[str] = []


class OverlayDetail(BaseModel):
    overlay_type: str
    authority: Optional[str]
    severity: Optional[str] = None
    source_url: Optional[str] = None
    captured_at: Optional[str] = None


class DaApplication(BaseModel):
    id: str
    lga_code: Optional[str]
    address: Optional[str]
    da_ref: Optional[str]
    proposal: Optional[str]
    status: Optional[str]
    received_on: Optional[str]
    decided_on: Optional[str] = None
    url: Optional[str]
    docs_json: Dict[str, Any] | None = None


class RiskCard(BaseModel):
    parcel: ParcelSummary
    metrics: Dict[str, Optional[float]]
    overlays: List[OverlayDetail]
    da_precedents: List[DaApplication]
    owner_masked: Optional[str]
    provenance: List[Dict[str, Any]]


class FeasoInput(BaseModel):
    parcel_id: str
    build_cost_m2: float
    siteworks_pct: float
    finance_pct: float
    contingency_pct: float = 10
    gst_pct: float
    sales_price_m2: float
    units_n: int = 10
    gross_floor_area_sqm: float | None = None
    holding_months: int = 18
    interest_rate_pct: float | None = None
    pre_sales_pct: float | None = None
    equity_contribution_pct: float | None = None


class FeasoResult(BaseModel):
    feaso_run_id: str
    irr_pct: float
    residual: float
    profit_margin_pct: float
    sensitivity: List[Dict[str, float]]
    provenance: List[Dict[str, Any]]


class CmaComp(BaseModel):
    parcel_id: str
    adjustments: Dict[str, float] | None = None


class CmaComposeRequest(BaseModel):
    subject_parcel_id: str
    comps: List[CmaComp]
    branding_options: Dict[str, Any] | None = None
    distribution: Dict[str, Any] | None = None


class CmaComposeResponse(BaseModel):
    report_id: str
    status: str


class OutreachRequest(BaseModel):
    owner_id: str
    channel: str = Field(..., regex=r"^(email|phone|mail)$")
    template_id: Optional[str] = None
    message_preview: Optional[str] = None
    consent_token: Optional[str] = None


class OutreachResponse(BaseModel):
    outreach_id: str
    status: str
    sent_at: Optional[str]


@lru_cache
def get_app_settings() -> Dict[str, Any]:
    return {
        "environment": os.getenv("APP_ENV", "local"),
        "allow_origins": os.getenv("CORS_ALLOW_ORIGINS", "*").split(","),
    }


def create_app() -> FastAPI:
    app = FastAPI(title="DevFindr + PricePro API", version="0.1.0")

    settings = get_app_settings()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings["allow_origins"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_routes(app)

    return app


def register_routes(app: FastAPI) -> None:
    @app.get("/health", tags=["System"])
    async def health() -> Dict[str, str]:
        return {"status": "ok"}

    @app.get("/parcels/search", response_model=Dict[str, Any], tags=["Parcels"])
    async def search_parcels(
        bbox: Optional[str] = None,
        zoning: Optional[List[str]] = Query(default=None),
        min_area: Optional[float] = None,
        max_slope: Optional[float] = None,
        overlay: Optional[str] = None,
        q: Optional[str] = None,
    ) -> Dict[str, Any]:
        results = parcel_service.search(
            bbox=bbox,
            zoning=zoning,
            min_area=min_area,
            max_slope=max_slope,
            overlay=overlay,
            query=q,
        )
        return {"items": results, "next_cursor": None}

    @app.get("/parcels/{parcel_id}/risk-card", response_model=RiskCard, tags=["Parcels"])
    async def get_risk_card(parcel_id: str) -> RiskCard:
        card = parcel_service.risk_card(parcel_id)
        if not card:
            raise HTTPException(status_code=404, detail="Parcel not found")
        return card

    @app.post("/feaso/run", response_model=FeasoResult, tags=["Feaso"])
    async def run_feaso(payload: FeasoInput) -> FeasoResult:
        result = feaso_service.run(payload.dict())
        return result

    @app.post("/cma/compose", response_model=CmaComposeResponse, status_code=202, tags=["CMA"])
    async def compose_cma(payload: CmaComposeRequest) -> CmaComposeResponse:
        report = reports_service.enqueue_cma(payload.dict())
        return report

    @app.get("/da/search", response_model=Dict[str, Any], tags=["DevelopmentApplications"])
    async def search_da(
        lga: Optional[str] = None,
        status: Optional[str] = None,
        since: Optional[str] = None,
    ) -> Dict[str, Any]:
        results = parcel_service.search_da(lga=lga, status=status, since=since)
        return {"items": results}

    @app.get("/provenance/{entity_type}/{entity_id}", response_model=Dict[str, List[Dict[str, Any]]], tags=["Provenance"])
    async def get_provenance(entity_type: str, entity_id: str) -> Dict[str, List[Dict[str, Any]]]:
        entries = provenance_service.lookup(entity_type, entity_id)
        return {"items": entries}

    @app.post("/outreach", response_model=OutreachResponse, status_code=201, tags=["Outreach"])
    async def create_outreach(payload: OutreachRequest) -> OutreachResponse:
        record = reports_service.log_outreach(payload.dict())
        if record.get("status") == "forbidden":
            raise HTTPException(status_code=403, detail="Consent not granted")
        return OutreachResponse(**record)


app = create_app()
