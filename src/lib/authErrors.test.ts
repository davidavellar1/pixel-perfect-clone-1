import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { accountError } from "./authErrors";

describe("Account error classification", () => {
  it("classifies rejected and invalid emails", () => {
    for (const error of [
      { code: "unknown", message: "This email address is not allowed. Placeholder, reserved, or mistyped domains such as example.com or gmai.com cannot receive email." },
      { code: "email_address_invalid", message: "Invalid address" },
    ]) assert.equal(accountError(error).message, "We could not use that email address. Check the spelling or use your work email.");
  });
  it("identifies existing accounts", () => {
    assert.deepEqual(accountError({ code: "user_already_exists", message: "User already registered" }), {
      message: "An account with this email already exists. Sign in instead.", signIn: true,
    });
  });
  it("preserves the password provider's explanation", () => {
    assert.equal(accountError({ code: "weak_password", message: "Password should contain a number." }).message, "Password should contain a number.");
  });
  it("classifies rate limits", () => {
    assert.equal(accountError({ status: 429, message: "Request limit reached" }).message, "Too many attempts. Wait a minute and try again.");
  });
  it("preserves other errors and safely handles missing errors", () => {
    assert.equal(accountError(new Error("Failed to fetch")).message, "Failed to fetch");
    assert.equal(accountError(null).message, "Something went wrong. Please try again.");
  });
});