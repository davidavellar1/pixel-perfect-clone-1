import { it } from "node:test";
import assert from "node:assert/strict";
import { isFieldAsked, recordedQuestionKeys } from "./submissionFields";
it("does not ask early-stage sponsors for detailed capital stacks", () => {
  assert.equal(isFieldAsked("Capital stack", "concept"), false);
  assert.equal(isFieldAsked("Capital stack", "feasibility"), false);
  assert.equal(isFieldAsked("Capital stack", "development"), true);
});
it("records only questions actually displayed at the eligible stage", () => {
  assert.deepEqual(recordedQuestionKeys(["Capital stack", "Project title"], "concept"), ["project.title"]);
  assert.deepEqual(recordedQuestionKeys(["Project title"], "development"), ["project.title"]);
});