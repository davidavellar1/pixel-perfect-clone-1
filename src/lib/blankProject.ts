import type { Tables } from "@/integrations/supabase/types";
import type { ProjectDetail } from "@/data/projectsData";

const NOT_STATED = "Not stated";

/**
 * Builds the detail shape for a listing that exists only in the database.
 * Every field comes from that project's own record; anything the developer has not
 * entered stays empty or reads "Not stated". Never borrow from the sample content —
 * an investor would read another project's figures as fact.
 */
export function blankProjectDetail(row: Tables<"project">): ProjectDetail {
  const readable = (value: string) => value.replace(/_/g, " ");
  const years = [row.timeline_start?.slice(0, 4), row.timeline_end?.slice(0, 4)].filter(Boolean);

  return {
    slug: row.slug,
    title: row.title,
    badge: readable(row.project_type),
    location: `${row.city}, ${row.country_code}`,
    country: row.country_code,
    source: readable(row.technology),
    technology: readable(row.technology),
    stage: readable(row.lifecycle_stage),
    type: "District heating and cooling",
    targetIRR: NOT_STATED,
    capex: row.headline_investment
      ? `€${(Number(row.headline_investment) / 1_000_000).toFixed(1)}M`
      : NOT_STATED,
    capacity: row.capacity_mw ? `${row.capacity_mw} MW` : NOT_STATED,
    npv: NOT_STATED,
    paybackPeriod: NOT_STATED,
    summary: row.summary || row.description || "The developer has not published a summary yet.",
    summaryExtended: row.description || undefined,
    timeline: [],
    documents: [],
    co2Reduction: row.headline_co2_tonnes
      ? `${Number(row.headline_co2_tonnes).toLocaleString()} tonnes/yr`
      : NOT_STATED,
    householdsServed: row.households_served?.toLocaleString() || NOT_STATED,
    timelineRange: years.length ? years.join(" to ") : "To be confirmed",
    equityRequired: NOT_STATED,
    minTicket: NOT_STATED,
    unleveragedIRR: NOT_STATED,
    concessionTerm: NOT_STATED,
    firstRevenue: NOT_STATED,
    fundingProgress: 0,
    fundingRemaining: NOT_STATED,
    developer: {
      name: "Project developer",
      verified: row.verified,
      hq: NOT_STATED,
      founded: NOT_STATED,
      dhcProjects: NOT_STATED,
      totalCapacity: NOT_STATED,
    },
    advisors: [],
    technologyCards: [],
    badges: [],
  };
}
