-- 0026: Developer company profile.
-- Developers maintain one company profile (organization) with a track record.
-- Investors see an anonymous sponsor summary on every listing, and the full
-- profile only once the developer has accepted their access request.
-- Applied directly to the Lovable database on 2026-10-09 and registered in
-- drizzle.__drizzle_migrations (see README.md in this folder).

alter table public.organization
  add column if not exists description text,
  add column if not exists website text,
  add column if not exists registry_number text,
  add column if not exists ownership text,
  add column if not exists employees_band text,
  add column if not exists countries_of_operation text[] not null default '{}';

alter table public.organization
  drop constraint if exists organization_description_len,
  add constraint organization_description_len check (description is null or char_length(description) <= 1500),
  drop constraint if exists organization_ownership_len,
  add constraint organization_ownership_len check (ownership is null or char_length(ownership) <= 300),
  drop constraint if exists organization_website_https,
  add constraint organization_website_https check (website is null or website ~* '^https?://'),
  drop constraint if exists organization_employees_band,
  add constraint organization_employees_band check (employees_band is null or employees_band in ('1-10', '11-50', '51-200', '201-1000', '1000+'));

create table if not exists public.organization_track_record (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization (id) on delete cascade,
  project_name text not null check (char_length(btrim(project_name)) between 2 and 160),
  country_code char(2) not null,
  technology text,
  capacity_mw numeric check (capacity_mw is null or capacity_mw > 0),
  cod_year smallint check (cod_year is null or cod_year between 1950 and 2100),
  role text not null check (role in ('owner', 'developer', 'operator', 'epc', 'co_investor')),
  status text not null default 'operational' check (status in ('operational', 'construction', 'development')),
  notes text check (notes is null or char_length(notes) <= 300),
  verified boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists organization_track_record_org_idx on public.organization_track_record (organization_id, sort_order);
alter table public.organization_track_record enable row level security;

-- Member of a company = has a developer profile linked to it.
create or replace function private.is_org_member(_user_id uuid, _org_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select _user_id is not null and exists (
    select 1 from public.developer_profiles d where d.user_id = _user_id and d.organization_id = _org_id)
$$;

-- Company records are no longer readable by everyone: members and admins only.
-- Investors reach company data through the two access-aware functions below.
drop policy if exists organization_read on public.organization;
create policy organization_read on public.organization for select using (
  private.is_org_member(auth.uid(), id) or private.has_role(auth.uid(), 'admin'::app_role)
);

drop policy if exists track_record_member_read on public.organization_track_record;
create policy track_record_member_read on public.organization_track_record for select using (
  private.is_org_member(auth.uid(), organization_id) or private.has_role(auth.uid(), 'admin'::app_role)
);
drop policy if exists track_record_member_write on public.organization_track_record;
create policy track_record_member_write on public.organization_track_record for all using (
  private.is_org_member(auth.uid(), organization_id) or private.has_role(auth.uid(), 'admin'::app_role)
) with check (
  private.is_org_member(auth.uid(), organization_id) or private.has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins verify. Any change by a member to a verified entry clears the badge.
create or replace function private.track_record_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  new.updated_at := now();
  if private.has_role(auth.uid(), 'admin'::app_role) then return new; end if;
  if tg_op = 'INSERT' then
    new.verified := false;
  elsif (new.project_name, new.country_code, new.technology, new.capacity_mw, new.cod_year, new.role, new.status, new.notes)
        is distinct from (old.project_name, old.country_code, old.technology, old.capacity_mw, old.cod_year, old.role, old.status, old.notes)
        or new.organization_id is distinct from old.organization_id then
    new.verified := false;
  else
    new.verified := old.verified;
  end if;
  return new;
end $$;
drop trigger if exists track_record_guard on public.organization_track_record;
create trigger track_record_guard before insert or update on public.organization_track_record
  for each row execute function private.track_record_guard();

-- Create or update the caller's company. Never touches `verified`.
create or replace function public.save_my_organization(p jsonb)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare dp public.developer_profiles; org_id uuid;
begin
  select * into dp from public.developer_profiles where user_id = auth.uid();
  if dp.id is null then
    raise exception 'A developer account is required' using errcode = '42501';
  end if;
  if coalesce(btrim(p->>'name'), '') = '' then
    raise exception 'Company name is required' using errcode = '22023';
  end if;
  org_id := dp.organization_id;
  if org_id is null then
    insert into public.organization (name, org_type, country_code, verified)
    values (btrim(p->>'name'), coalesce(nullif(p->>'org_type', ''), dp.developer_type::text, 'other'), upper(nullif(p->>'country_code', '')), false)
    returning id into org_id;
    update public.developer_profiles set organization_id = org_id, updated_at = now() where id = dp.id;
  end if;
  update public.organization set
    name = btrim(p->>'name'),
    org_type = coalesce(nullif(p->>'org_type', ''), org_type),
    country_code = upper(nullif(p->>'country_code', '')),
    hq_city = nullif(btrim(p->>'hq_city'), ''),
    founded_year = nullif(p->>'founded_year', '')::smallint,
    description = nullif(btrim(p->>'description'), ''),
    website = nullif(btrim(p->>'website'), ''),
    registry_number = nullif(btrim(p->>'registry_number'), ''),
    ownership = nullif(btrim(p->>'ownership'), ''),
    employees_band = nullif(p->>'employees_band', ''),
    countries_of_operation = coalesce(array(select upper(jsonb_array_elements_text(p->'countries_of_operation'))), '{}'),
    updated_at = now()
  where id = org_id;
  return org_id;
end $$;
revoke all on function public.save_my_organization(jsonb) from public, anon;
grant execute on function public.save_my_organization(jsonb) to authenticated;

-- Anonymous sponsor summary for any listed project: no name, city, website or founding year.
create or replace function public.project_sponsor_summary(_project_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when not (private.project_is_listed(_project_id) or private.owns_project(auth.uid(), _project_id)) then null else (
    select jsonb_build_object(
      'has_profile', o.id is not null,
      'org_type', coalesce(o.org_type, d.developer_type::text),
      'country_code', o.country_code,
      'countries_count', coalesce(cardinality(o.countries_of_operation), 0),
      'verified', coalesce(o.verified, false),
      'delivered_count', (select count(*) from public.organization_track_record t where t.organization_id = o.id and t.status = 'operational'),
      'delivered_verified_count', (select count(*) from public.organization_track_record t where t.organization_id = o.id and t.status = 'operational' and t.verified),
      'delivered_capacity_mw', (select sum(t.capacity_mw) from public.organization_track_record t where t.organization_id = o.id and t.status = 'operational'),
      'pipeline_count', (select count(*) from public.organization_track_record t where t.organization_id = o.id and t.status <> 'operational'),
      'member_since', extract(year from d.created_at)::int)
    from public.project p
    join public.developer_profiles d on d.id = p.developer_id
    left join public.organization o on o.id = d.organization_id
    where p.id = _project_id) end
$$;
grant execute on function public.project_sponsor_summary(uuid) to anon, authenticated;

-- Full profile: only the owner, investors with accepted access, and admins.
create or replace function public.project_developer_profile(_project_id uuid)
returns jsonb language sql stable security definer set search_path to 'public' as $$
  select case when not (
      private.owns_project(auth.uid(), _project_id)
      or private.has_project_access(auth.uid(), _project_id)
      or private.has_role(auth.uid(), 'admin'::app_role)) then null else (
    select jsonb_build_object(
      'organization', case when o.id is null then null else jsonb_build_object(
        'name', o.name, 'org_type', o.org_type, 'country_code', o.country_code, 'hq_city', o.hq_city,
        'founded_year', o.founded_year, 'description', o.description, 'website', o.website,
        'registry_number', o.registry_number, 'ownership', o.ownership, 'employees_band', o.employees_band,
        'countries_of_operation', o.countries_of_operation, 'verified', o.verified, 'updated_at', o.updated_at) end,
      'developer_type', d.developer_type,
      'member_since', extract(year from d.created_at)::int,
      'track_record', coalesce((select jsonb_agg(jsonb_build_object(
          'project_name', t.project_name, 'country_code', t.country_code, 'technology', t.technology,
          'capacity_mw', t.capacity_mw, 'cod_year', t.cod_year, 'role', t.role, 'status', t.status,
          'notes', t.notes, 'verified', t.verified) order by t.sort_order, t.cod_year desc nulls last)
        from public.organization_track_record t where t.organization_id = o.id), '[]'::jsonb),
      'other_listings', coalesce((select jsonb_agg(jsonb_build_object(
          -- Each listing keeps its own anonymity: the title shows only where this viewer has access too.
          'slug', x.slug,
          'title', case when private.owns_project(auth.uid(), x.id) or private.has_project_access(auth.uid(), x.id) then x.title end,
          'country_code', x.country_code, 'technology', x.technology,
          'capacity_mw', case when private.owns_project(auth.uid(), x.id) or private.has_project_access(auth.uid(), x.id) then x.capacity_mw end,
          'stage', x.lifecycle_stage) order by x.created_at desc)
        from public.project x where x.developer_id = p.developer_id and x.id <> p.id and x.visibility = 'listed'), '[]'::jsonb))
    from public.project p
    join public.developer_profiles d on d.id = p.developer_id
    left join public.organization o on o.id = d.organization_id
    where p.id = _project_id) end
$$;
revoke all on function public.project_developer_profile(uuid) from public, anon;
grant execute on function public.project_developer_profile(uuid) to authenticated;
