CREATE TABLE public.subscription(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL,provider_customer_id text,provider_subscription_id text UNIQUE,status text NOT NULL DEFAULT 'inactive' CHECK(status IN ('inactive','active','trialing','past_due','canceled')),current_period_end timestamptz,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.subscription TO authenticated; GRANT ALL ON public.subscription TO service_role;
ALTER TABLE public.subscription ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_owner_read ON public.subscription FOR SELECT TO authenticated USING(user_id=auth.uid());
ALTER TABLE public.project ADD COLUMN IF NOT EXISTS band_until_acceptance boolean NOT NULL DEFAULT false,ADD COLUMN IF NOT EXISTS subscriber_disclosure_consent_at timestamptz,ADD COLUMN IF NOT EXISTS subscriber_preview_fingerprint text;
CREATE OR REPLACE FUNCTION public.is_subscriber() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$ SELECT auth.uid() IS NOT NULL AND EXISTS(SELECT 1 FROM public.subscription s WHERE s.user_id=auth.uid() AND s.status IN ('active','trialing') AND s.current_period_end>now()); $$;
REVOKE ALL ON FUNCTION public.is_subscriber() FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.is_subscriber() TO authenticated;
CREATE OR REPLACE FUNCTION public.subscriber_document(_document jsonb,_banded boolean DEFAULT false) RETURNS jsonb LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE a jsonb:='{}';rows jsonb:='{}'; k text;v text;r jsonb;safe jsonb;items jsonb;stage text:=_document->>'stage';
BEGIN
IF _document IS NULL THEN RETURN NULL; END IF;
FOR k,v IN SELECT key,value FROM jsonb_each_text(coalesce(_document->'answers','{}')) LOOP
IF k IN ('country','projectType','technology','asOf','capacityBasis','capexBasis','precision','returnBasis','studyStatus','site','anchor','studyAuthor','epcStatus','epcType','debtStatus','revenueModel','eed','transactionType','fundingPlan','dnsh','regulated','vehicleAccounts','sponsorAccounts','sponsorDebt','vehicleDebt','vehicleDebtDisclosure','constructionAppetite','risk1','risk2','risk3','stopper') THEN
 IF k='revenueModel' THEN CONTINUE; END IF;
 IF length(v)<100 AND v !~ '[<>@]' THEN a:=a||jsonb_build_object(k,v); END IF;
ELSIF k IN ('capacity','capex','existingLoad','networkLength','existingHeat','existingSupply','existingReturn','existingLoss','households','designSupply','designReturn','designHeat','designLoad','contractedLoad','signedLoad','negotiationLoad','buildings','grantSplit','debtSplit','equitySplit','equitySought','minTicket','baseIrr','cashYield','debtAmount','debtTenor','constructionProgress','historyYears','realisedDscr','tariff','stake') AND v ~ '^\d+(\.\d+)?$' AND NOT _banded THEN a:=a||jsonb_build_object(k,v);
ELSIF k IN ('studyDate','studyExpected','dnshDate','progressDate','commissioning','operationalClose') AND v ~ '^\d{4}-\d{2}-\d{2}$' THEN a:=a||jsonb_build_object(k,v);
ELSIF k IN ('targetClose','indicativeClose') AND v ~ '^\d{4}( Q[1-4]| H[12])?$' THEN a:=a||jsonb_build_object(k,v);
ELSIF k IN ('instruments') AND v ~ '^(equity|equity_and_shareholder_loan|preferred_equity|mezzanine|convertible)(,(equity|equity_and_shareholder_loan|preferred_equity|mezzanine|convertible))*$' THEN a:=a||jsonb_build_object(k,v);
ELSIF k ~ '^dnshStatus[0-5]$' AND v IN ('Substantial contribution','Addressed','Not addressed') THEN a:=a||jsonb_build_object(k,v);
END IF;
END LOOP;
IF NOT _banded THEN
FOR k IN SELECT unnest(ARRAY['actuals','designMix','existingMix','capital','timeline']) LOOP
items:='[]';
FOR r IN SELECT value FROM jsonb_array_elements(coalesce(_document->'rows'->k,'[]')) LOOP
safe:='{}';
IF k='actuals' THEN FOR v IN SELECT unnest(ARRAY['year','output','losses','revenue','opex']) LOOP IF r->>v ~ '^\d+(\.\d+)?$' THEN safe:=safe||jsonb_build_object(v,r->>v); END IF;END LOOP;
ELSIF k IN ('designMix','existingMix') THEN IF r->>'source' IN ('Waste heat','Geothermal','Large heat pump','Heat pump','Solar thermal','Biomass','Biomass / CHP','Gas','Natural gas','Thermal storage','Hybrid','Electricity','CHP') AND r->>'share' ~ '^\d+(\.\d+)?$' THEN safe:=jsonb_build_object('source',r->>'source','share',r->>'share');END IF;
ELSIF k='capital' THEN IF r->>'amount' ~ '^\d+(\.\d+)?$' THEN safe:=jsonb_build_object('label','Capital line '||(jsonb_array_length(items)+1),'amount',r->>'amount');END IF;
ELSIF k='timeline' THEN IF r->>'date' ~ '^\d{4}-\d{2}-\d{2}$' THEN safe:=jsonb_build_object('label','Development milestone '||(jsonb_array_length(items)+1),'date',r->>'date');END IF;
END IF;
IF safe<>'{}' THEN items:=items||jsonb_build_array(safe);END IF;
END LOOP;rows:=rows||jsonb_build_object(k,items);
END LOOP;
END IF;
RETURN jsonb_build_object('version',_document->>'version','stage',stage,'answers',a,'rows',rows,'askedFields',coalesce(_document->'askedFields','[]'),'step','basics');
END $$;
GRANT EXECUTE ON FUNCTION public.subscriber_document(jsonb,boolean) TO authenticated;
CREATE OR REPLACE FUNCTION public.subscriber_project(_project_id uuid) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE p public.project;accepted boolean; BEGIN
IF NOT public.is_subscriber() THEN RAISE EXCEPTION 'An active subscription is required' USING ERRCODE='42501'; END IF;
SELECT * INTO p FROM public.project WHERE id=_project_id AND visibility='listed';
IF p.id IS NULL OR p.subscriber_disclosure_consent_at IS NULL THEN RETURN NULL; END IF;
accepted:=private.has_project_access(auth.uid(),p.id);
RETURN jsonb_build_object('id',p.id,'document',public.subscriber_document(p.submission_published,p.band_until_acceptance AND NOT accepted),'exact',NOT p.band_until_acceptance OR accepted);
END $$;
REVOKE ALL ON FUNCTION public.subscriber_project(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.subscriber_project(uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.subscriber_document_index(_project_id uuid) RETURNS TABLE(id uuid,label text,file_type text,created_at timestamptz,access_level public.document_access) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT d.id,'Project document '||row_number() OVER(ORDER BY d.created_at,d.id),CASE WHEN d.file_type IN ('pdf','doc','docx','xls','xlsx','csv','ppt','pptx') THEN d.file_type ELSE 'file' END,d.created_at,d.access_level FROM public.document d JOIN public.project p ON p.id=d.project_id WHERE d.project_id=_project_id AND p.visibility='listed' AND p.subscriber_disclosure_consent_at IS NOT NULL AND public.is_subscriber(); $$;
REVOKE ALL ON FUNCTION public.subscriber_document_index(uuid) FROM PUBLIC,anon; GRANT EXECUTE ON FUNCTION public.subscriber_document_index(uuid) TO authenticated;
DO $patch$ DECLARE definition text; BEGIN SELECT pg_get_functiondef('public.save_stage_listing(jsonb,jsonb,uuid,boolean,integer)'::regprocedure) INTO definition;
definition:=replace(definition,'IF _publish THEN','IF _publish THEN
 IF a->>''subscriberPreviewConsent''<>''yes'' OR a->>''subscriberPreviewConsent'' IS NULL THEN RAISE EXCEPTION ''Review and consent to the subscriber disclosure preview''; END IF;');
definition:=replace(definition,'submission_published=_document,','band_until_acceptance=coalesce(a->>''bandUntilAcceptance''=''yes'',false),subscriber_disclosure_consent_at=now(),subscriber_preview_fingerprint=md5(public.subscriber_document(_document,coalesce(a->>''bandUntilAcceptance''=''yes'',false))::text),submission_published=_document,');
EXECUTE definition;END $patch$;