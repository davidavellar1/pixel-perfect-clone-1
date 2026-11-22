import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { canReadAcceptedFigures, canReadProjectDetail, isPublicRef, loadDisclosedProject, projectPath, teaserJson } from "./projectDisclosure";

const REF = "3f1c2a9e-8b7d-4c6e-9a5f-1d2e3f4a5b6c";

import { publishedBandRange } from "./bands";

describe("Project disclosure", () => {
  it("raw investor figures require both qualification and acceptance; owners retain their own records", () => {
    assert.equal(canReadAcceptedFigures("teaser", false), false);
    assert.equal(canReadAcceptedFigures("teaser", true), false);
    assert.equal(canReadAcceptedFigures("granted", false), false);
    assert.equal(canReadAcceptedFigures("granted", true), true);
    assert.equal(canReadAcceptedFigures("granted_full", true), true);
    assert.equal(canReadAcceptedFigures("teaser", false, true), true);
  });
  it("accepted unqualified detail never fetches the raw project record", async () => {
    const calls: string[] = [];
    const client = { rpc: async () => ({ data: false, error: null }), from(table: string) {
      calls.push(table);
      const chain = { select: () => chain, eq: () => chain, maybeSingle: async () => ({
        data: table === "project_teaser" ? { id: "p", public_ref: REF } : table === "access_request" ? { state: "granted" } : null,
        error: null,
      }) };
      return chain;
    } } as unknown as SupabaseClient<Database>;
    const result = await loadDisclosedProject(client, REF, "u");
    assert.equal(result.project, null);
    assert.equal(result.request?.state, "granted");
    assert.equal(calls.includes("project"), false);
  });
  it("preserves published ranges for bundle consumers", () => {
    assert.deepEqual(publishedBandRange("25-50 MW"), { label: "25-50 MW", min: 25, max: 50 });
    assert.deepEqual(publishedBandRange("EUR 50M+", 1_000_000), { label: "EUR 50M+", min: 50_000_000, max: null });
  });
  it("only accepted states or ownership unlock investor-grade queries", () => {
    for (const state of ["teaser", "pending", "declined", "withdrawn", "lapsed"] as const) assert.equal(canReadProjectDetail(state), false);
    assert.equal(canReadProjectDetail("granted"), true);
    assert.equal(canReadProjectDetail("granted_full"), true);
    assert.equal(canReadProjectDetail("teaser", true), true);
  });
  for (const state of ["pending", "declined", "granted", "granted_full"] as const) {
    it(`${state} queries exact detail only after accepted access`, async () => {
      const calls: string[] = [];
      const client = { rpc: async () => ({ data: true, error: null }), from(table: string) {
        let selection = "";
        const chain = {
          select(value: string) { selection = value; return chain; },
          eq() { return chain; },
          async maybeSingle() {
            calls.push(`${table}:${selection}`);
            if (table === "project_teaser") return { data: { id: "p", public_ref: REF }, error: null };
            if (table === "access_request") return { data: { state, status: "approved" }, error: null };
            if (table === "developer_profiles") return { data: null, error: null };
            if (table === "project") return { data: { id: "p", title: "Private identity" }, error: null };
            throw new Error(`Unexpected table ${table}`);
          },
        };
        return chain;
      } } as unknown as SupabaseClient<Database>;
      const result = await loadDisclosedProject(client, REF, "u");
      const granted = state === "granted" || state === "granted_full";
      assert.equal(calls.includes("project:*"), granted);
      assert.equal(result.project !== null, granted);
    });
  }
  it("teaser output never includes exact figures or identity even if input contains them", () => {
    const output = teaserJson({ id: "p", public_ref: REF, slug: "lyon-waste-heat", teaser_title: "Heat network", country_code: "FR", technology: "geothermal", project_type: "greenfield", lifecycle_stage: "concept", capacity_band: "Under 10 MW", capex_band: "Under EUR 15M", min_ticket_band: null, min_ticket_sort: null, instrument: null, offtake_committed_load_pct: null, transaction_terms_published: false, created_at: null, title: "Private identity", capacity_mw: 8, headline_irr_pct: 14 } as Parameters<typeof teaserJson>[0]);
    assert.equal(output.capacityBand, "Under 10 MW");
    assert.equal(output.capexBand, "Under EUR 15M");
    for (const key of ["title", "city", "slug", "capacityMw", "headlineInvestment", "headlineIrrPct"]) assert.equal(key in output, false);
    assert.equal(output.publicRef, REF);
    assert.equal(JSON.stringify(output).includes("lyon"), false);
  });
  it("project links use the opaque reference only", () => {
    assert.equal(isPublicRef(REF), true);
    assert.equal(isPublicRef("lyon-waste-heat-recovery"), false);
    assert.equal(projectPath(REF), `/app/projects/${REF}`);
  });
  it("a legacy slug resolves only through RLS-protected project rows, with no teaser probe", async () => {
    const calls: string[] = [];
    const client = (projectRow: unknown) => ({ rpc: async () => ({ data: true, error: null }), from(table: string) {
      const chain = { select: () => chain, eq: (key: string) => { calls.push(`${table}:${key}`); return chain; }, maybeSingle: async () => {
        if (table === "project") return { data: projectRow, error: null };
        if (table === "project_teaser") return { data: { id: "p", public_ref: REF }, error: null };
        if (table === "developer_profiles") return { data: { id: "d" }, error: null };
        return { data: null, error: null };
      } };
      return chain;
    } }) as unknown as SupabaseClient<Database>;
    const anonymous = await loadDisclosedProject(client({ public_ref: REF }), "lyon-waste-heat-recovery", null);
    assert.equal(anonymous.teaser, null);
    assert.equal(anonymous.project, null);
    assert.equal(calls.length, 0);
    // RLS returns no row for a viewer who is neither owner nor accepted: "not found", no redirect.
    const stranger = await loadDisclosedProject(client(null), "lyon-waste-heat-recovery", "u");
    assert.equal(stranger.teaser, null);
    assert.equal(stranger.publicRef, null);
    assert.equal(calls.some(call => call.startsWith("project_teaser")), false);
    // The owner (row visible through RLS) is resolved to the opaque reference.
    const owner = await loadDisclosedProject(client({ public_ref: REF, id: "p" }), "lyon-waste-heat-recovery", "u");
    assert.equal(owner.publicRef, REF);
    assert.equal(owner.owner, true);
  });
});