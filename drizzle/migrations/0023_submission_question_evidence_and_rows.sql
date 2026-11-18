CREATE TYPE public.absence_reason AS ENUM ('not_asked', 'does_not_exist_yet', 'not_applicable', 'not_provided');
ALTER TABLE public.project ADD COLUMN asked_fields text[], ADD COLUMN form_version text, ADD COLUMN public_cofinancing_status text;
COMMENT ON COLUMN public.project.asked_fields IS 'Field keys actually shown during submission. NULL means no question evidence exists.';
COMMENT ON COLUMN public.financial_summary.debt_margin_bps IS 'DEPRECATED: retired from submission and project displays';
COMMENT ON COLUMN public.financial_summary.gearing_pct IS 'DEPRECATED: retired from submission and project displays';
COMMENT ON COLUMN public.financial_summary.lockup_dscr IS 'DEPRECATED: retired from submission and project displays';
COMMENT ON COLUMN public.financial_summary.dsra_months IS 'DEPRECATED: retired from submission and project displays';
COMMENT ON COLUMN public.financial_summary.npv IS 'DEPRECATED: retired from submission and project displays';
COMMENT ON TABLE public.sdg_alignment IS 'DEPRECATED: no developer submission source';
COMMENT ON COLUMN public.sustainability_profile.sfdr_article IS 'DEPRECATED: investor classification is not a project field';
CREATE OR REPLACE FUNCTION public.publish_project(payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
declare
 v_uid uuid := auth.uid(); v_dev uuid; v_project_id uuid; v_slug text := payload->>'slug'; v_child jsonb; v_case jsonb; v_fin uuid; v_row jsonb;
begin
 if v_uid is null then raise exception 'Not authenticated'; end if;
 if v_slug is null or btrim(v_slug) = '' then raise exception 'A listing slug is required'; end if;
 select id into v_dev from public.developer_profiles where user_id = v_uid limit 1;
 if v_dev is null then
  insert into public.developer_profiles (user_id, full_name, company_name) values (v_uid, coalesce(nullif(btrim(payload->>'developer_full_name'), ''), 'Developer'), nullif(btrim(coalesce(payload->>'developer_company', '')), '')) returning id into v_dev;
 end if;
 v_child := payload->'project';
 insert into public.project (slug,developer_id,title,summary,description,country_code,city,lifecycle_stage,project_type,technology,capacity_mw,visibility,headline_investment,headline_co2_tonnes,technical_as_of,financial_as_of,regulatory_as_of,asked_fields,form_version,network_length_km,households_served,timeline_start,timeline_end,public_cofinancing_status)
 values (v_slug,v_dev,v_child->>'title',v_child->>'summary',v_child->>'description',v_child->>'country_code',v_child->>'city',(v_child->>'lifecycle_stage')::lifecycle_stage,(v_child->>'project_type')::project_type,(v_child->>'technology')::technology,(v_child->>'capacity_mw')::numeric,coalesce((v_child->>'visibility')::project_visibility,'listed'),(v_child->>'headline_investment')::numeric,(v_child->>'headline_co2_tonnes')::numeric,(v_child->>'technical_as_of')::date,(v_child->>'financial_as_of')::date,(v_child->>'regulatory_as_of')::date,CASE WHEN jsonb_typeof(v_child->'asked_fields')='array' THEN ARRAY(SELECT jsonb_array_elements_text(v_child->'asked_fields')) ELSE NULL END,v_child->>'form_version',(v_child->>'network_length_km')::numeric,(v_child->>'households_served')::integer,(v_child->>'timeline_start')::date,(v_child->>'timeline_end')::date,v_child->>'public_cofinancing_status') returning id into v_project_id;
 v_child := payload->'financial_summary';
 if v_child is not null and v_child <> 'null'::jsonb then
 insert into public.financial_summary (project_id,currency,capex,dscr_1x_connections,irr_zero_connections,concession_term_years) values (v_project_id,coalesce(v_child->>'currency','EUR'),(v_child->>'capex')::numeric,(v_child->>'dscr_1x_connections')::integer,(v_child->>'irr_zero_connections')::integer,(v_child->>'concession_term_years')::smallint) returning id into v_fin;
 end if;
 v_child := payload->'sustainability_profile';
 if v_child is not null and v_child <> 'null'::jsonb then
 insert into public.sustainability_profile (project_id,co2_tonnes_per_year,renewable_share_pct) values (v_project_id,(v_child->>'co2_tonnes_per_year')::numeric,(v_child->>'renewable_share_pct')::numeric);
 end if;
 v_child := payload->'offtake_ladder';
 if v_child is not null and v_child <> 'null'::jsonb then
 insert into public.offtake_ladder (project_id,as_of,total_buildings,contracted_count,contracted_load_pct,signed_connection_count,signed_connection_load_pct,in_negotiation_count,in_negotiation_load_pct) values (v_project_id,(v_child->>'as_of')::date,(v_child->>'total_buildings')::integer,coalesce((v_child->>'contracted_count')::integer,0),coalesce((v_child->>'contracted_load_pct')::numeric,0),coalesce((v_child->>'signed_connection_count')::integer,0),coalesce((v_child->>'signed_connection_load_pct')::numeric,0),coalesce((v_child->>'in_negotiation_count')::integer,0),coalesce((v_child->>'in_negotiation_load_pct')::numeric,0));
 end if;
 v_child := payload->'construction_package';
 if v_child is not null and v_child <> 'null'::jsonb then
 insert into public.construction_package (project_id,as_of,epc_contractor,epc_named_in_dataroom,contract_type,contract_value,ld_rate,ld_cap_pct,security,contingency_amount,contingency_pct,schedule_float_months,permits_status,interface_risk,om_contract) values (v_project_id,(v_child->>'as_of')::date,v_child->>'epc_contractor',coalesce((v_child->>'epc_named_in_dataroom')::boolean,false),v_child->>'contract_type',(v_child->>'contract_value')::numeric,v_child->>'ld_rate',(v_child->>'ld_cap_pct')::numeric,v_child->>'security',(v_child->>'contingency_amount')::numeric,(v_child->>'contingency_pct')::numeric,(v_child->>'schedule_float_months')::numeric,v_child->>'permits_status',v_child->>'interface_risk',v_child->>'om_contract');
 end if;
 v_child := payload->'margin_profile';
 if v_child is not null and v_child <> 'null'::jsonb then
 insert into public.margin_profile (project_id,as_of,heat_purchase_price,purchase_index,customer_tariff,tariff_index,gross_spread,opex_per_kwh,indexation_mismatch_note,purchase_floor_cap) values (v_project_id,(v_child->>'as_of')::date,(v_child->>'heat_purchase_price')::numeric,v_child->>'purchase_index',(v_child->>'customer_tariff')::numeric,v_child->>'tariff_index',(v_child->>'gross_spread')::numeric,(v_child->>'opex_per_kwh')::numeric,v_child->>'indexation_mismatch_note',v_child->>'purchase_floor_cap');
 end if;
 for v_case in select value from jsonb_array_elements(coalesce(payload->'cases','[]'::jsonb)) loop
 insert into public.project_case (project_id,name,connections,power_price,capex_variance_pct,equity_irr_pct,min_dscr) values (v_project_id,(v_case->>'name')::case_name,(v_case->>'connections')::integer,(v_case->>'power_price')::numeric,(v_case->>'capex_variance_pct')::numeric,(v_case->>'equity_irr_pct')::numeric,(v_case->>'min_dscr')::numeric);
 end loop;
 v_child := payload->'project_transaction';
 if v_child is not null and v_child <> 'null'::jsonb then
 insert into public.project_transaction (project_id,as_of,instrument,equity_sought,stake_offered_pct,min_ticket,club_max_participants,target_equity_irr_pct,downside_equity_irr_pct) values (v_project_id,(v_child->>'as_of')::date,(v_child->>'instrument')::transaction_instrument,(v_child->>'equity_sought')::numeric,(v_child->>'stake_offered_pct')::numeric,(v_child->>'min_ticket')::numeric,(v_child->>'club_max_participants')::smallint,(v_child->>'target_equity_irr_pct')::numeric,(v_child->>'downside_equity_irr_pct')::numeric);
 end if;
 v_child := payload->'listing_access_criteria';
 if v_child is not null and v_child <> 'null'::jsonb then
 insert into public.listing_access_criteria (project_id,min_ticket,instruments_accepted,require_construction_risk_appetite,electronic_execution_consent,electronic_execution_consent_at,notify_users) values (v_project_id,(v_child->>'min_ticket')::numeric,coalesce((select array_agg(v) from jsonb_array_elements_text(coalesce(v_child->'instruments_accepted','[]'::jsonb)) v),'{}'::text[]),coalesce((v_child->>'require_construction_risk_appetite')::boolean,false),coalesce((v_child->>'electronic_execution_consent')::boolean,false),CASE WHEN (v_child->>'electronic_execution_consent')::boolean THEN now() ELSE NULL END,coalesce((select array_agg(v) from jsonb_array_elements_text(coalesce(v_child->'notify_users','[]'::jsonb)) v),'{}'::text[]));
 end if;
 for v_row in select value from jsonb_array_elements(coalesce(payload->'milestones','[]'::jsonb)) loop
 insert into public.milestone (project_id,label,target_date,status,description) values (v_project_id,v_row->>'label',(v_row->>'target_date')::date,(v_row->>'status')::milestone_status,v_row->>'description');
 end loop;
 for v_row in select value from jsonb_array_elements(coalesce(payload->'capital_stack','[]'::jsonb)) loop
 if v_fin is null then raise exception 'Capital stack requires financial summary'; end if;
 insert into public.capital_stack_item (financial_summary_id,label,amount,provider,share_pct) values (v_fin,v_row->>'label',(v_row->>'amount')::numeric,v_row->>'provider',CASE WHEN (payload->'financial_summary'->>'capex')::numeric > 0 THEN (v_row->>'amount')::numeric*100/(payload->'financial_summary'->>'capex')::numeric END);
 end loop;
 for v_row in select value from jsonb_array_elements(coalesce(payload->'revenue_streams','[]'::jsonb)) loop
 if v_fin is null then raise exception 'Revenue streams require financial summary'; end if;
 insert into public.revenue_stream (financial_summary_id,stream,structure,pct_of_revenue,counterparty) values (v_fin,v_row->>'stream',v_row->>'structure',(v_row->>'pct_of_revenue')::numeric,v_row->>'counterparty');
 end loop;
 for v_row in select value from jsonb_array_elements(coalesce(payload->'risks','[]'::jsonb)) loop
 insert into public.risk (project_id,category,severity,description,mitigation) values (v_project_id,v_row->>'category',(v_row->>'severity')::risk_severity,v_row->>'description',v_row->>'mitigation');
 end loop;
 for v_row in select value from jsonb_array_elements(coalesce(payload->'technology_cards','[]'::jsonb)) loop
 insert into public.technology_card (project_id,title,description) values (v_project_id,v_row->>'title',v_row->>'description');
 end loop;
 for v_row in select value from jsonb_array_elements(coalesce(payload->'energy_mix','[]'::jsonb)) loop
 insert into public.energy_mix_item (project_id,source,share_pct) values (v_project_id,v_row->>'source',(v_row->>'share_pct')::numeric);
 end loop;
 for v_row in select value from jsonb_array_elements(coalesce(payload->'operating_parameters','[]'::jsonb)) loop
 insert into public.operating_parameter (project_id,parameter,value,benchmark) values (v_project_id,v_row->>'parameter',v_row->>'value',v_row->>'benchmark');
 end loop;
 return jsonb_build_object('id',v_project_id,'slug',v_slug);
end;
$function$;
REVOKE ALL ON FUNCTION public.publish_project(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_project(jsonb) TO authenticated;