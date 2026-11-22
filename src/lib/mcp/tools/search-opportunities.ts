import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { disclosedProject, resolveCaller } from "../disclosure";

export default defineTool({
  name: "search_opportunities",
  title: "Search listed opportunities",
  description: "Search anonymized listed projects. Qualified information and accepted identity use the same gates as the interface. Figures are developer-stated and unverified.",
  inputSchema: {
    query: z.string().trim().nullable().describe("Free text matched against the anonymized teaser title."),
    countryCode: z.string().trim().length(2).nullable().describe("Two-letter country code, e.g. FR."),
    technology: z.string().trim().nullable().describe("Primary technology, e.g. waste_heat, geothermal."),
    lifecycleStage: z.string().trim().nullable().describe("Lifecycle stage, e.g. development, construction."),
    minCapacityMw: z.number().nonnegative().nullable().describe("Minimum capacity band floor in MW."),
    limit: z.number().int().min(1).max(50).nullable().describe("Maximum results to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    const caller = await resolveCaller(ctx);
    let query = caller.client.from("project_teaser").select("*")
      .order("created_at", { ascending: false }).limit(input.limit ?? 10);
    if (input.countryCode) query = query.eq("country_code", input.countryCode.toUpperCase());
    if (input.technology) query = query.eq("technology", input.technology as never);
    if (input.lifecycleStage) query = query.eq("lifecycle_stage", input.lifecycleStage as never);
    if (input.query) query = query.ilike("teaser_title", `%${input.query}%`);
    const { data, error } = await query;
    if (error) throw new ToolError("Unable to search listings.");
    const rows = (data ?? []).filter(row => {
      if (input.minCapacityMw == null) return true;
      const floor = row.capacity_band?.startsWith("Under") ? 0 : Number(row.capacity_band?.match(/\d+/)?.[0] ?? 0);
      return floor >= input.minCapacityMw;
    });
    const projects = await Promise.all(rows.map(row => disclosedProject(caller, row)));
    return { content: [{ type: "text", text: projects.length
      ? projects.map(({ project }) => `${project.teaserTitle} - ${project.countryCode}`).join("\n")
      : "No listed projects match these filters." }], structuredContent: { projects } };
  },
});
