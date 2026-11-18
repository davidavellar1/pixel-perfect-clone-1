import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveProjectField, BASIS_FLAGS } from "./projectAbsence";
describe("Project question evidence", () => {
  it("never attributes nonresponse to an unasked question at any lifecycle stage", () => {
    for (const stage of ["concept", "feasibility", "development", "construction", "operational"]) {
      assert.deepEqual(resolveProjectField("capex", stage, null, ["capacity_mw"], "not_provided"), { kind: "absence", reason: "not_asked" });
    }
  });
  it("treats all nine unrecorded legacy listings safely", () => {
    assert.deepEqual(resolveProjectField("capex", "development", null), { kind: "absence", reason: "not_asked" });
  });
  it("recognizes proven nonresponse and preserves zero", () => {
    assert.deepEqual(resolveProjectField("capex", "development", null, ["capex"]), { kind: "absence", reason: "not_provided", expectedDate: undefined });
    assert.deepEqual(resolveProjectField("capex", "development", 0, ["capex"]), { kind: "value", value: 0 });
  });
  it("keeps evidence basis separate from absence", () => assert.deepEqual(BASIS_FLAGS, ["measured", "modelled", "estimated"]));
});