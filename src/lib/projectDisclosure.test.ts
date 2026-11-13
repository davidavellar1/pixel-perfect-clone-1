import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { canReadProjectDetail, loadDisclosedProject, teaserJson } from "./projectDisclosure";

import { publishedBandRange } from "./bands";

describe("Project disclosure", () => {
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
      const client = { from(table: string) {
        let selection = "";
        const chain = {
          select(value: string) { selection = value; return chain; },
          eq() { return chain; },
          async maybeSingle() {
            calls.push(`${table}:${selection}`);
            if (table === "project_teaser") return { data: { id: "p", slug: "teaser" }, error: null };
            if (table === "access_request") return { data: { state, status: "approved" }, error: null };
            if (table === "developer_profiles") return { data: null, error: null };
            if (table === "project") return { data: { id: "p", title: "Private identity" }, error: null };
            throw new Error(`Unexpected table ${table}`);
          },
        };
        return chain;
      } } as unknown as SupabaseClient<Database>;
      const result = await loadDisclosedProject(client, "teaser", "u");
      const granted = state === "granted" || state === "granted_full";
      assert.equal(calls.includes("project:*"), granted);
      assert.equal(result.project !== null, granted);
    });
  }
  it("teaser output never includes exact figures or identity even if input contains them", () => {
    const output = teaserJson({ id: "p", slug: "teaser", teaser_title: "Heat network", country_code: "FR", technology: "geothermal", project_type: "greenfield", lifecycle_stage: "concept", capacity_band: "Under 10 MW", capex_band: "Under EUR 15M", min_ticket_band: null, min_ticket_sort: null, instrument: null, offtake_committed_load_pct: null, transaction_terms_published: false, created_at: null, title: "Private identity", capacity_mw: 8, headline_irr_pct: 14 } as Parameters<typeof teaserJson>[0]);
    assert.equal(output.capacityBand, "Under 10 MW");
    assert.equal(output.capexBand, "Under EUR 15M");
    for (const key of ["title", "city", "capacityMw", "headlineInvestment", "headlineIrrPct"]) assert.equal(key in output, false);
  });
});