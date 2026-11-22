import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { disclosedProject, findTeaser, resolveCaller } from "../disclosure";

export default defineTool({
  name: "get_project",
  title: "Get project profile",
  description: "Return a teaser, qualified de-identified information and separately accepted identity. Figures are developer-stated and unverified.",
  inputSchema: { publicRef: z.string().trim().uuid().describe("Opaque project reference (publicRef), as returned by search_opportunities.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ publicRef }, ctx) => {
    const caller = await resolveCaller(ctx);
    const result = await disclosedProject(caller, await findTeaser(caller, publicRef));
    return { content: [{ type: "text", text: result.project.teaserTitle ?? "Project listing" }],
      structuredContent: result };
  },
});
