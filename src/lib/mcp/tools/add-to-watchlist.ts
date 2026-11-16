import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "add_to_watchlist",
  title: "Add project to my watchlist",
  description: "Save a listed project to the signed-in user's watchlist. Does not express interest or request data-room access.",
  inputSchema: { slug: z.string().trim().min(1).describe("Project slug to save.") },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    const userId = ctx.getUserId();
    if (!ctx.isAuthenticated() || !userId) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: project, error: projectError } = await supabase
      .from("project_teaser")
      .select("id,teaser_title")
      .eq("slug", slug)
      .maybeSingle();
    if (projectError) return { content: [{ type: "text", text: projectError.message }], isError: true };
    if (!project?.id) throw new ToolError(`No listed project found for slug "${slug}".`);

    const row = { id: project.id, title: project.teaser_title ?? slug };
    const { error } = await supabase
      .from("watchlist_item")
      .upsert({ user_id: userId, project_id: row.id }, { onConflict: "user_id,project_id" });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: `Saved "${row.title}" to your watchlist.` }],
      structuredContent: { saved: { slug, title: row.title } },
    };
  },
});
