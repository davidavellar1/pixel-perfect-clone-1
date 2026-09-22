-- Atomic listing publication: project row + all conditional child rows in one transaction.
create or replace function public.publish_project(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_dev uuid;
  v_project_id uuid;
  v_slug text := payload->>'slug';
  v_child jsonb;
  v_case jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if v_slug is null or btrim(v_slug) = '' then
    raise exception 'A listing slug is required';
  end if;

  select id into v_dev from public.developer_profiles where user_id = v_uid limit 1;
  if v_dev is null then
    insert into public.developer_profiles (user_id, full_name, company_name)
    values (
      v_uid,
      coalesce(nullif(btrim(payload->>'developer_full_name'), ''), 'Developer'),
      nullif(btrim(coalesce(payload->>'developer_company', '')), '')
    )
    returning id into v_dev;
  end if;

  v_child := payload->'project';
  insert into public.project (
    slug, developer_id, title, summary, description, country_code, city,
    lifecycle_stage, project_type, technology, capacity_mw, visibility,
    headline_investment, headline_irr_pct, headline_co2_tonnes,
    technical_as_of, financial_as_of, regulatory_as_of
  ) values (
    v_slug, v_dev,
    v_child->>'title', v_child->>'summary', v_child->>'description',
    v_child->>'country_code', v_child->>'city',
    (v_child->>'lifecycle_stage')::lifecycle_stage,
    (v_child->>'project_type')::project_type,
    (v_child->>'technology')::technology,
    (v_child->>'capacity_mw')::numeric,
    coalesce((v_child->>'visibility')::project_visibility, 'listed'),
    (v_child->>'headline_investment')::numeric,
    (v_child->>'headline_irr_pct')::numeric,
    (v_child->>'headline_co2_tonnes')::numeric,
    (v_child->>'technical_as_of')::date,
    (v_child->>'financial_as_of')::date,
    (v_child->>'regulatory_as_of')::date
  ) returning id into v_project_id;

  v_child := payload->'financial_summary';
  if v_child is not null and v_child <> 'null'::jsonb then
    insert into public.financial_summary (
      project_id, currency, capex, target_irr_pct, dscr_1x_connections,
      irr_zero_connections, debt_margin_bps, gearing_pct, lockup_dscr, dsra_months
    ) values (
      v_project_id, coalesce(v_child->>'currency', 'EUR'),
      (v_child->>'capex')::numeric, (v_child->>'target_irr_pct')::numeric,
      (v_child->>'dscr_1x_connections')::integer, (v_child->>'irr_zero_connections')::integer,
      (v_child->>'debt_margin_bps')::integer, (v_child->>'gearing_pct')::numeric,
      (v_child->>'lockup_dscr')::numeric, (v_child->>'dsra_months')::smallint
    );
  end if;

  v_child := payload->'sustainability_profile';
  if v_child is not null and v_child <> 'null'::jsonb then
    insert into public.sustainability_profile (project_id, co2_tonnes_per_year, renewable_share_pct)
    values (v_project_id, (v_child->>'co2_tonnes_per_year')::numeric, (v_child->>'renewable_share_pct')::numeric);
  end if;

  v_child := payload->'offtake_ladder';
  if v_child is not null and v_child <> 'null'::jsonb then
    insert into public.offtake_ladder (
      project_id, as_of, total_buildings, contracted_count, contracted_load_pct,
      signed_connection_count, signed_connection_load_pct, in_negotiation_count, in_negotiation_load_pct
    ) values (
      v_project_id, (v_child->>'as_of')::date, (v_child->>'total_buildings')::integer,
      coalesce((v_child->>'contracted_count')::integer, 0), coalesce((v_child->>'contracted_load_pct')::numeric, 0),
      coalesce((v_child->>'signed_connection_count')::integer, 0), coalesce((v_child->>'signed_connection_load_pct')::numeric, 0),
      coalesce((v_child->>'in_negotiation_count')::integer, 0), coalesce((v_child->>'in_negotiation_load_pct')::numeric, 0)
    );
  end if;

  v_child := payload->'construction_package';
  if v_child is not null and v_child <> 'null'::jsonb then
    insert into public.construction_package (
      project_id, as_of, epc_contractor, epc_named_in_dataroom, contract_type, contract_value,
      ld_rate, ld_cap_pct, security, contingency_amount, contingency_pct,
      schedule_float_months, permits_status, interface_risk, om_contract
    ) values (
      v_project_id, (v_child->>'as_of')::date, v_child->>'epc_contractor',
      coalesce((v_child->>'epc_named_in_dataroom')::boolean, false),
      v_child->>'contract_type', (v_child->>'contract_value')::numeric,
      v_child->>'ld_rate', (v_child->>'ld_cap_pct')::numeric, v_child->>'security',
      (v_child->>'contingency_amount')::numeric, (v_child->>'contingency_pct')::numeric,
      (v_child->>'schedule_float_months')::numeric, v_child->>'permits_status',
      v_child->>'interface_risk', v_child->>'om_contract'
    );
  end if;

  v_child := payload->'margin_profile';
  if v_child is not null and v_child <> 'null'::jsonb then
    insert into public.margin_profile (
      project_id, as_of, heat_purchase_price, purchase_index, customer_tariff,
      tariff_index, gross_spread, opex_per_kwh, indexation_mismatch_note
    ) values (
      v_project_id, (v_child->>'as_of')::date, (v_child->>'heat_purchase_price')::numeric,
      v_child->>'purchase_index', (v_child->>'customer_tariff')::numeric, v_child->>'tariff_index',
      (v_child->>'gross_spread')::numeric, (v_child->>'opex_per_kwh')::numeric,
      v_child->>'indexation_mismatch_note'
    );
  end if;

  for v_case in select value from jsonb_array_elements(coalesce(payload->'cases', '[]'::jsonb)) loop
    insert into public.project_case (project_id, name, connections, power_price, capex_variance_pct, equity_irr_pct, min_dscr)
    values (
      v_project_id, (v_case->>'name')::case_name, (v_case->>'connections')::integer,
      (v_case->>'power_price')::numeric, (v_case->>'capex_variance_pct')::numeric,
      (v_case->>'equity_irr_pct')::numeric, (v_case->>'min_dscr')::numeric
    );
  end loop;

  v_child := payload->'project_transaction';
  if v_child is not null and v_child <> 'null'::jsonb then
    insert into public.project_transaction (
      project_id, as_of, instrument, equity_sought, stake_offered_pct, min_ticket,
      club_max_participants, board_seat_threshold, observer_threshold, reserved_matters,
      pre_emption, rofr, tag_along, drag_along_threshold, distribution_policy,
      first_distribution_year, exit_routes, expected_hold_years, pre_money_equity,
      sponsor_cash_funded, post_money_ownership, use_of_proceeds, drawdown_tranches,
      target_equity_irr_pct, downside_equity_irr_pct
    ) values (
      v_project_id, (v_child->>'as_of')::date, (v_child->>'instrument')::transaction_instrument,
      (v_child->>'equity_sought')::numeric, (v_child->>'stake_offered_pct')::numeric,
      (v_child->>'min_ticket')::numeric, (v_child->>'club_max_participants')::smallint,
      (v_child->>'board_seat_threshold')::numeric, (v_child->>'observer_threshold')::numeric,
      coalesce((select array_agg(v) from jsonb_array_elements_text(coalesce(v_child->'reserved_matters', '[]'::jsonb)) v), '{}'::text[]),
      coalesce((v_child->>'pre_emption')::boolean, false),
      coalesce((v_child->>'rofr')::boolean, false),
      coalesce((v_child->>'tag_along')::boolean, false),
      (v_child->>'drag_along_threshold')::numeric, v_child->>'distribution_policy',
      (v_child->>'first_distribution_year')::smallint,
      coalesce((select array_agg(v) from jsonb_array_elements_text(coalesce(v_child->'exit_routes', '[]'::jsonb)) v), '{}'::text[]),
      (v_child->>'expected_hold_years')::numeric, (v_child->>'pre_money_equity')::numeric,
      (v_child->>'sponsor_cash_funded')::numeric,
      coalesce(v_child->'post_money_ownership', '[]'::jsonb),
      coalesce(v_child->'use_of_proceeds', '[]'::jsonb),
      coalesce(v_child->'drawdown_tranches', '[]'::jsonb),
      (v_child->>'target_equity_irr_pct')::numeric, (v_child->>'downside_equity_irr_pct')::numeric
    );
  end if;

  v_child := payload->'project_process';
  if v_child is not null and v_child <> 'null'::jsonb then
    insert into public.project_process (
      project_id, as_of, process_type, ioi_deadline, management_meetings_window,
      loi_deadline, exclusivity_days, target_close, conditions_precedent,
      adviser_disclosed, parties_under_nda
    ) values (
      v_project_id, (v_child->>'as_of')::date, (v_child->>'process_type')::process_type,
      (v_child->>'ioi_deadline')::date, v_child->>'management_meetings_window',
      (v_child->>'loi_deadline')::date, (v_child->>'exclusivity_days')::smallint,
      (v_child->>'target_close')::date,
      coalesce((select array_agg(v) from jsonb_array_elements_text(coalesce(v_child->'conditions_precedent', '[]'::jsonb)) v), '{}'::text[]),
      coalesce((v_child->>'adviser_disclosed')::boolean, false),
      (v_child->>'parties_under_nda')::smallint
    );
  end if;

  v_child := payload->'listing_access_criteria';
  if v_child is not null and v_child <> 'null'::jsonb then
    insert into public.listing_access_criteria (
      project_id, min_ticket, instruments_accepted, require_construction_risk_appetite,
      auto_accept_qualified, notify_users
    ) values (
      v_project_id, (v_child->>'min_ticket')::numeric,
      coalesce((select array_agg(v) from jsonb_array_elements_text(coalesce(v_child->'instruments_accepted', '[]'::jsonb)) v), '{}'::text[]),
      coalesce((v_child->>'require_construction_risk_appetite')::boolean, false),
      coalesce((v_child->>'auto_accept_qualified')::boolean, false),
      coalesce((select array_agg(v) from jsonb_array_elements_text(coalesce(v_child->'notify_users', '[]'::jsonb)) v), '{}'::text[])
    );
  end if;

  return jsonb_build_object('id', v_project_id, 'slug', v_slug);
end;
$$;

revoke all on function public.publish_project(jsonb) from public;
revoke all on function public.publish_project(jsonb) from anon;
grant execute on function public.publish_project(jsonb) to authenticated;