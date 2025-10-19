# Security & Compliance Plan

## Regulatory Context
- **Privacy Act 1988 (Cth)** and Australian Privacy Principles (APPs).
- **State land titles legislation** (NSW Real Property Act, VIC Transfer of Land Act, etc.).
- **Consumer Data protections** for outreach communications (Spam Act 2003, DNCR).
- **Licensing agreements** with commercial data vendors (Pricefinder, CoreLogic, Landgate, etc.).

## Data Classification
| Category | Examples | Handling |
| --- | --- | --- |
| Public | Parcel geometry, zoning, overlays | Stored unencrypted, provenance logged |
| Regulated | Sales prices, DA documents, hazard overlays (with licence) | Stored in Supabase with RLS, provenance required |
| Sensitive | Owner contact data, outreach history | Masked, encrypted with pgcrypto, RLS + audit logs |

## Access Controls
- Supabase Auth with role-based JWT claims.
- Row Level Security policies per table, e.g., `parcels` read allowed for org members; `owners` only accessible when consent_status='granted'.
- Admin role required to view provenance licence notes for commercial datasets.
- Temporary service role key stored in API server secret manager, not shipped to client.

## Encryption & Storage
- Supabase-managed TLS for data in transit.
- At rest: Postgres encryption, plus `pgcrypto` for PII columns (`owners.pii_ciphertext`).
- File storage (reports, PDFs) encrypted via Supabase storage, signed URL for access.

## Audit & Logging
- `audit_log` table records sensitive actions with user_id, timestamp, reason.
- Supabase log drains to external SIEM (e.g., Datadog) for retention ≥ 12 months.
- Background jobs log ingestion events in `etl.ingestion_logs`.

## Provenance & Licensing
- Every dataset ingestion writes to `data_provenance` with licence, terms URL, refresh cadence.
- UI displays source + last refreshed.
- Commercial dataset integration (Pricefinder/CoreLogic) requires executed licence; access logs stored for audits.
- Land titles retrieval limited to consented lookups; store transaction id + cost centre.

## Consent & Opt-Out
- `owners` table default `consent_status='unknown'`.
- Consent captured via web form or recorded phone call (with compliance doc).
- Outreach API checks consent token before send; if `revoked` or `suppressed`, returns 403.
- Provide public-facing opt-out form referencing parcel id; apply to `owners` + `outreach` history.

## Incident Response
1. Detect via monitoring/alerts.
2. Contain: revoke keys, disable affected endpoints.
3. Assess impact, gather logs, notify leadership.
4. Report to OAIC if breach likely to cause serious harm (NDB scheme).
5. Communicate with affected customers and data licensors within contractual timelines.
6. Post-mortem with remediation actions (update controls, training).

## Third-Party Risk
- Vendor due diligence for Pricefinder/CoreLogic (security questionnaires).
- Review Manus, Firecrawl, Supabase compliance certifications.
- Maintain contract repository with renewal reminders.

## Development Practices
- Infrastructure-as-code (Terraform) with code review.
- Secrets managed via Supabase + Vercel env vars (no secrets in git).
- Dependency scanning (GitHub Dependabot) and Snyk for container images.
- Secure coding guidelines (no direct SQL string concatenation, parameterized queries).

## Testing & Validation
- Penetration test prior to GA.
- Automated tests for RLS policies (ensure least privilege).
- Data accuracy spot checks per dataset (Quality Gate).
- Annual review of compliance docs.

## References
- OAIC Notifiable Data Breach scheme.
- Spam Act 2003 compliance guides.
- Supabase Security Whitepaper.
- NSW LRS Terms of Use.
