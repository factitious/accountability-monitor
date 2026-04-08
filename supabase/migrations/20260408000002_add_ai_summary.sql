alter table public.incidents
  add column if not exists summary text,
  add column if not exists location text,
  add column if not exists ai_enriched boolean not null default false;
