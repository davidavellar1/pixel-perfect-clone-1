-- enums
CREATE TYPE public.transaction_instrument AS ENUM ('equity', 'equity_and_shareholder_loan', 'preferred_equity', 'mezzanine', 'convertible', 'other');
CREATE TYPE public.process_type AS ENUM ('bilateral', 'competitive');
CREATE TYPE public.case_name AS ENUM ('base', 'downside', 'stress', 'upside');
CREATE TYPE public.offtake_tier AS ENUM ('contracted', 'signed_connection_agreement', 'in_negotiation');

-- as-of dates on project
ALTER TABLE public.project
  ADD COLUMN IF NOT EXISTS financial_as_of date,
  ADD COLUMN IF NOT EXISTS technical_as_of date,
  ADD COLUMN IF NOT EXISTS regulatory_as_of date;

-- break-even on financial summary
ALTER TABLE public.financial_summary
  ADD COLUMN IF NOT EXISTS dscr_1x_connections integer,
  ADD COLUMN IF NOT EXISTS irr_zero_connections integer,
  ADD COLUMN IF NOT EXISTS debt_margin_bps integer,
  ADD COLUMN IF NOT EXISTS gearing_pct numeric,
  ADD COLUMN IF NOT EXISTS lockup_dscr numeric,
  ADD COLUMN IF NOT EXISTS dsra_months smallint;

-- transaction terms
CREATE TABLE public.project_transaction (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.project(id) ON DELETE CASCADE,
  instrument public.transaction_instrument NOT NULL DEFAULT 'equity',
  equity_sought numeric,
  stake_offered_pct numeric,
  min_ticket numeric,
  club_max_participants smallint,
  board_seat_threshold numeric,
  observer_threshold numeric,
  reserved_matters text[] NOT NULL DEFAULT '{}',
  pre_emption boolean NOT NULL DEFAULT true,
  rofr boolean NOT NULL DEFAULT true,
  tag_along boolean NOT NULL DEFAULT true,
  drag_along_threshold numeric,
  distribution_policy text,
  first_distribution_year smallint,
  exit_routes text[] NOT NULL DEFAULT '{}',
  expected_hold_years numeric,
  pre_money_equity numeric,
  sponsor_cash_funded numeric,
  post_money_ownership jsonb NOT NULL DEFAULT '[]'::jsonb,
  use_of_proceeds jsonb NOT NULL DEFAULT '[]'::jsonb,
  drawdown_tranches jsonb NOT NULL DEFAULT '[]'::jsonb,
  target_equity_irr_pct numeric,
  downside_equity_irr_pct numeric,
  as_of date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_transaction TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_transaction TO authenticated;
GRANT ALL ON public.project_transaction TO service_role;
ALTER TABLE public.project_transaction ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_transaction_read" ON public.project_transaction FOR SELECT
  USING (public.project_is_listed(project_id) OR public.owns_project(auth.uid(), project_id));
CREATE POLICY "project_transaction_owner_write" ON public.project_transaction FOR ALL TO authenticated
  USING (public.owns_project(auth.uid(), project_id))
  WITH CHECK (public.owns_project(auth.uid(), project_id));
CREATE TRIGGER project_transaction_updated_at BEFORE UPDATE ON public.project_transaction
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- process and timetable
CREATE TABLE public.project_process (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.project(id) ON DELETE CASCADE,
  process_type public.process_type NOT NULL DEFAULT 'bilateral',
  ioi_deadline date,
  management_meetings_window text,
  loi_deadline date,
  exclusivity_days smallint,
  target_close date,
  conditions_precedent text[] NOT NULL DEFAULT '{}',
  adviser_disclosed boolean NOT NULL DEFAULT false,
  parties_under_nda smallint,
  parties_under_nda_breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  as_of date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.project_process TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_process TO authenticated;
GRANT ALL ON public.project_process TO service_role;
ALTER TABLE public.project_process ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_process_read" ON public.project_process FOR SELECT
  USING (public.project_is_listed(project_id) OR public.owns_project(auth.uid(), project_id));
CREATE POLICY "project_process_owner_write" ON public.project_process FOR ALL TO authenticated
  USING (public.owns_project(auth.uid(), project_id))
  WITH CHECK (public.owns_project(auth.uid(), project_id));
CREATE TRIGGER project_process_updated_at BEFORE UPDATE ON public.project_process
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- construction package
CREATE TABLE public.construction_package (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.project(id) ON DELETE CASCADE,
  epc_contractor text,
  epc_named_in_dataroom boolean NOT NULL DEFAULT false,
  contract_type text,
  contract_value numeric,
  ld_rate text,
  ld_cap_pct numeric,
  security text,
  contingency_amount numeric,
  contingency_pct numeric,
  schedule_float_months numeric,
  permits_status text,
  interface_risk text,
  om_contract text,
  as_of date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.construction_package TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.construction_package TO authenticated;
GRANT ALL ON public.construction_package TO service_role;
ALTER TABLE public.construction_package ENABLE ROW LEVEL SECURITY;
CREATE POLICY "construction_package_read" ON public.construction_package FOR SELECT
  USING (public.project_is_listed(project_id) OR public.owns_project(auth.uid(), project_id));
CREATE POLICY "construction_package_owner_write" ON public.construction_package FOR ALL TO authenticated
  USING (public.owns_project(auth.uid(), project_id))
  WITH CHECK (public.owns_project(auth.uid(), project_id));
CREATE TRIGGER construction_package_updated_at BEFORE UPDATE ON public.construction_package
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- margin profile
CREATE TABLE public.margin_profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.project(id) ON DELETE CASCADE,
  heat_purchase_price numeric,
  purchase_index text,
  purchase_floor_cap text,
  customer_tariff numeric,
  tariff_index text,
  gross_spread numeric,
  opex_per_kwh numeric,
  indexation_mismatch_note text,
  as_of date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.margin_profile TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.margin_profile TO authenticated;
GRANT ALL ON public.margin_profile TO service_role;
ALTER TABLE public.margin_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "margin_profile_read" ON public.margin_profile FOR SELECT
  USING (public.project_is_listed(project_id) OR public.owns_project(auth.uid(), project_id));
CREATE POLICY "margin_profile_owner_write" ON public.margin_profile FOR ALL TO authenticated
  USING (public.owns_project(auth.uid(), project_id))
  WITH CHECK (public.owns_project(auth.uid(), project_id));
CREATE TRIGGER margin_profile_updated_at BEFORE UPDATE ON public.margin_profile
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- case sensitivities
CREATE TABLE public.project_case (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  name public.case_name NOT NULL,
  connections integer,
  power_price numeric,
  capex_variance_pct numeric,
  equity_irr_pct numeric,
  min_dscr numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);
GRANT SELECT ON public.project_case TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_case TO authenticated;
GRANT ALL ON public.project_case TO service_role;
ALTER TABLE public.project_case ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_case_read" ON public.project_case FOR SELECT
  USING (public.project_is_listed(project_id) OR public.owns_project(auth.uid(), project_id));
CREATE POLICY "project_case_owner_write" ON public.project_case FOR ALL TO authenticated
  USING (public.owns_project(auth.uid(), project_id))
  WITH CHECK (public.owns_project(auth.uid(), project_id));
CREATE TRIGGER project_case_updated_at BEFORE UPDATE ON public.project_case
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- offtake commitment ladder
CREATE TABLE public.offtake_ladder (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.project(id) ON DELETE CASCADE,
  contracted_count integer NOT NULL DEFAULT 0,
  contracted_load_pct numeric NOT NULL DEFAULT 0,
  signed_connection_count integer NOT NULL DEFAULT 0,
  signed_connection_load_pct numeric NOT NULL DEFAULT 0,
  in_negotiation_count integer NOT NULL DEFAULT 0,
  in_negotiation_load_pct numeric NOT NULL DEFAULT 0,
  total_buildings integer,
  as_of date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.offtake_ladder TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offtake_ladder TO authenticated;
GRANT ALL ON public.offtake_ladder TO service_role;
ALTER TABLE public.offtake_ladder ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offtake_ladder_read" ON public.offtake_ladder FOR SELECT
  USING (public.project_is_listed(project_id) OR public.owns_project(auth.uid(), project_id));
CREATE POLICY "offtake_ladder_owner_write" ON public.offtake_ladder FOR ALL TO authenticated
  USING (public.owns_project(auth.uid(), project_id))
  WITH CHECK (public.owns_project(auth.uid(), project_id));
CREATE TRIGGER offtake_ladder_updated_at BEFORE UPDATE ON public.offtake_ladder
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- executed confidentiality agreements
CREATE TABLE public.nda_signature (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  signatory_name text NOT NULL,
  entity_name text,
  ip_address text,
  document_version text NOT NULL DEFAULT 'v1.0',
  signed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);
GRANT SELECT, INSERT ON public.nda_signature TO authenticated;
GRANT ALL ON public.nda_signature TO service_role;
ALTER TABLE public.nda_signature ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nda_signature_read" ON public.nda_signature FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.owns_project(auth.uid(), project_id));
CREATE POLICY "nda_signature_insert_own" ON public.nda_signature FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());