create table if not exists public.incidents (
  id            text primary key,           -- e.g. "newsapi-abc123"
  title         text not null,
  description   text,
  url           text not null unique,        -- used for dedup
  date          timestamptz not null,
  source_name   text not null,
  data_source   text not null,              -- 'NewsAPI' | 'GDELT' | 'SerpAPI'
  category      text not null,             -- 'Teacher' | 'Doctor' | 'Religious' | 'Other'
  perpetrator_name  text,
  institution_name  text,
  perpetrator_role  text,
  fetched_at    timestamptz not null default now()
);

-- Index for the most common query pattern: recent incidents sorted by date
create index if not exists incidents_date_idx on public.incidents (date desc);

-- Allow the Edge Function (service role) to read/write
-- Allow anonymous browser reads (no auth needed for this public dashboard)
alter table public.incidents enable row level security;

create policy "Public read" on public.incidents
  for select using (true);

create policy "Service role write" on public.incidents
  for all using (auth.role() = 'service_role');
