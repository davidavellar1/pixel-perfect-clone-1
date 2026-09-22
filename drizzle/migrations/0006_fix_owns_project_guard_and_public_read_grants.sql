-- Correct operator precedence: an unauthenticated caller must never be treated as an owner.
CREATE OR REPLACE FUNCTION public.owns_project(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select _user_id is not null
  and (auth.uid() is null or _user_id = auth.uid())
  and exists (
    select 1 from public.project p
    join public.developer_profiles d on d.id = p.developer_id
    where p.id = _project_id and d.user_id = _user_id)
$$;

-- Public listing pages evaluate these helpers as the anonymous role.
GRANT EXECUTE ON FUNCTION public.project_is_listed(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.financial_summary_is_listed(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sustainability_is_listed(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.owns_project(uuid, uuid) TO anon, authenticated;
