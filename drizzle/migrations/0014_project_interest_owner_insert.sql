-- The project owner records the investor's pipeline stage when granting access,
-- so the owner must be allowed to insert project_interest rows for their own project.
create policy project_interest_insert_owner
  on public.project_interest
  for insert
  to authenticated
  with check (private.owns_project(auth.uid(), project_id));