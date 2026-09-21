-- 1. Enum types (developer_type, investor_type, investment_range already exist)
create type public.app_role as enum ('admin','developer','investor','advisor');
create type public.lifecycle_stage as enum ('concept','pre_feasibility','feasibility','development','ready_to_build','due_diligence','construction','commissioning','operational');
create type public.project_type as enum ('greenfield','brownfield','expansion','modernisation');
create type public.technology as enum ('geothermal','biomass_chp','waste_heat_recovery','solar_thermal','large_heat_pump','river_water_cooling','seawater_cooling','thermal_storage','hybrid');
create type public.project_visibility as enum ('draft','listed','archived');
create type public.milestone_status as enum ('completed','in_progress','upcoming');
create type public.document_access as enum ('public','gated');
create type public.request_status as enum ('requested','approved','denied','withdrawn');
create type public.risk_severity as enum ('low','medium','high');

-- shared updated_at function
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- 2. Organization
create table public.organization (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type text not null,
  country_code char(2),
  hq_city text,
  founded_year smallint,
  total_capacity_mw numeric(12,2),
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.organization to authenticated;
grant select on public.organization to anon;
grant all on public.organization to service_role;
alter table public.organization enable row level security;
create policy organization_read on public.organization for select to anon, authenticated using (true);
create trigger organization_updated_at before update on public.organization
  for each row execute function public.set_updated_at();

alter table public.developer_profiles add column if not exists organization_id uuid references public.organization(id) on delete set null;

-- 3. Roles
create table public.user_role (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_role to authenticated;
grant all on public.user_role to service_role;
alter table public.user_role enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_role where user_id = _user_id and role = _role)
$$;

create policy user_role_read_own on public.user_role for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy user_role_admin_write on public.user_role for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create policy organization_admin_write on public.organization for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- 4. Project
create table public.project (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  developer_id uuid not null references public.developer_profiles(id) on delete cascade,
  title text not null,
  summary text,
  description text,
  country_code char(2) not null,
  city text not null,
  latitude numeric(9,6),
  longitude numeric(9,6),
  lifecycle_stage lifecycle_stage not null,
  project_type project_type not null,
  technology technology not null,
  capacity_mw numeric(10,2) not null check (capacity_mw > 0),
  network_length_km numeric(10,2) check (network_length_km >= 0),
  households_served integer check (households_served >= 0),
  timeline_start date,
  timeline_end date,
  visibility project_visibility not null default 'draft',
  verified boolean not null default false,
  headline_irr_pct numeric(5,2),
  headline_investment numeric(14,2),
  headline_co2_tonnes numeric(12,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_timeline_valid check (timeline_end is null or timeline_start is null or timeline_end >= timeline_start)
);
grant select, insert, update, delete on public.project to authenticated;
grant select on public.project to anon;
grant all on public.project to service_role;
alter table public.project enable row level security;

create or replace function public.owns_project(_user_id uuid, _project_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.project p
    join public.developer_profiles d on d.id = p.developer_id
    where p.id = _project_id and d.user_id = _user_id)
$$;

create or replace function public.project_is_listed(_project_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.project p where p.id = _project_id and p.visibility = 'listed')
$$;

create policy project_read_listed on public.project for select to anon, authenticated
  using (visibility = 'listed');
create policy project_read_own on public.project for select to authenticated
  using (exists (select 1 from public.developer_profiles d where d.id = developer_id and d.user_id = auth.uid()));
create policy project_write_own on public.project for all to authenticated
  using (exists (select 1 from public.developer_profiles d where d.id = developer_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.developer_profiles d where d.id = developer_id and d.user_id = auth.uid()));
create trigger project_updated_at before update on public.project
  for each row execute function public.set_updated_at();

-- 5. Milestone
create table public.milestone (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project(id) on delete cascade,
  label text not null,
  target_date date,
  status milestone_status not null default 'upcoming',
  description text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  unique (project_id, sort_order)
);
grant select, insert, update, delete on public.milestone to authenticated;
grant select on public.milestone to anon;
grant all on public.milestone to service_role;
alter table public.milestone enable row level security;
create policy milestone_read on public.milestone for select to anon, authenticated
  using (public.project_is_listed(project_id));
create policy milestone_owner_all on public.milestone for all to authenticated
  using (public.owns_project(auth.uid(), project_id)) with check (public.owns_project(auth.uid(), project_id));

-- 6. Financial summary and children
create table public.financial_summary (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.project(id) on delete cascade,
  currency char(3) not null default 'EUR',
  capex numeric(14,2),
  npv numeric(14,2),
  target_irr_pct numeric(5,2),
  unleveraged_irr_pct numeric(5,2),
  payback_years numeric(4,1),
  equity_required numeric(14,2),
  min_ticket numeric(14,2),
  concession_term_years smallint,
  first_revenue_year smallint,
  funding_progress_pct numeric(5,2) check (funding_progress_pct between 0 and 100),
  funding_remaining numeric(14,2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.financial_summary to authenticated;
grant select on public.financial_summary to anon;
grant all on public.financial_summary to service_role;
alter table public.financial_summary enable row level security;
create policy financial_read on public.financial_summary for select to anon, authenticated
  using (public.project_is_listed(project_id));
create policy financial_owner_all on public.financial_summary for all to authenticated
  using (public.owns_project(auth.uid(), project_id)) with check (public.owns_project(auth.uid(), project_id));
create trigger financial_summary_updated_at before update on public.financial_summary
  for each row execute function public.set_updated_at();

create or replace function public.owns_financial_summary(_user_id uuid, _fs_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.financial_summary f
    join public.project p on p.id = f.project_id
    join public.developer_profiles d on d.id = p.developer_id
    where f.id = _fs_id and d.user_id = _user_id)
$$;

create or replace function public.financial_summary_is_listed(_fs_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.financial_summary f
    join public.project p on p.id = f.project_id
    where f.id = _fs_id and p.visibility = 'listed')
$$;

create table public.capital_stack_item (
  id uuid primary key default gen_random_uuid(),
  financial_summary_id uuid not null references public.financial_summary(id) on delete cascade,
  label text not null,
  share_pct numeric(5,2) check (share_pct between 0 and 100),
  amount numeric(14,2),
  provider text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.capital_stack_item to authenticated;
grant select on public.capital_stack_item to anon;
grant all on public.capital_stack_item to service_role;
alter table public.capital_stack_item enable row level security;
create policy capital_stack_read on public.capital_stack_item for select to anon, authenticated
  using (public.financial_summary_is_listed(financial_summary_id));
create policy capital_stack_owner_all on public.capital_stack_item for all to authenticated
  using (public.owns_financial_summary(auth.uid(), financial_summary_id))
  with check (public.owns_financial_summary(auth.uid(), financial_summary_id));

create table public.revenue_stream (
  id uuid primary key default gen_random_uuid(),
  financial_summary_id uuid not null references public.financial_summary(id) on delete cascade,
  stream text not null,
  structure text,
  pct_of_revenue numeric(5,2),
  counterparty text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.revenue_stream to authenticated;
grant select on public.revenue_stream to anon;
grant all on public.revenue_stream to service_role;
alter table public.revenue_stream enable row level security;
create policy revenue_stream_read on public.revenue_stream for select to anon, authenticated
  using (public.financial_summary_is_listed(financial_summary_id));
create policy revenue_stream_owner_all on public.revenue_stream for all to authenticated
  using (public.owns_financial_summary(auth.uid(), financial_summary_id))
  with check (public.owns_financial_summary(auth.uid(), financial_summary_id));

create table public.public_funding (
  id uuid primary key default gen_random_uuid(),
  financial_summary_id uuid not null references public.financial_summary(id) on delete cascade,
  source text not null,
  programme text,
  amount numeric(14,2),
  status text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.public_funding to authenticated;
grant select on public.public_funding to anon;
grant all on public.public_funding to service_role;
alter table public.public_funding enable row level security;
create policy public_funding_read on public.public_funding for select to anon, authenticated
  using (public.financial_summary_is_listed(financial_summary_id));
create policy public_funding_owner_all on public.public_funding for all to authenticated
  using (public.owns_financial_summary(auth.uid(), financial_summary_id))
  with check (public.owns_financial_summary(auth.uid(), financial_summary_id));

-- 7. Sustainability
create table public.sustainability_profile (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.project(id) on delete cascade,
  co2_tonnes_per_year numeric(12,2),
  lifetime_reduction_tonnes numeric(14,2),
  equivalent_cars integer,
  renewable_share_pct numeric(5,2),
  eu_taxonomy_objective text,
  eu_taxonomy_aligned boolean,
  sfdr_article smallint check (sfdr_article in (6,8,9)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.sustainability_profile to authenticated;
grant select on public.sustainability_profile to anon;
grant all on public.sustainability_profile to service_role;
alter table public.sustainability_profile enable row level security;
create policy sustainability_read on public.sustainability_profile for select to anon, authenticated
  using (public.project_is_listed(project_id));
create policy sustainability_owner_all on public.sustainability_profile for all to authenticated
  using (public.owns_project(auth.uid(), project_id)) with check (public.owns_project(auth.uid(), project_id));
create trigger sustainability_profile_updated_at before update on public.sustainability_profile
  for each row execute function public.set_updated_at();

create or replace function public.owns_sustainability(_user_id uuid, _sp_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sustainability_profile s
    join public.project p on p.id = s.project_id
    join public.developer_profiles d on d.id = p.developer_id
    where s.id = _sp_id and d.user_id = _user_id)
$$;

create or replace function public.sustainability_is_listed(_sp_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.sustainability_profile s
    join public.project p on p.id = s.project_id
    where s.id = _sp_id and p.visibility = 'listed')
$$;

create table public.sdg_alignment (
  id uuid primary key default gen_random_uuid(),
  sustainability_profile_id uuid not null references public.sustainability_profile(id) on delete cascade,
  sdg_number smallint not null check (sdg_number between 1 and 17),
  title text,
  note text,
  created_at timestamptz not null default now(),
  unique (sustainability_profile_id, sdg_number)
);
grant select, insert, update, delete on public.sdg_alignment to authenticated;
grant select on public.sdg_alignment to anon;
grant all on public.sdg_alignment to service_role;
alter table public.sdg_alignment enable row level security;
create policy sdg_read on public.sdg_alignment for select to anon, authenticated
  using (public.sustainability_is_listed(sustainability_profile_id));
create policy sdg_owner_all on public.sdg_alignment for all to authenticated
  using (public.owns_sustainability(auth.uid(), sustainability_profile_id))
  with check (public.owns_sustainability(auth.uid(), sustainability_profile_id));

-- 8. Risk
create table public.risk (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project(id) on delete cascade,
  category text not null,
  severity risk_severity not null default 'medium',
  description text,
  mitigation text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.risk to authenticated;
grant select on public.risk to anon;
grant all on public.risk to service_role;
alter table public.risk enable row level security;
create policy risk_read on public.risk for select to anon, authenticated
  using (public.project_is_listed(project_id));
create policy risk_owner_all on public.risk for all to authenticated
  using (public.owns_project(auth.uid(), project_id)) with check (public.owns_project(auth.uid(), project_id));

-- 9. Documents
create table public.document (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project(id) on delete cascade,
  name text not null,
  category text,
  file_type text,
  size_bytes bigint,
  page_count integer,
  access_level document_access not null default 'gated',
  storage_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.document to authenticated;
grant all on public.document to service_role;
alter table public.document enable row level security;
create policy document_public_read on public.document for select to authenticated
  using (access_level = 'public' and public.project_is_listed(project_id));
create policy document_owner_all on public.document for all to authenticated
  using (public.owns_project(auth.uid(), project_id)) with check (public.owns_project(auth.uid(), project_id));

create table public.document_access_grant (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.document(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status request_status not null default 'requested',
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (document_id, user_id)
);
grant select, insert, update, delete on public.document_access_grant to authenticated;
grant all on public.document_access_grant to service_role;
alter table public.document_access_grant enable row level security;

create or replace function public.owns_document(_user_id uuid, _document_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.document doc
    join public.project p on p.id = doc.project_id
    join public.developer_profiles d on d.id = p.developer_id
    where doc.id = _document_id and d.user_id = _user_id)
$$;

create policy grant_read_own on public.document_access_grant for select to authenticated
  using (user_id = auth.uid() or public.owns_document(auth.uid(), document_id));
create policy grant_insert_own on public.document_access_grant for insert to authenticated
  with check (user_id = auth.uid());
create policy grant_owner_manage on public.document_access_grant for update to authenticated
  using (public.owns_document(auth.uid(), document_id))
  with check (public.owns_document(auth.uid(), document_id));
create policy grant_delete on public.document_access_grant for delete to authenticated
  using (user_id = auth.uid() or public.owns_document(auth.uid(), document_id));

create policy document_gated_read on public.document for select to authenticated
  using (exists (select 1 from public.document_access_grant g
                 where g.document_id = document.id and g.user_id = auth.uid() and g.status = 'approved'));

-- 10. Access requests
create table public.access_request (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project(id) on delete cascade,
  investor_user_id uuid not null references auth.users(id) on delete cascade,
  status request_status not null default 'requested',
  note text,
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (project_id, investor_user_id)
);
grant select, insert, update, delete on public.access_request to authenticated;
grant all on public.access_request to service_role;
alter table public.access_request enable row level security;
create policy access_request_read on public.access_request for select to authenticated
  using (investor_user_id = auth.uid() or public.owns_project(auth.uid(), project_id));
create policy access_request_insert_own on public.access_request for insert to authenticated
  with check (investor_user_id = auth.uid());
create policy access_request_update on public.access_request for update to authenticated
  using (investor_user_id = auth.uid() or public.owns_project(auth.uid(), project_id))
  with check (investor_user_id = auth.uid() or public.owns_project(auth.uid(), project_id));
create policy access_request_delete_own on public.access_request for delete to authenticated
  using (investor_user_id = auth.uid());

-- 11. Q&A
create table public.question (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(body) between 1 and 1000),
  is_public boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.question to authenticated;
grant all on public.question to service_role;
alter table public.question enable row level security;
create policy question_read on public.question for select to authenticated
  using ((is_public and public.project_is_listed(project_id)) or author_id = auth.uid() or public.owns_project(auth.uid(), project_id));
create policy question_insert_own on public.question for insert to authenticated
  with check (author_id = auth.uid());
create policy question_delete_own on public.question for delete to authenticated
  using (author_id = auth.uid() or public.owns_project(auth.uid(), project_id));

create table public.answer (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.answer to authenticated;
grant all on public.answer to service_role;
alter table public.answer enable row level security;

create or replace function public.can_see_question(_user_id uuid, _question_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.question q
    join public.project p on p.id = q.project_id
    left join public.developer_profiles d on d.id = p.developer_id
    where q.id = _question_id
      and ((q.is_public and p.visibility = 'listed') or q.author_id = _user_id or d.user_id = _user_id))
$$;

create policy answer_read on public.answer for select to authenticated
  using (public.can_see_question(auth.uid(), question_id));
create policy answer_insert_own on public.answer for insert to authenticated
  with check (author_id = auth.uid());
create policy answer_delete_own on public.answer for delete to authenticated
  using (author_id = auth.uid());

-- 12. Watchlist
create table public.watchlist_item (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.project(id) on delete cascade,
  added_at timestamptz not null default now(),
  unique (user_id, project_id)
);
grant select, insert, update, delete on public.watchlist_item to authenticated;
grant all on public.watchlist_item to service_role;
alter table public.watchlist_item enable row level security;
create policy watchlist_own_all on public.watchlist_item for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 13. Indexes
create index project_visibility_stage_idx on public.project (visibility, lifecycle_stage);
create index project_country_idx on public.project (country_code);
create index project_technology_idx on public.project (technology);
create index project_developer_idx on public.project (developer_id);
create index project_capacity_idx on public.project (capacity_mw);
create index milestone_project_idx on public.milestone (project_id, sort_order);
create index document_project_idx on public.document (project_id, access_level);
create index question_project_idx on public.question (project_id, created_at desc);
create index answer_question_idx on public.answer (question_id, created_at);
create index access_request_project_idx on public.access_request (project_id, status);
create index watchlist_user_idx on public.watchlist_item (user_id);
create index project_search_idx on public.project
  using gin (to_tsvector('english', title || ' ' || coalesce(summary,'')));