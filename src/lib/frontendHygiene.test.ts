import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { eur, pct } from "../data/investorGrade";
import { interestSchema } from "./interestValidation";
import type { AccessCriteriaRow } from "./access";

const valid = {
  entityName: "Example Fund", entityType: "infra_fund", jurisdiction: "Ireland", regulatedStatus: "", website: "",
  signatoryName: "Example Signatory", signatoryRole: "Director", ticketBand: "1m_3m", instrumentSought: "equity",
  constructionRisk: "", capitalSource: "fund_with_dry_powder", decisionProcess: "ic_approval", earliestDecisionDate: "",
  interestDrivers: [], diligenceFocus: "", wouldLeadClub: false, conflictsDeclared: "none", conflictsDetail: "",
  advisersReceivingInfo: "", signedName: "Example Signatory", authority: true, feeAcknowledged: true, electronicConsent: true,
};
describe("Frontend hygiene rules", () => {
  it("missing euro and percentage values are null while zero remains a real value", () => {
    assert.equal(eur(null), null);
    assert.equal(pct(undefined), null);
    assert.equal(eur(0), "EUR 0");
    assert.equal(pct(0), "0.0%");
  });
  it("requires capital source in the request form", () => assert.equal(interestSchema(null).safeParse({ ...valid, capitalSource: "" }).success, false));
  it("requires decision process in the request form", () => assert.equal(interestSchema(null).safeParse({ ...valid, decisionProcess: "" }).success, false));
  it("requires named advisers when a conflict is declared", () => {
    assert.equal(interestSchema(null).safeParse({ ...valid, conflictsDeclared: "declared", conflictsDetail: "Competing mandate" }).success, false);
    assert.equal(interestSchema(null).safeParse({ ...valid, conflictsDeclared: "declared", conflictsDetail: "Competing mandate", advisersReceivingInfo: "Named counsel" }).success, true);
  });
  it("requires construction appetite only when the listing requests it", () => {
    assert.equal(interestSchema(null).safeParse(valid).success, true);
    assert.equal(interestSchema({ require_construction_risk_appetite: true } as AccessCriteriaRow).safeParse(valid).success, false);
  });
});