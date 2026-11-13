-- 0023_disclosure_gate_and_signature_evidence
--
-- Applied out of band on 13 Nov 2026 and recorded here so a rebuild from
-- migrations does not lose it. Three things:
--   1. Investor-grade data requires a granted access request.
--   2. The data room is a genuine second gate, keyed on state, not status.
--   3. The confidentiality agreement is reproducible, and what the signatory
--      assented to is recorded rather than implied.

drop policy if exists project_transaction_read on public.project_transaction;
create policy project_transaction_read on public.project_transaction for select to public
  using (private.has_project_access(auth.uid(), project_id) or private.owns_project(auth.uid(), project_id));

drop policy if exists project_case_read on public.project_case;
create policy project_case_read on public.project_case for select to public
  using (private.has_project_access(auth.uid(), project_id) or private.owns_project(auth.uid(), project_id));

drop policy if exists margin_profile_read on public.margin_profile;
create policy margin_profile_read on public.margin_profile for select to public
  using (private.has_project_access(auth.uid(), project_id) or private.owns_project(auth.uid(), project_id));

drop policy if exists construction_package_read on public.construction_package;
create policy construction_package_read on public.construction_package for select to public
  using (private.has_project_access(auth.uid(), project_id) or private.owns_project(auth.uid(), project_id));

drop policy if exists project_process_read on public.project_process;
create policy project_process_read on public.project_process for select to public
  using (private.has_project_access(auth.uid(), project_id) or private.owns_project(auth.uid(), project_id));

drop policy if exists financial_read on public.financial_summary;
create policy financial_read on public.financial_summary for select to public
  using (private.has_project_access(auth.uid(), project_id) or private.owns_project(auth.uid(), project_id));

drop policy if exists sustainability_read on public.sustainability_profile;
create policy sustainability_read on public.sustainability_profile for select to public
  using (private.has_project_access(auth.uid(), project_id) or private.owns_project(auth.uid(), project_id));

drop policy if exists offtake_ladder_read on public.offtake_ladder;
create policy offtake_ladder_read on public.offtake_ladder for select to public
  using (private.has_project_access(auth.uid(), project_id) or private.owns_project(auth.uid(), project_id));

create or replace view public.project_teaser as
select
  p.id,
  p.slug,
  upper(left(replace(p.technology::text, '_', ' '), 1))
    || substr(replace(p.technology::text, '_', ' '), 2)
    || ', ' || replace(p.project_type::text, '_', ' ') as teaser_title,
  p.country_code,
  p.technology,
  p.project_type,
  p.lifecycle_stage,
  case
    when p.capacity_mw < 10 then 'Under 10 MW'
    when p.capacity_mw < 25 then '10-25 MW'
    when p.capacity_mw < 50 then '25-50 MW'
    else '50+ MW'
  end as capacity_band,
  case
    when p.headline_investment is null then null
    when p.headline_investment < 15000000 then 'Under EUR 15M'
    when p.headline_investment < 30000000 then 'EUR 15-30M'
    when p.headline_investment < 50000000 then 'EUR 30-50M'
    else 'EUR 50M+'
  end as capex_band,
  t.instrument,
  case
    when t.min_ticket is null then null
    when t.min_ticket < 1000000 then 'Under EUR 1M'
    when t.min_ticket < 3000000 then 'EUR 1-3M'
    when t.min_ticket < 5000000 then 'EUR 3-5M'
    when t.min_ticket < 10000000 then 'EUR 5-10M'
    else 'EUR 10M and above'
  end as min_ticket_band,
  t.min_ticket as min_ticket_sort,
  case
    when l.project_id is null then null
    else round(coalesce(l.contracted_load_pct, 0) + coalesce(l.signed_connection_load_pct, 0))
  end as offtake_committed_load_pct,
  (t.project_id is not null) as transaction_terms_published,
  p.created_at
from public.project p
left join public.project_transaction t on t.project_id = p.id
left join public.offtake_ladder l on l.project_id = p.id
where p.visibility = 'listed';

grant select on public.project_teaser to anon, authenticated;

create or replace function private.sync_project_document_grants()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  IF NEW.state = 'granted_full' AND (OLD.state IS DISTINCT FROM NEW.state) THEN
    INSERT INTO public.document_access_grant (document_id, user_id, status, granted_by, granted_at)
    SELECT d.id, NEW.investor_user_id, 'approved'::public.request_status, auth.uid(), now()
    FROM public.document d
    WHERE d.project_id = NEW.project_id AND d.access_level = 'gated'
    ON CONFLICT (document_id, user_id) DO UPDATE
      SET status = 'approved', granted_by = auth.uid(), granted_at = now();
  ELSIF OLD.state = 'granted_full' AND NEW.state IS DISTINCT FROM 'granted_full' THEN
    UPDATE public.document_access_grant g
    SET status = 'withdrawn'::public.request_status, granted_by = auth.uid(), granted_at = NULL
    FROM public.document d
    WHERE g.document_id = d.id AND d.project_id = NEW.project_id AND g.user_id = NEW.investor_user_id;
  END IF;
  RETURN NEW;
END;
$function$;

drop trigger if exists access_request_sync_document_grants on public.access_request;
create trigger access_request_sync_document_grants
  after update of state on public.access_request
  for each row execute function private.sync_project_document_grants();

create or replace function private.inherit_project_document_access()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
BEGIN
  IF NEW.access_level = 'gated' THEN
    INSERT INTO public.document_access_grant (document_id, user_id, status, granted_by, granted_at)
    SELECT NEW.id, r.investor_user_id, 'approved'::public.request_status, r.investor_user_id, r.decided_at
    FROM public.access_request r
    WHERE r.project_id = NEW.project_id AND r.state = 'granted_full'
    ON CONFLICT (document_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

create table if not exists public.nda_document_version (
  version text primary key,
  body text not null,
  sha256 text not null,
  fee_text text not null,
  effective_from timestamptz not null default now(),
  retired_at timestamptz
);

alter table public.nda_document_version enable row level security;
grant select on public.nda_document_version to anon, authenticated;

drop policy if exists nda_document_version_read on public.nda_document_version;
create policy nda_document_version_read on public.nda_document_version for select to public using (true);

insert into public.nda_document_version (version, body, sha256, fee_text)
values (
  'v1.0',
  'DHC Market confidentiality agreement, version v1.0

Scope of confidential information
All information disclosed on this listing once access is granted, including the developer identity, the location, counterparties, and the technical, financial, transaction and process material, whether marked confidential or not.

Permitted use
Evaluating a possible investment in this project only. No disclosure to any third party other than the advisers named in your request, who are bound on the same terms.

Term
Twenty-four months from the date this agreement takes effect.

Return or destruction
On written request, return or destroy the material and any copies, other than one archival copy held for compliance.

Non-solicitation
No approach to or solicitation of the developer''s counterparties, including the heat-source host and offtakers, for twelve months without the developer''s written consent.

Governing law
The laws of Ireland, with the courts of Ireland having non-exclusive jurisdiction.

Effect
This agreement takes effect when the developer accepts your request.

Platform fee
Listing is free to the developer. A success fee of 1% of the amount invested is payable by the investor on financial close with a developer introduced here, within 36 months of the logged introduction. Either party may report a close; the other confirms before any invoice is raised.
',
  'ab771b81509fd9ec7b1727b8d99da5cb0b185cbe7f7d83028bbb188ae5a719dc',
  'Listing is free to the developer. A success fee of 1% of the amount invested is payable by the investor on financial close with a developer introduced here, within 36 months of the logged introduction. Either party may report a close; the other confirms before any invoice is raised.'
)
on conflict (version) do nothing;

alter table public.access_request
  add column if not exists nda_document_sha256 text,
  add column if not exists nda_user_agent text,
  add column if not exists authority_affirmed boolean,
  add column if not exists authority_text text,
  add column if not exists fee_acknowledged boolean,
  add column if not exists fee_text text,
  add column if not exists fee_version text,
  add column if not exists electronic_signature_consent boolean,
  add column if not exists client_signed_at timestamptz;

comment on column public.access_request.nda_document_sha256 is 'Hash of the exact agreement text shown at signature, checked against nda_document_version.';
comment on column public.access_request.authority_text is 'Exact wording of the authority checkbox the signatory ticked.';
comment on column public.access_request.fee_text is 'Exact fee sentence shown at signature, so the acknowledgement can be reproduced.';
comment on column public.access_request.electronic_signature_consent is 'Irish ECA 2000 s.13(2)(b): consent to sign electronically.';

alter table public.listing_access_criteria
  add column if not exists electronic_execution_consent boolean not null default false,
  add column if not exists electronic_execution_consent_at timestamptz;

create or replace function private.lock_access_request_evidence()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare header_ip text; header_ua text; known_hash text;
begin
  begin
    header_ip := nullif(btrim(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1)), '');
  exception when others then header_ip := null; end;
  begin
    header_ua := nullif(btrim(current_setting('request.headers', true)::json ->> 'user-agent'), '');
  exception when others then header_ua := null; end;

  if new.authority_affirmed is false or new.fee_acknowledged is false then
    raise exception 'The authority affirmation and the fee acknowledgement must both be given' using errcode = '42501';
  end if;

  if new.nda_document_sha256 is not null then
    select sha256 into known_hash from public.nda_document_version where version = new.nda_version;
    if known_hash is null or known_hash is distinct from new.nda_document_sha256 then
      raise exception 'The signed agreement does not match a known version of the confidentiality agreement' using errcode = '42501';
    end if;
  end if;

  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.project_id := old.project_id;
    new.investor_user_id := old.investor_user_id;

    if old.introduction_logged_at is not null then
      if new.state not in ('granted', 'granted_full') then
        raise exception 'An accepted introduction is permanent and cannot be reverted to %', new.state using errcode = '42501';
      end if;
      if new.introduction_logged_at is distinct from old.introduction_logged_at
         or new.fee_tail_expires_at is distinct from old.fee_tail_expires_at
         or new.nda_effective_at is distinct from old.nda_effective_at
         or new.nda_version is distinct from old.nda_version
         or new.nda_signed_name is distinct from old.nda_signed_name
         or new.nda_signed_role is distinct from old.nda_signed_role
         or new.nda_signed_at is distinct from old.nda_signed_at
         or new.nda_ip is distinct from old.nda_ip
         or new.nda_document_sha256 is distinct from old.nda_document_sha256
         or new.nda_user_agent is distinct from old.nda_user_agent
         or new.authority_affirmed is distinct from old.authority_affirmed
         or new.authority_text is distinct from old.authority_text
         or new.fee_acknowledged is distinct from old.fee_acknowledged
         or new.fee_text is distinct from old.fee_text
         or new.fee_version is distinct from old.fee_version
         or new.electronic_signature_consent is distinct from old.electronic_signature_consent
         or new.client_signed_at is distinct from old.client_signed_at
         or new.submitted_at is distinct from old.submitted_at then
        raise exception 'Signature and introduction records are locked once the introduction is logged' using errcode = '42501';
      end if;
      return new;
    end if;

    if (new.state = 'pending' and old.state in ('withdrawn', 'declined', 'lapsed'))
       or new.nda_signed_name is distinct from old.nda_signed_name then
      new.submitted_at := now();
      new.nda_signed_at := now();
      new.nda_ip := coalesce(header_ip, new.nda_ip);
      new.nda_user_agent := coalesce(header_ua, new.nda_user_agent);
    else
      new.nda_signed_at := old.nda_signed_at;
      new.nda_ip := old.nda_ip;
      new.nda_user_agent := old.nda_user_agent;
      new.submitted_at := old.submitted_at;
    end if;
  else
    new.submitted_at := now();
    if new.nda_signed_name is not null then
      new.nda_signed_at := now();
      new.nda_ip := coalesce(header_ip, new.nda_ip);
      new.nda_user_agent := coalesce(header_ua, new.nda_user_agent);
    end if;
  end if;

  if new.state in ('granted', 'granted_full') and (tg_op = 'INSERT' or old.state not in ('granted', 'granted_full')) then
    new.nda_effective_at := now();
    new.introduction_logged_at := now();
    new.fee_tail_expires_at := now() + interval '36 months';
    new.decided_at := now();
  elsif new.state not in ('granted', 'granted_full') then
    new.nda_effective_at := null;
    new.introduction_logged_at := null;
    new.fee_tail_expires_at := null;
  end if;
  return new;
end $function$;
