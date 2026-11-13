import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bundleExactFigures, publicFundingTotal } from "./figureDisclosure";

describe("Independent review figure regressions", () => {
  it("uses exact granted figures even while capacity bands remain present", () => {
    const project = { accessState: "granted" as const, capacityBand: "Under 10 MW", capacityMw: 8, capex: 12_000_000, equitySought: 4_000_000, minTicket: 1_000_000 };
    assert.deepEqual(bundleExactFigures(project), { capacityMw: 8, capex: 12_000_000, equitySought: 4_000_000, minTicket: 1_000_000 });
    assert.equal(bundleExactFigures({ ...project, accessState: "pending" }), null);
  });
  it("sums 900000 euros numerically, never as 900 million", () => {
    assert.equal(publicFundingTotal([{ numericAmount: 900_000 }, { numericAmount: null }]), 900_000);
  });
});