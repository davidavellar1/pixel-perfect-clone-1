import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

interface WatchRow {
  added_at: string;
  project: {
    slug: string;
    title: string;
    city: string;
    country_code: string;
    capacity_mw: number;
    technology: string;
    lifecycle_stage: string;
  } | null;
}

export default defineTool({
  name: "list_watchlist",
  title: "List my watchlist",
  description: "List the projects the signed-in user has saved to their watchlist.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("watchlist_item")
      .select("added_at, project:project_id(slug,title,city,country_code,capacity_mw,technology,lifecycle_stage)")
      .order("added_at", { ascending: false });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const items = ((data ?? []) as unknown as WatchRow[])
      .filter((row) => row.project !== null)
      .map((row) => ({
        addedAt: row.added_at,
        slug: row.project!.slug,
        title: row.project!.title,
        city: row.project!.city,
        countryCode: row.project!.country_code,
        capacityMw: row.project!.capacity_mw,
        technology: row.project!.technology,
        lifecycleStage: row.project!.lifecycle_stage,
      }));

    return {
      content: [
        {
          type: "text",
          text: items.length
            ? items.map((i) => `${i.title} (${i.slug}) - ${i.city}, ${i.countryCode} - ${i.capacityMw} MW`).join("\n")
            : "Your watchlist is empty.",
        },
      ],
      structuredContent: { items },
    };
  },
});
