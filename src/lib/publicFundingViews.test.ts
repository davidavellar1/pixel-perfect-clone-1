import { it } from "node:test";
import assert from "node:assert/strict";
import { beforeClose, contingentCapex, runningConditions, supportPerEquityEuro, unawardedByBody, type FundingRow } from "./publicFundingViews";

const row = (extra: Partial<FundingRow>): FundingRow => ({ projectId: "a", projectLabel: "Network A", body: "EIB", source: "Grant", amount: 1_000_000, status: "applied", decisionDate: null, conditions: null, ...extra });

it("contingent capex counts only unawarded funding with a stated amount, over stated capex", () => {
  const rows = [row({ amount: 2_000_000 }), row({ status: "awarded", amount: 5_000_000 }), row({ status: "declined" }), row({ amount: null }), row({ status: null }), row({ projectId: "b", amount: 3_000_000, body: null })];
  const result = contingentCapex(rows, new Map([["a", 10_000_000], ["b", 10_000_000], ["c", null]]));
  assert.ok(result);
  assert.equal(result.contingent, 5_000_000);
  assert.equal(result.totalCapex, 20_000_000);
  assert.equal(result.pct, 25);
  assert.equal(result.projects, 2);
  assert.equal(result.rowsWithoutAmount, 1);
  assert.equal(result.rowsWithoutStatus, 1);
  assert.deepEqual(result.byBody.map((group) => [group.body, group.amount]), [["Deciding body not stated", 3_000_000], ["EIB", 2_000_000]]);
});
it("no stated capex means no contingent share, never a zero", () => assert.equal(contingentCapex([row({})], new Map([["a", null]])), null));
it("public support per euro of equity is stated in both readings", () => {
  const result = supportPerEquityEuro([row({ status: "awarded", amount: 2_000_000 }), row({ amount: 2_000_000 }), row({ projectId: "z", status: "awarded", amount: 9_000_000 })], new Map([["a", 4_000_000]]));
  assert.deepEqual(result, { equity: 4_000_000, projects: 1, awarded: 2_000_000, sought: 2_000_000, awardedOnly: 0.5, ifAllAwarded: 1 });
  assert.equal(supportPerEquityEuro([row({})], new Map([["a", null]])), null);
});
it("pipeline and realised views keep their own rows", () => {
  const rows = [row({ decisionDate: "2027-05-01" }), row({ decisionDate: "2027-01-01", status: "decision_pending" }), row({ status: "awarded", conditions: "Clawback if heat sales fall below 80%" }), row({ status: "awarded", conditions: " " })];
  assert.deepEqual(beforeClose(rows).map((r) => r.decisionDate), ["2027-01-01", "2027-05-01"]);
  assert.equal(runningConditions(rows).length, 1);
  assert.equal(unawardedByBody(rows)[0]?.rows[0]?.decisionDate, "2027-01-01");
});
