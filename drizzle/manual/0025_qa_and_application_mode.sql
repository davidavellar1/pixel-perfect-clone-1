-- 0025: Project Q&A that actually stores and answers questions, and an
-- application mode for funding programmes ("apply any time" vs call-based).
-- Applied directly to the Lovable database on 2026-10-09 and registered in
-- drizzle.__drizzle_migrations (see README.md in this folder).

-- ─── Q&A ────────────────────────────────────────────────────────────────

alter table public.question
  add column if not exists answer_body text,
  add column if not exists answered_at timestamptz,
  add column if not exists answered_by uuid references auth.users (id) on delete set null,
  alter column is_public set default false;

alter table public.question
  drop constraint if exists question_body_length,
  add constraint question_body_length check (char_length(btrim(body)) between 5 and 1000),
  drop constraint if exists question_answer_length,
  add constraint question_answer_length check (answer_body is null or char_length(btrim(answer_body)) between 2 and 3000);

create index if not exists question_project_created_idx on public.question (project_id, created_at desc);

-- Investors whose access request the developer has accepted.
create or replace function private.has_project_access(_user_id uuid, _project_id uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select _user_id is not null and exists (
    select 1 from public.access_request r
    where r.project_id = _project_id
      and r.investor_user_id = _user_id
      and r.state in ('granted', 'granted_full'))
$$;

drop policy if exists question_read on public.question;
create policy question_read on public.question for select using (
  author_id = auth.uid()
  or private.owns_project(auth.uid(), project_id)
  or (is_public and answer_body is not null
      and private.project_is_listed(project_id)
      and private.has_project_access(auth.uid(), project_id))
);

drop policy if exists question_insert_own on public.question;
create policy question_insert_own on public.question for insert with check (
  author_id = auth.uid()
  and answer_body is null and answered_at is null and answered_by is null and is_public = false
  and private.has_project_access(auth.uid(), project_id)
);

-- Authors may withdraw a question only while it is unanswered; owners may remove any.
drop policy if exists question_delete_own on public.question;
create policy question_delete_own on public.question for delete using (
  (author_id = auth.uid() and answer_body is null)
  or private.owns_project(auth.uid(), project_id)
);

-- Answers go through this function only (no UPDATE policy on the table).
create or replace function public.answer_question(_question_id uuid, _answer text, _publish boolean default true)
returns void language plpgsql security definer set search_path to 'public' as $$
declare q public.question;
begin
  select * into q from public.question where id = _question_id;
  if q.id is null or not private.owns_project(auth.uid(), q.project_id) then
    raise exception 'Only the project developer can answer this question' using errcode = '42501';
  end if;
  update public.question
     set answer_body = nullif(btrim(_answer), ''),
         answered_at = case when nullif(btrim(_answer), '') is null then null else now() end,
         answered_by = case when nullif(btrim(_answer), '') is null then null else auth.uid() end,
         is_public = coalesce(_publish, true) and nullif(btrim(_answer), '') is not null
   where id = _question_id;
end $$;
revoke all on function public.answer_question(uuid, text, boolean) from public, anon;
grant execute on function public.answer_question(uuid, text, boolean) to authenticated;

create or replace function public.notify_question_event()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare owner_id uuid; project_title text; project_slug text;
begin
  select dp.user_id, p.title, p.slug into owner_id, project_title, project_slug
  from public.project p join public.developer_profiles dp on dp.id = p.developer_id
  where p.id = new.project_id;

  if tg_op = 'INSERT' then
    if owner_id is not null and owner_id <> new.author_id then
      insert into public.notification (user_id, kind, title, body, link, project_id, dedupe_key)
      values (owner_id, 'question_received', 'New investor question',
              'An investor asked a question about ' || coalesce(project_title, 'your listing') || '. Answer it on the Q&A tab.',
              '/app/projects/' || project_slug || '?tab=qa', new.project_id,
              'question_received:' || new.id::text)
      on conflict (dedupe_key) do nothing;
    end if;
  elsif new.answer_body is not null and old.answer_body is null then
    insert into public.notification (user_id, kind, title, body, link, project_id, dedupe_key)
    values (new.author_id, 'question_answered', 'Your question was answered',
            'The developer of ' || coalesce(project_title, 'a listing') || ' answered your question.',
            '/app/projects/' || project_slug || '?tab=qa', new.project_id,
            'question_answered:' || new.id::text)
    on conflict (dedupe_key) do nothing;
  end if;
  return new;
end $$;

drop trigger if exists question_notify on public.question;
create trigger question_notify after insert or update of answer_body on public.question
  for each row execute function public.notify_question_event();

-- ─── Funding: application mode ──────────────────────────────────────────

alter table public.funding_programme
  add column if not exists application_mode text
  check (application_mode in ('standing', 'calls', 'national_calls'));

comment on column public.funding_programme.application_mode is
  'standing = apply any time while active (no call windows); calls = only in published call windows; national_calls = EU money awarded through member-state calls; null = not yet established';

-- Verified on the official pages on 2026-10-09 (no call windows or cut-off dates stated).
update public.funding_programme set application_mode = 'standing' where slug in (
  'de-bew', 'de-kfw-270', 'de-kfw-572-geothermie', 'de-hh-ifb-waermenetzanschluss',
  'de-nw-progres-waerme-kaeltenetze', 'de-kwkg-waerme-kaeltenetze', 'de-kwkg-waerme-kaeltespeicher',
  'de-sh-buergschaft-waermenetze', 'eu-elena', 'eu-eib-energy-lending');
update public.funding_programme set application_mode = 'calls'
  where slug in ('eu-horizon-europe-cl5', 'eu-life-cet');
update public.funding_programme set application_mode = 'national_calls'
  where slug in ('eu-cohesion-erdf-cf', 'eu-just-transition-fund', 'eu-social-climate-fund', 'eu-modernisation-fund');
-- Left null for the funding agent: de-by-biowaerme-bayern, de-he-efre-effiziente-waermenetze,
-- de-sh-lpw-waermeversorgungssysteme (guideline term stated as ending 30.06.2024 – needs re-verification).

-- The funding agent's upsert now tracks and writes application_mode.
CREATE OR REPLACE FUNCTION private.funding_upsert_programme(p jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
DECLARE
  old_row public.funding_programme;
  new_row public.funding_programme;
  d jsonb := '{}';
  k text;
  tracked text[] := ARRAY['name','name_en','administering_body','level','country_codes','regions','instrument_types','applicant_types','technologies','stages','project_types','max_aid_pct','min_amount_eur','max_amount_eur','budget_eur','budget_note','state_aid_basis','cumulation','key_conditions','summary','official_url','status','confidence','application_mode'];
  arr text[] := ARRAY['country_codes','regions','instrument_types','applicant_types','technologies','stages','project_types','key_conditions','source_urls'];
  j jsonb;
BEGIN
  IF p->>'slug' IS NULL THEN RAISE EXCEPTION 'slug required'; END IF;
  j := p;
  SELECT * INTO old_row FROM public.funding_programme WHERE slug = j->>'slug';
  IF old_row.id IS NULL THEN
    FOREACH k IN ARRAY arr LOOP
      IF j->k IS NULL OR jsonb_typeof(j->k) <> 'array' THEN j := j || jsonb_build_object(k, '[]'::jsonb); END IF;
    END LOOP;
  END IF;
  new_row := jsonb_populate_record(old_row, j);
  new_row.last_verified_at := now();
  new_row.verified_by := COALESCE(j->>'verified_by', 'agent');
  IF old_row.id IS NULL THEN
    new_row.id := gen_random_uuid(); new_row.created_at := now(); new_row.updated_at := now();
    new_row.status := COALESCE(new_row.status, 'active');
    new_row.confidence := COALESCE(new_row.confidence, 'high');
    new_row.language := COALESCE(new_row.language, 'en');
    INSERT INTO public.funding_programme SELECT new_row.*;
    INSERT INTO public.funding_change_log (entity, entity_id, entity_slug, change, diff, source_url)
      VALUES ('programme', new_row.id, new_row.slug, 'new', '{}', new_row.official_url);
    RETURN 'new:' || new_row.slug;
  END IF;
  FOREACH k IN ARRAY tracked LOOP
    IF (to_jsonb(old_row)->k) IS DISTINCT FROM (to_jsonb(new_row)->k) THEN
      d := d || jsonb_build_object(k, jsonb_build_object('old', to_jsonb(old_row)->k, 'new', to_jsonb(new_row)->k));
    END IF;
  END LOOP;
  UPDATE public.funding_programme SET
    name = new_row.name, name_en = new_row.name_en, administering_body = new_row.administering_body, level = new_row.level,
    country_codes = new_row.country_codes, regions = new_row.regions, instrument_types = new_row.instrument_types,
    applicant_types = new_row.applicant_types, technologies = new_row.technologies, stages = new_row.stages,
    project_types = new_row.project_types, max_aid_pct = new_row.max_aid_pct, min_amount_eur = new_row.min_amount_eur,
    max_amount_eur = new_row.max_amount_eur, budget_eur = new_row.budget_eur, budget_note = new_row.budget_note,
    state_aid_basis = new_row.state_aid_basis, cumulation = new_row.cumulation, key_conditions = new_row.key_conditions,
    summary = new_row.summary, language = new_row.language, official_url = new_row.official_url, source_urls = new_row.source_urls,
    status = new_row.status, confidence = new_row.confidence, application_mode = new_row.application_mode,
    last_verified_at = now(), verified_by = new_row.verified_by
  WHERE id = old_row.id;
  INSERT INTO public.funding_change_log (entity, entity_id, entity_slug, change, diff, source_url)
    VALUES ('programme', old_row.id, old_row.slug,
            CASE WHEN d ? 'status' AND new_row.status = 'discontinued' THEN 'discontinued'
                 WHEN d ? 'status' AND new_row.status = 'closed' THEN 'closed'
                 WHEN d = '{}' THEN 'reverified' ELSE 'updated' END,
            d, new_row.official_url);
  RETURN (CASE WHEN d = '{}' THEN 'reverified:' ELSE 'updated:' END) || old_row.slug;
END $function$;
