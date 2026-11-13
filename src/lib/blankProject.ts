import type { Tables } from "@/integrations/supabase/types";
export interface ProjectDetail {
  slug: string;
  badge: string;
  title: string;
  location: string;
  country: string;
  source: string;
  stage: string;
  type: string;
  technology: string;
  publicSupport?: boolean;
  targetIRR: string | null;
  capex: string | null;
  capacity: string | null;
  npv: string | null;
  paybackPeriod: string | null;
  summary: string;
  summaryExtended?: string;
  timeline: { title: string; status: "completed" | "in_progress" | "planned"; date: string; description: string }[];
  documents: string[];
  co2Reduction: string | null;
  householdsServed: string | null;
  timelineRange: string | null;
  // New fields
  equityRequired: string | null;
  minTicket: string | null;
  unleveragedIRR: string | null;
  concessionTerm: string | null;
  firstRevenue: string | null;
  fundingProgress: number; // percentage
  fundingRemaining: string | null;
  developer: {
    name: string;
    verified: boolean;
    hq: string | null;
    founded: string | null;
    dhcProjects: string | null;
    totalCapacity: string | null;
  };
  advisors: { name: string; role: string }[];
  publicFunding?: { source: string; amount: string; numericAmount: number | null; status: string }[];
  technologyCards: { title: string; description: string }[];
  capitalStack?: { label: string; percentage: number; amount: string; description: string; color: string }[];
  revenueStreams?: { stream: string; structure: string; percentRevenue: string; counterparty: string }[];
  risks?: { title: string; severity: "Low" | "Medium" | "High"; description: string }[];
  co2Detail?: { tonnes: number; equivalentCars: string; lifetimeReduction: string };
  euTaxonomy?: { objective: string; description: string };
  sdgs?: { number: number; title: string; description: string; color: string }[];
  sfdr?: { article: string; description: string };
  energyMix?: { source: string; percentage: number }[];
  operatingParameters?: { parameter: string; value: string; benchmark: string }[];
  sustainabilityMetrics?: { label: string; value: string; context: string }[];
  badges: string[];
}


/**
 * Builds the detail shape for a listing that exists only in the database.
 * Every field comes from that project's own record; anything the developer has not
 * entered stays empty. Never borrow from sample content -
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
    targetIRR: null,
    capex: row.headline_investment
      ? `€${(Number(row.headline_investment) / 1_000_000).toFixed(1)}M`
      : null,
    capacity: row.capacity_mw ? `${row.capacity_mw} MW` : null,
    npv: null,
    paybackPeriod: null,
    summary: row.summary || row.description || "The developer has not published a summary yet.",
    summaryExtended: row.description || undefined,
    timeline: [],
    documents: [],
    co2Reduction: row.headline_co2_tonnes
      ? `${Number(row.headline_co2_tonnes).toLocaleString()} tonnes/yr`
      : null,
    householdsServed: row.households_served?.toLocaleString() || null,
    timelineRange: years.length ? years.join(" to ") : "To be confirmed",
    equityRequired: null,
    minTicket: null,
    unleveragedIRR: null,
    concessionTerm: null,
    firstRevenue: null,
    fundingProgress: 0,
    fundingRemaining: null,
    developer: {
      name: "Project developer",
      verified: row.verified,
      hq: null,
      founded: null,
      dhcProjects: null,
      totalCapacity: null,
    },
    advisors: [],
    technologyCards: [],
    badges: [],
  };
}
