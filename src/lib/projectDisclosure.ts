import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/integrations/supabase/types";
import { effectiveState, isGranted, type ViewerAccess } from "@/lib/access";
import { blankProjectDetail } from "@/lib/blankProject";

export type ProjectTeaser = Tables<"project_teaser">;
export const countryName = (code: string | null) => {
  if (!code) return "";
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code; }
  catch { return code; }
};
export const readable = (value: string | null) => (value ?? "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export const canReadProjectDetail = (state: ViewerAccess, owner = false) => owner || isGranted(state);

/** Whitelisted teaser output shared by the UI and external agent tools. */
export const teaserJson = (row: ProjectTeaser) => ({
  id: row.id, slug: row.slug, teaserTitle: row.teaser_title,
  countryCode: row.country_code, technology: row.technology,
  projectType: row.project_type, lifecycleStage: row.lifecycle_stage,
  capacityBand: row.capacity_band, capexBand: row.capex_band,
  instrument: row.instrument, minTicketBand: row.min_ticket_band,
  minTicketSort: row.min_ticket_sort,
  offtakeCommittedLoadPct: row.offtake_committed_load_pct,
  transactionTermsPublished: row.transaction_terms_published, createdAt: row.created_at,
});

export const teaserProjectDetail = (row: ProjectTeaser) => {
  const country = countryName(row.country_code);
  return {
    ...blankProjectDetail({
      id: row.id ?? "", slug: row.slug ?? "", title: "", city: "", country_code: row.country_code ?? "",
      developer_id: "", technology: row.technology ?? "hybrid", project_type: row.project_type ?? "greenfield",
      lifecycle_stage: row.lifecycle_stage ?? "concept", visibility: "listed", verified: false,
      capacity_mw: null, headline_investment: null, headline_irr_pct: null, headline_co2_tonnes: null,
      latitude: null, longitude: null, network_length_km: null, households_served: null,
      summary: null, description: null, timeline_start: null, timeline_end: null,
      financial_as_of: null, technical_as_of: null, regulatory_as_of: null,
      created_at: row.created_at ?? "", updated_at: row.created_at ?? "",
    }),
    title: `${row.teaser_title ?? readable(row.technology)}, ${country}`,
    location: country, country, capacity: row.capacity_band ?? "", capex: row.capex_band ?? "",
    summary: "", developer: { name: "Developer identity withheld until access is granted", verified: false, hq: "", founded: "", dhcProjects: "", totalCapacity: "" },
  };
};

/** Resolve entitlement using only the teaser and owner ids before fetching exact data. */
export async function loadDisclosedProject(client: SupabaseClient<Database>, slug: string, userId: string | null) {
  const teaserResult = await client.from("project_teaser").select("*").eq("slug", slug).maybeSingle();
  if (teaserResult.error) throw teaserResult.error;
  const teaser = teaserResult.data;
  let request: Tables<"access_request"> | null = null;
  let owner = false;
  if (userId) {
    const [requestResult, developerResult] = await Promise.all([
      teaser?.id ? client.from("access_request").select("*").eq("project_id", teaser.id).eq("investor_user_id", userId).maybeSingle() : Promise.resolve({ data: null, error: null }),
      client.from("developer_profiles").select("id").eq("user_id", userId).maybeSingle(),
    ]);
    if (requestResult.error) throw requestResult.error;
    if (developerResult.error) throw developerResult.error;
    request = requestResult.data;
    if (developerResult.data) {
      const ownership = await client.from("project").select("id").eq("slug", slug).eq("developer_id", developerResult.data.id).maybeSingle();
      if (ownership.error) throw ownership.error;
      owner = Boolean(ownership.data);
    }
  }
  const state = request ? effectiveState(request) : "teaser";
  if (!canReadProjectDetail(state, owner)) return { teaser, project: null, request, owner };
  const result = await client.from("project").select("*").eq("slug", slug).maybeSingle();
  if (result.error) throw result.error;
  return { teaser, project: result.data, request, owner };
}