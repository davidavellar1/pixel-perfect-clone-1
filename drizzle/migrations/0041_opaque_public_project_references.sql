ALTER TABLE public.project ADD COLUMN public_ref uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.project ADD CONSTRAINT project_public_ref_unique UNIQUE(public_ref);
DO $replace$
DECLARE teaser_def text; discovery_def text; f record; definition text;
BEGIN
SELECT pg_get_functiondef('public.project_teaser_rows()'::regprocedure) INTO teaser_def;
SELECT pg_get_functiondef('public.project_discovery_rows()'::regprocedure) INTO discovery_def;
DROP VIEW public.project_discovery;
DROP VIEW public.project_teaser;
DROP FUNCTION public.project_discovery_rows();
DROP FUNCTION public.project_teaser_rows();
teaser_def:=replace(replace(teaser_def,'slug text','public_ref text'),'p.slug','p.public_ref::text');
discovery_def:=replace(discovery_def,'slug text','public_ref text');
EXECUTE teaser_def; EXECUTE discovery_def;
FOR f IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('notify_access_request_event','notify_question_event','decline_question','notify_stage_followers') LOOP
SELECT pg_get_functiondef(f.oid) INTO definition;
definition:=replace(definition,'p.slug','p.public_ref::text');
definition:=replace(definition,'SELECT p.title,p.slug','SELECT p.title,p.public_ref::text');
EXECUTE definition;
END LOOP;
END $replace$;
REVOKE ALL ON FUNCTION public.project_teaser_rows() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.project_discovery_rows() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.project_teaser_rows(),public.project_discovery_rows() TO anon,authenticated,service_role;
CREATE VIEW public.project_teaser WITH (security_invoker=true) AS SELECT * FROM public.project_teaser_rows();
CREATE VIEW public.project_discovery WITH (security_invoker=true) AS SELECT * FROM public.project_discovery_rows();
GRANT SELECT ON public.project_teaser,public.project_discovery TO anon,authenticated,service_role;
UPDATE public.notification n SET link=regexp_replace(n.link,'^/app/projects/[^?]+','/app/projects/'||p.public_ref::text) FROM public.project p WHERE n.project_id=p.id AND n.link LIKE '/app/projects/%';
DROP POLICY IF EXISTS "Anyone can read criteria of listed projects" ON public.listing_access_criteria;
REVOKE SELECT ON public.listing_access_criteria FROM anon;
CREATE POLICY criteria_accepted_read ON public.listing_access_criteria FOR SELECT TO authenticated USING (private.owns_project(auth.uid(),project_id) OR private.has_project_access(auth.uid(),project_id));
CREATE OR REPLACE FUNCTION public.investor_project(_project_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $function$
DECLARE p public.project;accepted boolean;c jsonb; BEGIN
IF NOT public.is_qualified_investor() THEN RAISE EXCEPTION 'Complete your investment mandate to open this' USING ERRCODE='42501'; END IF;
SELECT * INTO p FROM public.project WHERE id=_project_id AND visibility='listed';
IF p.id IS NULL OR p.subscriber_disclosure_consent_at IS NULL THEN RETURN NULL; END IF;
accepted:=private.has_project_access(auth.uid(),p.id);
SELECT jsonb_build_object('min_ticket',min_ticket,'instruments_accepted',instruments_accepted,'require_construction_risk_appetite',require_construction_risk_appetite,'electronic_execution_consent',electronic_execution_consent) INTO c FROM public.listing_access_criteria WHERE project_id=p.id;
RETURN jsonb_build_object('id',p.id,'document',public.investor_document(p.submission_published,p.band_until_acceptance AND NOT accepted),'exact',NOT p.band_until_acceptance OR accepted,'criteria',c);
END $function$;