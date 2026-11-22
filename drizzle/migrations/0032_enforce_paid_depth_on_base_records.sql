DO $$ DECLARE t text; BEGIN
FOREACH t IN ARRAY ARRAY['project','financial_summary','project_transaction','project_process','construction_package','margin_profile','project_case','offtake_ladder','sustainability_profile','milestone','risk','project_advisor','technology_card','energy_mix_item','operating_parameter'] LOOP
EXECUTE format('CREATE POLICY paid_depth ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (private.owns_project(auth.uid(),%s) OR public.is_subscriber())',t,CASE WHEN t='project' THEN 'id' ELSE 'project_id' END);
END LOOP;
FOREACH t IN ARRAY ARRAY['capital_stack_item','revenue_stream','public_funding'] LOOP
EXECUTE format('CREATE POLICY paid_depth ON public.%I AS RESTRICTIVE FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.financial_summary f WHERE f.id=financial_summary_id AND (private.owns_project(auth.uid(),f.project_id) OR public.is_subscriber())))',t);
END LOOP;END $$;
CREATE POLICY subscriber_interest_submission ON public.access_request AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(public.is_subscriber());