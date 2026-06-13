-- Marketing dashboard data table.
-- One row per ad, per day. Run this in the Supabase SQL editor (Database -> SQL editor).
--
-- The app reads from this table via SupabaseProvider. Column names are snake_case
-- (Postgres convention) and are aliased back to camelCase in lib/data/supabase.ts.

create table if not exists public.ad_performance (
  id                 bigint generated always as identity primary key,
  date               date         not null,
  channel            text         not null check (channel in ('facebook', 'google')),
  campaign           text         not null,
  adset              text         not null,
  ad                 text         not null,
  impressions        bigint       not null default 0,
  clicks             bigint       not null default 0,
  spend              numeric(14,2) not null default 0,
  conversions        bigint       not null default 0,
  revenue            numeric(14,2) not null default 0,
  -- optional breakdown dimensions
  device             text,
  placement          text,
  region             text,
  age_range          text,
  gender             text,
  keyword            text,
  frequency          numeric(8,2),
  landing_page_views bigint
);

-- Index for the date-range + channel filters the dashboard runs constantly.
create index if not exists ad_performance_date_channel_idx
  on public.ad_performance (date, channel);

-- Row Level Security: enable, then allow public read with the anon key.
-- (This is an internal read-only dashboard; the anon key only needs SELECT.)
alter table public.ad_performance enable row level security;

create policy "Public read access"
  on public.ad_performance
  for select
  using (true);

-- Writes should happen via the service_role key from your ETL / Windsor sync job,
-- which bypasses RLS. Do NOT expose the service_role key to the browser.
