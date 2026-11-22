import { describe, it } from "node:test";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
import type { ToolContext } from "@lovable.dev/mcp-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Use Bun's module mocking without importing its browser-wide fetch overrides.
const { mock } = createRequire(import.meta.url)("bun:test") as {
  mock: { module: (path: string, factory: () => unknown) => void };
};

let qualified = false;
let accepted = false;
let resolved = true;
let banded = false;
const calls: string[] = [];
const filters: string[] = [];
const teaser = { id: "p", slug: "listing-p", teaser_title: "Heat network",
  country_code: "FR", technology: "geothermal", project_type: "greenfield",
  lifecycle_stage: "development", capacity_band: "Under 10 MW", capex_band: "EUR 10M-15M",
  instrument: "equity", min_ticket_band: "EUR 1M-3M", min_ticket_sort: 1,
  offtake_committed_load_pct: null, transaction_terms_published: true, created_at: null,
  title: "Private project", city: "Private city", developer: "Private developer" };
const request = () => ({ id: "r", project_id: "p", status: "approved",
  state: accepted ? "granted" : "declined", requested_at: "2026-11-01", decided_at: null,
  developer_question: "Private bank", investor_user_id: "real-user" });
function database(anonymous = false) {
  return {
    auth: { getUser: async () => {
      calls.push("getUser");
      return { data: { user: resolved ? { id: "real-user" } : null }, error: null };
    } },
    rpc: async (name: string) => {
      calls.push(name);
      assert.equal(anonymous, false);
      if (name === "is_qualified_investor") return { data: qualified, error: null };
      if (name === "project_identity") {
        assert.equal(accepted, true);
        return { data: { title: "Private project", city: "Private city", country: "FR",
          developer: { name: "Private developer", contactName: "Private contact", position: "Director" } }, error: null };
      }
      assert.equal(name, "investor_project");
      assert.equal(qualified, true);
      return { data: { id: "p", exact: !banded || accepted, leakedTitle: "Private project",
        document: { stage: "development", version: "Private version", step: "Private step",
          answers: { country: "FR", capacity: "8", capex: "12000000", title: "Private project",
            summary: "Private city and Private host", site: "Private host", contact: "Private contact" },
          rows: { capital: [{ label: "Private bank", provider: "Private bank", amount: "4000000" }],
            documents: [{ title: "Private host", filename: "Private developer.pdf" }] },
          askedFields: ["Private host"] } }, error: null };
    },
    from: (table: string) => {
      calls.push(table);
      assert.equal(["project_teaser", "watchlist_item", "access_request"].includes(table), true);
      if (anonymous) assert.equal(table, "project_teaser");
      const rows = table === "project_teaser" ? [teaser] : table === "watchlist_item"
        ? [{ project_id: "p", added_at: "2026-11-01" }] : [request()];
      const chain = {
        select: (value: string) => { assert.equal(value.includes("project:"), false); return chain; },
        eq: (key: string, value: unknown) => { filters.push(`${table}:${key}:${value}`); return chain; },
        in: () => chain, order: () => chain, limit: () => chain, ilike: () => chain,
        maybeSingle: async () => ({ data: rows[0], error: null }),
        upsert: async (row: { user_id: string }) => {
          calls.push("upsert"); assert.equal(row.user_id, "real-user"); return { error: null };
        },
        then: (callback: (value: unknown) => unknown) => Promise.resolve({ data: rows, error: null }).then(callback),
      };
      return chain;
    },
  } as unknown as SupabaseClient<Database>;
}
mock.module("../supabase", () => ({ supabaseForUser: () => database(), supabaseAnon: () => database(true) }));
const tools = await Promise.all([
  import("./search-opportunities"), import("./get-project"), import("./list-watchlist"),
  import("./add-to-watchlist"), import("./list-my-access-requests"),
]);
const context = (authenticated = true) => ({ isAuthenticated: () => authenticated,
  getToken: () => authenticated ? "test-token" : undefined, getUserId: () => "real-user" }) as unknown as ToolContext;
const inputs = [ { query: null, countryCode: null, technology: null, lifecycleStage: null, minCapacityMw: null, limit: 10 },
  { slug: "listing-p" }, {}, { slug: "listing-p" }, {} ];

describe("Actual MCP handler disclosure", () => {
  for (const [index, module] of tools.entries()) {
    for (const state of ["unqualified", "qualified-unaccepted", "accepted"] as const) {
      it(`${module.default.name}: ${state} response shape`, async () => {
        qualified = state !== "unqualified"; accepted = state === "accepted"; resolved = true; banded = false;
        calls.length = 0; filters.length = 0;
        // Invoke the SDK definition's actual handler, not a duplicate projection.
        const tool = module.default as { handler: (input: unknown, ctx: ToolContext) => unknown };
        const response = await tool.handler(inputs[index], context()) as { structuredContent: Record<string, unknown> };
        const body = response.structuredContent;
        const entries = index === 0 ? body['projects'] : index === 2 ? body['items'] : index === 4 ? body['requests'] : [body];
        assert.ok(Array.isArray(entries)); assert.equal(entries.length, 1);
        for (const entry of entries) {
          assert.equal(typeof entry, "object");
          assert.deepEqual(Object.keys(entry.project).sort(), ["id", "slug", "teaserTitle", "countryCode", "technology",
            "projectType", "lifecycleStage", "capacityBand", "capexBand", "instrument", "minTicketBand", "minTicketSort",
            "offtakeCommittedLoadPct", "transactionTermsPublished", "createdAt"].sort());
          assert.equal(Object.hasOwn(entry, "information"), qualified);
          assert.equal(Object.hasOwn(entry, "identity"), accepted);
          if (qualified) {
            assert.equal(entry.information.exact, true);
            assert.equal(entry.information.document.answers.capacity, "8");
            assert.equal(entry.information.document.answers.capex, "12000000");
            assert.deepEqual(entry.information.document.rows.capital, [{ label: "Capital line 1", amount: "4000000" }]);
            assert.equal(JSON.stringify(entry.information).includes("Private"), false);
          }
          if (accepted) assert.deepEqual(entry.identity, { title: "Private project", city: "Private city", country: "FR",
            developer: { name: "Private developer", contactName: "Private contact", position: "Director" } });
        }
        if (!accepted) assert.equal(JSON.stringify(response).includes("Private"), false);
        assert.equal(calls.includes("getUser"), true);
        assert.equal(calls.includes("is_qualified_investor"), true);
        assert.equal(calls.includes("investor_project"), qualified);
        assert.equal(calls.includes("project_identity"), accepted);
        assert.ok(filters.includes("access_request:investor_user_id:real-user"));
        if (index === 2) assert.ok(filters.includes("watchlist_item:user_id:real-user"));
      });
    }
    for (const auth of ["anonymous", "unresolvable"] as const) {
      it(`${module.default.name}: ${auth} exposes no personal or exact records`, async () => {
        qualified = true; accepted = true; resolved = false; calls.length = 0;
        const tool = module.default as { handler: (input: unknown, ctx: ToolContext) => unknown };
        const response = await tool.handler(inputs[index], context(auth !== "anonymous"));
        const json = JSON.stringify(response);
        assert.equal(json.includes("Private"), false);
        assert.equal(json.includes('"information"'), false); assert.equal(json.includes('"identity"'), false);
        assert.equal(calls.includes("upsert"), false);
        assert.equal(calls.includes("access_request"), false); assert.equal(calls.includes("watchlist_item"), false);
        assert.equal(calls.includes("is_qualified_investor"), false);
      });
    }
  }
  it("qualification alone respects the listing's band-until-acceptance flag", async () => {
    qualified = true; accepted = false; resolved = true; banded = true;
    const response = await tools[1]?.default.handler({ slug: "listing-p" }, context());
    assert.ok(response);
    const json = JSON.stringify(response);
    assert.equal(json.includes('"exact":false'), true);
    assert.equal(json.includes('"capacity":"8"'), false);
    assert.equal(json.includes("12000000"), false);
    assert.equal(json.includes("4000000"), false);
  });
  it("acceptance without qualification reveals identity, not investor information", async () => {
    qualified = false; accepted = true; resolved = true; banded = false;
    const response = await tools[1]?.default.handler({ slug: "listing-p" }, context());
    const json = JSON.stringify(response);
    assert.equal(json.includes('"identity"'), true);
    assert.equal(json.includes('"information"'), false);
  });
});