-- Lets a person who signed up with Google (no metadata on the auth user) claim
-- their self-declared persona and get the matching profile row created.
CREATE OR REPLACE FUNCTION public.claim_signup_role(
  _role app_role,
  _full_name text DEFAULT '',
  _company text DEFAULT ''
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  -- Only the two self-service personas may ever be claimed this way.
  IF _role NOT IN ('investor', 'developer') THEN
    RAISE EXCEPTION 'Role % cannot be self-assigned', _role;
  END IF;

  INSERT INTO public.user_role (user_id, role)
  VALUES (uid, _role)
  ON CONFLICT (user_id, role) DO NOTHING;

  IF _role = 'investor' AND NOT EXISTS (
    SELECT 1 FROM public.investor_profiles WHERE user_id = uid
  ) THEN
    INSERT INTO public.investor_profiles (user_id, full_name, company_name)
    VALUES (uid, COALESCE(NULLIF(_full_name, ''), ''), NULLIF(_company, ''));
  END IF;

  IF _role = 'developer' AND NOT EXISTS (
    SELECT 1 FROM public.developer_profiles WHERE user_id = uid
  ) THEN
    INSERT INTO public.developer_profiles (user_id, full_name, company_name)
    VALUES (uid, COALESCE(NULLIF(_full_name, ''), ''), NULLIF(_company, ''));
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_signup_role(app_role, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.claim_signup_role(app_role, text, text) TO authenticated;