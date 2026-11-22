import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { disclosedProject, findTeaser, resolveCaller } from "../disclosure";

export default defineTool({
  name: "add_to_watchlist",
  title: "Add project to my watchlist",
  description: "Save a listed project for the resolved user. Does not express interest or request data-room access.",
  inputSchema: { publicRef: z.string().trim().uuid().describe("Opaque project reference (publicRef) to save, as returned by search_opportunities.") },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ publicRef }, ctx) => {
    const caller = await resolveCaller(ctx);
    const teaser = await findTeaser(caller, publicRef);
    const result = await disclosedProject(caller, teaser);
    if (!caller.user) return { content: [{ type: "text", text: "Sign in to save this listing." }],
      structuredContent: { saved: false, ...result } };
    const { error } = await caller.client.from("watchlist_item")
      .upsert({ user_id: caller.user.id, project_id: teaser.id }, { onConflict: "user_id,project_id" });
    if (error) throw new ToolError("Unable to save listing.");
    return { content: [{ type: "text", text: "Listing saved to your watchlist." }],
      structuredContent: { saved: true, ...result } };
  },
});
