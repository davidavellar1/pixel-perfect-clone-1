-- 0023_bundles: saved investor bundles (Bundle builder, Release 1).
-- A bundle belongs to one user; only that user can read or change it.
-- Items may only point at listed projects. Idempotent; safe to re-run.

CREATE TABLE IF NOT EXISTS public.bundle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bundle_item (
  bundle_id uuid NOT NULL REFERENCES public.bundle(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.project(id) ON DELETE CASCADE,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (bundle_id, project_id)
);

CREATE INDEX IF NOT EXISTS bundle_user_id_idx ON public.bundle (user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS bundle_item_project_id_idx ON public.bundle_item (project_id);

-- updated_at on bundle; touching items also bumps the parent bundle
DROP TRIGGER IF EXISTS bundle_set_updated_at ON public.bundle;
CREATE TRIGGER bundle_set_updated_at BEFORE UPDATE ON public.bundle
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION private.bundle_item_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, private AS $$
DECLARE
  v_bundle uuid := COALESCE(NEW.bundle_id, OLD.bundle_id);
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NOT private.project_is_listed(NEW.project_id) THEN
      RAISE EXCEPTION 'project is not listed' USING ERRCODE = '42501';
    END IF;
    IF (SELECT count(*) FROM public.bundle_item WHERE bundle_id = NEW.bundle_id) >= 50 THEN
      RAISE EXCEPTION 'a bundle can hold at most 50 projects' USING ERRCODE = '23514';
    END IF;
  END IF;
  UPDATE public.bundle SET updated_at = now() WHERE id = v_bundle;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS bundle_item_guard ON public.bundle_item;
CREATE TRIGGER bundle_item_guard BEFORE INSERT OR DELETE ON public.bundle_item
  FOR EACH ROW EXECUTE FUNCTION private.bundle_item_guard();

-- Row-level security: owner only
ALTER TABLE public.bundle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_item ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bundle_own_all ON public.bundle;
CREATE POLICY bundle_own_all ON public.bundle FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS bundle_item_own_all ON public.bundle_item;
CREATE POLICY bundle_item_own_all ON public.bundle_item FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bundle b WHERE b.id = bundle_id AND b.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.bundle b WHERE b.id = bundle_id AND b.user_id = auth.uid()));

-- Grants: no anonymous access; RLS is the gate for signed-in users
REVOKE ALL ON public.bundle, public.bundle_item FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.bundle, public.bundle_item FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bundle, public.bundle_item TO authenticated;
REVOKE ALL ON FUNCTION private.bundle_item_guard() FROM PUBLIC;

-- Down (manual rollback):
-- DROP TABLE IF EXISTS public.bundle_item; DROP TABLE IF EXISTS public.bundle;
-- DROP FUNCTION IF EXISTS private.bundle_item_guard();
