-- Supabase-ready schema for DevFindr + PricePro
-- Uses PostGIS and pgcrypto extensions

create extension if not exists postgis;
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;
create extension if not exists vector;

-- Organisations & users (Supabase defaults) assumed existing.

create table if not exists orgs (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    bundle_plan text not null default 'mvp',
    created_at timestamptz default now()
);

create table if not exists memberships (
    id uuid primary key default gen_random_uuid(),
    org_id uuid references orgs(id) on delete cascade,
    user_id uuid references auth.users(id) on delete cascade,
    role text not null check (role in ('developer','agent','investor','homeowner','admin')),
    created_at timestamptz default now()
);

create table if not exists parcels (
    id uuid primary key default gen_random_uuid(),
    cad_id text unique,
    lga_code text,
    state text,
    address text,
    centroid geometry(point, 7844),
    geom geometry(multipolygon, 7844),
    zoning_code text,
    frontage_m numeric,
    area_sqm numeric,
    slope_pct numeric,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create index if not exists parcels_geom_idx on parcels using gist (geom);
create index if not exists parcels_centroid_idx on parcels using gist (centroid);
create index if not exists parcels_state_idx on parcels (state);

create table if not exists overlays (
    id uuid primary key default gen_random_uuid(),
    parcel_id uuid references parcels(id) on delete cascade,
    overlay_type text check (overlay_type in ('flood','bushfire','heritage','zoning','other')),
    authority text,
    severity text,
    geom geometry(multipolygon, 7844),
    source_url text,
    captured_at timestamptz,
    created_at timestamptz default now()
);
create index if not exists overlays_geom_idx on overlays using gist (geom);

create table if not exists da_applications (
    id uuid primary key default gen_random_uuid(),
    lga_code text,
    address text,
    parcel_id uuid references parcels(id) on delete set null,
    da_ref text,
    proposal text,
    status text,
    received_on date,
    decided_on date,
    url text,
    docs_json jsonb,
    created_at timestamptz default now()
);
create index if not exists da_applications_lga_idx on da_applications (lga_code);
create index if not exists da_applications_status_idx on da_applications (status);

create table if not exists sales (
    id uuid primary key default gen_random_uuid(),
    parcel_id uuid references parcels(id) on delete cascade,
    contract_date date,
    settle_date date,
    price numeric,
    source text,
    source_url text,
    created_at timestamptz default now()
);
create index if not exists sales_contract_date_idx on sales (contract_date);

create table if not exists comps (
    id uuid primary key default gen_random_uuid(),
    subject_parcel_id uuid references parcels(id) on delete cascade,
    comp_parcel_id uuid references parcels(id) on delete cascade,
    rationale text,
    adjustments_json jsonb,
    distance_m numeric,
    created_at timestamptz default now()
);

create table if not exists feaso_runs (
    id uuid primary key default gen_random_uuid(),
    parcel_id uuid references parcels(id) on delete cascade,
    org_id uuid references orgs(id) on delete set null,
    inputs_json jsonb not null,
    outputs_json jsonb not null,
    irr_pct numeric,
    residual numeric,
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now()
);
create index if not exists feaso_runs_parcel_idx on feaso_runs (parcel_id);

create table if not exists reports (
    id uuid primary key default gen_random_uuid(),
    type text check (type in ('cma','feaso','portfolio')),
    subject_id uuid,
    url text,
    status text default 'queued',
    created_by uuid references auth.users(id) on delete set null,
    created_at timestamptz default now()
);

create table if not exists data_provenance (
    id uuid primary key default gen_random_uuid(),
    entity_type text,
    entity_id uuid,
    source_name text,
    source_url text,
    fetched_at timestamptz,
    license text,
    terms text,
    refresh_cadence text,
    notes text,
    created_at timestamptz default now()
);
create index if not exists data_provenance_entity_idx on data_provenance (entity_type, entity_id);

create table if not exists owners (
    id uuid primary key default gen_random_uuid(),
    parcel_id uuid references parcels(id) on delete cascade,
    owner_masked text,
    postal_masked text,
    consent_status text check (consent_status in ('unknown','granted','revoked','suppressed')) default 'unknown',
    last_contacted_at timestamptz,
    pii_ciphertext bytea,
    created_at timestamptz default now()
);
create index if not exists owners_parcel_idx on owners (parcel_id);

create table if not exists outreach (
    id uuid primary key default gen_random_uuid(),
    owner_id uuid references owners(id) on delete cascade,
    channel text,
    template_id text,
    status text,
    sent_at timestamptz,
    payload_hash bytea,
    created_at timestamptz default now()
);

create table if not exists portfolios (
    id uuid primary key default gen_random_uuid(),
    org_id uuid references orgs(id) on delete cascade,
    name text,
    description text,
    created_at timestamptz default now()
);

create table if not exists portfolio_parcels (
    portfolio_id uuid references portfolios(id) on delete cascade,
    parcel_id uuid references parcels(id) on delete cascade,
    primary key (portfolio_id, parcel_id)
);

create table if not exists audit_log (
    id bigint generated always as identity primary key,
    user_id uuid,
    action text,
    entity_type text,
    entity_id uuid,
    metadata jsonb,
    created_at timestamptz default now()
);

-- Staging schema for ETL
create schema if not exists etl;
create table if not exists etl.ingestion_logs (
    id bigserial primary key,
    job_name text,
    dataset text,
    status text,
    rows_inserted int,
    started_at timestamptz,
    finished_at timestamptz,
    error text
);

-- Masking helper
create or replace function mask_owner_name(full_name text)
returns text
language plpgsql as $$
begin
  if full_name is null then
    return null;
  end if;
  return regexp_replace(full_name, '(\\w)(\\w+)', '\\1.', 'g');
end;
$$;

-- RLS policies placeholder (configure via Supabase dashboard)
-- example: enable RLS on parcels and allow read based on org membership.
