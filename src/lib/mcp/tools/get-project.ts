import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

interface ProjectRow {
  id: string;
  slug: string;
  title: string;
  city: string;
  country_code: string;
  technology: string;
  lifecycle_stage: string;
  project_type: string;
  capacity_mw: number;
  network_length_km: number | null;
  households_served: number | null;
  headline_investment: number | null;
  headline_irr_pct: number | null;
  headline_co2_tonnes: number | null;
  summary: string | null;
  description: string | null;
  verified: boolean;
  timeline_start: string | null;
  timeline_end: string | null;
}

interface FinancialRow {
  currency: string;
  capex: number | null;
  equity_required: number | null;
  min_ticket: number | null;
  gearing_pct: number | null;
  funding_progress_pct: number | null;
  payback_years: number | null;
}

export default defineTool({
  name: "get_project",
  title: "Get project profile",
  description:
    "Return the public profile of one listed project by slug, including headline figures and any financial summary the developer has published. Figures are developer-stated and unverified.",
  inputSchema: { slug: z.string().trim().min(1).describe("Project slug, as returned by search_opportunities.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("project")
      .select("*")
      .eq("slug", slug)
      .eq("visibility", "listed")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) throw new ToolError(`No listed project found for slug "${slug}".`);

    const p = data as unknown as ProjectRow;
    const { data: fin } = await supabase
      .from("financial_summary")
      .select("currency,capex,equity_required,min_ticket,gearing_pct,funding_progress_pct,payback_years")
      .eq("project_id", p.id)
      .maybeSingle();
    const f = (fin ?? null) as FinancialRow | null;

    const project = {
      slug: p.slug,
      title: p.title,
      city: p.city,
      countryCode: p.country_code,
      technology: p.technology,
      lifecycleStage: p.lifecycle_stage,
      projectType: p.project_type,
      capacityMw: p.capacity_mw,
      networkLengthKm: p.network_length_km,
      householdsServed: p.households_served,
      headlineInvestment: p.headline_investment,
      headlineIrrPct: p.headline_irr_pct,
      headlineCo2Tonnes: p.headline_co2_tonnes,
      summary: p.summary,
      description: p.description,
      verified: p.verified,
      timelineStart: p.timeline_start,
      timelineEnd: p.timeline_end,
      financialSummary: f
        ? {
            currency: f.currency,
            capex: f.capex,
            equityRequired: f.equity_required,
            minTicket: f.min_ticket,
            gearingPct: f.gearing_pct,
            fundingProgressPct: f.funding_progress_pct,
            paybackYears: f.payback_years,
          }
        : null,
    };

    return {
      content: [
        {
          type: "text",
          text: `${project.title} - ${project.city}, ${project.countryCode}\n${project.capacityMw} MW ${project.technology}, stage ${project.lifecycleStage}\n${project.summary ?? ""}`.trim(),
        },
      ],
      structuredContent: { project },
    };
  },
});
