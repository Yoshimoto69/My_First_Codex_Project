# DevFindr + PricePro MVP PRD (Australia)

## Vision & Objectives
- Deliver a dual-sided property intelligence platform for Australian developers, agents, investors, and homeowners.
- Provide explainable analytics, feasibility modelling, and compliant outreach in a single bundle.
- Build for rapid expansion to other jurisdictions by enforcing provenance, licensing, and modular data ingestion.

### Success Metrics (MVP)
- 200 active weekly users within 3 months of beta.
- 80% of feasibility runs completed in <3 minutes with ±10% variance vs curated baseline set.
- CMA PDF download NPS ≥ +30 from beta agents.
- 90% of parcels enriched with at least one overlay or risk flag across NSW, VIC, QLD pilot LGAs.

## Target Personas
- **Property developers**: need rapid site vetting, overlay risks, feasibility, DA precedent scanning.
- **Buyers' & sales agents**: require comps, CMAs, outreach, and branded reporting.
- **Investors & homeowners**: portfolio tracking, renovation ROI insights, alerts.
- **Internal analysts**: manage data pipelines, provenance, and compliance.

## Scope Definition
### Must Have
1. **Parcel discovery** with zoning, overlays (flood, bushfire, heritage), parcel geometry, and provenance stamps.
2. **Feaso v1** one-click feasibility calculator (residual land value, IRR) using configurable assumptions and saved runs.
3. **CMA Studio v1** with drag-and-drop comparable selection, adjustments, and PDF export under 30 seconds.
4. **Provenance Panel** showing data source, licence, and last refresh for every surfaced data point.
5. **Supabase Auth** with role presets (Developer, Agent, Investor, Homeowner, Admin) and RBAC workspaces.
6. **Data ingestion jobs** (Firecrawl/Playwright ETL) with provenance logging.
7. **Demo workflow**: Parcel search → Risk Card → Feaso modal → CMA PDF.

### Should Have
1. **DA precedent harvesting** across pilot councils with searchable metadata and document previews.
2. **Outreach list builder** with masked owner contact, consent tracking, and opt-out mechanisms.
3. **Portfolio tracker** for investors/homeowners.
4. **Shareable branded reports** with trackable links.

### Could Have
1. **Automated valuation model (AVM)** with confidence bands.
2. **Bulk owner exports** with usage caps and logging.
3. **Partner API keys** with usage metering.

## Key User Stories
- *As a developer*, I can search parcels within a drawn area, filter by zoning, slope, overlays, and view a risk card summarising constraints.
- *As a developer*, I can launch "Feaso-in-a-Click" from the risk card, tweak assumptions, and see IRR/residual outputs with provenance.
- *As an agent*, I can drag candidate comps into a CMA, apply adjustments, and generate a branded PDF with cited sources.
- *As an investor*, I can track owned parcels, see valuation trends, and note renovation ROI suggestions.
- *As an admin*, I can audit data sources, view licensing terms, and honour opt-outs.

## Feature Requirements
### Parcel Search & Risk Card
- Map search by bounding box, suburb, or CAD/Lot/Plan.
- Overlay badges with severity; hover reveals provenance.
- Risk card details: zoning, overlays, slope, frontage, recent sale, DA precedents summary, contact (masked).
- Filter response <1s for ≤10k parcels (use cached tiles + client-side filter).

### Feaso-in-a-Click
- Inputs: build cost (per m²), site works %, finance cost %, contingency %, sales price per m², holding period, GST %, pre-sales %, interest rate, margin target.
- Outputs: residual land value, profit margin, IRR, sensitivity table (±10% on key drivers).
- Save run to `feaso_runs`, tag by user/org, attach assumptions JSON.
- Export summary to PDF with provenance footnotes.

### CMA Studio
- Map/list view to select comps (drag to selection pane).
- Adjustment sliders for time, condition, size, location (persisted in `adjustments_json`).
- Live valuation band with confidence indicator.
- Generate PDF (≤30s) with summary, comps table, map, and methodology section referencing data sources.

### Provenance Panel
- Component showing aggregated `data_provenance` entries tied to surfaced entity.
- Display source name, URL, last fetched, licence terms, refresh cadence.
- Always accessible via floating button.

### Role-Based Workspaces
- Developer workspace: focus on site pipeline, feasibility, outreach list.
- Agent workspace: CMA studio, report templates, portfolio.
- Investor/Homeowner workspace: holdings, alerts, ROI calculators.
- Admin workspace: ingestion health, licence tracker, audit logs.

### Data & Compliance
- Enforce masking for owner PII; require consent to reveal full details.
- Log consent events and outreach touches; enable opt-out per parcel.
- All ingestion jobs record source metadata (`data_provenance`).
- Document licensing plan for land titles and sales data (Pricefinder, CoreLogic, NSW LPI, VIC Landata, etc.).

## Non-Functional Requirements
- **Performance**: map filters <1s; Feaso & CMA computations <5s; PDF generation <30s.
- **Reliability**: nightly ETL jobs with retry + alerting; provenance logs auditable.
- **Security**: Supabase RLS, encryption at rest (Postgres managed), TLS.
- **Scalability**: multi-state via modular ingestion adapters; multi-tenant orgs.
- **Compliance**: respect data licences, honour robots.txt, maintain audit trails.

## Dependencies & Risks
- Securing commercial sales/licence data (Cost, legal negotiation).
- Council data variability; manual mapping for schema alignment.
- Feasibility accuracy reliant on cost benchmarks; require baseline dataset.
- PDF generation load; consider queueing.
- Performance for large map queries; need spatial indexing (PostGIS) and caching strategy.

## Open Questions / TODOs
- Finalise commercial sales data licensing partner (Pricefinder vs CoreLogic vs Domain). Evaluate costs/terms.
- Determine approach for owner outreach consent flows (in-product consent vs external list). Need legal review.
- Validate ETL refresh cadence per state (daily vs weekly) to balance cost/performance.
- Confirm PDF template design & hosting (serverless vs third-party like DocRaptor).
- Define AVM roadmap and acceptable error thresholds for expansion.

## Release Plan
1. **Milestone 1 (Weeks 0-4)**: Setup Supabase schema, ingestion skeleton, Next.js scaffold, basic parcel search with seed data.
2. **Milestone 2 (Weeks 5-8)**: Implement Feaso v1, CMA Studio skeleton, Provenance Panel, PDF service stub.
3. **Milestone 3 (Weeks 9-12)**: DA harvesting, outreach module, branded reports, licensing integration, beta with pilot orgs.
4. **Milestone 4 (Weeks 13-16)**: Performance tuning, security review, compliance docs, go-to-market prep.

## References
- NSW Planning Portal Open Data (Creative Commons Attribution 4.0).
- data.gov.au catalogue for hazard overlays (varies by state, many under CC BY 4.0).
- Queensland Spatial Catalogue (QSpatial) licence under Creative Commons Attribution 3.0 AU.
- VICMAP data licensing (commercial – contact Department of Environment, Land, Water and Planning).
