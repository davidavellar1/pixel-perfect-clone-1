-- Batch C item 7 (phase 5): country library. One row per country code. Every value carries its
-- source URL, source title, data year and confidence, and a value cannot be stored without them.
-- The table ships empty: values are researched separately and seeded by an admin or the service
-- role. There is no developer write path. Missing values render the R2 absence copy.
CREATE TABLE public.country_profile (
  country_code character(2) PRIMARY KEY CHECK (country_code ~ '^[A-Z]{2}$'),
  regulatory_regime text,
  regulatory_regime_source text,
  regulatory_regime_source_title text,
  regulatory_regime_data_year smallint CHECK (regulatory_regime_data_year BETWEEN 1990 AND 2100),
  regulatory_regime_confidence text CHECK (regulatory_regime_confidence IN ('high','medium','low')),
  CONSTRAINT regulatory_regime_sourced CHECK (regulatory_regime IS NULL OR (regulatory_regime_source IS NOT NULL AND regulatory_regime_source_title IS NOT NULL AND regulatory_regime_data_year IS NOT NULL AND regulatory_regime_confidence IS NOT NULL)),
  heat_price_regulation text,
  heat_price_regulation_source text,
  heat_price_regulation_source_title text,
  heat_price_regulation_data_year smallint CHECK (heat_price_regulation_data_year BETWEEN 1990 AND 2100),
  heat_price_regulation_confidence text CHECK (heat_price_regulation_confidence IN ('high','medium','low')),
  CONSTRAINT heat_price_regulation_sourced CHECK (heat_price_regulation IS NULL OR (heat_price_regulation_source IS NOT NULL AND heat_price_regulation_source_title IS NOT NULL AND heat_price_regulation_data_year IS NOT NULL AND heat_price_regulation_confidence IS NOT NULL)),
  regulator text,
  regulator_source text,
  regulator_source_title text,
  regulator_data_year smallint CHECK (regulator_data_year BETWEEN 1990 AND 2100),
  regulator_confidence text CHECK (regulator_confidence IN ('high','medium','low')),
  CONSTRAINT regulator_sourced CHECK (regulator IS NULL OR (regulator_source IS NOT NULL AND regulator_source_title IS NOT NULL AND regulator_data_year IS NOT NULL AND regulator_confidence IS NOT NULL)),
  connection_obligation text,
  connection_obligation_source text,
  connection_obligation_source_title text,
  connection_obligation_data_year smallint CHECK (connection_obligation_data_year BETWEEN 1990 AND 2100),
  connection_obligation_confidence text CHECK (connection_obligation_confidence IN ('high','medium','low')),
  CONSTRAINT connection_obligation_sourced CHECK (connection_obligation IS NULL OR (connection_obligation_source IS NOT NULL AND connection_obligation_source_title IS NOT NULL AND connection_obligation_data_year IS NOT NULL AND connection_obligation_confidence IS NOT NULL)),
  dh_share_of_heat_pct numeric,
  dh_share_of_heat_pct_source text,
  dh_share_of_heat_pct_source_title text,
  dh_share_of_heat_pct_data_year smallint CHECK (dh_share_of_heat_pct_data_year BETWEEN 1990 AND 2100),
  dh_share_of_heat_pct_confidence text CHECK (dh_share_of_heat_pct_confidence IN ('high','medium','low')),
  CONSTRAINT dh_share_of_heat_pct_sourced CHECK (dh_share_of_heat_pct IS NULL OR (dh_share_of_heat_pct_source IS NOT NULL AND dh_share_of_heat_pct_source_title IS NOT NULL AND dh_share_of_heat_pct_data_year IS NOT NULL AND dh_share_of_heat_pct_confidence IS NOT NULL)),
  grid_emission_factor_kg_mwh numeric,
  grid_emission_factor_kg_mwh_source text,
  grid_emission_factor_kg_mwh_source_title text,
  grid_emission_factor_kg_mwh_data_year smallint CHECK (grid_emission_factor_kg_mwh_data_year BETWEEN 1990 AND 2100),
  grid_emission_factor_kg_mwh_confidence text CHECK (grid_emission_factor_kg_mwh_confidence IN ('high','medium','low')),
  CONSTRAINT grid_emission_factor_kg_mwh_sourced CHECK (grid_emission_factor_kg_mwh IS NULL OR (grid_emission_factor_kg_mwh_source IS NOT NULL AND grid_emission_factor_kg_mwh_source_title IS NOT NULL AND grid_emission_factor_kg_mwh_data_year IS NOT NULL AND grid_emission_factor_kg_mwh_confidence IS NOT NULL)),
  counterfactual_emission_factor_kg_mwh numeric,
  counterfactual_emission_factor_kg_mwh_source text,
  counterfactual_emission_factor_kg_mwh_source_title text,
  counterfactual_emission_factor_kg_mwh_data_year smallint CHECK (counterfactual_emission_factor_kg_mwh_data_year BETWEEN 1990 AND 2100),
  counterfactual_emission_factor_kg_mwh_confidence text CHECK (counterfactual_emission_factor_kg_mwh_confidence IN ('high','medium','low')),
  CONSTRAINT counterfactual_emission_factor_kg_mwh_sourced CHECK (counterfactual_emission_factor_kg_mwh IS NULL OR (counterfactual_emission_factor_kg_mwh_source IS NOT NULL AND counterfactual_emission_factor_kg_mwh_source_title IS NOT NULL AND counterfactual_emission_factor_kg_mwh_data_year IS NOT NULL AND counterfactual_emission_factor_kg_mwh_confidence IS NOT NULL)),
  carbon_price_regime text,
  carbon_price_regime_source text,
  carbon_price_regime_source_title text,
  carbon_price_regime_data_year smallint CHECK (carbon_price_regime_data_year BETWEEN 1990 AND 2100),
  carbon_price_regime_confidence text CHECK (carbon_price_regime_confidence IN ('high','medium','low')),
  CONSTRAINT carbon_price_regime_sourced CHECK (carbon_price_regime IS NULL OR (carbon_price_regime_source IS NOT NULL AND carbon_price_regime_source_title IS NOT NULL AND carbon_price_regime_data_year IS NOT NULL AND carbon_price_regime_confidence IS NOT NULL)),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.country_profile ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.country_profile FROM anon;
GRANT SELECT ON public.country_profile TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.country_profile TO authenticated;
CREATE POLICY country_profile_read ON public.country_profile FOR SELECT TO authenticated USING (true);
CREATE POLICY country_profile_admin_write ON public.country_profile FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
