create table if not exists public.notification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  project_id uuid references public.project(id) on delete cascade,
  access_request_id uuid references public.access_request(id) on delete cascade,
  dedupe_key text,
  email_status text not null default 'pending',
  read_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create unique index if not exists notification_dedupe_key_idx on public.notification (dedupe_key) where dedupe_key is not null;
create index if not exists notification_user_created_idx on public.notification (user_id, created_at desc);

grant select, update on public.notification to authenticated;
grant all on public.notification to service_role;

alter table public.notification enable row level security;

drop policy if exists notification_read_own on public.notification;
create policy notification_read_own on public.notification
  for select to authenticated using (user_id = auth.uid());

drop policy if exists notification_update_own on public.notification;
create policy notification_update_own on public.notification
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.project_owner_user_id(_project_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select dp.user_id
  from public.project p
  join public.developer_profiles dp on dp.id = p.developer_id
  where p.id = _project_id
$$;

revoke all on function public.project_owner_user_id(uuid) from public, anon;

create or replace function public.notify_access_request_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  project_title text;
begin
  select dp.user_id, p.title into owner_id, project_title
  from public.project p
  join public.developer_profiles dp on dp.id = p.developer_id
  where p.id = new.project_id;

  if tg_op = 'INSERT' then
    if owner_id is not null then
      insert into public.notification (user_id, kind, title, body, link, project_id, access_request_id, dedupe_key)
      values (
        owner_id,
        'access_request_received',
        'New access request',
        'An investor requested access to ' || coalesce(project_title, 'your listing') || '. Review and decide on the access requests screen.',
        '/app/access-requests?request=' || new.id::text,
        new.project_id,
        new.id,
        'access_request_received:' || new.id::text
      )
      on conflict (dedupe_key) do nothing;
    end if;
    return new;
  end if;

  if new.state is distinct from old.state then
    insert into public.notification (user_id, kind, title, body, link, project_id, access_request_id, dedupe_key)
    values (
      new.investor_user_id,
      'access_request_' || new.state::text,
      case new.state::text
        when 'granted' then 'Access granted'
        when 'granted_full' then 'Data room access granted'
        when 'declined' then 'Access request declined'
        when 'withdrawn' then 'Access request withdrawn'
        when 'lapsed' then 'Access request lapsed'
        else 'Access request updated'
      end,
      coalesce(project_title, 'A listing') || ': your access request is now ' || replace(new.state::text, '_', ' ') || '.',
      '/app/projects/' || (select slug from public.project where id = new.project_id),
      new.project_id,
      new.id,
      'access_request_state:' || new.id::text || ':' || new.state::text
    )
    on conflict (dedupe_key) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.notify_access_request_event() from public, anon;

drop trigger if exists access_request_notify_insert on public.access_request;
create trigger access_request_notify_insert
  after insert on public.access_request
  for each row execute function public.notify_access_request_event();

drop trigger if exists access_request_notify_update on public.access_request;
create trigger access_request_notify_update
  after update on public.access_request
  for each row execute function public.notify_access_request_event();