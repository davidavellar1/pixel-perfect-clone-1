-- 0021_news_fetch_via_db.sql
-- GDELT rate-limits the shared hosting IPs (HTTP 429), so GDELT sources are fetched from the
-- database with pg_net instead: one pg_cron job per source, staggered one minute apart.
-- The ingest hook (service role) claims the stored responses via news_claim_fetched().
-- Applied manually to the live dev DB on 2026-10-05 and registered in drizzle.__drizzle_migrations.

create table if not exists public.news_fetch (
  request_id bigint primary key,
  source_id uuid not null references public.news_source(id) on delete cascade,
  requested_at timestamptz not null default now()
);
create index if not exists news_fetch_source_idx on public.news_fetch (source_id);
alter table public.news_fetch enable row level security;
revoke all on public.news_fetch from anon, authenticated;
grant all on public.news_fetch to service_role;

-- Queue an HTTP GET for one source if it is active and due (or has no fetch pending).
create or replace function private.queue_news_fetch(p_slug text)
returns bigint
language plpgsql security definer set search_path = public, private, net as $$
declare s public.news_source; rid bigint;
begin
  select * into s from public.news_source where slug = p_slug and active;
  if not found then return null; end if;
  if s.last_polled_at is not null and s.last_polled_at > now() - make_interval(mins => s.poll_interval_minutes) then
    return null;
  end if;
  if exists (select 1 from public.news_fetch f where f.source_id = s.id and f.requested_at > now() - interval '2 hours') then
    return null;
  end if;
  rid := net.http_get(url := s.url, timeout_milliseconds := 30000);
  insert into public.news_fetch (request_id, source_id) values (rid, s.id);
  return rid;
end $$;
revoke all on function private.queue_news_fetch(text) from public, anon, authenticated;

-- Return completed responses and remove them from the queue. Service role only.
create or replace function public.news_claim_fetched()
returns table (source_id uuid, status_code integer, body text, error_msg text)
language plpgsql security definer set search_path = public, net as $$
begin
  return query
  with done as (
    delete from public.news_fetch f
    using net._http_response r
    where r.id = f.request_id
    returning f.source_id, r.status_code, r.content, r.error_msg
  )
  select d.source_id, d.status_code, d.content, d.error_msg from done d;
  -- Drop requests that never completed (pg_net keeps responses for 6 hours).
  delete from public.news_fetch where requested_at < now() - interval '6 hours';
end $$;
revoke all on function public.news_claim_fetched() from public, anon, authenticated;
grant execute on function public.news_claim_fetched() to service_role;

-- One staggered job per GDELT source (minutes 1-11); the ingest hook runs at minute 23.
do $$
declare r record; m int := 1;
begin
  for r in select slug from public.news_source where kind = 'gdelt' order by slug loop
    perform cron.schedule('dhc-news-fetch-' || r.slug, m || ' * * * *', format('select private.queue_news_fetch(%L);', r.slug));
    m := m + 1;
  end loop;
end $$;
