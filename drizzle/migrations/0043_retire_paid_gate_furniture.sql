-- Batch B item 2 (R4: no billing, no plan). The paid gate was replaced by qualification in
-- 0038 and 0039; this removes what survived of it.
-- 1. Legacy paid-gate functions: nothing in the app or the database calls them.
DROP FUNCTION IF EXISTS public.subscriber_project(uuid);
DROP FUNCTION IF EXISTS public.subscriber_document_index(uuid);
DROP FUNCTION IF EXISTS public.subscriber_document(jsonb, boolean);
DROP FUNCTION IF EXISTS public.is_subscriber();
-- 2. The subscription table (0 rows, no foreign keys, no views) and its policies.
DROP TABLE IF EXISTS public.subscription;
-- 3. The two live columns are the pre-acceptance disclosure preview consent, not a subscription.
ALTER TABLE public.project RENAME COLUMN subscriber_disclosure_consent_at TO disclosure_preview_consent_at;
ALTER TABLE public.project RENAME COLUMN subscriber_preview_fingerprint TO disclosure_preview_fingerprint;
-- Function bodies reference columns by name, so recreate the three that use them.
DO $rename$
DECLARE f record; definition text;
BEGIN
FOR f IN SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname IN ('save_stage_listing','investor_project','investor_document_index') LOOP
  SELECT pg_get_functiondef(f.oid) INTO definition;
  definition:=replace(definition,'subscriber_disclosure_consent_at','disclosure_preview_consent_at');
  definition:=replace(definition,'subscriber_preview_fingerprint','disclosure_preview_fingerprint');
  EXECUTE definition;
END LOOP;
IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname IN ('public','private') AND (p.prosrc LIKE '%subscriber_disclosure_consent_at%' OR p.prosrc LIKE '%subscriber_preview_fingerprint%')) THEN
  RAISE EXCEPTION 'A function still references a renamed column';
END IF;
END $rename$;
-- 4. The restrictive SELECT policies keep their condition (owner or qualified investor);
-- only the paid-era name changes.
DO $policies$
DECLARE t text;
BEGIN
FOR t IN SELECT tablename FROM pg_policies WHERE schemaname='public' AND policyname='paid_depth' LOOP
  EXECUTE format('ALTER POLICY paid_depth ON public.%I RENAME TO qualified_depth', t);
END LOOP;
END $policies$;
