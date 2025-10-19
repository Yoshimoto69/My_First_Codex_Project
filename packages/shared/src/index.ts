export type OverlayType = 'flood' | 'bushfire' | 'heritage' | 'zoning' | 'other';

export interface ParcelSummary {
  id: string;
  cad_id?: string;
  address?: string;
  state?: string;
  zoning_code?: string;
  overlays: OverlayType[];
  last_sale_price?: number;
  area_sqm?: number;
  frontage_m?: number;
  slope_pct?: number;
}

export interface RiskCardMetrics {
  area_sqm?: number;
  frontage_m?: number;
  slope_pct?: number;
}

export interface ProvenanceEntry {
  id: string;
  source_name: string;
  source_url: string;
  fetched_at: string;
  license: string;
  terms: string;
  refresh_cadence: string;
}

export interface FeasoInputs {
  parcel_id: string;
  build_cost_m2: number;
  siteworks_pct: number;
  finance_pct: number;
  contingency_pct?: number;
  gst_pct: number;
  sales_price_m2: number;
  units_n?: number;
  gross_floor_area_sqm?: number;
  holding_months?: number;
  interest_rate_pct?: number;
  pre_sales_pct?: number;
  equity_contribution_pct?: number;
}

export interface FeasoOutputs {
  feaso_run_id: string;
  irr_pct: number;
  residual: number;
  profit_margin_pct: number;
}

export interface CmaComposePayload {
  subject_parcel_id: string;
  comps: Array<{
    parcel_id: string;
    adjustments?: Record<string, number>;
  }>;
  branding_options?: Record<string, string>;
  distribution?: {
    email?: string;
    send_copy_to_owner?: boolean;
  };
}
