import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AUTHORITY_TEXT, qualificationReady, requestFit, signatureEvidence, signatureReady } from "./gateWorkflow";
import { SLA_LAPSE_WORKING_DAYS, SLA_REMINDER_HOURS, slaStatus, workingDaysSince, type AccessRequestRow, type AccessCriteriaRow } from "./access";
import type { Agreement } from "./gateWorkflow";
import type { InterestFormDraft } from "@/components/project/ExpressInterestDialog";

const draft: InterestFormDraft = { entityName: "Test Fund", entityType: "infra_fund", jurisdiction: "Ireland", regulatedStatus: "", website: "",
  signatoryName: "Test Signatory", signatoryRole: "Director", ticketBand: "1m_3m", instrumentSought: "equity", constructionRisk: "",
  capitalSource: "fund_with_dry_powder", decisionProcess: "ic_approval", earliestDecisionDate: "", interestDrivers: [], diligenceFocus: "",
  wouldLeadClub: false, conflictsDeclared: "none", conflictsDetail: "", advisersReceivingInfo: "", signedName: "Test Signatory",
  authority: true, feeAcknowledged: true, electronicConsent: true };
const criteria = { min_ticket: 10_000_000, instruments_accepted: ["equity"], require_construction_risk_appetite: false } as AccessCriteriaRow;
const agreement = { version: "v1.0", body: "Stored agreement body", sha256: "verified-hash", fee_text: "Stored exact fee sentence" } as Agreement;
const request = { state: "pending", submitted_at: "2026-11-02T10:00:00Z", requested_at: "2026-11-02T10:00:00Z", developer_question_at: null, investor_reply_at: null } as AccessRequestRow;
describe("Gate workflow rules", () => {
  it("lapses only after ten working days, not fourteen calendar days", () => {
    assert.equal(SLA_LAPSE_WORKING_DAYS, 10);
    assert.equal(workingDaysSince(request.submitted_at, new Date("2026-11-15T10:00:00Z")), 9);
    assert.equal(slaStatus(request, new Date("2026-11-15T10:00:00Z")).lapsed, false);
    assert.equal(slaStatus(request, new Date("2026-11-16T10:00:00Z")).lapsed, true);
  });
  it("reminds at 48 hours", () => {
    assert.equal(SLA_REMINDER_HOURS, 48);
    assert.equal(slaStatus(request, new Date("2026-11-04T09:59:00Z")).reminderDue, false);
    assert.equal(slaStatus(request, new Date("2026-11-04T10:00:00Z")).reminderDue, true);
  });
  it("question pauses lapse until a reply resumes the shared clock", () => {
    const paused = { ...request, developer_question_at: "2026-11-03T10:00:00Z" };
    assert.equal(slaStatus(paused, new Date("2026-12-01T10:00:00Z")).lapsed, false);
    assert.equal(slaStatus({ ...paused, investor_reply_at: "2026-12-01T10:00:00Z" }, new Date("2026-12-01T10:00:00Z")).paused, false);
  });
  it("below-minimum fit never blocks signing", () => {
    assert.equal(requestFit(draft, criteria)[0]?.ok, false);
    assert.equal(signatureReady(draft, criteria, agreement), true);
  });
  it("capital source is required", () => assert.equal(qualificationReady({ ...draft, capitalSource: "" }, criteria), false));
  it("decision process is required", () => assert.equal(qualificationReady({ ...draft, decisionProcess: "" }, criteria), false));
  it("construction appetite is required only when listing requires it", () => {
    assert.equal(qualificationReady(draft, criteria), true);
    assert.equal(qualificationReady(draft, { ...criteria, require_construction_risk_appetite: true }), false);
  });
  it("declared conflicts require named advisers", () => {
    const conflicted = { ...draft, conflictsDeclared: "declared" as const, conflictsDetail: "Competing mandate" };
    assert.equal(signatureReady(conflicted, criteria, agreement), false);
    assert.equal(signatureReady({ ...conflicted, advisersReceivingInfo: "Named counsel" }, criteria, agreement), true);
  });
  it("electronic signing requires express consent", () => assert.equal(signatureReady({ ...draft, electronicConsent: false }, criteria, agreement), false));
  it("authority and fee must both be affirmed", () => {
    assert.equal(signatureReady({ ...draft, authority: false }, criteria, agreement), false);
    assert.equal(signatureReady({ ...draft, feeAcknowledged: false }, criteria, agreement), false);
  });
  it("evidence records displayed agreement values and never an introduction", () => {
    const evidence = signatureEvidence(draft, agreement, "2026-11-13T21:00:00Z");
    assert.equal(evidence.authority_text, AUTHORITY_TEXT);
    assert.equal(evidence.fee_text, agreement.fee_text);
    assert.equal(evidence.nda_document_sha256, agreement.sha256);
    assert.equal(evidence.fee_version, "v1.0");
    assert.equal(evidence.client_signed_at, "2026-11-13T21:00:00Z");
    assert.equal("introduction_logged_at" in evidence, false);
    assert.equal(signatureReady(draft, criteria, null), false);
  });
});