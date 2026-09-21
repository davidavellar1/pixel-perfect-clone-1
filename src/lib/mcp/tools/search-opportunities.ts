import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

interface ProjectRow {
  slug: string;
  title: string;
  city: string;
  country_code: string;
  technology: string;
  lifecycle_stage: string;
  project_type: string;
  capacity_mw: number;
  headline_investment: number | null;
  headline_irr_pct: number | null;
  summary: string | null;
  verified: boolean;
  created_at: string;
}

const toJson = (p: ProjectRow) => ({
  slug: p.slug,
  title: p.title,
  city: p.city,
  countryCode: p.country_code,
  technology: p.technology,
  lifecycleStage: p.lifecycle_stage,
  projectType: p.project_type,
  capacityMw: p.capacity_mw,
  headlineInvestment: p.headline_investment,
  headlineIrrPct: p.headline_irr_pct,
  summary: p.summary,
  verified: p.verified,
  createdAt: p.created_at,
});

export default defineTool({
  name: "search_opportunities",
  title: "Search listed opportunities",
  description:
    "Search listed district heating and cooling projects on the marketplace. Filters are optional; figures are developer-stated and unverified.",
  inputSchema: {
    query: z.string().trim().nullable().describe("Free text matched against title, city and summary."),
    countryCode: z.string().trim().length(2).nullable().describe("Two-letter country code, e.g. FR."),
    technology: z.string().trim().nullable().describe("Primary technology, e.g. waste_heat, geothermal."),
    lifecycleStage: z.string().trim().nullable().describe("Lifecycle stage, e.g. development, construction."),
    minCapacityMw: z.number().nonnegative().nullable().describe("Minimum installed capacity in MW."),
    limit: z.number().int().min(1).max(50).nullable().describe("Maximum results to return (default 10)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("project")
      .select(
        "slug,title,city,country_code,technology,lifecycle_stage,project_type,capacity_mw,headline_investment,headline_irr_pct,summary,verified,created_at",
      )
      .eq("visibility", "listed")
      .order("created_at", { ascending: false })
      .limit(input.limit ?? 10);

    if (input.countryCode) q = q.eq("country_code", input.countryCode.toUpperCase());
    if (input.technology) q = q.eq("technology", input.technology as never);
    if (input.lifecycleStage) q = q.eq("lifecycle_stage", input.lifecycleStage as never);
    if (input.minCapacityMw !== null && input.minCapacityMw !== undefined) {
      q = q.gte("capacity_mw", input.minCapacityMw);
    }
    if (input.query) {
      const like = `%${input.query}%`;
      q = q.or(`title.ilike.${like},city.ilike.${like},summary.ilike.${like}`);
    }

    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const projects = ((data ?? []) as ProjectRow[]).map(toJson);
    return {
      content: [
        {
          type: "text",
          text: projects.length
            ? projects
                .map(
                  (p) =>
                    `${p.title} (${p.slug}) - ${p.city}, ${p.countryCode} - ${p.capacityMw} MW - ${p.technology} - ${p.lifecycleStage}`,
                )
                .join("\n")
            : "No listed projects match these filters.",
        },
      ],
      structuredContent: { projects },
    };
  },
});
