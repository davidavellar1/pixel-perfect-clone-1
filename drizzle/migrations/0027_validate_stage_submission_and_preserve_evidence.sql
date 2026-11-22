DO $patch$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.save_stage_listing(jsonb,jsonb,uuid,boolean,integer)'::regprocedure) INTO definition;
 definition:=replace(definition,'IF _publish THEN','IF _publish THEN
  IF a->>''mandate''<>''yes'' OR a->>''electronicConsent''<>''yes'' OR a->>''mandate'' IS NULL OR a->>''electronicConsent'' IS NULL THEN RAISE EXCEPTION ''Listing mandate and electronic execution consent are required''; END IF;
  IF stage=''concept'' THEN
   _document:=jsonb_set(jsonb_set(_document,''{answers,capacityBasis}'',''"estimated"''),''{answers,capexBasis}'',''"estimated"'');
  ELSIF stage=''feasibility'' THEN
   _document:=jsonb_set(jsonb_set(_document,''{answers,capacityBasis}'',''"modelled"''),''{answers,capexBasis}'',''"modelled"'');
  END IF;
  a:=_document->''answers'';
  FOR key IN SELECT jsonb_object_keys(a) LOOP
   IF key ~ ''^dnshText[0-5]$'' AND length(a->>key)>300 THEN RAISE EXCEPTION ''DNSH statements are limited to 300 characters''; END IF;
  END LOOP;
  IF a->>''capacityBasis'' NOT IN (''measured'',''modelled'',''estimated'') OR a->>''capexBasis'' NOT IN (''measured'',''modelled'',''estimated'') THEN RAISE EXCEPTION ''Capacity and capex need a basis''; END IF;
  IF stage IN (''feasibility'',''development'',''construction'') THEN
   IF coalesce((SELECT sum((value->>''share'')::numeric) FROM jsonb_array_elements(coalesce(_document->''rows''->''designMix'',''[]''))),0)<>100 THEN RAISE EXCEPTION ''Design energy shares must total 100''; END IF;
   IF (a->>''contractedLoad'')::numeric<0 OR (a->>''signedLoad'')::numeric<0 OR (a->>''negotiationLoad'')::numeric<0 OR (a->>''contractedLoad'')::numeric+(a->>''signedLoad'')::numeric+(a->>''negotiationLoad'')::numeric>100 THEN RAISE EXCEPTION ''New load shares must be non-negative and total no more than 100''; END IF;
  END IF;
  IF stage IN (''development'',''construction'') THEN
   IF jsonb_array_length(coalesce(_document->''rows''->''timeline'',''[]''))<>5 THEN RAISE EXCEPTION ''Five development dates are required''; END IF;
   IF jsonb_array_length(coalesce(_document->''rows''->''capital'',''[]''))<>4 THEN RAISE EXCEPTION ''Four capital lines are required''; END IF;
   FOR row IN SELECT value FROM jsonb_array_elements(_document->''rows''->''timeline'') LOOP IF nullif(row->>''date'','''') IS NULL THEN RAISE EXCEPTION ''Complete each development date''; END IF; END LOOP;
   FOR row IN SELECT value FROM jsonb_array_elements(_document->''rows''->''capital'') LOOP IF nullif(row->>''label'','''') IS NULL OR nullif(row->>''amount'','''') IS NULL OR nullif(row->>''status'','''') IS NULL OR (row->>''amount'')::numeric<0 THEN RAISE EXCEPTION ''Complete each capital line and status''; END IF; END LOOP;
  END IF;
  IF stage=''construction'' AND ((a->>''constructionProgress'')::numeric<0 OR (a->>''constructionProgress'')::numeric>100) THEN RAISE EXCEPTION ''Construction progress must be between 0 and 100''; END IF;
  IF stage=''operational'' THEN
   IF jsonb_array_length(coalesce(_document->''rows''->''actuals'',''[]''))<>(a->>''historyYears'')::integer THEN RAISE EXCEPTION ''Actuals must match the available history years''; END IF;
   FOR row IN SELECT value FROM jsonb_array_elements(_document->''rows''->''actuals'') LOOP
    FOREACH key IN ARRAY ARRAY[''year'',''output'',''losses'',''revenue'',''opex''] LOOP IF nullif(row->>key,'''') IS NULL OR (row->>key)::numeric<0 THEN RAISE EXCEPTION ''Complete non-negative operating actuals''; END IF; END LOOP;
   END LOOP;
  END IF;
 ');
 definition:=replace(definition,'IF stage IN (''development'',''construction'',''operational'') THEN
  INSERT INTO public.project_transaction','IF stage IN (''development'',''construction'',''operational'') THEN
  FOR key IN SELECT unnest(string_to_array(a->>''instruments'','','')) LOOP IF key NOT IN (''equity'',''equity_shareholder_loan'',''preferred_equity'',''mezzanine'',''convertible'') THEN RAISE EXCEPTION ''Invalid offered instrument''; END IF; END LOOP;
  INSERT INTO public.project_transaction');
 EXECUTE definition;
END $patch$;