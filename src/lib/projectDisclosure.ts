import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/integrations/supabase/types";
import { effectiveState, isGranted, isQualifiedInvestor, type ViewerAccess } from "@/lib/access";
import { blankProjectDetail } from "@/lib/blankProject";

export type ProjectTeaser = Tables<"project_teaser">;
export const countryName = (code: string | null) => {
  if (!code) return "";
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code; }
  catch { return code; }
};
export const readable = (value: string | null) => (value ?? "").replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export const canReadProjectDetail = (state: ViewerAccess, owner = false) => owner || isGranted(state);
export const canReadAcceptedFigures = (state: ViewerAccess, qualified: boolean, owner = false) => owner || (qualified && isGranted(state));

/** Whitelisted teaser output shared by the UI and external agent tools. */
export const teaserJson = (row: ProjectTeaser) => ({
  id: row.id, publicRef: row.public_ref, teaserTitle: row.teaser_title,
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
      id: row.id ?? "", slug: "", public_ref: row.public_ref ?? "", title: "", city: "", country_code: row.country_code ?? "",
      developer_id: "", technology: row.technology ?? "hybrid", project_type: row.project_type ?? "greenfield",
      lifecycle_stage: row.lifecycle_stage ?? "concept", visibility: "listed", verified: false,
      capacity_mw: null, headline_investment: null, headline_irr_pct: null, headline_co2_tonnes: null,
      latitude: null, longitude: null, network_length_km: null, households_served: null,
      summary: null, description: null, timeline_start: null, timeline_end: null,
      financial_as_of: null, technical_as_of: null, regulatory_as_of: null,
      asked_fields: null, form_version: null, public_cofinancing_status: null,
      submission_draft: null, submission_published: null, submission_revision: 0, band_until_acceptance:false, disclosure_preview_consent_at:null, disclosure_preview_fingerprint:null,
      created_at: row.created_at ?? "", updated_at: row.created_at ?? "",
    }),
    title: `${row.teaser_title ?? readable(row.technology)}, ${country}`,
    location: country, country, capacity: row.capacity_band ?? "", capex: row.capex_band ?? "",
    summary: "", developer: { name: "Developer identity withheld until access is granted", verified: false, hq: "", founded: "", dhcProjects: "", totalCapacity: "" },
  };
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Public project references are random UUIDs; anything else is treated as a legacy slug. */
export const isPublicRef = (value: string) => UUID_PATTERN.test(value);
/** The only in-app link to a project. Never build a project URL from a slug or title. */
export const projectPath = (publicRef: string) => `/app/projects/${encodeURIComponent(publicRef)}`;

/**
 * Resolve entitlement using only the teaser and owner ids before fetching exact data.
 * `ref` is the project's public_ref. A legacy slug resolves only through the project table,
 * whose RLS admits the owner and accepted investors; everyone else gets "not found" with no
 * redirect, so slugs cannot be probed.
 */
export async function loadDisclosedProject(client: SupabaseClient<Database>, ref: string, userId: string | null) {
  let publicRef = ref;
  if (!isPublicRef(ref)) {
    if (!userId) return { teaser: null, project: null, request: null, owner: false, publicRef: null };
    const legacy = await client.from("project").select("public_ref").eq("slug", ref).maybeSingle();
    if (legacy.error || !legacy.data) return { teaser: null, project: null, request: null, owner: false, publicRef: null };
    publicRef = legacy.data.public_ref;
  }
  const teaserResult = await client.from("project_teaser").select("*").eq("public_ref", publicRef).maybeSingle();
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
      const ownership = await client.from("project").select("id").eq("public_ref", publicRef).eq("developer_id", developerResult.data.id).maybeSingle();
      if (ownership.error) throw ownership.error;
      owner = Boolean(ownership.data);
    }
  }
  const state = request ? effectiveState(request) : "teaser";
  if (!canReadProjectDetail(state, owner)) return { teaser, project: null, request, owner, publicRef };
  if (!owner && !await isQualifiedInvestor(userId ? { id: userId } : null, client)) {
    return { teaser, project: null, request, owner, publicRef };
  }
  const result = await client.from("project").select("*").eq("public_ref", publicRef).maybeSingle();
  if (result.error) throw result.error;
  return { teaser, project: result.data, request, owner, publicRef };
}
