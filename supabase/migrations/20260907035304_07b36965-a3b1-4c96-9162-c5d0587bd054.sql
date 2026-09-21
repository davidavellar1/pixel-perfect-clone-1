revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.handle_new_investor() from public, anon, authenticated;
revoke execute on function public.update_updated_at_column() from public, anon, authenticated;

revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.owns_project(uuid, uuid) from public, anon;
revoke execute on function public.owns_financial_summary(uuid, uuid) from public, anon;
revoke execute on function public.owns_sustainability(uuid, uuid) from public, anon;
revoke execute on function public.owns_document(uuid, uuid) from public, anon;
revoke execute on function public.can_see_question(uuid, uuid) from public, anon;

revoke execute on function public.project_is_listed(uuid) from public;
grant execute on function public.project_is_listed(uuid) to anon, authenticated;
revoke execute on function public.financial_summary_is_listed(uuid) from public;
grant execute on function public.financial_summary_is_listed(uuid) to anon, authenticated;
revoke execute on function public.sustainability_is_listed(uuid) from public;
grant execute on function public.sustainability_is_listed(uuid) to anon, authenticated;