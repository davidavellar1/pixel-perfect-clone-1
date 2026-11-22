import type { Tables } from "@/integrations/supabase/types";
import { absenceCopy } from "@/lib/projectAbsence";

export type CountryProfile = Tables<"country_profile">;

/** Country library fields. Each value is stored with its source, source title, data year and confidence. */
export const COUNTRY_FIELDS = [
  { key: "regulatory_regime", label: "Regulatory regime", unit: "" },
  { key: "heat_price_regulation", label: "Heat price regulation", unit: "" },
  { key: "regulator", label: "Price or licensing authority", unit: "" },
  { key: "connection_obligation", label: "Connection obligation or zoning", unit: "" },
  { key: "dh_share_of_heat_pct", label: "District heating share of heat demand", unit: "%" },
  { key: "grid_emission_factor_kg_mwh", label: "Grid electricity emission factor", unit: "kg CO2e/MWh" },
  { key: "counterfactual_emission_factor_kg_mwh", label: "Counterfactual heat emission factor", unit: "kg CO2e/MWh" },
  { key: "carbon_price_regime", label: "Carbon pricing applicable to heat", unit: "" },
] as const;
export type CountryFieldKey = (typeof COUNTRY_FIELDS)[number]["key"];

export interface CountryFact {
  key: CountryFieldKey;
  label: string;
  value: string | null;
  numeric: number | null;
  absence: string | null;
  source: { url: string; title: string; year: number; confidence: string } | null;
}

/** One entry per field. A missing value renders the R2 absence copy, never a default or an estimate. */
export function countryFacts(row: CountryProfile | null): CountryFact[] {
  return COUNTRY_FIELDS.map(({ key, label, unit }) => {
    const raw = row ? row[key] : null;
    const record = row as unknown as Record<string, unknown> | null;
    const url = record?.[`${key}_source`]; const title = record?.[`${key}_source_title`];
    const year = record?.[`${key}_data_year`]; const confidence = record?.[`${key}_confidence`];
    const sourced = typeof url === "string" && typeof title === "string" && typeof year === "number" && typeof confidence === "string";
    if (raw === null || raw === undefined || raw === "" || !sourced) {
      return { key, label, value: null, numeric: null, absence: absenceCopy({ kind: "absence", reason: "not_provided" }, ""), source: null };
    }
    const numeric = typeof raw === "number" ? raw : null;
    return { key, label, value: numeric !== null ? `${numeric.toLocaleString("en-GB")}${unit ? ` ${unit}` : ""}` : String(raw), numeric, absence: null, source: { url, title, year, confidence } };
  });
}

/** A country factor only when it is sourced; otherwise null so dependent calculations stay absent. */
export const countryFactor = (row: CountryProfile | null, key: "grid_emission_factor_kg_mwh" | "counterfactual_emission_factor_kg_mwh") =>
  countryFacts(row).find((fact) => fact.key === key)?.numeric ?? null;
