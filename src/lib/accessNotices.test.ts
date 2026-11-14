import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pendingAccessNotices } from "./accessNotices";
import { formatDate } from "./access";

const input = { id: "request", project_id: "project", investor_user_id: "investor", ownerId: "developer", title: "Lyon Waste Heat Recovery", teaserTitle: "Waste heat recovery, modernisation", workingDays: 10, paused: false };
describe("Scheduled access notices", () => {
  it("omits an absent decision date rather than supplying a placeholder", () => {
    assert.equal(formatDate(null), "");
    assert.equal(formatDate("2026-11-14"), "14 Nov 2026");
  });
  it("uses only the teaser title for the investor lapse notice", () => {
    const notices = pendingAccessNotices(input);
    assert.equal(notices.find(n => n.user_id === "investor")?.body.includes("Lyon"), false);
    assert.equal(notices.find(n => n.user_id === "investor")?.body.includes(input.teaserTitle), true);
    assert.equal(notices.find(n => n.user_id === "developer")?.body.includes(input.title), true);
  });
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