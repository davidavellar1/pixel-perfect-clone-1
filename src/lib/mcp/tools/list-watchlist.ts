import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { disclosedProject, resolveCaller, teasersById } from "../disclosure";

export default defineTool({
  name: "list_watchlist",
  title: "List my watchlist",
  description: "List the resolved user's saved projects with qualification and acceptance disclosure gates.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const caller = await resolveCaller(ctx);
    const result = caller.user ? await caller.client.from("watchlist_item")
      .select("project_id,added_at").eq("user_id", caller.user.id)
      .order("added_at", { ascending: false }).limit(50) : { data: [], error: null };
    if (result.error) throw new ToolError("Unable to load watchlist.");
    const rows = result.data ?? [];
    const teasers = await teasersById(caller, rows.map(row => row.project_id));
    const items = [];
    for (const row of rows) {
      const teaser = teasers.get(row.project_id);
      if (teaser) items.push({ addedAt: row.added_at, ...await disclosedProject(caller, teaser) });
    }
    return { content: [{ type: "text", text: items.length
      ? items.map(item => item.project.teaserTitle ?? "Project listing").join("\n")
      : "Your watchlist is empty." }], structuredContent: { items } };
  },
});
