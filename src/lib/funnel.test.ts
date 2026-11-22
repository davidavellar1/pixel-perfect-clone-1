import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canonicalSignup, funnelDestination, recoveryPasswordError } from "./funnel";
describe("Canonical signup funnel", () => {
  it("preserves legacy redirect and role query parameters", () => {
    assert.equal(canonicalSignup("?redirect=%2Fapp%2Fprojects%2F3f1c2a9e-8b7d-4c6e-9a5f-1d2e3f4a5b6c&role=investor"), "/sign-up?redirect=%2Fapp%2Fprojects%2F3f1c2a9e-8b7d-4c6e-9a5f-1d2e3f4a5b6c&role=investor");
  });
  it("keeps local project destinations with queries and fragments", () => {
    assert.equal(funnelDestination("/app/projects/3f1c2a9e-8b7d-4c6e-9a5f-1d2e3f4a5b6c?tab=Financial#data"), "/app/projects/3f1c2a9e-8b7d-4c6e-9a5f-1d2e3f4a5b6c?tab=Financial#data");
  });
  it("rejects external and malformed redirect paths", () => {
    for (const path of ["https://outside.invalid", "//outside.invalid", "/\\outside.invalid", "/\nwrong"]) assert.equal(funnelDestination(path), "/app");
  });
  it("requires an eight-character recovery password and matching confirmation", () => {
    assert.equal(recoveryPasswordError("1234567", "1234567"), "Use at least 8 characters.");
    assert.equal(recoveryPasswordError("12345678", "87654321"), "Passwords do not match.");
    assert.equal(recoveryPasswordError("12345678", "12345678"), null);
  });
});
