ALTER TABLE public.investor_profiles ADD COLUMN ticket_band public.ticket_band, ADD COLUMN instrument_sought public.instrument_sought, ADD COLUMN construction_risk_appetite public.construction_risk_appetite, ADD COLUMN capital_source public.capital_source, ADD COLUMN decision_process public.decision_process, ADD COLUMN mandate_reviewed_at timestamptz;
UPDATE public.investor_profiles SET ticket_band = CASE WHEN investment_range::text = 'under_1m' THEN 'under_1m'::public.ticket_band WHEN investment_range::text IN ('25m_100m', 'over_100m') THEN '10m_plus'::public.ticket_band ELSE NULL END;
COMMENT ON COLUMN public.investor_profiles.investment_range IS 'DEPRECATED: replaced by ticket_band; overlapping legacy ranges require investor confirmation.';
CREATE FUNCTION public.notify_gate_followup() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE owner_id uuid;
BEGIN
 SELECT dp.user_id INTO owner_id FROM public.project p JOIN public.developer_profiles dp ON dp.id=p.developer_id WHERE p.id=NEW.project_id;
 IF owner_id IS NULL THEN RETURN NEW; END IF;
 IF NEW.investor_reply_at IS DISTINCT FROM OLD.investor_reply_at AND NEW.investor_reply_at IS NOT NULL AND NEW.investor_reply IS NOT NULL THEN
 INSERT INTO public.notification(user_id,kind,title,body,link,project_id,access_request_id,dedupe_key) VALUES(owner_id,'access_request_reply','Investor replied','The investor answered your question. Review their reply and decide.','/app/access-requests?request='||NEW.id,NEW.project_id,NEW.id,'access_request_reply:'||NEW.id||':'||NEW.investor_reply_at) ON CONFLICT(dedupe_key) DO NOTHING;
 END IF;
 IF NEW.state='lapsed' AND NEW.state IS DISTINCT FROM OLD.state THEN
 INSERT INTO public.notification(user_id,kind,title,body,link,project_id,access_request_id,dedupe_key) VALUES(owner_id,'access_request_lapsed','Access request lapsed','No decision within 10 working days. No access was granted and no introduction was logged.','/app/access-requests?request='||NEW.id,NEW.project_id,NEW.id,'access_request_lapsed_owner:'||NEW.id||':'||NEW.submitted_at) ON CONFLICT(dedupe_key) DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.notify_gate_followup() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER gate_followup_notice AFTER UPDATE OF investor_reply_at,state ON public.access_request FOR EACH ROW EXECUTE FUNCTION public.notify_gate_followup();
DO $$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.publish_project(jsonb)'::regprocedure) INTO definition;
 IF position('auto_accept_qualified, notify_users' in definition)=0 THEN RAISE EXCEPTION 'Publish criteria definition differs; migration not applied'; END IF;
 definition := replace(definition,'auto_accept_qualified, notify_users','electronic_execution_consent, electronic_execution_consent_at, notify_users');
 definition := replace(definition,'coalesce((v_child->>''auto_accept_qualified'')::boolean, false),','coalesce((v_child->>''electronic_execution_consent'')::boolean, false), CASE WHEN (v_child->>''electronic_execution_consent'')::boolean THEN now() ELSE NULL END,');
 EXECUTE definition;
END $$;