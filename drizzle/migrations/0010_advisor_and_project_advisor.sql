create type public.advisor_category as enum ('financial', 'legal', 'technical');

create table public.advisor (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  initials text not null,
  category public.advisor_category not null,
  label text not null,
  description text not null,
  tags text[] not null default '{}',
  website text,
  countries text[] not null default '{}',
  verified boolean not null default false,
  active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_advisor (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project(id) on delete cascade,
  advisor_id uuid not null references public.advisor(id) on delete cascade,
  role text,
  disclosed boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, advisor_id)
);

create index project_advisor_project_id_idx on public.project_advisor (project_id);
create index advisor_category_idx on public.advisor (category) where active;

grant select on public.advisor to anon, authenticated;
grant select, insert, update, delete on public.advisor to authenticated;
grant all on public.advisor to service_role;

grant select on public.project_advisor to anon, authenticated;
grant select, insert, update, delete on public.project_advisor to authenticated;
grant all on public.project_advisor to service_role;

alter table public.advisor enable row level security;
alter table public.project_advisor enable row level security;

create policy advisor_public_read on public.advisor
  for select using (active);

create policy advisor_admin_write on public.advisor
  for all to authenticated
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

create policy project_advisor_public_read on public.project_advisor
  for select using (disclosed and private.project_is_listed(project_id));

create policy project_advisor_owner_all on public.project_advisor
  for all to authenticated
  using (private.owns_project(auth.uid(), project_id))
  with check (private.owns_project(auth.uid(), project_id));

create trigger advisor_set_updated_at
  before update on public.advisor
  for each row execute function public.set_updated_at();