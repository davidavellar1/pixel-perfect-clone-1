import type { FieldResolution } from "./projectAbsence";
export function simplePayback(capex: FieldResolution<number>, revenue: FieldResolution<number>, opex: FieldResolution<number>): FieldResolution<{ years: number; inputs: { totalCapex: number; annualRevenue: number; annualOpex: number } }> {
  if (capex.kind === "absence") return capex;
  if (revenue.kind === "absence") return revenue;
  if (opex.kind === "absence") return opex;
  const net = revenue.value - opex.value;
  if (net <= 0 || ![capex.value, revenue.value, opex.value].every(Number.isFinite)) return { kind: "absence", reason: "not_applicable" };
  return { kind: "value", value: { years: capex.value / net, inputs: { totalCapex: capex.value, annualRevenue: revenue.value, annualOpex: opex.value } } };
}
const numeric = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
type Document = { stage: string; answers: Record<string, string>; rows: Record<string, Record<string, string>[]>; askedFields?: readonly string[] } | null | undefined;
const asked = (document: Document, key: string) => Boolean(document?.askedFields?.includes(`stage.${key}`));

/** Latest reported operating year with both revenue and opex, from the submitted actuals rows. */
export function latestActuals(document: Document): FieldResolution<{ year: number; revenue: number; opex: number }> {
  const rows = (document?.rows["actuals"] ?? [])
    .map((row) => ({ year: numeric(row["year"]), revenue: numeric(row["revenue"]), opex: numeric(row["opex"]) }))
    .filter((row): row is { year: number; revenue: number; opex: number } => row.year !== null && row.revenue !== null && row.opex !== null)
    .sort((a, b) => b.year - a.year);
  const latest = rows[0];
  if (latest) return { kind: "value", value: latest };
  return { kind: "absence", reason: document?.stage === "operational" && asked(document, "historyYears") ? "not_provided" : document && document.stage !== "operational" ? "does_not_exist_yet" : "not_asked" };
}

/** Simple payback from stated total capex and the latest year's revenue less opex. */
export function paybackFromDocument(capex: number | null | undefined, document: Document) {
  const capexValue: FieldResolution<number> = capex != null && Number.isFinite(Number(capex)) ? { kind: "value", value: Number(capex) } : { kind: "absence", reason: "not_asked" };
  const actuals = latestActuals(document);
  if (actuals.kind === "absence") return simplePayback(capexValue, actuals, actuals);
  return simplePayback(capexValue, { kind: "value", value: actuals.value.revenue }, { kind: "value", value: actuals.value.opex });
}

/**
 * First revenue year: the earliest reported year with revenue, otherwise the year of the stated
 * commissioning target. Returns the source so the reader can see where the year came from.
 */
export function firstRevenueYear(document: Document): FieldResolution<{ year: number; source: "actuals" | "commissioning target" }> {
  const years = (document?.rows["actuals"] ?? []).flatMap((row) => {
    const year = numeric(row["year"]); const revenue = numeric(row["revenue"]);
    return year !== null && revenue !== null && revenue > 0 ? [year] : [];
  });
  if (years.length) return { kind: "value", value: { year: Math.min(...years), source: "actuals" } };
  const commissioning = document?.answers["commissioning"];
  if (commissioning && /^\d{4}-\d{2}-\d{2}$/.test(commissioning)) return { kind: "value", value: { year: Number(commissioning.slice(0, 4)), source: "commissioning target" } };
  return { kind: "absence", reason: asked(document, "commissioning") ? "not_provided" : "not_asked" };
}

/**
 * Funding progress: share of total capex covered by capital-stack lines the developer has
 * marked committed, and the amount not yet committed. A line with no recorded commitment
 * status makes the figure unknown; it is never shown as zero.
 */
export function fundingProgress(capex: number | null | undefined, lines: { amount: number | null; committed: boolean | null }[]): FieldResolution<{ pct: number; remaining: number; inputs: { totalCapex: number; committed: number } }> {
  const total = numeric(capex);
  if (total === null || total <= 0 || !lines.length) return { kind: "absence", reason: "not_asked" };
  if (lines.some((line) => line.committed === null || line.amount === null)) return { kind: "absence", reason: "not_asked" };
  const committed = lines.reduce((sum, line) => line.committed ? sum + Number(line.amount) : sum, 0);
  return { kind: "value", value: { pct: Math.min(100, committed / total * 100), remaining: Math.max(0, total - committed), inputs: { totalCapex: total, committed } } };
}
