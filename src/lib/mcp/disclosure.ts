import { ToolError, type ToolContext } from "@lovable.dev/mcp-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { effectiveState, isGranted, isQualifiedInvestor } from "@/lib/access";
import { teaserJson, type ProjectTeaser } from "@/lib/projectDisclosure";
import { investorPreview } from "@/lib/investorDisclosure";
import { parseProjectIdentity } from "@/lib/projectIdentity";
import { parseDocument } from "@/lib/submission/serializer";
import { supabaseAnon, supabaseForUser } from "./supabase";

export interface Caller {
  client: SupabaseClient<Database>;
  user: { id: string } | null;
  qualified: boolean;
}

/** A token subject alone is not a resolved account. Verify it with Auth. */
export async function resolveCaller(ctx: ToolContext): Promise<Caller> {
  const token = ctx.isAuthenticated() ? ctx.getToken() : null;
  if (token) {
    const client = supabaseForUser(ctx);
    const verified = await client.auth.getUser(token).catch(() => null);
    if (verified && !verified.error && verified.data.user?.id && verified.data.user.id === ctx.getUserId()) {
      const user = { id: verified.data.user.id };
      return { client, user, qualified: await isQualifiedInvestor(user, client) };
    }
  }
  return { client: supabaseAnon(), user: null, qualified: false };
}

/** Both gates use the interface's functions, never tool-specific role rules. */
export async function disclosedProject(caller: Caller, teaser: ProjectTeaser) {
  const project = teaserJson(teaser);
  if (!caller.user || !teaser.id) return { project };
  const { client, user, qualified } = caller;
  const request = await client.from("access_request").select("*")
    .eq("project_id", teaser.id).eq("investor_user_id", user.id).maybeSingle();
  if (request.error) throw new ToolError("Unable to check project access.");
  const accepted = Boolean(request.data && isGranted(effectiveState(request.data)));
  const informationResult = qualified
    ? await client.rpc("investor_project", { _project_id: teaser.id })
    : { data: null, error: null };
  const identityResult = accepted
    ? await client.rpc("project_identity", { _project_id: teaser.id })
    : { data: null, error: null };
  if (informationResult.error || identityResult.error) throw new ToolError("Unable to load project disclosure.");
  const raw = informationResult.data;
  const record = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
  const document = parseDocument(record?.['document'] ?? null);
  // Reuse the existing preview whitelist, including generic prose/row labels.
  // The database's exact flag preserves the developer's banding switch.
  const safe = document ? investorPreview(document, record?.['exact'] !== true) : null;
  const information = qualified && record ? {
    id: teaser.id,
    exact: record['exact'] === true,
    document: safe ? { version: safe.version, stage: safe.stage, answers: safe.answers,
      rows: safe.rows, askedFields: safe.askedFields, step: safe.step } : null,
  } : null;
  const parsedIdentity = accepted ? parseProjectIdentity(identityResult.data) : null;
  const identity = parsedIdentity ? { title: parsedIdentity.title, city: parsedIdentity.city,
    country: parsedIdentity.country, developer: { ...parsedIdentity.developer } } : null;
  return { project, ...(information ? { information } : {}), ...(identity ? { identity } : {}) };
}

/** Projects are addressed only by their opaque public reference, never by a readable slug. */
export async function findTeaser(caller: Caller, publicRef: string) {
  const result = await caller.client.from("project_teaser").select("*").eq("public_ref", publicRef).maybeSingle();
  if (result.error) throw new ToolError("Unable to load listing.");
  if (!result.data?.id) throw new ToolError("No listed project found.");
  return { ...result.data, id: result.data.id };
}

export async function teasersById(caller: Caller, ids: string[]) {
  if (!ids.length) return new Map<string, ProjectTeaser>();
  const result = await caller.client.from("project_teaser").select("*").in("id", ids);
  if (result.error) throw new ToolError("Unable to load listings.");
  return new Map((result.data ?? []).flatMap(row => row.id ? [[row.id, row] as const] : []));
}