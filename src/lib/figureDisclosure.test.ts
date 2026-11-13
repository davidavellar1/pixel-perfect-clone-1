import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { baseCaseReturn, designLoadSegments, ownershipRows } from "./figureDisclosure";
import { calculateSuccessFee } from "./fee";

describe("Truthful project figures", () => {
  it("uses 100 percent of design load, leaving 30 percent uncommitted at 70 percent", () => {
    assert.deepEqual(designLoadSegments([50, 15, 5]), { shares: [50, 15, 5], remainder: 30 });
  });
  it("keeps a small tier represented instead of dropping it", () => {
    assert.deepEqual(designLoadSegments([60, 5, 0]), { shares: [60, 5, 0], remainder: 35 });
  });
  it("returns base-case IRR only for granted or granted_full, never pending or declined", () => {
    const cases = [{ name: "base", equity_irr_pct: 9 }, { name: "upside", equity_irr_pct: 15 }];
    assert.equal(baseCaseReturn("pending", cases), null);
    assert.equal(baseCaseReturn("declined", cases), null);
    assert.equal(baseCaseReturn("teaser", cases), null);
    assert.equal(baseCaseReturn("granted", cases), 9);
    assert.equal(baseCaseReturn("granted_full", cases), 9);
  });
  it("does not substitute another case when the base row is absent", () => {
    assert.equal(baseCaseReturn("granted", [{ name: "upside", equity_irr_pct: 15 }]), null);
  });
  it("only returns saved shareholder identities and shares", () => {
    assert.deepEqual(ownershipRows([{ holder: "Municipal utility", pct: 45 }]), [{ name: "Municipal utility", share: 45 }]);
    assert.deepEqual(ownershipRows(null), []);
  });
  it("charges 80000 on an invested amount of 8000000", () => {
    assert.equal(calculateSuccessFee(8_000_000), 80_000);
  });
});
