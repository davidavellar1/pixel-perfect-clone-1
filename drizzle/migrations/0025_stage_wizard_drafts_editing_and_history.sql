ALTER TABLE public.project ADD COLUMN IF NOT EXISTS submission_draft jsonb;
ALTER TABLE public.project ADD COLUMN IF NOT EXISTS submission_published jsonb;
ALTER TABLE public.project ADD COLUMN IF NOT EXISTS submission_revision integer NOT NULL DEFAULT 0;
ALTER TABLE public.public_funding ADD COLUMN IF NOT EXISTS base_case_assumes_award boolean;
CREATE TABLE public.project_stage_event (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), project_id uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE, actor_user_id uuid NOT NULL, from_stage public.lifecycle_stage NOT NULL, to_stage public.lifecycle_stage NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(), submission_version text NOT NULL);
GRANT SELECT ON public.project_stage_event TO authenticated;
GRANT ALL ON public.project_stage_event TO service_role;
ALTER TABLE public.project_stage_event ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entitled members read stage history" ON public.project_stage_event FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.project p WHERE p.id=project_id));
CREATE OR REPLACE FUNCTION public.save_stage_listing(_document jsonb, _payload jsonb, _project_id uuid DEFAULT NULL, _publish boolean DEFAULT false, _revision integer DEFAULT 0)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $function$
DECLARE uid uuid := auth.uid(); pid uuid := _project_id; old public.project; result jsonb; row jsonb; fin uuid; stage text := _document->>'stage'; a jsonb := _document->'answers'; key text; required text[]; idx integer;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE='42501'; END IF;
 IF stage NOT IN ('concept','feasibility','development','construction','operational') OR jsonb_typeof(a)<>'object' OR jsonb_typeof(_document->'rows')<>'object' THEN RAISE EXCEPTION 'Invalid submission document'; END IF;
 IF pid IS NOT NULL THEN
  SELECT p.* INTO old FROM public.project p JOIN public.developer_profiles d ON d.id=p.developer_id WHERE p.id=pid AND d.user_id=uid FOR UPDATE OF p;
  IF old.id IS NULL THEN RAISE EXCEPTION 'Only the listing owner can save this project' USING ERRCODE='42501'; END IF;
  IF old.submission_revision<>_revision THEN RAISE EXCEPTION 'This listing changed in another session. Reload before saving.'; END IF;
  IF old.visibility='archived' THEN RAISE EXCEPTION 'Archived listings cannot be edited here'; END IF;
 END IF;
 IF _publish THEN
  required:=ARRAY['title','country','projectType','technology','capacity','capex','precision','summary','risk1','risk2','risk3','stopper','exposure','asOf'];
  IF stage='concept' THEN required:=required||ARRAY['anchor','studyStatus']; END IF;
  IF stage IN ('concept','feasibility','development') AND a->>'projectType'<>'modernisation' THEN required:=required||ARRAY['site']; END IF;
  IF stage IN ('feasibility','development') THEN required:=required||ARRAY['studyComplete','studyAuthor','studyDate']; END IF;
  IF stage IN ('feasibility','development','construction') THEN required:=required||ARRAY['designSupply','designReturn','designHeat','designLoad','contractedLoad','signedLoad','negotiationLoad']; END IF;
  IF stage<>'concept' THEN required:=required||ARRAY['revenueModel','regulated']; END IF;
  IF stage='feasibility' THEN required:=required||ARRAY['grantSplit','debtSplit','equitySplit','indicativeClose']; END IF;
  IF stage IN ('development','construction','operational') THEN required:=required||ARRAY['equitySought','minTicket','instruments','baseIrr','cashYield','returnBasis']; END IF;
  IF stage IN ('development','construction') THEN required:=required||ARRAY['targetClose','debtStatus']; END IF;
  IF stage='construction' THEN required:=required||ARRAY['debtAmount','debtTenor','debtPricing','epcStatus','epcType','constructionProgress','progressDate','commissioning']; END IF;
  IF stage='operational' THEN required:=required||ARRAY['historyYears','vehicleDebt','eed','tariff','transactionType','stake','operationalClose']; IF a->>'vehicleDebt'='yes' THEN required:=required||ARRAY['realisedDscr']; END IF; END IF;
  FOREACH key IN ARRAY required LOOP IF nullif(btrim(a->>key),'') IS NULL THEN RAISE EXCEPTION 'Required stage field missing: %',key; END IF; END LOOP;
  IF length(a->>'exposure')>200 THEN RAISE EXCEPTION 'Exposed assumption is limited to 200 characters'; END IF;
  IF (a->>'capacity')::numeric<=0 OR (a->>'capex')::numeric<=0 THEN RAISE EXCEPTION 'Capacity and capex must be positive'; END IF;
  IF a->>'risk1'=a->>'risk2' OR a->>'risk1'=a->>'risk3' OR a->>'risk2'=a->>'risk3' OR NOT (a->>'stopper'=ANY(ARRAY[a->>'risk1',a->>'risk2',a->>'risk3'])) THEN RAISE EXCEPTION 'Choose three distinct risks and one of them as the stopper'; END IF;
  IF stage='feasibility' AND ((a->>'grantSplit')::numeric+(a->>'debtSplit')::numeric+(a->>'equitySplit')::numeric<>100 OR a->>'indicativeClose' !~ '^\d{4}( H[12])?$') THEN RAISE EXCEPTION 'Feasibility shares must total 100 and close must be a year or half year'; END IF;
  IF stage IN ('development','construction') AND a->>'targetClose' !~ '^\d{4} Q[1-4]$' THEN RAISE EXCEPTION 'Target close must be a quarter'; END IF;
  IF old.visibility='listed' AND old.lifecycle_stage::text<>stage AND array_position(ARRAY['concept','feasibility','development','construction','operational'],stage)<>array_position(ARRAY['concept','feasibility','development','construction','operational'],old.lifecycle_stage::text)+1 THEN RAISE EXCEPTION 'Promote one lifecycle stage at a time'; END IF;
  FOR row IN SELECT value FROM jsonb_array_elements(coalesce(_document->'rows'->'funding','[]'::jsonb)) LOOP
   IF stage IN ('development','construction','operational') AND a->>'fundingPlan'='pursuing' AND row->>'funding_status' IN ('intending','applied','decision_pending') AND coalesce(row->>'irrAssumesAward','') NOT IN ('yes','no') THEN RAISE EXCEPTION 'Record the base-case assumption for each unawarded funding row'; END IF;
  END LOOP;
  IF stage='operational' AND (a->>'historyYears')::integer NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Operating history must be 1, 2 or 3 years'; END IF;
 END IF;
 IF pid IS NULL THEN
  result:=public.publish_project(jsonb_build_object('slug',coalesce(nullif(_payload->>'slug',''),'listing-'||gen_random_uuid()::text),'developer_full_name',_payload->>'developer_full_name','project',jsonb_build_object('title',coalesce(a->>'title',''),'summary',a->>'summary','country_code',coalesce(a->>'country',''),'city','','lifecycle_stage',stage,'project_type',coalesce(nullif(a->>'projectType',''),'greenfield'),'technology',coalesce(nullif(a->>'technology',''),'hybrid'),'visibility','draft')));
  pid:=(result->>'id')::uuid;
 END IF;
 IF NOT _publish THEN
  UPDATE public.project SET submission_draft=_document,submission_revision=submission_revision+1,title=CASE WHEN visibility='draft' THEN coalesce(a->>'title','') ELSE title END,lifecycle_stage=CASE WHEN visibility='draft' THEN stage::public.lifecycle_stage ELSE lifecycle_stage END WHERE id=pid RETURNING submission_revision INTO idx;
  RETURN jsonb_build_object('id',pid,'revision',idx);
 END IF;
 UPDATE public.project SET title=a->>'title',summary=a->>'summary',description=a->>'summary',country_code=a->>'country',lifecycle_stage=stage::public.lifecycle_stage,project_type=(a->>'projectType')::public.project_type,technology=(a->>'technology')::public.technology,capacity_mw=(a->>'capacity')::numeric,headline_investment=(a->>'capex')::numeric,network_length_km=nullif(a->>'networkLength','')::numeric,households_served=nullif(a->>'households','')::integer,financial_as_of=(a->>'asOf')::date,technical_as_of=(a->>'asOf')::date,regulatory_as_of=(a->>'asOf')::date,public_cofinancing_status=CASE a->>'fundingPlan' WHEN 'none' THEN 'None' WHEN 'pursuing' THEN 'In progress' ELSE NULL END,asked_fields=ARRAY(SELECT jsonb_array_elements_text(coalesce(_document->'askedFields','[]'::jsonb))),form_version=_document->>'version',submission_published=_document,submission_draft=NULL,submission_revision=submission_revision+1,visibility='listed' WHERE id=pid RETURNING submission_revision INTO idx;
 INSERT INTO public.financial_summary(project_id,currency,capex) VALUES(pid,'EUR',(a->>'capex')::numeric) ON CONFLICT(project_id) DO UPDATE SET capex=excluded.capex RETURNING id INTO fin;
 IF jsonb_array_length(coalesce(_payload->'energy_mix','[]'::jsonb))>0 THEN
  DELETE FROM public.energy_mix_item WHERE project_id=pid;
  FOR row IN SELECT value FROM jsonb_array_elements(_payload->'energy_mix') LOOP INSERT INTO public.energy_mix_item(project_id,source,share_pct) VALUES(pid,row->>'source',(row->>'share_pct')::numeric); END LOOP;
 END IF;
 IF stage IN ('feasibility','development','construction') THEN
  INSERT INTO public.offtake_ladder(project_id,as_of,total_buildings,contracted_count,contracted_load_pct,signed_connection_count,signed_connection_load_pct,in_negotiation_count,in_negotiation_load_pct) VALUES(pid,(a->>'asOf')::date,nullif(a->>'buildings','')::integer,coalesce(nullif(a->>'contractedCount','')::integer,0),(a->>'contractedLoad')::numeric,coalesce(nullif(a->>'signedCount','')::integer,0),(a->>'signedLoad')::numeric,coalesce(nullif(a->>'negotiationCount','')::integer,0),(a->>'negotiationLoad')::numeric) ON CONFLICT(project_id) DO UPDATE SET as_of=excluded.as_of,total_buildings=excluded.total_buildings,contracted_count=excluded.contracted_count,contracted_load_pct=excluded.contracted_load_pct,signed_connection_count=excluded.signed_connection_count,signed_connection_load_pct=excluded.signed_connection_load_pct,in_negotiation_count=excluded.in_negotiation_count,in_negotiation_load_pct=excluded.in_negotiation_load_pct;
 END IF;
 IF stage IN ('development','construction','operational') THEN
  INSERT INTO public.project_transaction(project_id,as_of,instrument,equity_sought,min_ticket,stake_offered_pct,target_equity_irr_pct) VALUES(pid,(a->>'asOf')::date,(split_part(a->>'instruments',',',1))::public.transaction_instrument,(a->>'equitySought')::numeric,(a->>'minTicket')::numeric,nullif(a->>'stake','')::numeric,(a->>'baseIrr')::numeric) ON CONFLICT(project_id) DO UPDATE SET as_of=excluded.as_of,instrument=excluded.instrument,equity_sought=excluded.equity_sought,min_ticket=excluded.min_ticket,stake_offered_pct=excluded.stake_offered_pct,target_equity_irr_pct=excluded.target_equity_irr_pct;
  INSERT INTO public.project_case(project_id,name,equity_irr_pct) VALUES(pid,'base',(a->>'baseIrr')::numeric) ON CONFLICT(project_id,name) DO UPDATE SET equity_irr_pct=excluded.equity_irr_pct;
 END IF;
 IF stage='construction' THEN INSERT INTO public.construction_package(project_id,as_of,contract_type) VALUES(pid,(a->>'progressDate')::date,a->>'epcType') ON CONFLICT(project_id) DO UPDATE SET as_of=excluded.as_of,contract_type=excluded.contract_type; END IF;
 IF stage IN ('development','construction') THEN
  DELETE FROM public.milestone WHERE project_id=pid;
  FOR row IN SELECT value FROM jsonb_array_elements(coalesce(_payload->'milestones','[]'::jsonb)) LOOP INSERT INTO public.milestone(project_id,label,target_date,status,sort_order) VALUES(pid,row->>'label',(row->>'target_date')::date,'upcoming',(row->>'sort_order')::integer); END LOOP;
  DELETE FROM public.capital_stack_item WHERE financial_summary_id=fin;
  FOR row IN SELECT value FROM jsonb_array_elements(coalesce(_payload->'capital_stack','[]'::jsonb)) LOOP INSERT INTO public.capital_stack_item(financial_summary_id,label,amount,provider,share_pct) VALUES(fin,row->>'label',(row->>'amount')::numeric,row->>'provider',(row->>'amount')::numeric*100/(a->>'capex')::numeric); END LOOP;
 END IF;
 IF stage<>'concept' THEN
  DELETE FROM public.public_funding WHERE financial_summary_id=fin;
  IF a->>'fundingPlan'='pursuing' THEN
   FOR row IN SELECT value FROM jsonb_array_elements(coalesce(_document->'rows'->'funding','[]'::jsonb)) LOOP
    IF nullif(row->>'programme_id','') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.funding_programme p WHERE p.id=(row->>'programme_id')::uuid AND p.instrument_types @> ARRAY[row->>'instrument_type'] AND (cardinality(p.country_codes)=0 OR p.country_codes @> ARRAY[a->>'country'])) THEN RAISE EXCEPTION 'Funding programme must match the country and instrument'; END IF;
    IF row->>'instrument_type' NOT IN ('blended','equity','grant','guarantee','loan','risk_cover','tax_incentive','technical_assistance') THEN RAISE EXCEPTION 'Invalid funding instrument'; END IF;
    INSERT INTO public.public_funding(financial_summary_id,source,programme,programme_id,administering_body,instrument_type,amount,funding_status,expected_decision_date,clawback_treatment,base_case_assumes_award) VALUES(fin,coalesce((SELECT administering_body FROM public.funding_programme WHERE id=nullif(row->>'programme_id','')::uuid),nullif(row->>'administering_body',''),row->>'programme'),coalesce((SELECT name FROM public.funding_programme WHERE id=nullif(row->>'programme_id','')::uuid),row->>'programme'),nullif(row->>'programme_id','')::uuid,coalesce((SELECT administering_body FROM public.funding_programme WHERE id=nullif(row->>'programme_id','')::uuid),row->>'administering_body'),row->>'instrument_type',(row->>'amount')::numeric,(row->>'funding_status')::public.public_funding_status,CASE WHEN row->>'funding_status' IN ('applied','decision_pending') THEN nullif(row->>'expected_decision_date','')::date END,CASE WHEN row->>'funding_status'='awarded' AND row->>'instrument_type'='grant' THEN row->>'clawback_treatment' END,CASE WHEN row->>'irrAssumesAward' IN ('yes','no') THEN row->>'irrAssumesAward'='yes' END);
   END LOOP;
  END IF;
 END IF;
 INSERT INTO public.listing_access_criteria(project_id,min_ticket,instruments_accepted,require_construction_risk_appetite,electronic_execution_consent,electronic_execution_consent_at) VALUES(pid,nullif(a->>'minTicket','')::numeric,string_to_array(coalesce(a->>'instruments',''),','),a->>'constructionAppetite'='yes',true,now()) ON CONFLICT(project_id) DO UPDATE SET min_ticket=excluded.min_ticket,instruments_accepted=excluded.instruments_accepted,require_construction_risk_appetite=excluded.require_construction_risk_appetite;
 IF old.visibility='listed' AND old.lifecycle_stage::text<>stage THEN INSERT INTO public.project_stage_event(project_id,actor_user_id,from_stage,to_stage,submission_version) VALUES(pid,uid,old.lifecycle_stage,stage::public.lifecycle_stage,_document->>'version'); END IF;
 RETURN jsonb_build_object('id',pid,'revision',idx,'slug',(SELECT slug FROM public.project WHERE id=pid));
END $function$;
REVOKE ALL ON FUNCTION public.save_stage_listing(jsonb,jsonb,uuid,boolean,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.save_stage_listing(jsonb,jsonb,uuid,boolean,integer) TO authenticated,service_role;