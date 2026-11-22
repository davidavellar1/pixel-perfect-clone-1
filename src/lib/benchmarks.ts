import type { Tables } from "@/integrations/supabase/types";
import type { SubmissionDocument } from "@/lib/submission/stageSchema";

export type BenchmarkRow = Tables<"benchmark">;
export type GenerationClass = "2G" | "3G" | "4G" | "5G";

/**
 * Generation class from the stated supply temperature: 5G under 30 C, 4G under 70 C,
 * 3G up to 120 C, 2G above. No stated temperature means no class, so no benchmark.
 */
export function generationClass(supplyC: number | null): GenerationClass | null {
  if (supplyC === null || !Number.isFinite(supplyC)) return null;
  return supplyC < 30 ? "5G" : supplyC < 70 ? "4G" : supplyC <= 120 ? "3G" : "2G";
}

const num = (value: string | undefined) => { const n = Number(value); return value?.trim() && Number.isFinite(n) ? n : null; };

export const BENCHMARK_METRICS = [
  { metric: "supply_temperature_c", label: "Supply temperature", unit: "C" },
  { metric: "return_temperature_c", label: "Return temperature", unit: "C" },
  { metric: "network_loss_pct", label: "Network heat losses", unit: "%" },
  { metric: "linear_heat_density_mwh_m", label: "Linear heat density", unit: "MWh/m a year" },
  { metric: "capex_per_mw_eur", label: "Capex per MW", unit: "EUR/MW" },
] as const;

/** The project's own developer-stated figures for each metric, or null when an input is missing. */
export function projectMetrics(document: SubmissionDocument | null | undefined) {
  const a = document?.answers ?? {};
  const supply = num(a["designSupply"]) ?? num(a["existingSupply"]);
  const heatGwh = num(a["designHeat"]) ?? num(a["existingHeat"]);
  const lengthKm = num(a["networkLength"]);
  const capex = num(a["capex"]); const capacity = num(a["capacity"]);
  return {
    supply_temperature_c: supply,
    return_temperature_c: num(a["designReturn"]) ?? num(a["existingReturn"]),
    network_loss_pct: num(a["existingLoss"]),
    linear_heat_density_mwh_m: heatGwh !== null && lengthKm ? heatGwh * 1000 / (lengthKm * 1000) : null,
    capex_per_mw_eur: capex !== null && capacity ? capex / capacity : null,
  } as Record<(typeof BENCHMARK_METRICS)[number]["metric"], number | null>;
}

export const benchmarkText = (row: Pick<BenchmarkRow, "low" | "high" | "central" | "unit">) =>
  row.low !== null && row.high !== null ? `${row.low.toLocaleString("en-GB")} to ${row.high.toLocaleString("en-GB")} ${row.unit}` : `${(row.central ?? 0).toLocaleString("en-GB")} ${row.unit}`;
