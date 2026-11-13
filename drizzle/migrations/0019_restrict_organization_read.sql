DROP POLICY IF EXISTS organization_read ON public.organization;
REVOKE SELECT ON public.organization FROM anon;
CREATE POLICY organization_read ON public.organization FOR SELECT TO authenticated
USING (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM public.developer_profiles dp WHERE dp.organization_id = organization.id AND dp.user_id = auth.uid())
);