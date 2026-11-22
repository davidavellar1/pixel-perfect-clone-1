DO $migration$
DECLARE t text; policy_name text; project_expr text;
BEGIN
FOR t IN SELECT unnest(ARRAY['capital_stack_item','revenue_stream','milestone','risk','public_funding','technology_card','operating_parameter','energy_mix_item','project_advisor','sdg_alignment']) LOOP
IF to_regclass('public.'||t) IS NULL THEN CONTINUE; END IF;
FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=t AND cmd='SELECT' LOOP
EXECUTE format('DROP POLICY %I ON public.%I',policy_name,t);
END LOOP;
EXECUTE format('REVOKE SELECT ON public.%I FROM anon',t);
EXECUTE format('GRANT SELECT ON public.%I TO authenticated',t);
project_expr:=CASE WHEN t IN ('capital_stack_item','revenue_stream','public_funding') THEN 'EXISTS (SELECT 1 FROM public.financial_summary f WHERE f.id=financial_summary_id AND (private.owns_project(auth.uid(),f.project_id) OR private.has_project_access(auth.uid(),f.project_id)))' WHEN t='sdg_alignment' THEN 'EXISTS (SELECT 1 FROM public.sustainability_profile s WHERE s.id=sustainability_profile_id AND (private.owns_project(auth.uid(),s.project_id) OR private.has_project_access(auth.uid(),s.project_id)))' ELSE '(private.owns_project(auth.uid(),project_id) OR private.has_project_access(auth.uid(),project_id))' END;
EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (%s)',t||'_accepted_read',t,project_expr);
END LOOP;
END $migration$;
DROP POLICY IF EXISTS paid_depth ON public.project;