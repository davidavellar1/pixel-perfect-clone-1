-- Batch B item 10 (phase 1C): investor instruments are the five equity-like matched instruments;
-- senior debt is a declarable financing capability, never matched. The legacy single-choice
-- instrument_sought (equity, debt, either) is migrated and no longer written.
DO $guard$
BEGIN
  -- Signed answers are evidence and are not rewritten beyond the backfill below. A signed
  -- debt or either answer would need a decision, so stop rather than guess.
  IF EXISTS (SELECT 1 FROM public.access_request_answers WHERE instrument_sought::text IN ('debt','either')) THEN
    RAISE EXCEPTION 'Signed access answers with debt or either need a manual decision before this migration';
  END IF;
END $guard$;

-- Investor profiles: either becomes all five; equity becomes equity; debt becomes the
-- senior_debt financing capability. Only profiles with no matched selection are filled.
UPDATE public.investor_profiles SET matched_instruments = ARRAY['equity','equity_and_shareholder_loan','preferred_equity','mezzanine','convertible']
  WHERE instrument_sought::text = 'either' AND cardinality(matched_instruments) = 0;
UPDATE public.investor_profiles SET matched_instruments = ARRAY['equity']
  WHERE instrument_sought::text = 'equity' AND cardinality(matched_instruments) = 0;
UPDATE public.investor_profiles SET financing_capabilities = array_append(financing_capabilities, 'senior_debt')
  WHERE instrument_sought::text = 'debt' AND NOT ('senior_debt' = ANY(financing_capabilities));
UPDATE public.investor_profiles SET instrument_sought = NULL WHERE instrument_sought IS NOT NULL;

-- Signed answers with no matched selection recorded: record the equivalent of what was signed
-- (equity -> {equity}). The immutability trigger is suspended for this statement only, inside
-- this transaction, and is re-enabled unchanged; it still blocks every later change.
ALTER TABLE public.access_request_answers DISABLE TRIGGER lock_matched_instrument_evidence;
UPDATE public.access_request_answers SET matched_instruments = ARRAY['equity']
  WHERE matched_instruments IS NULL AND instrument_sought::text = 'equity';
ALTER TABLE public.access_request_answers ENABLE TRIGGER lock_matched_instrument_evidence;

-- Stop writing instrument_sought; keep signed historical values readable.
ALTER TABLE public.access_request_answers ALTER COLUMN instrument_sought DROP NOT NULL;

-- Remove the debt and either options from the enum.
ALTER TYPE public.instrument_sought RENAME TO instrument_sought_legacy;
CREATE TYPE public.instrument_sought AS ENUM ('equity');
ALTER TABLE public.access_request_answers ALTER COLUMN instrument_sought TYPE public.instrument_sought USING instrument_sought::text::public.instrument_sought;
ALTER TABLE public.investor_profiles ALTER COLUMN instrument_sought TYPE public.instrument_sought USING instrument_sought::text::public.instrument_sought;
DROP TYPE public.instrument_sought_legacy;
