-- Batch C item 10: benchmark library. One sourced figure per network generation class and metric,
-- with source URL, source title, data year and confidence. Projects are compared only within their
-- own generation class. The table ships empty and is seeded by an admin or the service role.
-- It replaces the unsourced free-text operating_parameter.benchmark, which the app no longer reads
-- or writes (the column stays because the legacy publish_project function still names it).
CREATE TABLE public.benchmark (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_class text NOT NULL CHECK (generation_class IN ('2G','3G','4G','5G')),
  metric text NOT NULL CHECK (metric IN ('supply_temperature_c','return_temperature_c','network_loss_pct','linear_heat_density_mwh_m','capex_per_mw_eur')),
  low numeric,
  high numeric,
  central numeric,
  unit text NOT NULL,
  source text NOT NULL,
  source_title text NOT NULL,
  data_year smallint NOT NULL CHECK (data_year BETWEEN 1990 AND 2100),
  confidence text NOT NULL CHECK (confidence IN ('high','medium','low')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT benchmark_has_value CHECK (central IS NOT NULL OR (low IS NOT NULL AND high IS NOT NULL)),
  CONSTRAINT benchmark_range CHECK (low IS NULL OR high IS NULL OR low <= high),
  UNIQUE (generation_class, metric)
);
ALTER TABLE public.benchmark ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.benchmark FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.benchmark TO authenticated;
CREATE POLICY benchmark_read ON public.benchmark FOR SELECT TO authenticated USING (true);
CREATE POLICY benchmark_admin_write ON public.benchmark FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
