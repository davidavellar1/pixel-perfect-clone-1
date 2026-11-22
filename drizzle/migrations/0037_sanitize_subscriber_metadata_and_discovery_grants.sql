GRANT EXECUTE ON FUNCTION public.project_discovery_rows() TO service_role;
GRANT EXECUTE ON FUNCTION public.project_teaser_rows() TO service_role;
GRANT SELECT ON public.project_discovery TO service_role;
DO $patch$ DECLARE definition text; BEGIN SELECT pg_get_functiondef('public.subscriber_document(jsonb,boolean)'::regprocedure) INTO definition;
definition:=replace(definition,'IF k IN (''country''','IF k=''asOf'' AND v ~ ''^\d{4}-\d{2}-\d{2}$'' THEN a:=a||jsonb_build_object(k,v); ELSIF k IN (''country''');
definition:=replace(definition,'''version'',_document->>''version''','''version'',''subscriber-projection-1''');
definition:=replace(definition,'''askedFields'',coalesce(_document->''askedFields'',''[]'')','''askedFields'',(SELECT coalesce(jsonb_agg(q.value),''[]''::jsonb) FROM jsonb_array_elements_text(coalesce(_document->''askedFields'',''[]''::jsonb)) AS q(value) WHERE a ? regexp_replace(q.value,''^stage\.'',''''))');
EXECUTE definition;END $patch$;