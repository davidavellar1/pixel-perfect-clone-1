CREATE TYPE public.public_funding_status AS ENUM ('intending','applied','decision_pending','awarded','declined');
ALTER TABLE public.public_funding ADD COLUMN programme_id uuid REFERENCES public.funding_programme(id), ADD COLUMN administering_body text, ADD COLUMN instrument_type text, ADD COLUMN funding_status public.public_funding_status, ADD COLUMN expected_decision_date date, ADD COLUMN clawback_treatment text;
COMMENT ON COLUMN public.public_funding.status IS 'DEPRECATED: use ordered funding_status for new submissions; legacy status is retained';
DO $migration$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.publish_project(jsonb)'::regprocedure) INTO definition;
 definition := replace(definition, ' return jsonb_build_object(''id'',v_project_id,''slug'',v_slug);', $addition$
 for v_row in select value from jsonb_array_elements(coalesce(payload->'public_funding','[]'::jsonb)) loop
 if v_fin is null then raise exception 'Public funding requires financial summary'; end if;
 if nullif(v_row->>'programme_id','') is not null and not exists (select 1 from public.funding_programme where id=(v_row->>'programme_id')::uuid) then raise exception 'Funding programme does not exist'; end if;
 if nullif(v_row->>'programme_id','') is not null and not exists (select 1 from public.funding_programme where id=(v_row->>'programme_id')::uuid and instrument_types @> array[v_row->>'instrument_type']) then raise exception 'Instrument must match the funding catalogue'; end if;
 if v_row->>'instrument_type' not in ('blended','equity','grant','guarantee','loan','risk_cover','tax_incentive','technical_assistance') then raise exception 'Invalid funding instrument'; end if;
 insert into public.public_funding (financial_summary_id,source,programme,programme_id,administering_body,instrument_type,amount,funding_status,expected_decision_date,clawback_treatment)
 values (v_fin,coalesce((select administering_body from public.funding_programme where id=nullif(v_row->>'programme_id','')::uuid),nullif(v_row->>'administering_body',''),v_row->>'programme'),coalesce((select name from public.funding_programme where id=nullif(v_row->>'programme_id','')::uuid),v_row->>'programme'),nullif(v_row->>'programme_id','')::uuid,coalesce((select administering_body from public.funding_programme where id=nullif(v_row->>'programme_id','')::uuid),nullif(v_row->>'administering_body','')),v_row->>'instrument_type',(v_row->>'amount')::numeric,(v_row->>'funding_status')::public_funding_status,CASE WHEN v_row->>'funding_status' in ('applied','decision_pending') THEN (v_row->>'expected_decision_date')::date END,CASE WHEN v_row->>'funding_status'='awarded' AND v_row->>'instrument_type'='grant' THEN v_row->>'clawback_treatment' END);
 end loop;
 return jsonb_build_object('id',v_project_id,'slug',v_slug);
$addition$);
 IF position('Invalid funding instrument' in definition)=0 THEN RAISE EXCEPTION 'Publish function insertion point not found'; END IF;
 EXECUTE definition;
END;
$migration$;