# Scraping & Ingestion Playbook

## Principles
- **Lawful Access Only**: Collect data exclusively from publicly accessible endpoints or licensed feeds. Never bypass authentication or paywalls.
- **Robots.txt Respect**: Before scheduling a job, check and cache robots.txt status. Abort if disallowed.
- **Backoff & Throttling**: Default concurrency of 2 requests/sec per domain with exponential backoff (2^n up to 5 retries).
- **Auditability**: Log every request with timestamp, URL, response code, dataset id, and provenance metadata.
- **PII Handling**: Mask owner or personal data on ingest; store hashed email/phone if exposed (salted). Strip PDF attachments of signatures via Manus redaction options.

## Tooling
- **Firecrawl**: Ideal for API/JSON/CSV endpoints. Configure dataset-specific connectors with schema mappers.
- **Playwright**: Used when interactive filtering is required (e.g., council DA registers). Run in headless mode within containerised worker.
- **Manus**: Parse PDF documents and map extracted text to structured JSON for `docs_json`.
- **Deduplication**: Hash of (source_url + primary_identifier + fetched_at) stored to avoid re-ingest.

## Workflow Template
1. **Discovery**: Add dataset to `docs/DATA-SOURCES.csv` with licensing notes.
2. **Robots Check**: Firecrawl `robots()` helper or manual fetch; store result in ingestion config.
3. **Schema Mapping**: Define transformation to match DB tables (`/packages/shared/src/schemas.ts`).
4. **Ingestion Run**:
   - Fetch data with Firecrawl/Playwright.
   - Normalize field names and coordinate reference system to GDA2020.
   - Upsert into staging tables (`etl.stage_*`).
   - Validate row counts and geometry validity.
   - Merge into production tables with `INSERT ... ON CONFLICT`.
   - Write `data_provenance` record.
5. **Error Handling**:
   - Retry on network/timeouts up to 5 times (exponential backoff).
   - On HTTP 429, respect `Retry-After` header + random jitter.
   - Alert via Slack/webhook when failures exceed threshold.
6. **PII Masking**: Apply `mask_owner()` UDF before persisting to `owners` table. Only store hashed contact if consent provided.
7. **Audit Logs**: Append to `etl.ingestion_logs` with job id, dataset, duration, rows inserted, errors.

## Job Configuration Example (YAML)
```yaml
name: nsw_flood_overlays
schedule: "0 3 * * 1"  # Mondays 3am AEST
connector: firecrawl.arcgis
source: https://portal.spatial.nsw.gov.au/...
out: overlays
transform:
  - project: [id, geometry, severity]
  - convert_crs: EPSG:4326 -> EPSG:7844
  - set:
      overlay_type: flood
provenance:
  source_name: NSW Spatial Services Flood Data
  license: CC BY 4.0
  refresh_cadence: quarterly
  terms_url: https://creativecommons.org/licenses/by/4.0/
```

## Playwright Pattern
```python
async def fetch_city_da(page):
    await page.goto("https://online2.cityofsydney.nsw.gov.au/DA/Pages/XC.Track/SearchApplication.aspx")
    await page.fill("#ctl00_Main_txtDateFrom", since.strftime("%d/%m/%Y"))
    await page.click("#ctl00_Main_btnSearch")
    await page.wait_for_selector("table.results")
    rows = await page.query_selector_all("table.results tr")
    for row in rows:
        data = await row.inner_text()
        # parse columns, yield structured dict
```
- Use context managers to ensure browser closed.
- Cache session cookies per run if allowed.
- Screenshot HTML on schema changes for diffing.

## Data Quality Checks
- Geometry validity (`ST_IsValid`) and simplification for tiles.
- Compare row counts vs previous ingest; alert on ±20% deviation.
- Spot-check top 10 records, confirm licences still valid.
- Document manual overrides in `data_provenance.notes`.

## PII & Consent Workflow
- Owner details masked as `FirstName L.` by default.
- Consent table records method (phone/email/form) and expiry.
- Provide opt-out endpoints; ingestion must honour suppression list before insert.

## References
- Firecrawl documentation.
- Playwright Python docs.
- Manus API docs.
- OAIC Australian Privacy Principles guidance.
