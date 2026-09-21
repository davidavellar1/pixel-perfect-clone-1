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

CREATE TYPE public.deal_stage AS ENUM ('interest_logged','data_room','due_diligence','term_sheet','financial_close');

CREATE TABLE public.project_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  investor_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage public.deal_stage NOT NULL DEFAULT 'interest_logged',
  indicated_commitment numeric(14,2),
  introduced_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, investor_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_interest TO authenticated;
GRANT ALL ON public.project_interest TO service_role;
ALTER TABLE public.project_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY project_interest_read ON public.project_interest FOR SELECT TO authenticated
  USING (investor_user_id = auth.uid() OR public.owns_project(auth.uid(), project_id));
CREATE POLICY project_interest_insert_own ON public.project_interest FOR INSERT TO authenticated
  WITH CHECK (investor_user_id = auth.uid() AND public.project_is_listed(project_id));
CREATE POLICY project_interest_update_owner ON public.project_interest FOR UPDATE TO authenticated
  USING (public.owns_project(auth.uid(), project_id))
  WITH CHECK (public.owns_project(auth.uid(), project_id));
CREATE POLICY project_interest_delete_own ON public.project_interest FOR DELETE TO authenticated
  USING (investor_user_id = auth.uid());
CREATE INDEX project_interest_investor_idx ON public.project_interest (investor_user_id, stage);
CREATE INDEX project_interest_project_idx ON public.project_interest (project_id, stage);
CREATE TRIGGER project_interest_updated_at BEFORE UPDATE ON public.project_interest
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY access_request_update ON public.access_request;
CREATE POLICY access_request_owner_update ON public.access_request FOR UPDATE TO authenticated
  USING (public.owns_project(auth.uid(), project_id))
  WITH CHECK (public.owns_project(auth.uid(), project_id));

CREATE OR REPLACE FUNCTION public.sync_project_document_grants()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.document_access_grant (document_id, user_id, status, granted_by, granted_at)
    SELECT d.id, NEW.investor_user_id, 'approved'::public.request_status, auth.uid(), now()
    FROM public.document d
    WHERE d.project_id = NEW.project_id AND d.access_level = 'gated'
    ON CONFLICT (document_id, user_id) DO UPDATE
      SET status = 'approved', granted_by = auth.uid(), granted_at = now();
  ELSIF NEW.status IN ('denied','withdrawn') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    UPDATE public.document_access_grant g
    SET status = NEW.status, granted_by = auth.uid(), granted_at = NULL
    FROM public.document d
    WHERE g.document_id = d.id AND d.project_id = NEW.project_id AND g.user_id = NEW.investor_user_id;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER access_request_sync_document_grants
AFTER UPDATE OF status ON public.access_request
FOR EACH ROW EXECUTE FUNCTION public.sync_project_document_grants();

CREATE OR REPLACE FUNCTION public.inherit_project_document_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.access_level = 'gated' THEN
    INSERT INTO public.document_access_grant (document_id, user_id, status, granted_by, granted_at)
    SELECT NEW.id, r.investor_user_id, 'approved'::public.request_status, r.investor_user_id, r.decided_at
    FROM public.access_request r
    WHERE r.project_id = NEW.project_id AND r.status = 'approved'
    ON CONFLICT (document_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER document_inherit_project_access
AFTER INSERT ON public.document
FOR EACH ROW EXECUTE FUNCTION public.inherit_project_document_access();

REVOKE ALL ON FUNCTION public.sync_project_document_grants() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inherit_project_document_access() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_project_document_grants() TO service_role;
GRANT EXECUTE ON FUNCTION public.inherit_project_document_access() TO service_role;

REVOKE EXECUTE ON FUNCTION public.can_see_question(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.financial_summary_is_listed(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_investor() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.owns_document(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_financial_summary(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_project(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_sustainability(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.project_is_listed(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.sustainability_is_listed(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_see_question(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.financial_summary_is_listed(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_investor() TO service_role;
GRANT EXECUTE ON FUNCTION public.owns_document(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_financial_summary(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_project(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_sustainability(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.project_is_listed(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.sustainability_is_listed(uuid) TO authenticated, service_role;
