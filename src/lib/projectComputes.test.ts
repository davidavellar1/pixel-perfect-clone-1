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
});