-- 0024_funding_catalogue: public funding catalogue for DHC (EU + EEA), maintained by the
-- dhc-funding-scout agent. Programmes last for years; calls open and close.
-- Signed-in users read; only the agent's definer functions write. Idempotent.

CREATE TABLE IF NOT EXISTS public.funding_programme (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,80}$'),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 200),
  name_en text CHECK (name_en IS NULL OR char_length(name_en) <= 200),
  administering_body text NOT NULL CHECK (char_length(administering_body) <= 200),
  level text NOT NULL CHECK (level IN ('eu','ifi','national','regional')),
  country_codes text[] NOT NULL DEFAULT '{}' CHECK (country_codes <@ ARRAY['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO']::text[]),
  regions text[] NOT NULL DEFAULT '{}',
  instrument_types text[] NOT NULL CHECK (cardinality(instrument_types) > 0 AND instrument_types <@ ARRAY['grant','loan','guarantee','equity','technical_assistance','risk_cover','tax_incentive','blended']::text[]),
  applicant_types text[] NOT NULL DEFAULT '{}' CHECK (applicant_types <@ ARRAY['municipality','municipal_utility','private_developer','sme','large_company','cooperative','public_body','financial_intermediary']::text[]),
  technologies text[] NOT NULL DEFAULT '{}' CHECK (technologies <@ ARRAY['geothermal','biomass_chp','waste_heat_recovery','solar_thermal','large_heat_pump','river_water_cooling','seawater_cooling','thermal_storage','hybrid']::text[]),
  stages text[] NOT NULL DEFAULT '{}' CHECK (stages <@ ARRAY['concept','pre_feasibility','feasibility','development','ready_to_build','due_diligence','construction','commissioning','operational']::text[]),
  project_types text[] NOT NULL DEFAULT '{}' CHECK (project_types <@ ARRAY['greenfield','brownfield','expansion','modernisation']::text[]),
  max_aid_pct numeric CHECK (max_aid_pct IS NULL OR (max_aid_pct > 0 AND max_aid_pct <= 100)),
  min_amount_eur numeric CHECK (min_amount_eur IS NULL OR min_amount_eur >= 0),
  max_amount_eur numeric CHECK (max_amount_eur IS NULL OR max_amount_eur >= 0),
  budget_eur numeric CHECK (budget_eur IS NULL OR budget_eur >= 0),
  budget_note text CHECK (budget_note IS NULL OR char_length(budget_note) <= 300),
  state_aid_basis text CHECK (state_aid_basis IS NULL OR char_length(state_aid_basis) <= 200),
  cumulation text CHECK (cumulation IS NULL OR char_length(cumulation) <= 400),
  key_conditions text[] NOT NULL DEFAULT '{}',
  summary text NOT NULL CHECK (char_length(summary) BETWEEN 20 AND 700),
  language text NOT NULL DEFAULT 'en' CHECK (char_length(language) BETWEEN 2 AND 5),
  official_url text NOT NULL CHECK (official_url ~ '^https://'),
  source_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','closed','discontinued')),
  confidence text NOT NULL DEFAULT 'high' CHECK (confidence IN ('high','medium','low')),
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  verified_by text NOT NULL DEFAULT 'agent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.funding_call (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  programme_id uuid NOT NULL REFERENCES public.funding_programme(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,100}$'),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 250),
  opens_at date,
  deadline_at timestamptz,
  deadline_note text CHECK (deadline_note IS NULL OR char_length(deadline_note) <= 200),
  rolling boolean NOT NULL DEFAULT false,
  budget_eur numeric CHECK (budget_eur IS NULL OR budget_eur >= 0),
  status text NOT NULL CHECK (status IN ('upcoming','open','closed')),
  call_url text NOT NULL CHECK (call_url ~ '^https://'),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 500),
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (rolling OR deadline_at IS NOT NULL OR status = 'upcoming')
);

CREATE TABLE IF NOT EXISTS public.funding_change_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at timestamptz NOT NULL DEFAULT clock_timestamp(),
  entity text NOT NULL CHECK (entity IN ('programme','call')),
  entity_id uuid NOT NULL,
  entity_slug text NOT NULL,
  change text NOT NULL CHECK (change IN ('new','updated','reverified','closed','discontinued')),
  diff jsonb NOT NULL DEFAULT '{}',
  source_url text,
  actor text NOT NULL DEFAULT 'agent'
);

CREATE TABLE IF NOT EXISTS public.funding_coverage (
  scope text PRIMARY KEY,                 -- 'EU' or ISO country code
  wave smallint NOT NULL,
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','covered')),
  last_swept_at timestamptz,
  notes text
);

CREATE INDEX IF NOT EXISTS funding_programme_countries_idx ON public.funding_programme USING gin (country_codes);
CREATE INDEX IF NOT EXISTS funding_programme_status_idx ON public.funding_programme (status, level);
CREATE INDEX IF NOT EXISTS funding_call_programme_idx ON public.funding_call (programme_id, status, deadline_at);
CREATE INDEX IF NOT EXISTS funding_change_log_at_idx ON public.funding_change_log (at DESC);

DROP TRIGGER IF EXISTS funding_programme_updated_at ON public.funding_programme;
CREATE TRIGGER funding_programme_updated_at BEFORE UPDATE ON public.funding_programme FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS funding_call_updated_at ON public.funding_call;
CREATE TRIGGER funding_call_updated_at BEFORE UPDATE ON public.funding_call FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: signed-in users read programmes and calls (not discontinued); admins read the log and coverage.
ALTER TABLE public.funding_programme ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_call ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_coverage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS funding_programme_read ON public.funding_programme;
CREATE POLICY funding_programme_read ON public.funding_programme FOR SELECT TO authenticated USING (status <> 'discontinued');
DROP POLICY IF EXISTS funding_call_read ON public.funding_call;
CREATE POLICY funding_call_read ON public.funding_call FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.funding_programme p WHERE p.id = programme_id AND p.status <> 'discontinued'));
DROP POLICY IF EXISTS funding_change_log_admin ON public.funding_change_log;
CREATE POLICY funding_change_log_admin ON public.funding_change_log FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS funding_coverage_admin ON public.funding_coverage;
CREATE POLICY funding_coverage_admin ON public.funding_coverage FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.funding_programme, public.funding_call, public.funding_change_log, public.funding_coverage FROM anon, authenticated;
GRANT SELECT ON public.funding_programme, public.funding_call, public.funding_change_log, public.funding_coverage TO authenticated;

-- Write path for the agent: JSON in, validated upsert, change logged.
CREATE OR REPLACE FUNCTION private.funding_upsert_programme(p jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
DECLARE
  old_row public.funding_programme;
  new_row public.funding_programme;
  d jsonb := '{}';
  k text;
  tracked text[] := ARRAY['name','name_en','administering_body','level','country_codes','regions','instrument_types','applicant_types','technologies','stages','project_types','max_aid_pct','min_amount_eur','max_amount_eur','budget_eur','budget_note','state_aid_basis','cumulation','key_conditions','summary','official_url','status','confidence'];
  arr text[] := ARRAY['country_codes','regions','instrument_types','applicant_types','technologies','stages','project_types','key_conditions','source_urls'];
  j jsonb;
BEGIN
  IF p->>'slug' IS NULL THEN RAISE EXCEPTION 'slug required'; END IF;
  j := p;
  SELECT * INTO old_row FROM public.funding_programme WHERE slug = j->>'slug';
  IF old_row.id IS NULL THEN
    -- new row: missing arrays become empty arrays
    FOREACH k IN ARRAY arr LOOP
      IF j->k IS NULL OR jsonb_typeof(j->k) <> 'array' THEN j := j || jsonb_build_object(k, '[]'::jsonb); END IF;
    END LOOP;
  END IF;
  new_row := jsonb_populate_record(old_row, j);
  new_row.last_verified_at := now();
  new_row.verified_by := COALESCE(j->>'verified_by', 'agent');
  IF old_row.id IS NULL THEN
    new_row.id := gen_random_uuid(); new_row.created_at := now(); new_row.updated_at := now();
    new_row.status := COALESCE(new_row.status, 'active');
    new_row.confidence := COALESCE(new_row.confidence, 'high');
    new_row.language := COALESCE(new_row.language, 'en');
    INSERT INTO public.funding_programme SELECT new_row.*;
    INSERT INTO public.funding_change_log (entity, entity_id, entity_slug, change, diff, source_url)
      VALUES ('programme', new_row.id, new_row.slug, 'new', '{}', new_row.official_url);
    RETURN 'new:' || new_row.slug;
  END IF;
  FOREACH k IN ARRAY tracked LOOP
    IF (to_jsonb(old_row)->k) IS DISTINCT FROM (to_jsonb(new_row)->k) THEN
      d := d || jsonb_build_object(k, jsonb_build_object('old', to_jsonb(old_row)->k, 'new', to_jsonb(new_row)->k));
    END IF;
  END LOOP;
  UPDATE public.funding_programme SET
    name = new_row.name, name_en = new_row.name_en, administering_body = new_row.administering_body, level = new_row.level,
    country_codes = new_row.country_codes, regions = new_row.regions, instrument_types = new_row.instrument_types,
    applicant_types = new_row.applicant_types, technologies = new_row.technologies, stages = new_row.stages,
    project_types = new_row.project_types, max_aid_pct = new_row.max_aid_pct, min_amount_eur = new_row.min_amount_eur,
    max_amount_eur = new_row.max_amount_eur, budget_eur = new_row.budget_eur, budget_note = new_row.budget_note,
    state_aid_basis = new_row.state_aid_basis, cumulation = new_row.cumulation, key_conditions = new_row.key_conditions,
    summary = new_row.summary, language = new_row.language, official_url = new_row.official_url, source_urls = new_row.source_urls,
    status = new_row.status, confidence = new_row.confidence, last_verified_at = now(), verified_by = new_row.verified_by
  WHERE id = old_row.id;
  INSERT INTO public.funding_change_log (entity, entity_id, entity_slug, change, diff, source_url)
    VALUES ('programme', old_row.id, old_row.slug,
            CASE WHEN d ? 'status' AND new_row.status = 'discontinued' THEN 'discontinued'
                 WHEN d ? 'status' AND new_row.status = 'closed' THEN 'closed'
                 WHEN d = '{}' THEN 'reverified' ELSE 'updated' END,
            d, new_row.official_url);
  RETURN (CASE WHEN d = '{}' THEN 'reverified:' ELSE 'updated:' END) || old_row.slug;
END $$;

CREATE OR REPLACE FUNCTION private.funding_upsert_call(p jsonb)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
DECLARE
  prog uuid;
  old_row public.funding_call;
  new_row public.funding_call;
  d jsonb := '{}';
  k text;
  tracked text[] := ARRAY['title','opens_at','deadline_at','deadline_note','rolling','budget_eur','status','call_url','notes'];
BEGIN
  SELECT id INTO prog FROM public.funding_programme WHERE slug = p->>'programme_slug';
  IF prog IS NULL THEN RAISE EXCEPTION 'unknown programme_slug %', p->>'programme_slug'; END IF;
  SELECT * INTO old_row FROM public.funding_call WHERE slug = p->>'slug';
  new_row := jsonb_populate_record(old_row, p - 'programme_slug');
  new_row.programme_id := prog;
  new_row.last_verified_at := now();
  IF old_row.id IS NULL THEN
    new_row.id := gen_random_uuid(); new_row.created_at := now(); new_row.updated_at := now();
    new_row.rolling := COALESCE(new_row.rolling, false);
    INSERT INTO public.funding_call SELECT new_row.*;
    INSERT INTO public.funding_change_log (entity, entity_id, entity_slug, change, source_url)
      VALUES ('call', new_row.id, new_row.slug, 'new', new_row.call_url);
    RETURN 'new:' || new_row.slug;
  END IF;
  FOREACH k IN ARRAY tracked LOOP
    IF (to_jsonb(old_row)->k) IS DISTINCT FROM (to_jsonb(new_row)->k) THEN
      d := d || jsonb_build_object(k, jsonb_build_object('old', to_jsonb(old_row)->k, 'new', to_jsonb(new_row)->k));
    END IF;
  END LOOP;
  UPDATE public.funding_call SET programme_id = prog, title = new_row.title, opens_at = new_row.opens_at, deadline_at = new_row.deadline_at,
    deadline_note = new_row.deadline_note, rolling = new_row.rolling, budget_eur = new_row.budget_eur, status = new_row.status,
    call_url = new_row.call_url, notes = new_row.notes, last_verified_at = now()
  WHERE id = old_row.id;
  INSERT INTO public.funding_change_log (entity, entity_id, entity_slug, change, diff, source_url)
    VALUES ('call', old_row.id, old_row.slug,
            CASE WHEN d ? 'status' AND new_row.status = 'closed' THEN 'closed' WHEN d = '{}' THEN 'reverified' ELSE 'updated' END,
            d, new_row.call_url);
  RETURN (CASE WHEN d = '{}' THEN 'reverified:' ELSE 'updated:' END) || old_row.slug;
END $$;

-- Close calls whose deadline has passed (safe to run any time).
CREATE OR REPLACE FUNCTION private.funding_close_expired()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
DECLARE n integer;
BEGIN
  WITH closed AS (
    UPDATE public.funding_call SET status = 'closed'
    WHERE status <> 'closed' AND NOT rolling AND deadline_at IS NOT NULL AND deadline_at < now()
    RETURNING id, slug, call_url
  )
  INSERT INTO public.funding_change_log (entity, entity_id, entity_slug, change, diff, source_url, actor)
  SELECT 'call', id, slug, 'closed', '{"reason":"deadline passed"}', call_url, 'system' FROM closed;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

REVOKE ALL ON FUNCTION private.funding_upsert_programme(jsonb), private.funding_upsert_call(jsonb), private.funding_close_expired() FROM PUBLIC;

-- Coverage plan: wave 1 = EU level + DE, NL, DK, PL, FR; wave 2 = remaining EU + EEA.
INSERT INTO public.funding_coverage (scope, wave) VALUES
  ('EU',1),('DE',1),('NL',1),('DK',1),('PL',1),('FR',1),
  ('AT',2),('BE',2),('BG',2),('HR',2),('CY',2),('CZ',2),('EE',2),('FI',2),('GR',2),('HU',2),('IE',2),('IT',2),('LV',2),('LT',2),('LU',2),('MT',2),('PT',2),('RO',2),('SK',2),('SI',2),('ES',2),('SE',2),('IS',2),('LI',2),('NO',2)
ON CONFLICT (scope) DO NOTHING;

-- Down (manual): DROP TABLE funding_call, funding_change_log, funding_coverage, funding_programme;
-- DROP FUNCTION private.funding_upsert_programme(jsonb), private.funding_upsert_call(jsonb), private.funding_close_expired();

-- 0024 follow-up (applied 2026-10-08): allow 'biomass_heat' technology.
-- ALTER TABLE public.funding_programme DROP CONSTRAINT <technologies check>;
-- ALTER TABLE public.funding_programme ADD CONSTRAINT funding_programme_technologies_check CHECK (technologies <@ ARRAY['geothermal','biomass_chp','biomass_heat','waste_heat_recovery','solar_thermal','large_heat_pump','river_water_cooling','seawater_cooling','thermal_storage','hybrid']::text[]);
