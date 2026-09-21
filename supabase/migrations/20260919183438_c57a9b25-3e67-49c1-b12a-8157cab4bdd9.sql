-- 1. Access lifecycle states
CREATE TYPE public.access_state AS ENUM ('pending','granted','granted_full','declined','withdrawn','lapsed');
CREATE TYPE public.access_decline_reason AS ENUM ('ticket_too_small','wrong_instrument','conflict','process_closed','not_now','other');
CREATE TYPE public.access_scope AS ENUM ('identity_and_data','full_including_dataroom');
CREATE TYPE public.investor_entity_type AS ENUM ('infra_fund','pension','insurer','family_office','regional_fund','municipal_utility','esco','corporate','bank_or_debt_fund','other');
CREATE TYPE public.ticket_band AS ENUM ('under_1m','1m_3m','3m_5m','5m_10m','10m_plus');
CREATE TYPE public.instrument_sought AS ENUM ('equity','debt','either');
CREATE TYPE public.construction_risk_appetite AS ENUM ('yes','no','only_fixed_price_date_certain');
CREATE TYPE public.capital_source AS ENUM ('fund_with_dry_powder','balance_sheet','club_to_be_assembled','advising_a_client');
CREATE TYPE public.decision_process AS ENUM ('discretionary','ic_approval','lp_consent');

-- 2. Extend access_request
ALTER TABLE public.access_request
  ADD COLUMN state public.access_state NOT NULL DEFAULT 'pending',
  ADD COLUMN submitted_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN decided_by uuid REFERENCES auth.users(id),
  ADD COLUMN decision_note text,
  ADD COLUMN decline_reason public.access_decline_reason,
  ADD COLUMN scope_granted public.access_scope,
  ADD COLUMN nda_version text,
  ADD COLUMN nda_signed_name text,
  ADD COLUMN nda_signed_role text,
  ADD COLUMN nda_signed_at timestamptz,
  ADD COLUMN nda_ip text,
  ADD COLUMN nda_effective_at timestamptz,
  ADD COLUMN introduction_logged_at timestamptz,
  ADD COLUMN fee_tail_expires_at timestamptz,
  ADD COLUMN developer_question text,
  ADD COLUMN developer_question_at timestamptz,
  ADD COLUMN investor_reply text,
  ADD COLUMN investor_reply_at timestamptz,
  ADD COLUMN reopen_allowed_at timestamptz;

UPDATE public.access_request SET
  submitted_at = requested_at,
  state = CASE status
    WHEN 'approved' THEN 'granted_full'::public.access_state
    WHEN 'denied' THEN 'declined'::public.access_state
    WHEN 'withdrawn' THEN 'withdrawn'::public.access_state
    ELSE 'pending'::public.access_state
  END;

CREATE INDEX IF NOT EXISTS access_request_state_idx ON public.access_request (project_id, state);

-- 3. Investor answers
CREATE TABLE public.access_request_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  access_request_id uuid NOT NULL UNIQUE REFERENCES public.access_request(id) ON DELETE CASCADE,
  entity_name text NOT NULL,
  entity_type public.investor_entity_type,
  jurisdiction text,
  regulated_status text,
  website text,
  signatory_name text NOT NULL,
  signatory_role text,
  ticket_band public.ticket_band NOT NULL,
  instrument_sought public.instrument_sought NOT NULL,
  construction_risk_appetite public.construction_risk_appetite,
  capital_source public.capital_source,
  decision_process public.decision_process,
  earliest_decision_date date,
  interest_drivers text[] NOT NULL DEFAULT '{}',
  diligence_focus text,
  would_lead_club boolean NOT NULL DEFAULT false,
  conflicts_declared boolean NOT NULL DEFAULT false,
  conflicts_detail text,
  advisers_receiving_info text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_request_answers TO authenticated;
GRANT ALL ON public.access_request_answers TO service_role;
ALTER TABLE public.access_request_answers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.owns_access_request(_user_id uuid, _request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.access_request r WHERE r.id = _request_id AND r.investor_user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.developer_of_access_request(_user_id uuid, _request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.access_request r WHERE r.id = _request_id AND public.owns_project(_user_id, r.project_id)
  )
$$;

CREATE POLICY "Investors manage their own answers" ON public.access_request_answers
  FOR ALL TO authenticated
  USING (public.owns_access_request(auth.uid(), access_request_id))
  WITH CHECK (public.owns_access_request(auth.uid(), access_request_id));

CREATE POLICY "Developers read answers on their listings" ON public.access_request_answers
  FOR SELECT TO authenticated
  USING (public.developer_of_access_request(auth.uid(), access_request_id));

CREATE TRIGGER access_request_answers_updated_at BEFORE UPDATE ON public.access_request_answers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 4. Listing access criteria
CREATE TABLE public.listing_access_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.project(id) ON DELETE CASCADE,
  min_ticket numeric,
  instruments_accepted text[] NOT NULL DEFAULT '{}',
  require_construction_risk_appetite boolean NOT NULL DEFAULT false,
  auto_accept_qualified boolean NOT NULL DEFAULT false,
  notify_users text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.listing_access_criteria TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_access_criteria TO authenticated;
GRANT ALL ON public.listing_access_criteria TO service_role;
ALTER TABLE public.listing_access_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read criteria of listed projects" ON public.listing_access_criteria
  FOR SELECT USING (public.project_is_listed(project_id));

CREATE POLICY "Developers manage criteria on their listings" ON public.listing_access_criteria
  FOR ALL TO authenticated
  USING (public.owns_project(auth.uid(), project_id))
  WITH CHECK (public.owns_project(auth.uid(), project_id));

CREATE TRIGGER listing_access_criteria_updated_at BEFORE UPDATE ON public.listing_access_criteria
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. Pipeline stages
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'watchlisted';
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'interest_submitted';
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'access_granted';
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'ioi';
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'loi';
ALTER TYPE public.deal_stage ADD VALUE IF NOT EXISTS 'closed';