-- Security batch A, item 4: sdg_alignment had no write path in the app, nothing renders it,
-- and its free-text note column is attached to a project. Phase 1 specified its deletion.
-- Nothing depends on it (no views, functions or triggers reference it).
DROP POLICY IF EXISTS sdg_alignment_accepted_read ON public.sdg_alignment;--> statement-breakpoint
DROP POLICY IF EXISTS sdg_owner_all ON public.sdg_alignment;--> statement-breakpoint
DROP TABLE IF EXISTS public.sdg_alignment;
