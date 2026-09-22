create table if not exists public.cron_token (
  id smallint primary key default 1,
  token text not null,
  created_at timestamp with time zone not null default now(),
  constraint cron_token_single_row check (id = 1)
);

alter table public.cron_token enable row level security;

revoke all on public.cron_token from anon, authenticated;
grant all on public.cron_token to service_role;

insert into public.cron_token (id, token)
values (1, encode(gen_random_bytes(32), 'hex'))
on conflict (id) do nothing;