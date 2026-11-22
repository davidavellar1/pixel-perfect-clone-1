import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { disclosedProject, resolveCaller, teasersById } from "../disclosure";

export default defineTool({
  name: "list_my_access_requests",
  title: "List my access requests",
  description: "List the resolved investor's requests and dates with teaser-first project disclosure.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const caller = await resolveCaller(ctx);
    const result = caller.user ? await caller.client.from("access_request")
      .select("id,project_id,status,requested_at,decided_at")
      .eq("investor_user_id", caller.user.id).order("requested_at", { ascending: false })
      .limit(50) : { data: [], error: null };
    if (result.error) throw new ToolError("Unable to load access requests.");
    const rows = result.data ?? [];
    const teasers = await teasersById(caller, rows.map(row => row.project_id));
    const requests = [];
    for (const row of rows) {
      const teaser = teasers.get(row.project_id);
      if (teaser) requests.push({ id: row.id, status: row.status,
        requestedAt: row.requested_at, decidedAt: row.decided_at,
        ...await disclosedProject(caller, teaser) });
    }
    return { content: [{ type: "text", text: requests.length
      ? requests.map(row => `${row.project.teaserTitle} - ${row.status}`).join("\n")
      : "No access requests yet." }], structuredContent: { requests } };
  },
});
