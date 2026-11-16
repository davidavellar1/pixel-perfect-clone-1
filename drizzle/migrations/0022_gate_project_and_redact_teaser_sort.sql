DROP POLICY IF EXISTS project_read_listed ON public.project;
CREATE POLICY project_read_accepted ON public.project FOR SELECT TO authenticated USING (private.owns_project(auth.uid(), id) OR private.has_project_access(auth.uid(), id));
CREATE OR REPLACE FUNCTION public.project_teaser_rows()
RETURNS TABLE (id uuid, slug text, teaser_title text, country_code character(2), technology public.technology, project_type public.project_type, lifecycle_stage public.lifecycle_stage, capacity_band text, capex_band text, instrument public.transaction_instrument, min_ticket_band text, min_ticket_sort numeric, offtake_committed_load_pct numeric, transaction_terms_published boolean, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $function$
SELECT p.id, p.slug,
  upper(left(replace(p.technology::text, '_', ' '), 1)) || substr(replace(p.technology::text, '_', ' '), 2) || ', ' || replace(p.project_type::text, '_', ' '),
  p.country_code, p.technology, p.project_type, p.lifecycle_stage,
  CASE WHEN p.capacity_mw IS NULL THEN NULL WHEN p.capacity_mw < 10 THEN 'Under 10 MW' WHEN p.capacity_mw < 25 THEN '10-25 MW' WHEN p.capacity_mw < 50 THEN '25-50 MW' ELSE '50+ MW' END,
  CASE WHEN p.headline_investment IS NULL THEN NULL WHEN p.headline_investment < 15000000 THEN 'Under EUR 15M' WHEN p.headline_investment < 30000000 THEN 'EUR 15-30M' WHEN p.headline_investment < 50000000 THEN 'EUR 30-50M' ELSE 'EUR 50M+' END,
  t.instrument,
  CASE WHEN t.min_ticket IS NULL THEN NULL WHEN t.min_ticket < 1000000 THEN 'Under EUR 1M' WHEN t.min_ticket < 3000000 THEN 'EUR 1-3M' WHEN t.min_ticket < 5000000 THEN 'EUR 3-5M' WHEN t.min_ticket < 10000000 THEN 'EUR 5-10M' ELSE 'EUR 10M and above' END,
  CASE WHEN t.min_ticket IS NULL THEN NULL WHEN t.min_ticket < 1000000 THEN 0::numeric WHEN t.min_ticket < 3000000 THEN 1::numeric WHEN t.min_ticket < 5000000 THEN 2::numeric WHEN t.min_ticket < 10000000 THEN 3::numeric ELSE 4::numeric END,
  CASE WHEN l.project_id IS NULL THEN NULL ELSE round(coalesce(l.contracted_load_pct, 0) + coalesce(l.signed_connection_load_pct, 0)) END,
  t.project_id IS NOT NULL, p.created_at
FROM public.project p LEFT JOIN public.project_transaction t ON t.project_id=p.id LEFT JOIN public.offtake_ladder l ON l.project_id=p.id WHERE p.visibility='listed';
$function$;
REVOKE ALL ON FUNCTION public.project_teaser_rows() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.project_teaser_rows() TO anon, authenticated, service_role;
CREATE OR REPLACE VIEW public.project_teaser WITH (security_invoker=true) AS SELECT id,slug,teaser_title,country_code::character(2) AS country_code,technology,project_type,lifecycle_stage,capacity_band,capex_band,instrument,min_ticket_band,min_ticket_sort,offtake_committed_load_pct,transaction_terms_published,created_at FROM public.project_teaser_rows();
GRANT SELECT ON public.project_teaser TO anon, authenticated, service_role;
COMMENT ON FUNCTION public.project_teaser_rows() IS 'Public whitelist for listed teasers only. No project identity, exact location or exact financial values. Ticket sort is a band ordinal.';