import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { SubmissionDocument } from "@/lib/submission/stageSchema";
import { BENCHMARK_METRICS, benchmarkText, generationClass, projectMetrics, type BenchmarkRow } from "@/lib/benchmarks";
import { absenceCopy } from "@/lib/projectAbsence";

/**
 * Each project figure beside the sourced benchmark for its own generation class, with source and
 * data year. No verdict: the reader compares.
 */
export default function BenchmarkPanel({ document }: { document: SubmissionDocument | null | undefined }) {
  const metrics = projectMetrics(document);
  const cls = generationClass(metrics.supply_temperature_c);
  const [rows, setRows] = useState<BenchmarkRow[] | null>(null);
  useEffect(() => {
    setRows(null);
    if (!cls) return;
    let active = true;
    void supabase.from("benchmark").select("*").eq("generation_class", cls).then(({ data }) => { if (active) setRows(data ?? []); });
    return () => { active = false; };
  }, [cls]);
  const shown = BENCHMARK_METRICS.filter(({ metric }) => metrics[metric] !== null);
  if (!shown.length) return null;
  return <section>
    <h2 className="mb-1 font-display text-2xl font-semibold">Benchmarks</h2>
    <p className="mb-4 text-xs text-muted-foreground">{cls ? `Compared within ${cls} networks, the class set by the stated supply temperature.` : "No supply temperature is stated, so no generation class and no benchmark applies."} Project figures are developer-stated; benchmarks come from the DHC Market library.</p>
    <div className="overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[560px] text-sm">
      <thead><tr className="bg-muted/50 text-left text-xs uppercase tracking-[0.1em] text-muted-foreground"><th scope="col" className="p-4 font-semibold">Metric</th><th scope="col" className="p-4 font-semibold">This project</th><th scope="col" className="p-4 font-semibold">Benchmark{cls ? `, ${cls}` : ""}</th></tr></thead>
      <tbody>{shown.map(({ metric, label, unit }) => {
        const benchmark = rows?.find((row) => row.metric === metric) ?? null;
        const value = metrics[metric] ?? 0;
        return <tr key={metric} className="border-t border-border align-top">
          <td className="p-4 font-medium">{label}</td>
          <td className="p-4">{`${Number(value.toFixed(metric === "capex_per_mw_eur" ? 0 : 1)).toLocaleString("en-GB")} ${unit}`}</td>
          <td className="p-4">{!cls || rows === null ? <span className="text-muted-foreground">{cls ? "Loading..." : absenceCopy({ kind: "absence", reason: "not_applicable" }, "")}</span> : benchmark ? <>
            <span className="font-semibold">{benchmarkText(benchmark)}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground"><a href={benchmark.source} target="_blank" rel="noopener noreferrer nofollow" className="text-primary underline">{benchmark.source_title}</a>, data year {benchmark.data_year}, {benchmark.confidence} confidence</span>
          </> : <span className="text-muted-foreground">{absenceCopy({ kind: "absence", reason: "not_provided" }, "")}</span>}</td>
        </tr>;
      })}</tbody>
    </table></div>
  </section>;
}
