-- ==============================================================================
-- WAT Job Radar 2027 — Production Schema
-- Relational Model: Agencies -> Employers -> AgencyEmployers -> Positions -> Snapshots
-- ==============================================================================

-- 1. Agencies
create table if not exists public.agencies (
  id text primary key, -- e.g. 'OEG', 'New Step', 'ACADEX', 'IEE', 'iHappy'
  name text not null,
  website text not null,
  connector_type text not null default 'HTML', -- 'API', 'EMBEDDED_JSON', 'HTML', 'BROWSER', 'TBD'
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed initial agencies
insert into public.agencies (id, name, website, connector_type, is_active)
values
  ('OEG', 'OEG Thailand', 'https://www.oeg.co.th/work-and-travel-usa', 'HTML', true),
  ('New Step', 'New Step Thailand', 'https://newstepthailand.com/jobs', 'HTML', true),
  ('ACADEX', 'ACADEX Thailand', 'https://www.acadexthailand.com', 'HTML', true),
  ('IEE', 'IEE Thailand', 'https://www.ieethailand.com', 'HTML', true),
  ('iHappy', 'iHappy Thailand', 'https://ihappythailand.com', 'TBD', false)
on conflict (id) do update set
  website = excluded.website,
  connector_type = excluded.connector_type;

-- 2. Canonical Employers (Merged across agencies)
create table if not exists public.employers (
  id text primary key, -- canonical slug, e.g. 'denali-princess-wilderness-lodge'
  canonical_name text not null,
  city text,
  state text,
  area text, -- e.g. 'Denali Area', 'Sandusky', 'Wisconsin Dells', 'Yosemite Area'
  address text,
  latitude numeric,
  longitude numeric,
  aliases text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists employers_state_idx on public.employers(state);
create index if not exists employers_area_idx on public.employers(area);

-- 3. Agency Employers (One row per agency's representation of an employer)
create table if not exists public.agency_employers (
  id text primary key, -- e.g. 'oeg-65'
  employer_id text not null references public.employers(id) on delete cascade,
  agency_id text not null references public.agencies(id) on delete cascade,
  source_employer_name text not null,
  source_url text not null,
  source_id text, -- e.g. '65'
  season text not null default 'Summer 2027',
  program_status text, -- e.g. 'Confirmed - Placement', 'Pre-Placement'
  start_date_text text,
  end_date_text text,
  location_raw text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  missing_runs int not null default 0,
  sync_status text not null default 'ACTIVE' -- 'ACTIVE', 'SUSPECT', 'STALE', 'ARCHIVED'
);
create index if not exists agency_employers_agency_idx on public.agency_employers(agency_id);
create index if not exists agency_employers_season_idx on public.agency_employers(season);
create index if not exists agency_employers_sync_idx on public.agency_employers(sync_status);

-- 4. Housing
create table if not exists public.housing (
  id text primary key, -- e.g. 'housing-oeg-65'
  agency_employer_id text not null references public.agency_employers(id) on delete cascade,
  weekly_cost numeric,
  housing_text text,
  deposit numeric,
  deposit_text text,
  meals_included boolean default false,
  meals_per_day int,
  meals_text text,
  transportation_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Positions (Granular job positions under an agency employer)
create table if not exists public.positions (
  id text primary key, -- e.g. 'oeg-65-lifeguard'
  agency_employer_id text not null references public.agency_employers(id) on delete cascade,
  position_name text not null,
  canonical_category text, -- 'KITCHEN_BOH', 'FOOD_FOH', 'HOUSEKEEPING', 'ATTRACTION', 'RETAIL', 'OTHER'
  wage_hourly numeric,
  wage_max numeric,
  wage_text text,
  tips boolean default false,
  tips_text text,
  hours_min numeric,
  hours_max numeric,
  hours_text text,
  available_slots int, -- null when count unknown
  availability_text text,
  status text not null default 'UNKNOWN', -- 'OPEN', 'LOW_SLOTS', 'FULL', 'COMING_SOON', 'PRE_PLACEMENT', 'CONFIRMED', 'PENDING', 'CLOSED', 'UNKNOWN'
  english_level text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  missing_runs int not null default 0,
  is_stale boolean not null default false
);
create index if not exists positions_status_idx on public.positions(status);
create index if not exists positions_slots_idx on public.positions(available_slots);
create index if not exists positions_wage_idx on public.positions(wage_hourly);

-- 6. Job Snapshots (Point-in-time tracking for status, slots, wage changes)
create table if not exists public.job_snapshots (
  id bigint generated always as identity primary key,
  position_id text not null references public.positions(id) on delete cascade,
  available_slots int,
  wage_hourly numeric,
  status text not null,
  captured_at timestamptz not null default now()
);
create index if not exists job_snapshots_pos_idx on public.job_snapshots(position_id, captured_at desc);

-- 7. Sync Runs (Detailed coverage audit for every scrape cycle)
create table if not exists public.sync_runs (
  id bigint generated always as identity primary key,
  agency_id text not null references public.agencies(id) on delete cascade,
  connector_type text not null,
  discovery_count int not null default 0,
  detail_pages_fetched int not null default 0,
  detail_pages_parsed int not null default 0,
  positions_found int not null default 0,
  positions_saved int not null default 0,
  failed_pages int not null default 0,
  failed_urls text[] default '{}',
  coverage_pct numeric not null default 0,
  duration_ms int,
  status text not null default 'SUCCESS', -- 'SUCCESS', 'WARNING', 'ERROR'
  error_text text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index if not exists sync_runs_agency_idx on public.sync_runs(agency_id, started_at desc);

-- 8. Source Health (Aggregated current health view for /sources)
create table if not exists public.source_health (
  agency_id text primary key references public.agencies(id) on delete cascade,
  connector_type text not null default 'HTML',
  last_sync_at timestamptz,
  last_status text not null default 'UNKNOWN', -- 'Healthy', 'Warning', 'Partial', 'Error', 'Connector Needed'
  last_coverage_pct numeric default 0,
  employers_count int not null default 0,
  positions_count int not null default 0,
  active_positions_count int not null default 0,
  last_error text,
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security (Public Read)
alter table public.agencies enable row level security;
alter table public.employers enable row level security;
alter table public.agency_employers enable row level security;
alter table public.housing enable row level security;
alter table public.positions enable row level security;
alter table public.job_snapshots enable row level security;
alter table public.sync_runs enable row level security;
alter table public.source_health enable row level security;

-- Public read policies
create policy "public read agencies" on public.agencies for select to anon using (true);
create policy "public read employers" on public.employers for select to anon using (true);
create policy "public read agency_employers" on public.agency_employers for select to anon using (true);
create policy "public read housing" on public.housing for select to anon using (true);
create policy "public read positions" on public.positions for select to anon using (true);
create policy "public read snapshots" on public.job_snapshots for select to anon using (true);
create policy "public read sync runs" on public.sync_runs for select to anon using (true);
create policy "public read source health" on public.source_health for select to anon using (true);
