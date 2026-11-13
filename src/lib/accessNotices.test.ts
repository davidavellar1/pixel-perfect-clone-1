import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pendingAccessNotices } from "./accessNotices";

const input = { id: "request", project_id: "project", investor_user_id: "investor", ownerId: "developer", title: "a listing", workingDays: 10, paused: false };
describe("Scheduled access notices", () => {
  it("notifies both parties at ten working days", () => {
    const notices = pendingAccessNotices(input);
    assert.deepEqual(notices.map((notice) => notice.user_id), ["investor", "developer"]);
    assert.equal(notices.every((notice) => notice.kind === "access_request_lapsed"), true);
    assert.equal(new Set(notices.map((notice) => notice.dedupe_key)).size, 2);
  });
  it("escalates to the developer at five working days", () => {
    assert.equal(pendingAccessNotices({ ...input, workingDays: 4 }).length, 0);
    const notices = pendingAccessNotices({ ...input, workingDays: 5 });
    assert.equal(notices.length, 1);
    assert.equal(notices[0]?.user_id, "developer");
    assert.equal(notices[0]?.kind, "access_request_escalation");
  });
  it("does not lapse or escalate while a reply is outstanding", () => {
    assert.equal(pendingAccessNotices({ ...input, paused: true }).length, 0);
  });
});