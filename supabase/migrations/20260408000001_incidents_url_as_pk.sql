-- Drop the old id-based primary key and make url the primary key instead.
-- This avoids hash collision issues with generated IDs and matches our upsert strategy.

alter table public.incidents drop constraint incidents_pkey;
alter table public.incidents drop column id;
alter table public.incidents add primary key (url);
