DROP POLICY IF EXISTS nda_document_version_read ON public.nda_document_version;
REVOKE SELECT ON public.nda_document_version FROM anon;
CREATE POLICY nda_document_version_read ON public.nda_document_version FOR SELECT TO authenticated
USING (auth.uid() IS NOT NULL AND effective_from <= now());
DROP POLICY IF EXISTS news_source_read ON public.news_source;
REVOKE SELECT ON public.news_source FROM anon;
CREATE POLICY news_source_read ON public.news_source FOR SELECT TO authenticated
USING (active OR private.has_role(auth.uid(), 'admin'::app_role));