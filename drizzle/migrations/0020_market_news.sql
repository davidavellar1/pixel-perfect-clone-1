-- 0020_market_news.sql
-- Market news: curated sources, ingested items, per-user region/country preferences.
-- Applied manually to the live dev DB on 2026-10-05 and registered in drizzle.__drizzle_migrations.
-- Not yet in meta/_journal.json: add the journal entry together with 0016-0019 when those land on main.
-- Writes to news_source / news_item happen only through the service role (ingest hook).

do $$ begin
  create type public.news_category as enum ('deal','policy','funding','project','market','technology','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.news_source_kind as enum ('rss','gdelt','scraper');
exception when duplicate_object then null; end $$;

create table if not exists public.news_source (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  kind public.news_source_kind not null,
  url text not null,
  homepage_url text,
  country_code char(2),                         -- null = EU-wide / international
  language text not null default 'en',
  keyword_filter boolean not null default false, -- require a district-energy keyword match
  active boolean not null default true,
  poll_interval_minutes integer not null default 180 check (poll_interval_minutes >= 30),
  notes text,
  last_polled_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  consecutive_failures integer not null default 0,
  items_ingested integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.news_item (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.news_source(id) on delete set null,
  url text not null unique,                     -- canonical URL (tracking params stripped)
  title text not null,                          -- original-language headline
  title_en text,                                -- English headline (translated when needed)
  summary text,                                 -- short English summary in our own words
  why_it_matters text,
  language text,
  publisher text,
  image_url text,
  published_at timestamptz not null,
  category public.news_category not null default 'other',
  country_codes char(2)[] not null default '{}',
  technologies public.technology[] not null default '{}',
  deal_value_eur numeric,
  counterparties text[] not null default '{}',
  related_project_ids uuid[] not null default '{}',
  relevance smallint not null default 50 check (relevance between 0 and 100),
  enriched boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists news_item_published_idx on public.news_item (published_at desc) where not hidden;
create index if not exists news_item_country_idx on public.news_item using gin (country_codes);
create index if not exists news_item_projects_idx on public.news_item using gin (related_project_ids);
create index if not exists news_item_category_idx on public.news_item (category);
create index if not exists news_item_source_idx on public.news_item (source_id);

create table if not exists public.user_news_preference (
  user_id uuid primary key references auth.users(id) on delete cascade,
  regions text[] not null default '{}',
  country_codes char(2)[] not null default '{}',
  categories public.news_category[] not null default '{}',
  include_eu boolean not null default true,
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.news_source;
create trigger set_updated_at before update on public.news_source
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.user_news_preference;
create trigger set_updated_at before update on public.user_news_preference
  for each row execute function public.set_updated_at();

alter table public.news_source enable row level security;
alter table public.news_item enable row level security;
alter table public.user_news_preference enable row level security;

-- news_source: members can see which sources exist (not health fields); writes via service role only.
revoke all on public.news_source from anon, authenticated;
grant select (id, slug, name, kind, homepage_url, country_code, language, active) on public.news_source to authenticated;
grant all on public.news_source to service_role;
drop policy if exists news_source_read on public.news_source;
create policy news_source_read on public.news_source for select to authenticated using (true);

-- news_item: signed-in members read visible items; admins may hide/unhide; inserts via service role only.
revoke all on public.news_item from anon, authenticated;
grant select on public.news_item to authenticated;
grant update (hidden) on public.news_item to authenticated;
grant all on public.news_item to service_role;
drop policy if exists news_item_read on public.news_item;
create policy news_item_read on public.news_item for select to authenticated
  using (not hidden or private.has_role(auth.uid(), 'admin'));
drop policy if exists news_item_admin_moderate on public.news_item;
create policy news_item_admin_moderate on public.news_item for update to authenticated
  using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));

-- user_news_preference: each user manages only their own row.
revoke all on public.user_news_preference from anon;
grant select, insert, update, delete on public.user_news_preference to authenticated;
grant all on public.user_news_preference to service_role;
drop policy if exists news_pref_own on public.user_news_preference;
create policy news_pref_own on public.user_news_preference for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Admin-only source health check (failures, last error) without exposing it to all members.
create or replace function public.news_source_health()
returns table (slug text, name text, kind public.news_source_kind, country_code char(2), active boolean,
               last_polled_at timestamptz, last_success_at timestamptz, last_error text,
               consecutive_failures integer, items_ingested integer)
language sql stable security definer set search_path = public, private as $$
  select s.slug, s.name, s.kind, s.country_code, s.active, s.last_polled_at, s.last_success_at,
         s.last_error, s.consecutive_failures, s.items_ingested
  from public.news_source s
  where private.has_role(auth.uid(), 'admin')
  order by s.country_code nulls first, s.slug;
$$;
revoke all on function public.news_source_health() from public, anon;
grant execute on function public.news_source_health() to authenticated;

-- Seed sources. Feeds verified 2026-10-05; scraper rows are inactive placeholders documenting coverage gaps.
insert into public.news_source (slug, name, kind, url, homepage_url, country_code, language, keyword_filter, active, poll_interval_minutes) values
  ('dbdh', 'DBDH – Danish Board of District Heating', 'rss', 'https://dbdh.org/category/news/feed/', 'https://dbdh.org', null, 'en', false, true, 360),
  ('energiateollisuus', 'Energiateollisuus (Finnish Energy)', 'rss', 'https://energia.fi/feed/', 'https://energia.fi', 'FI', 'fi', true, true, 360),
  ('gdelt-dk', 'News monitoring · Denmark', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28fjernvarme%20OR%20fjernk%C3%B8ling%20OR%20%22district%20heating%22%29%20sourcecountry%3Adenmark', 'https://www.gdeltproject.org/', 'DK', 'da', false, true, 180),
  ('gdelt-se', 'News monitoring · Sweden', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28fj%C3%A4rrv%C3%A4rme%20OR%20fj%C3%A4rrkyla%20OR%20%22district%20heating%22%29%20sourcecountry%3Asweden', 'https://www.gdeltproject.org/', 'SE', 'sv', false, true, 180),
  ('gdelt-fi', 'News monitoring · Finland', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28kaukol%C3%A4mp%C3%B6%20OR%20kaukol%C3%A4mm%C3%B6n%20OR%20kaukoj%C3%A4%C3%A4hdytys%20OR%20%22district%20heating%22%29%20sourcecountry%3Afinland', 'https://www.gdeltproject.org/', 'FI', 'fi', false, true, 180),
  ('gdelt-ee', 'News monitoring · Estonia', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28kaugk%C3%BCte%20OR%20kaugk%C3%BCtte%20OR%20%22district%20heating%22%29%20sourcecountry%3Aestonia', 'https://www.gdeltproject.org/', 'EE', 'et', false, true, 180),
  ('gdelt-de', 'News monitoring · Germany', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28Fernw%C3%A4rme%20OR%20W%C3%A4rmenetz%20OR%20W%C3%A4rmenetze%20OR%20Fernk%C3%A4lte%29%20sourcecountry%3Agermany', 'https://www.gdeltproject.org/', 'DE', 'de', false, true, 180),
  ('gdelt-at', 'News monitoring · Austria', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28Fernw%C3%A4rme%20OR%20Fernk%C3%A4lte%20OR%20W%C3%A4rmenetz%29%20sourcecountry%3Aaustria', 'https://www.gdeltproject.org/', 'AT', 'de', false, true, 180),
  ('gdelt-nl', 'News monitoring · Netherlands', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28warmtenet%20OR%20warmtenetten%20OR%20stadsverwarming%20OR%20warmtebedrijf%29%20sourcecountry%3Anetherlands', 'https://www.gdeltproject.org/', 'NL', 'nl', false, true, 180),
  ('gdelt-fr', 'News monitoring · France', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28%22r%C3%A9seau%20de%20chaleur%22%20OR%20%22r%C3%A9seaux%20de%20chaleur%22%20OR%20%22r%C3%A9seau%20de%20froid%22%20OR%20%22chauffage%20urbain%22%29%20sourcecountry%3Afrance', 'https://www.gdeltproject.org/', 'FR', 'fr', false, true, 180),
  ('gdelt-pl', 'News monitoring · Poland', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28ciep%C5%82ownictwo%20OR%20ciep%C5%82ownia%20OR%20%22ciep%C5%82o%20systemowe%22%20OR%20%22sie%C4%87%20ciep%C5%82ownicza%22%29%20sourcecountry%3Apoland', 'https://www.gdeltproject.org/', 'PL', 'pl', false, true, 180),
  ('gdelt-gb', 'News monitoring · United Kingdom', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28%22heat%20network%22%20OR%20%22heat%20networks%22%20OR%20%22district%20heating%22%29%20sourcecountry%3Aunitedkingdom', 'https://www.gdeltproject.org/', 'GB', 'en', false, true, 180),
  ('gdelt-eu-deals', 'News monitoring · Deals & financing (Europe)', 'gdelt', 'https://api.gdeltproject.org/api/v2/doc/doc?mode=artlist&format=json&maxrecords=75&sort=datedesc&timespan=3d&query=%28%22district%20heating%22%20OR%20%22district%20cooling%22%20OR%20%22heat%20network%22%29%20%28acquisition%20OR%20acquires%20OR%20investment%20OR%20financing%20OR%20stake%20OR%20fund%29%20sourcelang%3Aenglish', 'https://www.gdeltproject.org/', null, 'en', false, true, 180)on conflict (slug) do nothing;

insert into public.news_source (slug, name, kind, url, homepage_url, country_code, language, keyword_filter, active, notes) values
  ('agfw', 'AGFW (German district heating association)', 'scraper', 'https://www.agfw.de/agfw-news', 'https://www.agfw.de', 'DE', 'de', false, false, 'No RSS feed found; needs an HTML scraper.'),
  ('dansk-fjernvarme', 'Dansk Fjernvarme', 'scraper', 'https://www.danskfjernvarme.dk/', 'https://www.danskfjernvarme.dk', 'DK', 'da', false, false, 'Standard WordPress feed URL returns 404; needs an HTML scraper.'),
  ('warmtenetwerk', 'Warmtenetwerk', 'rss', 'https://warmtenetwerk.nl/feed/', 'https://warmtenetwerk.nl', 'NL', 'nl', false, false, 'Feed exists but is empty as of 2026-10-05; re-check before activating.'),
  ('euroheat', 'Euroheat & Power', 'scraper', 'https://www.euroheat.org/news', 'https://www.euroheat.org', null, 'en', false, false, 'robots.txt disallows automated access to its API; link only, or seek a content partnership.')
on conflict (slug) do nothing;
