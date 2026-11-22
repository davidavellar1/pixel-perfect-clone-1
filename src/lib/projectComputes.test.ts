import { it } from "node:test";
import assert from "node:assert/strict";
import { simplePayback } from "./projectComputes";
const v = (value: number) => ({ kind: "value" as const, value });
it("computes undiscounted simple payback over total capex with checkable inputs", () => {
  assert.deepEqual(simplePayback(v(12000000), v(3000000), v(1000000)), { kind: "value", value: { years: 6, inputs: { totalCapex: 12000000, annualRevenue: 3000000, annualOpex: 1000000 } } });
});
it("inherits a missing input reason without a default", () => assert.deepEqual(simplePayback(v(12), { kind: "absence", reason: "not_asked" }, v(1)), { kind: "absence", reason: "not_asked" }));
it("never renders negative or infinite payback", () => {
  assert.equal(simplePayback(v(12), v(1), v(1)).kind, "absence");
  assert.equal(simplePayback(v(12), v(1), v(2)).kind, "absence");
});import { firstRevenueYear, fundingProgress, latestActuals, paybackFromDocument } from "./projectComputes";
const doc = (stage: string, answers: Record<string, string>, actuals: Record<string, string>[] = [], askedFields: string[] = []) => ({ stage, answers, rows: { actuals }, askedFields });
it("payback uses the latest complete actuals year and stated capex", () => {
  const d = doc("operational", {}, [{ year: "2024", revenue: "2000000", opex: "1000000" }, { year: "2025", revenue: "3000000", opex: "1000000" }]);
  assert.deepEqual(paybackFromDocument(12000000, d), { kind: "value", value: { years: 6, inputs: { totalCapex: 12000000, annualRevenue: 3000000, annualOpex: 1000000 } } });
  assert.deepEqual(latestActuals(doc("development", {})), { kind: "absence", reason: "does_not_exist_yet" });
  assert.equal(paybackFromDocument(null, d).kind, "absence");
  assert.equal(paybackFromDocument(12000000, null).kind, "absence");
});
it("first revenue comes from actuals, then the commissioning target, never a default", () => {
  assert.deepEqual(firstRevenueYear(doc("operational", {}, [{ year: "2023", revenue: "0" }, { year: "2024", revenue: "5" }])), { kind: "value", value: { year: 2024, source: "actuals" } });
  assert.deepEqual(firstRevenueYear(doc("construction", { commissioning: "2027-10-01" })), { kind: "value", value: { year: 2027, source: "commissioning target" } });
  assert.deepEqual(firstRevenueYear(doc("construction", {}, [], ["stage.commissioning"])), { kind: "absence", reason: "not_provided" });
  assert.deepEqual(firstRevenueYear(null), { kind: "absence", reason: "not_asked" });
});
it("funding progress needs a commitment status on every line and never renders zero by default", () => {
  assert.equal(fundingProgress(12000000, [{ amount: 4000000, committed: null }]).kind, "absence");
  assert.equal(fundingProgress(12000000, []).kind, "absence");
  assert.equal(fundingProgress(null, [{ amount: 1, committed: true }]).kind, "absence");
  assert.deepEqual(fundingProgress(12000000, [{ amount: 9000000, committed: true }, { amount: 3000000, committed: false }]), { kind: "value", value: { pct: 75, remaining: 3000000, inputs: { totalCapex: 12000000, committed: 9000000 } } });
});
