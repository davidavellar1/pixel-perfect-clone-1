import type { FieldResolution } from "./projectAbsence";
export function simplePayback(capex: FieldResolution<number>, revenue: FieldResolution<number>, opex: FieldResolution<number>): FieldResolution<{ years: number; inputs: { totalCapex: number; annualRevenue: number; annualOpex: number } }> {
  if (capex.kind === "absence") return capex;
  if (revenue.kind === "absence") return revenue;
  if (opex.kind === "absence") return opex;
  const net = revenue.value - opex.value;
  if (net <= 0 || ![capex.value, revenue.value, opex.value].every(Number.isFinite)) return { kind: "absence", reason: "not_applicable" };
  return { kind: "value", value: { years: capex.value / net, inputs: { totalCapex: capex.value, annualRevenue: revenue.value, annualOpex: opex.value } } };
}