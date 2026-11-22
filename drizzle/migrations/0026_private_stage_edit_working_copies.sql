CREATE TABLE public.project_submission_work (project_id uuid PRIMARY KEY REFERENCES public.project(id) ON DELETE CASCADE, owner_user_id uuid NOT NULL, document jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.project_submission_work TO authenticated;
GRANT ALL ON public.project_submission_work TO service_role;
ALTER TABLE public.project_submission_work ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read working submissions" ON public.project_submission_work FOR SELECT TO authenticated USING (owner_user_id=auth.uid());
DO $patch$
DECLARE definition text;
BEGIN
 SELECT pg_get_functiondef('public.save_stage_listing(jsonb,jsonb,uuid,boolean,integer)'::regprocedure) INTO definition;
 definition:=replace(definition,'submission_draft=_document,submission_revision=submission_revision+1','submission_draft=CASE WHEN visibility=''draft'' THEN _document ELSE NULL END,submission_revision=submission_revision+1');
 definition:=replace(definition,'IF NOT _publish THEN','IF NOT _publish THEN
  INSERT INTO public.project_submission_work(project_id,owner_user_id,document) VALUES(pid,uid,_document) ON CONFLICT(project_id) DO UPDATE SET document=excluded.document,updated_at=now();');
 definition:=replace(definition,'UPDATE public.project SET title=a->>''title''','DELETE FROM public.project_submission_work WHERE project_id=pid;
 UPDATE public.project SET title=a->>''title''');
 EXECUTE definition;
END $patch$;