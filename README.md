# DevFindr + PricePro MVP Scaffold

This repository contains documentation, API scaffolding, database schema, ETL examples, and a Next.js UI shell for the DevFindr (developer intelligence) and PricePro (CMA/reporting) platform focused on the Australian market.

## Getting Started
1. **Clone & Install**
   ```bash
   git clone <repo>
   cd My_First_Codex_Project
   ```
2. **API (FastAPI)**
   ```bash
   cd apps/api
   poetry install
   poetry run uvicorn app.main:app --reload
   ```
3. **Web (Next.js)**
   ```bash
   cd apps/web
   npm install
   npm run dev
   ```
4. **Database**
   - Use Supabase project, run `sql/DB-SCHEMA.sql` via SQL editor.
   - Load seed data manually or via Supabase CSV upload using files in `/seeds`.

## Seed Data
Sample parcels, overlays, DA applications, owners, and provenance records live under `/seeds`. These populate the API mocks and support demo flows.

## Documentation
| File | Description |
| --- | --- |
| `docs/PRD.md` | Product requirements for MVP |
| `docs/TECH-ARCH.md` | Technical architecture, data flow, services |
| `docs/DATA-SOURCES.csv` | Dataset inventory with licensing |
| `docs/SCRAPING-PLAYBOOK.md` | Scraping & ingestion guidelines |
| `docs/API-SPEC.yaml` | OpenAPI 3.0 spec |
| `docs/SECURITY-COMPLIANCE.md` | Privacy, security, licensing plan |
| `docs/GTM-PRICING.md` | Pricing & GTM strategy |

## Demo Script
1. Launch API + Web dev servers.
2. Log in with Supabase test user (see `.env.local.sample`).
3. Search for "Marrickville" in Parcel Explorer (Developer workspace).
4. Open parcel risk card → review overlays & provenance.
5. Click **Feaso-in-a-Click** → run with default assumptions, review IRR/residual.
6. Switch to Agent workspace → open CMA Studio, drag seeded comp into selection, export PDF (mock queued response).
7. View Provenance panel to confirm sources and refresh cadence.

## Next Steps
- Integrate Supabase client, real PostGIS queries, and background workers.
- Replace mock data with live ingestion pipelines defined in `/etl`.
- Finalise licensing agreements before ingesting commercial titles/sales.

## License
Internal use only. Ensure compliance with dataset licences noted in `docs/DATA-SOURCES.csv`.
