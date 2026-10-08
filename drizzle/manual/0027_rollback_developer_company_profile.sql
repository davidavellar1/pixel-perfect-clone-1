-- 0027: Rolls back 0026 (developer company profile) at the owner's request, 2026-10-09.
-- No company or track-record data existed when this ran.

drop function if exists public.project_developer_profile(uuid);
drop function if exists public.project_sponsor_summary(uuid);
drop function if exists public.save_my_organization(jsonb);
drop table if exists public.organization_track_record;
drop function if exists private.track_record_guard();

drop policy if exists organization_read on public.organization;
create policy organization_read on public.organization for select using (true);
drop function if exists private.is_org_member(uuid, uuid);

alter table public.organization
  drop constraint if exists organization_description_len,
  drop constraint if exists organization_ownership_len,
  drop constraint if exists organization_website_https,
  drop constraint if exists organization_employees_band,
  drop column if exists description,
  drop column if exists website,
  drop column if exists registry_number,
  drop column if exists ownership,
  drop column if exists employees_band,
  drop column if exists countries_of_operation;

delete from drizzle.__drizzle_migrations where hash = 'manual-0026_developer_company_profile';
