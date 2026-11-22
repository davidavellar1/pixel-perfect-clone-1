ALTER TABLE public.question ADD COLUMN IF NOT EXISTS declined_at timestamptz, ADD COLUMN IF NOT EXISTS decline_reason text;
DROP POLICY IF EXISTS question_read ON public.question;
CREATE POLICY question_read ON public.question FOR SELECT TO authenticated USING (author_id=auth.uid() OR private.owns_project(auth.uid(),project_id));
CREATE OR REPLACE FUNCTION public.answer_question(_question_id uuid,_answer text,_publish boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.question; BEGIN
SELECT * INTO q FROM public.question WHERE id=_question_id FOR UPDATE;
IF q.id IS NULL OR NOT private.owns_project(auth.uid(),q.project_id) THEN RAISE EXCEPTION 'Only the project developer can answer' USING ERRCODE='42501'; END IF;
IF length(btrim(_answer)) NOT BETWEEN 2 AND 3000 THEN RAISE EXCEPTION 'Answer must contain 2 to 3000 characters'; END IF;
IF q.answered_at IS NOT NULL OR q.declined_at IS NOT NULL THEN RAISE EXCEPTION 'Question already resolved'; END IF;
UPDATE public.question SET answer_body=btrim(_answer),answered_at=now(),answered_by=auth.uid(),is_public=false WHERE id=q.id;
END $$;
REVOKE ALL ON FUNCTION public.answer_question(uuid,text,boolean) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.answer_question(uuid,text,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.decline_question(_question_id uuid,_reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE q public.question; title text; slug text; BEGIN
SELECT * INTO q FROM public.question WHERE id=_question_id FOR UPDATE;
IF q.id IS NULL OR NOT private.owns_project(auth.uid(),q.project_id) THEN RAISE EXCEPTION 'Only the project developer can decline' USING ERRCODE='42501'; END IF;
IF length(btrim(_reason)) NOT BETWEEN 2 AND 3000 THEN RAISE EXCEPTION 'Reason must contain 2 to 3000 characters'; END IF;
IF q.answered_at IS NOT NULL OR q.declined_at IS NOT NULL THEN RAISE EXCEPTION 'Question already resolved'; END IF;
UPDATE public.question SET declined_at=now(),decline_reason=btrim(_reason),answered_by=auth.uid(),is_public=false WHERE id=q.id;
SELECT p.slug INTO slug FROM public.project p WHERE p.id=q.project_id;
title:=private.investor_notification_title(q.project_id,q.author_id);
INSERT INTO public.notification(user_id,kind,title,body,link,project_id,dedupe_key) VALUES(q.author_id,'question_declined','Your question was declined','The developer of '||coalesce(title,'a listing')||' declined your question. The reason remains in your private thread.','/app/projects/'||slug||'?tab=qa',q.project_id,'question_declined:'||q.id) ON CONFLICT(dedupe_key) DO NOTHING;
END $$;
REVOKE ALL ON FUNCTION public.decline_question(uuid,text) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.decline_question(uuid,text) TO authenticated;
CREATE OR REPLACE FUNCTION public.question_response_record(_project_id uuid) RETURNS TABLE(median_hours numeric,declined_count bigint,open_count bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT (percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (coalesce(q.answered_at,q.declined_at)-q.created_at))/3600) FILTER(WHERE q.answered_at IS NOT NULL OR q.declined_at IS NOT NULL))::numeric,count(*) FILTER(WHERE q.declined_at IS NOT NULL),count(*) FILTER(WHERE q.answered_at IS NULL AND q.declined_at IS NULL)
FROM public.question q WHERE q.project_id=_project_id AND (private.owns_project(auth.uid(),_project_id) OR private.has_project_access(auth.uid(),_project_id)) HAVING private.owns_project(auth.uid(),_project_id) OR private.has_project_access(auth.uid(),_project_id);
$$;
REVOKE ALL ON FUNCTION public.question_response_record(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.question_response_record(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.notify_stage_followers() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE teaser text; slug text; BEGIN
SELECT t.teaser_title,t.slug INTO teaser,slug FROM public.project_teaser t WHERE t.id=NEW.project_id;
INSERT INTO public.notification(user_id,kind,title,body,link,project_id,dedupe_key)
SELECT w.user_id,'project_stage_promoted','A followed project advanced',coalesce(teaser,'A listing')||' moved from '||NEW.from_stage::text||' to '||NEW.to_stage::text||'. Developer-stated.','/app/projects/'||slug,NEW.project_id,'stage_follow:'||NEW.id||':'||w.user_id FROM public.watchlist_item w WHERE w.project_id=NEW.project_id ON CONFLICT(dedupe_key) DO NOTHING;
RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.notify_stage_followers() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER stage_follow_notice AFTER INSERT ON public.project_stage_event FOR EACH ROW EXECUTE FUNCTION public.notify_stage_followers();
DO $patch$ DECLARE definition text; BEGIN SELECT pg_get_functiondef('public.save_stage_listing(jsonb,jsonb,uuid,boolean,integer)'::regprocedure) INTO definition; definition:=replace(definition,'''equity_shareholder_loan''','''equity_and_shareholder_loan'''); EXECUTE definition; END $patch$;