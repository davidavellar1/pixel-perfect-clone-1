import { it } from "node:test";
import assert from "node:assert/strict";
import { annualCarbon, parseMix } from "./carbon";
const factors = { gridKgPerMwh: 100, counterfactualKgPerMwh: 200 };
it("computes annual emissions only when output, mix and every factor exist", () => {
  const result = annualCarbon(10, [{ source: "Electricity", share: 50 }, { source: "Natural gas", share: 50 }], factors);
  assert.equal(result.kind, "value");
  if (result.kind !== "value") return;
  assert.equal(result.value.baselineTonnes, 2000);
  assert.equal(result.value.projectTonnes, 1500);
  assert.equal(result.value.reductionTonnes, 500);
  assert.deepEqual(result.value.bySource.map((row) => Math.round(row.emissionsShare)), [33, 67]);
});
it("a mix source without a sourced factor makes the figure absent, never estimated", () => {
  assert.equal(annualCarbon(10, [{ source: "Waste heat", share: 100 }], factors).kind, "absence");
  assert.equal(annualCarbon(10, [{ source: "Electricity", share: 100 }], { gridKgPerMwh: 100, counterfactualKgPerMwh: null }).kind, "absence");
  assert.equal(annualCarbon(null, [{ source: "Electricity", share: 100 }], factors).kind, "absence");
  assert.equal(annualCarbon(10, [{ source: "Electricity", share: 60 }], factors).kind, "absence");
});
it("parses only positive stated shares", () => assert.deepEqual(parseMix([{ source: "Gas", share: "40" }, { source: "", share: "60" }, { source: "Electricity", share: "x" }]), [{ source: "Gas", share: 40 }]));
