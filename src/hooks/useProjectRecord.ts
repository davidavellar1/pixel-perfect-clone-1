import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectDetail } from "@/data/projectsData";

/**
 * Loads the live database detail for a project (financial, technical, sustainability
 * and structure figures) and shapes it into the same fields the detail tabs render.
 * Only fields the database actually carries are returned, so anything missing keeps
 * falling back to the static content.
 */

const STACK_COLORS = [
  "hsl(var(--primary))",
  "hsl(152 69% 40%)",
  "hsl(271 60% 60%)",
  "hsl(271 40% 75%)",
  "hsl(199 89% 48%)",
];

const SDG_COLORS: Record<number, string> = {
  7: "hsl(45 93% 47%)",
  9: "hsl(14 80% 50%)",
  11: "hsl(33 90% 50%)",
  12: "hsl(38 70% 45%)",
  13: "hsl(152 69% 35%)",
  17: "hsl(217 60% 35%)",
};

function money(value: number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return undefined;
  if (n >= 1_000_000_000) return `€${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  return `€${Math.round(n).toLocaleString()}`;
}

function pct(value: number | null | undefined): string | undefined {
  if (value === null || value === undefined) return undefined;
  return `${Number(value).toFixed(1)}%`;
}

function severityLabel(value: string): "Low" | "Medium" | "High" {
  return (value.charAt(0).toUpperCase() + value.slice(1)) as "Low" | "Medium" | "High";
}

function clean<T extends object>(input: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null && !(Array.isArray(value) && value.length === 0)) {
      out[key] = value;
    }
  }
  return out as Partial<T>;
}

export function useProjectRecord(projectId: string | undefined) {
  const [overrides, setOverrides] = useState<Partial<ProjectDetail>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) {
      setOverrides({});
      return;
    }
    let cancelled = false;
    setLoading(true);

    (async () => {
      const [
        financialRes,
        sustainabilityRes,
        milestonesRes,
        risksRes,
        advisorsRes,
        techCardsRes,
        energyMixRes,
        operatingRes,
      ] = await Promise.all([
        supabase.from("financial_summary").select("*").eq("project_id", projectId).maybeSingle(),
        supabase.from("sustainability_profile").select("*").eq("project_id", projectId).maybeSingle(),
        supabase.from("milestone").select("*").eq("project_id", projectId).order("sort_order"),
        supabase.from("risk").select("*").eq("project_id", projectId),
        supabase
          .from("project_advisor")
          .select("role, advisor:advisor_id(name, label)")
          .eq("project_id", projectId),
      ]);

      const financial = financialRes.data;
      const sustainability = sustainabilityRes.data;

      const [stackRes, revenueRes, fundingRes, sdgRes] = await Promise.all([
        financial
          ? supabase.from("capital_stack_item").select("*").eq("financial_summary_id", financial.id).order("sort_order")
          : Promise.resolve({ data: null }),
        financial
          ? supabase.from("revenue_stream").select("*").eq("financial_summary_id", financial.id)
          : Promise.resolve({ data: null }),
        financial
          ? supabase.from("public_funding").select("*").eq("financial_summary_id", financial.id)
          : Promise.resolve({ data: null }),
        sustainability
          ? supabase.from("sdg_alignment").select("*").eq("sustainability_profile_id", sustainability.id).order("sdg_number")
          : Promise.resolve({ data: null }),
      ]);

      if (cancelled) return;

      const next: Partial<ProjectDetail> = {
        ...clean({
          capex: money(financial?.capex),
          npv: money(financial?.npv),
          equityRequired: money(financial?.equity_required),
          minTicket: money(financial?.min_ticket),
          fundingRemaining: money(financial?.funding_remaining),
          targetIRR: pct(financial?.target_irr_pct),
          unleveragedIRR: pct(financial?.unleveraged_irr_pct),
          paybackPeriod: financial?.payback_years ? `${Number(financial.payback_years)} years` : undefined,
          concessionTerm: financial?.concession_term_years ? `${financial.concession_term_years} years` : undefined,
          firstRevenue: financial?.first_revenue_year ? String(financial.first_revenue_year) : undefined,
          fundingProgress:
            financial?.funding_progress_pct !== null && financial?.funding_progress_pct !== undefined
              ? Number(financial.funding_progress_pct)
              : undefined,
        }),
      };

      const stack = (stackRes.data ?? []).map((item, index) => ({
        label: item.label,
        percentage: Number(item.share_pct ?? 0),
        amount: money(item.amount) ?? "Not stated",
        description: item.provider ?? "",
        color: STACK_COLORS[index % STACK_COLORS.length]!,
      }));
      if (stack.length) next.capitalStack = stack;

      const revenue = (revenueRes.data ?? []).map((row) => ({
        stream: row.stream,
        structure: row.structure ?? "",
        percentRevenue: row.pct_of_revenue !== null ? `${Number(row.pct_of_revenue).toFixed(0)}%` : "",
        counterparty: row.counterparty ?? "",
      }));
      if (revenue.length) next.revenueStreams = revenue;

      const funding = (fundingRes.data ?? []).map((row) => ({
        source: row.source,
        amount: money(row.amount) ?? "Not stated",
        status: row.status ?? "Indicative",
      }));
      if (funding.length) next.publicFunding = funding;

      const risks = (risksRes.data ?? []).map((row) => ({
        title: row.category,
        severity: severityLabel(row.severity),
        description: [row.description, row.mitigation].filter(Boolean).join(" ") || "",
      }));
      if (risks.length) next.risks = risks;

      const timeline = (milestonesRes.data ?? []).map((row) => ({
        title: row.label,
        status: (row.status === "in_progress" ? "in_progress" : row.status === "completed" ? "completed" : "planned") as
          | "completed"
          | "in_progress"
          | "planned",
        date: row.target_date ? new Date(row.target_date).getFullYear().toString() : "",
        description: row.description ?? "",
      }));
      if (timeline.length) next.timeline = timeline;

      if (sustainability) {
        if (sustainability.co2_tonnes_per_year) {
          next.co2Reduction = `${Number(sustainability.co2_tonnes_per_year).toLocaleString()} tonnes/yr`;
          next.co2Detail = {
            tonnes: Number(sustainability.co2_tonnes_per_year),
            equivalentCars: sustainability.equivalent_cars
              ? Number(sustainability.equivalent_cars).toLocaleString()
              : "not stated",
            lifetimeReduction: sustainability.lifetime_reduction_tonnes
              ? `${Number(sustainability.lifetime_reduction_tonnes).toLocaleString()} tonnes`
              : "not stated",
          };
        }
        if (sustainability.eu_taxonomy_objective) {
          next.euTaxonomy = {
            objective: sustainability.eu_taxonomy_objective,
            description: sustainability.eu_taxonomy_aligned
              ? "Assessed as aligned with the EU Taxonomy for Sustainable Finance (Regulation 2020/852) for this objective."
              : "Taxonomy objective reported by the developer; alignment not yet confirmed.",
          };
        }
        if (sustainability.sfdr_article) {
          next.sfdr = {
            article: `Article ${sustainability.sfdr_article}`,
            description: "Classification reported by the lead investor under SFDR.",
          };
        }
      }

      const sdgs = (sdgRes.data ?? []).map((row) => ({
        number: row.sdg_number,
        title: row.title ?? `SDG ${row.sdg_number}`,
        description: row.note ?? "",
        color: SDG_COLORS[row.sdg_number] ?? "hsl(var(--primary))",
      }));
      if (sdgs.length) next.sdgs = sdgs;

      const advisors = (advisorsRes.data ?? [])
        .map((row) => {
          const linked = row.advisor as { name: string; label: string } | null;
          return linked ? { name: linked.name, role: row.role ?? linked.label } : null;
        })
        .filter((row): row is { name: string; role: string } => row !== null);
      if (advisors.length) next.advisors = advisors;

      setOverrides(next);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return { overrides, loading };
}
