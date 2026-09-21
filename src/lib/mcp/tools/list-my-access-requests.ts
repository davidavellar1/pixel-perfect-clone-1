import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

interface RequestRow {
  id: string;
  status: string;
  requested_at: string | null;
  decided_at: string | null;
  project: { slug: string; title: string } | null;
}

export default defineTool({
  name: "list_my_access_requests",
  title: "List my access requests",
  description:
    "List the data-room access requests visible to the signed-in user, with their current status and decision dates.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("access_request")
      .select("id,status,requested_at,decided_at,project:project_id(slug,title)")
      .order("requested_at", { ascending: false })
      .limit(50);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const requests = ((data ?? []) as unknown as RequestRow[]).map((r) => ({
      id: r.id,
      status: r.status,
      requestedAt: r.requested_at,
      decidedAt: r.decided_at,
      projectSlug: r.project?.slug ?? null,
      projectTitle: r.project?.title ?? null,
    }));

    return {
      content: [
        {
          type: "text",
          text: requests.length
            ? requests.map((r) => `${r.projectTitle ?? "Project"} (${r.projectSlug ?? "?"}) - ${r.status}`).join("\n")
            : "No access requests yet.",
        },
      ],
      structuredContent: { requests },
    };
  },
});
