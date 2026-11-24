DROP POLICY IF EXISTS benchmark_read ON public.benchmark;
CREATE POLICY benchmark_read ON public.benchmark FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'developer') OR private.has_role(auth.uid(),'investor') OR private.has_role(auth.uid(),'advisor'));
DROP POLICY IF EXISTS country_profile_read ON public.country_profile;
CREATE POLICY country_profile_read ON public.country_profile FOR SELECT TO authenticated
USING (private.has_role(auth.uid(),'admin') OR private.has_role(auth.uid(),'developer') OR private.has_role(auth.uid(),'investor') OR private.has_role(auth.uid(),'advisor'));