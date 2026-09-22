delete from public.notification where dedupe_key is null;

drop index if exists public.notification_dedupe_key_idx;

alter table public.notification
  alter column dedupe_key set not null;

alter table public.notification
  add constraint notification_dedupe_key_unique unique (dedupe_key);