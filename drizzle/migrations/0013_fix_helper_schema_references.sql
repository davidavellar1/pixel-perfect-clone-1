-- Four helpers still called public.owns_project / public.owns_document /
-- public.storage_project_id, which live in the private schema. Re-point them.

CREATE OR REPLACE FUNCTION private.enforce_access_request_decision()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE is_owner boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  is_owner := private.owns_project(auth.uid(), NEW.project_id);

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
END $function$;

CREATE OR REPLACE FUNCTION private.enforce_document_grant_approval()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NOT private.owns_document(auth.uid(), NEW.document_id) THEN
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
END $function$;

CREATE OR REPLACE FUNCTION private.can_read_project_object(_user_id uuid, _name text)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT
    private.owns_project(_user_id, private.storage_project_id(_name))
    OR EXISTS (
      SELECT 1
      FROM public.document d
      WHERE d.storage_path = _name
        AND (
          (
            d.access_level = 'public'
            AND EXISTS (
              SELECT 1 FROM public.access_request ar
              WHERE ar.project_id = d.project_id
                AND ar.investor_user_id = _user_id
                AND ar.state IN ('granted', 'granted_full')
            )
          )
          OR EXISTS (
            SELECT 1 FROM public.document_access_grant g
            WHERE g.document_id = d.id
              AND g.user_id = _user_id
              AND g.status = 'approved'
          )
        )
    )
$function$;

CREATE OR REPLACE FUNCTION private.developer_of_access_request(_user_id uuid, _request_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  select (auth.uid() is null or _user_id = auth.uid())
  and exists (
    select 1 from public.access_request r
    where r.id = _request_id and private.owns_project(_user_id, r.project_id))
$function$;