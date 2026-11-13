import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

import { teaserJson, type ProjectTeaser } from "@/lib/projectDisclosure";

export default defineTool({
  name: "search_opportunities",
  title: "Search listed opportunities",
  description:
    "Search listed district heating and cooling projects on the marketplace. Filters are optional; figures are developer-stated and unverified.",
  inputSchema: {
    query: z.string().trim().nullable().describe("Free text matched against the anonymized teaser title."),
    countryCode: z.string().trim().length(2).nullable().describe("Two-letter country code, e.g. FR."),
    technology: z.string().trim().nullable().describe("Primary technology, e.g. waste_heat, geothermal."),
    lifecycleStage: z.string().trim().nullable().describe("Lifecycle stage, e.g. development, construction."),
    minCapacityMw: z.number().nonnegative().nullable().describe("Minimum capacity band floor in MW; exact capacity is not disclosed."),
    limit: z.number().int().min(1).max(50).nullable().describe("Maximum results to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("project_teaser")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 10);

    if (input.countryCode) q = q.eq("country_code", input.countryCode.toUpperCase());
    if (input.technology) q = q.eq("technology", input.technology as never);
    if (input.lifecycleStage) q = q.eq("lifecycle_stage", input.lifecycleStage as never);
    if (input.query) q = q.ilike("teaser_title", `%${input.query}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const projects = ((data ?? []) as ProjectTeaser[]).filter((p) => {
      if (input.minCapacityMw == null) return true;
      const floor = p.capacity_band?.startsWith("Under") ? 0 : Number(p.capacity_band?.match(/\d+/)?.[0] ?? 0);
      return floor >= input.minCapacityMw;
    }).map(teaserJson);
    return {
      content: [
        {
          type: "text",
          text: projects.length
            ? projects
                .map(
                  (p) =>
                    `${p.teaserTitle} (${p.slug}) - ${p.countryCode} - ${p.capacityBand ?? ""} - ${p.technology} - ${p.lifecycleStage}`,
                )
                .join("\n")
            : "No listed projects match these filters.",
        },
      ],
      structuredContent: { projects },
    };
  },
});
