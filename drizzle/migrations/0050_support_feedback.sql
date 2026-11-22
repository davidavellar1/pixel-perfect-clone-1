-- 0022_support_feedback.sql
-- Support requests and product feedback from signed-in members, with an admin inbox.
-- Applied manually to the live dev DB on 2026-10-05 and registered in drizzle.__drizzle_migrations.

do $$ begin
  create type public.member_message_kind as enum ('support', 'feedback');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.member_message_status as enum ('open', 'answered', 'closed');
exception when duplicate_object then null; end $$;

create table if not exists public.member_message (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind public.member_message_kind not null,
  topic text not null check (char_length(topic) between 1 and 80),
  subject text check (subject is null or char_length(subject) <= 120),
  body text not null check (char_length(btrim(body)) between 1 and 5000),
  rating smallint check (rating is null or (rating between 1 and 5)),
  page_url text check (page_url is null or char_length(page_url) <= 500),
  status public.member_message_status not null default 'open',
  created_at timestamptz not null default now(),
  constraint member_message_rating_feedback_only check (rating is null or kind = 'feedback')
);

create index if not exists member_message_user_idx on public.member_message (user_id, created_at desc);
create index if not exists member_message_status_idx on public.member_message (status, created_at desc);

alter table public.member_message enable row level security;

revoke all on public.member_message from anon, authenticated;
grant select, insert on public.member_message to authenticated;
grant update (status) on public.member_message to authenticated;
grant all on public.member_message to service_role;

drop policy if exists member_message_insert_own on public.member_message;
create policy member_message_insert_own on public.member_message for insert to authenticated
  with check (user_id = auth.uid() and status = 'open');

drop policy if exists member_message_read on public.member_message;
create policy member_message_read on public.member_message for select to authenticated
  using (user_id = auth.uid() or private.has_role(auth.uid(), 'admin'));

drop policy if exists member_message_admin_status on public.member_message;
create policy member_message_admin_status on public.member_message for update to authenticated
  using (private.has_role(auth.uid(), 'admin')) with check (private.has_role(auth.uid(), 'admin'));

-- Notify every admin about a new message.
create or replace function private.notify_admins_member_message()
returns trigger language plpgsql security definer set search_path = public, private as $$
begin
  insert into public.notification (user_id, kind, title, body, link, dedupe_key)
  select ur.user_id,
         'member_message',
         case when new.kind = 'support' then 'New support request' else 'New feedback' end,
         left(coalesce(new.subject, new.topic) || ' — ' || new.body, 200),
         '/app/support',
         'member_message:' || new.id || ':' || ur.user_id
  from public.user_role ur
  where ur.role = 'admin'
  on conflict (dedupe_key) do nothing;
  return new;
end $$;

drop trigger if exists member_message_notify_admins on public.member_message;
create trigger member_message_notify_admins after insert on public.member_message
  for each row execute function private.notify_admins_member_message();

-- Admin inbox with the sender's email (auth.users is not readable from the client).
create or replace function public.member_message_inbox()
returns table (id uuid, kind public.member_message_kind, topic text, subject text, body text, rating smallint,
               status public.member_message_status, created_at timestamptz, sender_email text)
language sql stable security definer set search_path = public, private as $$
  select m.id, m.kind, m.topic, m.subject, m.body, m.rating, m.status, m.created_at, u.email::text
  from public.member_message m
  left join auth.users u on u.id = m.user_id
  where private.has_role(auth.uid(), 'admin')
  order by m.created_at desc
  limit 500;
$$;
revoke all on function public.member_message_inbox() from public, anon;
grant execute on function public.member_message_inbox() to authenticated;
