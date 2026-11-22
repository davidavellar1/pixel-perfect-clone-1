import type { FieldResolution } from "./projectAbsence";

/**
 * Annual emissions from stated output, the stated design mix and sourced country factors.
 * A source counts only when the library holds a sourced factor for it; if any share of the mix
 * has no factor, the project figure is absent rather than estimated. Lifetime figures are never
 * computed: no operating life is recorded.
 */
export interface CountryFactors { gridKgPerMwh: number | null; counterfactualKgPerMwh: number | null }
export interface MixRow { source: string; share: number }

/** Sources whose emissions follow a country factor in the library. */
const FACTOR_FOR_SOURCE: Record<string, keyof CountryFactors> = {
  Electricity: "gridKgPerMwh",
  Gas: "counterfactualKgPerMwh",
  "Natural gas": "counterfactualKgPerMwh",
};

export function parseMix(rows: Record<string, string>[] | undefined): MixRow[] {
  return (rows ?? []).flatMap((row) => {
    const share = Number(row["share"]);
    return row["source"] && Number.isFinite(share) && share > 0 ? [{ source: row["source"], share }] : [];
  });
}

export interface CarbonFigures {
  outputMwh: number;
  baselineTonnes: number;
  projectTonnes: number;
  reductionTonnes: number;
  bySource: { source: string; heatShare: number; emissionsShare: number }[];
  inputs: { outputGwh: number; factors: CountryFactors };
}

export function annualCarbon(outputGwh: number | null, mix: MixRow[], factors: CountryFactors): FieldResolution<CarbonFigures> {
  if (outputGwh === null || !Number.isFinite(outputGwh) || outputGwh <= 0) return { kind: "absence", reason: "not_asked" };
  if (!mix.length || Math.abs(mix.reduce((sum, row) => sum + row.share, 0) - 100) > 0.5) return { kind: "absence", reason: "not_asked" };
  if (factors.counterfactualKgPerMwh === null) return { kind: "absence", reason: "not_provided" };
  const outputMwh = outputGwh * 1000;
  const perSource = mix.map((row) => {
    const key = FACTOR_FOR_SOURCE[row.source];
    const factor = key ? factors[key] : null;
    return { ...row, tonnes: factor === null ? null : outputMwh * row.share / 100 * factor / 1000 };
  });
  if (perSource.some((row) => row.tonnes === null)) return { kind: "absence", reason: "not_provided" };
  const projectTonnes = perSource.reduce((sum, row) => sum + (row.tonnes ?? 0), 0);
  const baselineTonnes = outputMwh * factors.counterfactualKgPerMwh / 1000;
  return { kind: "value", value: {
    outputMwh, baselineTonnes, projectTonnes, reductionTonnes: baselineTonnes - projectTonnes,
    bySource: perSource.map((row) => ({ source: row.source, heatShare: row.share, emissionsShare: projectTonnes > 0 ? (row.tonnes ?? 0) / projectTonnes * 100 : 0 })),
    inputs: { outputGwh, factors },
  } };
}
