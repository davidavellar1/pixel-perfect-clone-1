import { it } from "node:test";
import assert from "node:assert/strict";
import { isFieldAsked, recordedQuestionKeys, fundingQuestionKeys, recordQuestionEvidence, questionEvidenceForStage } from "./submissionFields";
import { resolveProjectField } from "./projectAbsence";
it("does not ask early-stage sponsors for detailed capital stacks", () => {
  assert.equal(isFieldAsked("Capital stack", "concept"), false);
  assert.equal(isFieldAsked("Capital stack", "feasibility"), false);
  assert.equal(isFieldAsked("Capital stack", "development"), true);
});
it("records only questions actually displayed at the eligible stage", () => {
  assert.deepEqual(recordedQuestionKeys(["Capital stack", "Project title"], "concept"), ["project.title"]);
  assert.deepEqual(recordedQuestionKeys(["Project title"], "development"), ["project.title"]);
});
it("does not stamp the access ticket when only the transaction ticket was displayed", () => {
  assert.deepEqual(recordedQuestionKeys(["Minimum ticket"], "development"), ["project_transaction.min_ticket"]);
  assert.deepEqual(recordedQuestionKeys(["Minimum ticket"], "concept"), []);
});
it("does not stamp maximum participants when only the club toggle was displayed", () => {
  assert.deepEqual(recordedQuestionKeys(["Club deal"], "development"), []);
});
it("asks for a decision date only for applied and decision-pending funding", () => {
  for (const status of ["intending", "awarded", "declined"]) assert.equal(fundingQuestionKeys(status, "grant", false).includes("public_funding.expected_decision_date"), false);
  for (const status of ["applied", "decision_pending"]) assert.equal(fundingQuestionKeys(status, "grant", false).includes("public_funding.expected_decision_date"), true);
});
it("asks for clawback treatment only for awarded grants", () => {
  assert.equal(fundingQuestionKeys("awarded", "grant", false).includes("public_funding.clawback_treatment"), true);
  assert.equal(fundingQuestionKeys("applied", "grant", false).includes("public_funding.clawback_treatment"), false);
  assert.equal(fundingQuestionKeys("awarded", "loan", false).includes("public_funding.clawback_treatment"), false);
});
it("never attributes nonresponse to hidden conditional funding questions", () => {
  const asked = fundingQuestionKeys("intending", "grant", true);
  assert.equal(resolveProjectField("public_funding.expected_decision_date", "development", null, asked).kind, "absence");
  assert.deepEqual(resolveProjectField("public_funding.expected_decision_date", "development", null, asked), { kind: "absence", reason: "not_asked" });
});
it("keeps actual question histories separate when a sponsor changes stage", () => {
  const history = new Map<string, Set<string>>();
  recordQuestionEvidence(history, "Development", ["financial_summary.capex"]);
  recordQuestionEvidence(history, "Concept", ["project.title"]);
  assert.deepEqual(questionEvidenceForStage(history, "Concept"), ["project.title"]);
  assert.deepEqual(questionEvidenceForStage(history, "Development"), ["financial_summary.capex"]);
});