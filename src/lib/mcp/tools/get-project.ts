import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

import { effectiveState, isGranted } from "@/lib/access";
import { teaserJson, type ProjectTeaser } from "@/lib/projectDisclosure";
import type { Tables } from "@/integrations/supabase/types";

export default defineTool({
  name: "get_project",
  title: "Get project profile",
  description:
    "Return an anonymized teaser, or investor detail after the calling user has granted access. Figures are developer-stated and unverified.",
  inputSchema: { slug: z.string().trim().min(1).describe("Project slug, as returned by search_opportunities.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    const { data: teaser, error } = await supabase.from("project_teaser").select("*").eq("slug", slug).maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!teaser?.id) throw new ToolError(`No listed project found for slug "${slug}".`);
    const { data: request, error: requestError } = await supabase.from("access_request").select("*")
      .eq("project_id", teaser.id).eq("investor_user_id", ctx.getUserId()).maybeSingle();
    if (requestError) throw new ToolError(requestError.message);
    if (!request || !isGranted(effectiveState(request as Tables<"access_request">))) {
      const project = teaserJson(teaser as ProjectTeaser);
      return { content: [{ type: "text", text: `${project.teaserTitle}, ${project.countryCode} - ${project.capacityBand ?? ""}` }], structuredContent: { project } };
    }
    const [detail, financial, cases] = await Promise.all([
      supabase.from("project").select("id,slug,title,city,country_code,technology,lifecycle_stage,project_type,capacity_mw,network_length_km,households_served,headline_investment,headline_co2_tonnes,summary,description,verified,timeline_start,timeline_end,financial_as_of").eq("id", teaser.id).single(),
      supabase.from("financial_summary").select("currency,capex,equity_required,min_ticket,gearing_pct,funding_progress_pct,payback_years").eq("project_id", teaser.id).maybeSingle(),
      supabase.from("project_case").select("name,equity_irr_pct,min_dscr").eq("project_id", teaser.id),
    ]);
    for (const result of [detail, financial, cases]) if (result.error) throw new ToolError(result.error.message);
    const p = detail.data;
    if (!p) throw new ToolError("Project detail is unavailable.");
    const f = financial.data;
    const project = {
      slug: p.slug, title: p.title, city: p.city, countryCode: p.country_code,
      technology: p.technology, lifecycleStage: p.lifecycle_stage, projectType: p.project_type,
      capacityMw: p.capacity_mw, networkLengthKm: p.network_length_km, householdsServed: p.households_served,
      headlineInvestment: p.headline_investment, headlineCo2Tonnes: p.headline_co2_tonnes,
      summary: p.summary, description: p.description, verified: p.verified,
      timelineStart: p.timeline_start, timelineEnd: p.timeline_end,
      financialAsOf: p.financial_as_of, figuresSource: "developer-stated",
      cases: (cases.data ?? []).map((row) => ({ case: row.name, equityIrrPct: row.equity_irr_pct, minDscr: row.min_dscr })),
      financialSummary: f ? { currency: f.currency, capex: f.capex, equityRequired: f.equity_required,
        minTicket: f.min_ticket, gearingPct: f.gearing_pct, fundingProgressPct: f.funding_progress_pct, paybackYears: f.payback_years } : null,
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
