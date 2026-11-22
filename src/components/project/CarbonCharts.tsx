import { Bar, BarChart, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SubmissionDocument } from "@/lib/submission/stageSchema";
import { annualCarbon, parseMix } from "@/lib/carbon";
import { countryFactor } from "@/lib/countryProfile";
import { useCountryProfile } from "@/hooks/useCountryProfile";

/** Okabe-Ito: distinguishable with the common forms of colour-vision deficiency. */
const OKABE_ITO = ["#0072B2", "#E69F00", "#009E73", "#CC79A7", "#56B4E9", "#D55E00", "#F0E442"];
const tonnes = (value: number) => `${Math.round(value).toLocaleString("en-GB")} t`;

export default function CarbonCharts({ document, country }: { document: SubmissionDocument | null | undefined; country: string }) {
  const { row, loading } = useCountryProfile(country);
  const output = Number(document?.answers["designHeat"] || document?.answers["existingHeat"] || NaN);
  const result = annualCarbon(Number.isFinite(output) ? output : null, parseMix(document?.rows["designMix"]), {
    gridKgPerMwh: countryFactor(row, "grid_emission_factor_kg_mwh"),
    counterfactualKgPerMwh: countryFactor(row, "counterfactual_emission_factor_kg_mwh"),
  });
  if (loading) return null;
  if (result.kind === "absence") {
    return <section>
      <h2 className="mb-3 font-display text-2xl font-semibold">Annual emissions</h2>
      <p className="text-sm text-muted-foreground">Shown when the stated annual heat output, the design energy mix and sourced country emission factors for every source in the mix all exist. Not all of these are recorded for this project yet.</p>
    </section>;
  }
  const figures = result.value;
  const comparison = [{ name: "Baseline", tonnes: figures.baselineTonnes }, { name: "Project", tonnes: figures.projectTonnes }];
  const shares = [
    { name: "Heat share", ...Object.fromEntries(figures.bySource.map((row) => [row.source, row.heatShare])) },
    { name: "Residual emissions share", ...Object.fromEntries(figures.bySource.map((row) => [row.source, row.emissionsShare])) },
  ];
  return <section className="space-y-6">
    <div>
      <h2 className="mb-1 font-display text-2xl font-semibold">Annual emissions</h2>
      <p className="text-xs text-muted-foreground">Computed from the developer-stated output ({figures.inputs.outputGwh} GWh a year) and design mix, with country factors from the DHC Market library (see Structure). Annual reduction: {tonnes(figures.reductionTonnes)} CO2e. No lifetime figure is shown.</p>
    </div>
    <div>
      <h3 className="mb-2 text-sm font-semibold">Baseline versus project, tonnes CO2e a year</h3>
      <div role="img" aria-label={`Baseline ${tonnes(figures.baselineTonnes)}, project ${tonnes(figures.projectTonnes)} a year`}>
        <ResponsiveContainer width="100%" height={220}><BarChart data={comparison} layout="vertical" margin={{ left: 16, right: 64 }}>
          <XAxis type="number" domain={[0, "dataMax"]} hide /><YAxis type="category" dataKey="name" width={80} />
          <Tooltip formatter={(value: number) => tonnes(value)} />
          <Bar dataKey="tonnes" fill={OKABE_ITO[0]} isAnimationActive={false}><LabelList dataKey="tonnes" position="right" formatter={(value: number) => tonnes(value)} /></Bar>
        </BarChart></ResponsiveContainer>
      </div>
    </div>
    <div>
      <h3 className="mb-2 text-sm font-semibold">Heat share versus residual emissions share, by source</h3>
      <div role="img" aria-label={figures.bySource.map((row) => `${row.source}: ${row.heatShare.toFixed(0)}% of heat, ${row.emissionsShare.toFixed(0)}% of emissions`).join("; ")}>
        <ResponsiveContainer width="100%" height={200}><BarChart data={shares} layout="vertical" stackOffset="expand" margin={{ left: 16, right: 16 }}>
          <XAxis type="number" hide /><YAxis type="category" dataKey="name" width={160} /><Legend />
          {figures.bySource.map((row, index) => <Bar key={row.source} dataKey={row.source} stackId="share" fill={OKABE_ITO[index % OKABE_ITO.length]} isAnimationActive={false}>
            <LabelList dataKey={row.source} position="center" formatter={(value: number) => value >= 6 ? `${value.toFixed(0)}%` : ""} />
          </Bar>)}
        </BarChart></ResponsiveContainer>
      </div>
    </div>
  </section>;
}
