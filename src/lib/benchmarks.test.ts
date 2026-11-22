import { it } from "node:test";
import assert from "node:assert/strict";
import { benchmarkText, generationClass, projectMetrics } from "./benchmarks";
it("classes come from the stated supply temperature only", () => {
  assert.equal(generationClass(null), null);
  assert.equal(generationClass(20), "5G"); assert.equal(generationClass(65), "4G"); assert.equal(generationClass(90), "3G"); assert.equal(generationClass(130), "2G");
});
it("project metrics need every input and never default", () => {
  const m = projectMetrics({ version: "v", stage: "development", answers: { designSupply: "65", designHeat: "20", networkLength: "10", capex: "12000000", capacity: "8" }, rows: {}, askedFields: [], step: "basics" } as never);
  assert.equal(m.supply_temperature_c, 65); assert.equal(m.linear_heat_density_mwh_m, 2); assert.equal(m.capex_per_mw_eur, 1500000); assert.equal(m.network_loss_pct, null);
});
it("ranges print as ranges, no verdict", () => assert.equal(benchmarkText({ low: 8, high: 15, central: null, unit: "%" }), "8 to 15 %"));
