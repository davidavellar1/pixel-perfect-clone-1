REVOKE ALL ON FUNCTION public.sync_project_document_grants() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inherit_project_document_access() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_project_document_grants() TO service_role;
GRANT EXECUTE ON FUNCTION public.inherit_project_document_access() TO service_role;