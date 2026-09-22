create table public.technology_card (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project(id) on delete cascade,
  title text not null,
  description text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.energy_mix_item (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project(id) on delete cascade,
  source text not null,
  share_pct numeric,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.operating_parameter (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.project(id) on delete cascade,
  parameter text not null,
  value text,
  benchmark text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index technology_card_project_idx on public.technology_card(project_id);
create index energy_mix_item_project_idx on public.energy_mix_item(project_id);
create index operating_parameter_project_idx on public.operating_parameter(project_id);

grant select on public.technology_card to anon;
grant select, insert, update, delete on public.technology_card to authenticated;
grant all on public.technology_card to service_role;

grant select on public.energy_mix_item to anon;
grant select, insert, update, delete on public.energy_mix_item to authenticated;
grant all on public.energy_mix_item to service_role;

grant select on public.operating_parameter to anon;
grant select, insert, update, delete on public.operating_parameter to authenticated;
grant all on public.operating_parameter to service_role;

alter table public.technology_card enable row level security;
alter table public.energy_mix_item enable row level security;
alter table public.operating_parameter enable row level security;

create policy technology_card_public_read on public.technology_card
  for select using (private.project_is_listed(project_id));
create policy technology_card_owner_all on public.technology_card
  for all using (private.owns_project(auth.uid(), project_id))
  with check (private.owns_project(auth.uid(), project_id));

create policy energy_mix_item_public_read on public.energy_mix_item
  for select using (private.project_is_listed(project_id));
create policy energy_mix_item_owner_all on public.energy_mix_item
  for all using (private.owns_project(auth.uid(), project_id))
  with check (private.owns_project(auth.uid(), project_id));

create policy operating_parameter_public_read on public.operating_parameter
  for select using (private.project_is_listed(project_id));
create policy operating_parameter_owner_all on public.operating_parameter
  for all using (private.owns_project(auth.uid(), project_id))
  with check (private.owns_project(auth.uid(), project_id));

create trigger technology_card_set_updated_at before update on public.technology_card
  for each row execute function public.set_updated_at();
create trigger energy_mix_item_set_updated_at before update on public.energy_mix_item
  for each row execute function public.set_updated_at();
create trigger operating_parameter_set_updated_at before update on public.operating_parameter
  for each row execute function public.set_updated_at();