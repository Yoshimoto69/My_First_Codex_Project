# Technical Architecture — DevFindr + PricePro MVP (AU)

## Overview
The MVP consists of a Supabase-hosted Postgres + PostGIS database, FastAPI service layer, Next.js web application, and ETL pipelines powered by Firecrawl/Playwright with Manus for PDF parsing. Data provenance is enforced via dedicated logging tables and a provenance service.

```
+-------------------+          +----------------------+         +------------------+
|  Next.js (Web)    |<-------->|  FastAPI (apps/api)  |<------->| Supabase (DB/RLS)|
|  Role workspaces  |  HTTPS   |  REST + WebSockets   |  SQL    | PostGIS + Auth   |
+-------------------+          +----------------------+         +------------------+
        ^   ^                             ^   ^                          ^   ^
        |   |                             |   |                          |   |
        |   |                             |   |                          |   |
        |   +--------------+--------------+   +----------+---------------+   |
        |                  |                         |                   |   |
        |                  v                         v                   |   |
        |          +---------------+         +---------------+           |   |
        |          |  Queue (SQS)  |         |  File Storage |           |   |
        |          |  (or Supabase)|         |  (Supabase)   |           |   |
        |          +-------+-------+         +-------+-------+           |   |
        |                  |                         |                   |   |
        |                  v                         v                   |   |
        |          +---------------+         +---------------+           |   |
        |          | ETL Workers   |         | Manus PDF OCR |           |   |
        |          | (Firecrawl,   |         | (serverless)  |           |   |
        |          | Playwright)   |         +---------------+           |   |
        |          +---------------+                                     |   |
        |                     |                                          |   |
        +---------------------+------------------------------------------+---+
                              |                                              
                              v                                              
                       External Data APIs & Open Data Sources
```

## Components
### Web Application (`/apps/web`)
- Next.js 14 app router with role-based layouts.
- Map stack using Mapbox GL JS (tiles sourced via Supabase storage or Mapbox) and Tippecanoe-generated vector tiles for parcels/overlays.
- Shared UI components for Provenance Panel, Parcel Risk Card, Feaso modal, CMA Studio wizard.
- Auth via Supabase client SDK; RLS enforces data isolation per org.

### API Layer (`/apps/api`)
- FastAPI chosen for speed, async support, and Python ecosystem integration with data science tasks (Feaso calculations).
- Provides REST endpoints defined in `docs/API-SPEC.yaml`.
- Integrates with Supabase Postgres via async SQLAlchemy/PostgREST bridging.
- Handles Feaso calculations, CMA PDF orchestration, provenance lookups, and queue dispatch for heavy tasks.
- Background tasks (Celery or FastAPI background tasks) for PDF generation and DA scraping triggers.

### Data Layer
- Supabase Postgres with PostGIS for spatial queries.
- Vector tile generation pipeline using Tippecanoe (via ETL job) output stored in Supabase storage bucket or S3-compatible store.
- Qdrant (optional future) for semantic search across DA documents; initial MVP can use pgvector extension.

### ETL & Scraping (`/etl`)
- Firecrawl for structured open data endpoints (JSON/CSV).
- Playwright for council DA portals requiring DOM navigation (respect robots.txt, login not bypassed).
- Manus for parsing DA PDF documents into structured JSON.
- Jobs orchestrated via simple cron (Supabase scheduled functions) or GitHub Actions for MVP; production move to Airflow/Temporal.
- Deduplication via hashed keys (source URL + timestamp) before insert.
- Provenance logging appended to `data_provenance` on each ingestion.

### File Storage & PDFs
- Supabase storage bucket `reports` for CMA/Feaso outputs.
- PDF rendering via serverless service (e.g., open-source Paged.js or Headless Chrome) orchestrated by FastAPI.

### Auth & RBAC
- Supabase Auth for user/org membership.
- Roles mapped to Supabase RLS policies controlling table access (`role` claim in JWT).
- Admin tools to manage licences, opt-outs, and audit logs.

## Data Flow
1. **Ingestion**: ETL job fetches council dataset → normalises schema → stores in staging tables → upserts into core tables (`parcels`, `overlays`, `da_applications`, etc.) → writes `data_provenance` entry.
2. **Tile Generation**: After parcel/overlay updates, Tippecanoe pipeline generates vector tiles and uploads to storage; tile manifest stored in DB.
3. **API Consumption**: FastAPI endpoints query PostGIS (spatial filters) and return JSON responses with provenance references.
4. **Feaso & CMA**: API receives request, runs calculations (NumPy/Pandas), persists results to `feaso_runs` or `reports`, enqueues PDF job.
5. **PDF Rendering**: Background worker pulls job, renders PDF via Headless Chrome/Playwright, stores in Supabase storage, updates `reports` with URL.
6. **UI Display**: Next.js fetches via API, displays data, attaches provenance panel data, ensures masked PII per user role.
7. **Outreach**: When owner outreach triggered, API logs in `outreach` table, ensures consent status and opt-out enforced.

## Infrastructure & Deployment
- **Supabase**: hosts Postgres, Auth, Storage, Edge Functions.
- **API Deployment**: Deploy FastAPI on Fly.io or Railway with autoscaling (containerized). Connect via service role to Supabase using RLS bypass for server-to-server operations.
- **Web Deployment**: Next.js on Vercel with environment variables for Supabase keys, API base URL.
- **ETL Workers**: Container jobs on GitHub Actions (cron) or AWS Fargate triggered by SQS.
- **Monitoring**: Supabase logs, FastAPI metrics via Prometheus, uptime via BetterStack.

## Map Pipeline Detail
1. Source parcels/overlays from Supabase (PostGIS) into GeoJSON via SQL functions.
2. Use Tippecanoe CLI to create MBTiles vector tiles with layer metadata (parcel, overlay types).
3. Upload MBTiles to Tilestrata or Mapbox; expose tile endpoints to Next.js map.
4. Cache tile generation results; incremental updates using tile-delta approach for changed parcels only.

## Queues & Background Processing
- Use Amazon SQS (or Supabase Edge Queue once available) for PDF generation and heavy analytics tasks.
- Jobs include: `generate_cma_pdf`, `generate_feaso_pdf`, `ingest_da_batch`.
- Worker service polls queue, processes job, and writes status back to `reports` or `data_provenance`.

## Security Considerations
- All external integrations via API keys stored in Supabase secrets.
- PII masked columns stored encrypted (pgcrypto) and unmasked only for authorised roles with logged access events.
- Audit logs stored in Supabase `audit_log` (extension) capturing user queries on sensitive tables.
- Strict robots.txt adherence for scraping; rate limiting with exponential backoff.

## Scalability & Future Expansion
- Modular ETL connectors per state; add configuration-driven mapping to expand internationally.
- Introduce GraphQL gateway for partner API distribution post-MVP.
- Add caching layer (Redis) for high-traffic endpoints (parcel search, overlays) when user load increases.

## References
- Supabase Architecture Docs.
- FastAPI Async Patterns.
- Tippecanoe & Mapbox vector tiles documentation.
- AWS SQS developer guide.
