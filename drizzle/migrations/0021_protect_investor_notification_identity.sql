CREATE OR REPLACE FUNCTION private.investor_notification_title(_project_id uuid, _user_id uuid, _state public.access_state DEFAULT NULL)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $function$
  SELECT CASE
    WHEN private.owns_project(_user_id, _project_id)
      OR CASE WHEN _state IS NOT NULL THEN _state IN ('granted', 'granted_full')
              ELSE EXISTS (SELECT 1 FROM public.access_request r WHERE r.project_id = _project_id AND r.investor_user_id = _user_id AND r.state IN ('granted', 'granted_full')) END
    THEN (SELECT p.title FROM public.project p WHERE p.id = _project_id)
    ELSE (SELECT t.teaser_title FROM public.project_teaser t WHERE t.id = _project_id)
  END
$function$;
REVOKE ALL ON FUNCTION private.investor_notification_title(uuid, uuid, public.access_state) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.notify_access_request_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $function$
DECLARE owner_id uuid; project_title text; investor_title text; project_slug text;
BEGIN
  SELECT dp.user_id, p.title, p.slug INTO owner_id, project_title, project_slug
  FROM public.project p JOIN public.developer_profiles dp ON dp.id = p.developer_id
  WHERE p.id = NEW.project_id;
  IF TG_OP = 'INSERT' THEN
    IF owner_id IS NOT NULL THEN
      INSERT INTO public.notification (user_id, kind, title, body, link, project_id, access_request_id, dedupe_key)
      VALUES (owner_id, 'access_request_received', 'New access request',
        'An investor requested access to ' || coalesce(project_title, 'your listing') || '. Review and decide on the access requests screen.',
        '/app/access-requests?request=' || NEW.id::text, NEW.project_id, NEW.id, 'access_request_received:' || NEW.id::text)
      ON CONFLICT (dedupe_key) DO NOTHING;
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.state IS DISTINCT FROM OLD.state THEN
    investor_title := coalesce(private.investor_notification_title(NEW.project_id, NEW.investor_user_id, NEW.state), 'A listing');
    INSERT INTO public.notification (user_id, kind, title, body, link, project_id, access_request_id, dedupe_key)
    VALUES (NEW.investor_user_id, 'access_request_' || NEW.state::text,
      CASE NEW.state::text WHEN 'granted' THEN 'Access granted' WHEN 'granted_full' THEN 'Data room access granted'
        WHEN 'declined' THEN 'Access request declined' WHEN 'withdrawn' THEN 'Access request withdrawn'
        WHEN 'lapsed' THEN 'Access request lapsed' ELSE 'Access request updated' END,
      CASE WHEN NEW.state = 'granted_full' THEN 'You now have access to the data room for ' || investor_title || '.'
        ELSE investor_title || ': your access request is now ' || replace(NEW.state::text, '_', ' ') || '.' END,
      '/app/projects/' || project_slug, NEW.project_id, NEW.id,
      'access_request_state:' || NEW.id::text || ':' || NEW.state::text)
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;
  RETURN NEW;
END
$function$;

CREATE OR REPLACE FUNCTION public.notify_question_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $function$
DECLARE owner_id uuid; project_title text; project_slug text; investor_title text;
BEGIN
  SELECT dp.user_id, p.title, p.slug INTO owner_id, project_title, project_slug
  FROM public.project p JOIN public.developer_profiles dp ON dp.id = p.developer_id WHERE p.id = NEW.project_id;
  IF TG_OP = 'INSERT' THEN
    IF owner_id IS NOT NULL AND owner_id <> NEW.author_id THEN
      INSERT INTO public.notification (user_id, kind, title, body, link, project_id, dedupe_key)
      VALUES (owner_id, 'question_received', 'New investor question',
        'An investor asked a question about ' || coalesce(project_title, 'your listing') || '. Answer it on the Q&A tab.',
        '/app/projects/' || project_slug || '?tab=qa', NEW.project_id, 'question_received:' || NEW.id::text)
      ON CONFLICT (dedupe_key) DO NOTHING;
    END IF;
  ELSIF NEW.answer_body IS NOT NULL AND OLD.answer_body IS NULL THEN
    investor_title := coalesce(private.investor_notification_title(NEW.project_id, NEW.author_id), 'a listing');
    INSERT INTO public.notification (user_id, kind, title, body, link, project_id, dedupe_key)
    VALUES (NEW.author_id, 'question_answered', 'Your question was answered',
      'The developer of ' || investor_title || ' answered your question.',
      '/app/projects/' || project_slug || '?tab=qa', NEW.project_id, 'question_answered:' || NEW.id::text)
    ON CONFLICT (dedupe_key) DO NOTHING;
  END IF;
  RETURN NEW;
END
$function$;