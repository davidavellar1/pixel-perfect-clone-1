-- 1. Harden SECURITY DEFINER helpers: they may only answer about the calling user,
--    and are no longer callable by anonymous visitors / PUBLIC.

CREATE OR REPLACE FUNCTION public.owns_project(_user_id uuid, _project_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select auth.uid() is null or _user_id = auth.uid()
  and exists (
    select 1 from public.project p
    join public.developer_profiles d on d.id = p.developer_id
    where p.id = _project_id and d.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.owns_document(_user_id uuid, _document_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select (auth.uid() is null or _user_id = auth.uid())
  and exists (
    select 1 from public.document doc
    join public.project p on p.id = doc.project_id
    join public.developer_profiles d on d.id = p.developer_id
    where doc.id = _document_id and d.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.owns_financial_summary(_user_id uuid, _fs_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select (auth.uid() is null or _user_id = auth.uid())
  and exists (
    select 1 from public.financial_summary f
    join public.project p on p.id = f.project_id
    join public.developer_profiles d on d.id = p.developer_id
    where f.id = _fs_id and d.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.owns_sustainability(_user_id uuid, _sp_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select (auth.uid() is null or _user_id = auth.uid())
  and exists (
    select 1 from public.sustainability_profile s
    join public.project p on p.id = s.project_id
    join public.developer_profiles d on d.id = p.developer_id
    where s.id = _sp_id and d.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.owns_access_request(_user_id uuid, _request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select (auth.uid() is null or _user_id = auth.uid())
  and exists (select 1 from public.access_request r where r.id = _request_id and r.investor_user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.developer_of_access_request(_user_id uuid, _request_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select (auth.uid() is null or _user_id = auth.uid())
  and exists (
    select 1 from public.access_request r
    where r.id = _request_id and public.owns_project(_user_id, r.project_id))
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select (auth.uid() is null or _user_id = auth.uid())
  and exists (select 1 from public.user_role where user_id = _user_id and role = _role)
$$;

CREATE OR REPLACE FUNCTION public.can_see_question(_user_id uuid, _question_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  select (auth.uid() is null or _user_id = auth.uid())
  and exists (
    select 1 from public.question q
    join public.project p on p.id = q.project_id
    left join public.developer_profiles d on d.id = p.developer_id
    where q.id = _question_id
      and ((q.is_public and p.visibility = 'listed') or q.author_id = _user_id or d.user_id = _user_id))
$$;

-- Remove anonymous / PUBLIC execute rights on every SECURITY DEFINER helper.
DO $$
DECLARE fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.sig);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.sig);
  END LOOP;
END $$;

-- Helpers that only reveal whether a listing is public stay callable by signed-in users only.
REVOKE ALL ON FUNCTION public.project_is_listed(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.financial_summary_is_listed(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.sustainability_is_listed(uuid) FROM anon;

-- Trigger functions must never be callable from the API.
REVOKE ALL ON FUNCTION public.handle_new_investor() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.inherit_project_document_access() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_project_document_grants() FROM anon, authenticated;


-- 2. access_request: only the project owner may decide. Investors can submit and withdraw.

CREATE OR REPLACE FUNCTION public.enforce_access_request_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE is_owner boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW; -- service role / trusted server-side code
  END IF;
  is_owner := public.owns_project(auth.uid(), NEW.project_id);

  IF TG_OP = 'INSERT' THEN
    IF NOT is_owner THEN
      NEW.state := 'pending';
      NEW.status := 'requested';
      NEW.scope_granted := NULL;
      NEW.decided_at := NULL;
      NEW.decided_by := NULL;
      NEW.decision_note := NULL;
      NEW.decline_reason := NULL;
      NEW.nda_effective_at := NULL;
      NEW.introduction_logged_at := NULL;
      NEW.fee_tail_expires_at := NULL;
      NEW.reopen_allowed_at := NULL;
      NEW.developer_question := NULL;
      NEW.developer_question_at := NULL;
    END IF;
    RETURN NEW;
  END IF;

  IF NOT is_owner THEN
    -- Investor side: may only re-submit (pending) or withdraw; decision fields are frozen.
    IF NEW.state NOT IN ('pending', 'withdrawn') THEN
      RAISE EXCEPTION 'Only the project owner can decide an access request';
    END IF;
    IF NEW.status NOT IN ('requested', 'withdrawn') THEN
      RAISE EXCEPTION 'Only the project owner can decide an access request';
    END IF;
    NEW.scope_granted := OLD.scope_granted;
    NEW.decided_by := OLD.decided_by;
    NEW.decision_note := OLD.decision_note;
    NEW.decline_reason := OLD.decline_reason;
    NEW.nda_effective_at := OLD.nda_effective_at;
    NEW.introduction_logged_at := OLD.introduction_logged_at;
    NEW.fee_tail_expires_at := OLD.fee_tail_expires_at;
    NEW.reopen_allowed_at := OLD.reopen_allowed_at;
    NEW.developer_question := OLD.developer_question;
    NEW.developer_question_at := OLD.developer_question_at;
    NEW.investor_user_id := OLD.investor_user_id;
    NEW.project_id := OLD.project_id;
  ELSE
    NEW.decided_by := auth.uid();
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.enforce_access_request_decision() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_access_request_decision ON public.access_request;
CREATE TRIGGER enforce_access_request_decision
  BEFORE INSERT OR UPDATE ON public.access_request
  FOR EACH ROW EXECUTE FUNCTION public.enforce_access_request_decision();

DROP POLICY IF EXISTS "access_request_insert_own" ON public.access_request;
CREATE POLICY "access_request_insert_own" ON public.access_request FOR INSERT TO authenticated
  WITH CHECK (
    investor_user_id = auth.uid()
    AND state = 'pending'::access_state
    AND status = 'requested'::request_status
    AND scope_granted IS NULL
    AND decided_by IS NULL
    AND decided_at IS NULL
    AND nda_effective_at IS NULL
  );

DROP POLICY IF EXISTS "access_request_investor_update" ON public.access_request;
CREATE POLICY "access_request_investor_update" ON public.access_request FOR UPDATE TO authenticated
  USING (investor_user_id = auth.uid())
  WITH CHECK (
    investor_user_id = auth.uid()
    AND state IN ('pending'::access_state, 'withdrawn'::access_state)
    AND scope_granted IS NULL
  );


-- 3. document_access_grant: a user may only ask; only the document owner may approve.

DROP POLICY IF EXISTS "grant_insert_own" ON public.document_access_grant;
CREATE POLICY "grant_insert_own" ON public.document_access_grant FOR INSERT TO authenticated
  WITH CHECK (
    public.owns_document(auth.uid(), document_id)
    OR (
      user_id = auth.uid()
      AND status = 'requested'::request_status
      AND granted_at IS NULL
      AND granted_by IS NULL
    )
  );

CREATE OR REPLACE FUNCTION public.enforce_document_grant_approval()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT public.owns_document(auth.uid(), NEW.document_id) THEN
    IF NEW.status <> 'requested'::request_status THEN
      RAISE EXCEPTION 'Only the document owner can approve document access';
    END IF;
    NEW.granted_by := NULL;
    NEW.granted_at := NULL;
  ELSE
    IF NEW.status = 'approved'::request_status THEN
      NEW.granted_by := auth.uid();
      NEW.granted_at := coalesce(NEW.granted_at, now());
    END IF;
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.enforce_document_grant_approval() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_document_grant_approval ON public.document_access_grant;
CREATE TRIGGER enforce_document_grant_approval
  BEFORE INSERT OR UPDATE ON public.document_access_grant
  FOR EACH ROW EXECUTE FUNCTION public.enforce_document_grant_approval();


-- 4. nda_signature: server records who signed, when and from where.

CREATE OR REPLACE FUNCTION public.stamp_nda_signature()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE header_ip text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  NEW.signed_at := now();
  BEGIN
    header_ip := nullif(btrim(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1)), '');
  EXCEPTION WHEN others THEN
    header_ip := NULL;
  END;
  NEW.ip_address := header_ip;
  IF btrim(coalesce(NEW.signatory_name, '')) = '' THEN
    RAISE EXCEPTION 'A signatory name is required';
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.stamp_nda_signature() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS stamp_nda_signature ON public.nda_signature;
CREATE TRIGGER stamp_nda_signature
  BEFORE INSERT OR UPDATE ON public.nda_signature
  FOR EACH ROW EXECUTE FUNCTION public.stamp_nda_signature();

DROP POLICY IF EXISTS "nda_signature_insert_own" ON public.nda_signature;
CREATE POLICY "nda_signature_insert_own" ON public.nda_signature FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND btrim(coalesce(signatory_name, '')) <> '');
