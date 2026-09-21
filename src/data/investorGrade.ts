/**
 * Shared types and helpers for the investor-grade project records.
 * These mirror the database tables project_transaction, project_process,
 * construction_package, margin_profile, project_case and offtake_ladder.
 */
import type { Tables } from "@/integrations/supabase/types";

export type TransactionRecord = Tables<"project_transaction">;
export type ProcessRecord = Tables<"project_process">;
export type ConstructionRecord = Tables<"construction_package">;
export type MarginRecord = Tables<"margin_profile">;
export type CaseRecord = Tables<"project_case">;
export type LadderRecord = Tables<"offtake_ladder">;

export interface InvestorGradeBundle {
  transaction: TransactionRecord | null;
  process: ProcessRecord | null;
  construction: ConstructionRecord | null;
  margin: MarginRecord | null;
  cases: CaseRecord[];
  ladder: LadderRecord | null;
}

export const emptyInvestorGrade: InvestorGradeBundle = {
  transaction: null,
  process: null,
  construction: null,
  margin: null,
  cases: [],
  ladder: null,
};

export const CASE_ORDER: CaseRecord["name"][] = ["base", "downside", "stress", "upside"];

export const CASE_LABEL: Record<CaseRecord["name"], string> = {
  base: "Base case",
  downside: "Downside case",
  stress: "Stress case",
  upside: "Upside case",
};

export const INSTRUMENT_LABEL: Record<string, string> = {
  equity: "Equity",
  equity_and_shareholder_loan: "Equity and shareholder loan",
  preferred_equity: "Preferred equity",
  mezzanine: "Mezzanine",
  convertible: "Convertible",
  other: "Other",
};

export const LADDER_TIERS = [
  { key: "contracted", label: "Contracted", color: "hsl(152 69% 34%)" },
  { key: "signed_connection_agreement", label: "Signed connection agreements", color: "hsl(199 89% 48%)" },
  { key: "in_negotiation", label: "In negotiation", color: "hsl(38 92% 50%)" },
] as const;

export const DEFAULT_RESERVED_MATTERS = [
  "Annual budget and business plan",
  "Capital expenditure above an agreed threshold",
  "New indebtedness or refinancing",
  "Issue or transfer of shares",
  "Related-party transactions",
  "Change of auditor or accounting policy",
  "Sale of material assets",
  "Amendment of the concession or offtake agreements",
];

export const DEFAULT_EXIT_ROUTES = [
  "Trade sale to a strategic utility",
  "Secondary sale to an infrastructure fund",
  "Sponsor buy-back",
  "Refinancing and partial distribution",
];

export const DEVELOPER_STATED = "developer-stated";

/** Formats a number as euros without fractional noise. */
export const eur = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "Not stated";
  if (Math.abs(value) >= 1_000_000) return `EUR ${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `EUR ${Math.round(value / 1_000)}k`;
  return `EUR ${value.toLocaleString()}`;
};

export const pct = (value: number | null | undefined, digits = 1) =>
  value === null || value === undefined ? "Not stated" : `${Number(value).toFixed(digits)}%`;

export const asOfLine = (label: string, date: string | null | undefined) =>
  date
    ? `${label} as of ${new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
    : `${label} as-of date not stated`;

/** Total committed load share across the two committed tiers of the ladder. */
export const committedLoadPct = (ladder: LadderRecord | null) =>
  ladder ? Number(ladder.contracted_load_pct || 0) + Number(ladder.signed_connection_load_pct || 0) : null;

export const committedBuildingCount = (ladder: LadderRecord | null) =>
  ladder ? (ladder.contracted_count || 0) + (ladder.signed_connection_count || 0) : null;

export const committedBuildingPct = (ladder: LadderRecord | null) => {
  if (!ladder?.total_buildings) return null;
  const count = committedBuildingCount(ladder) || 0;
  return (count / ladder.total_buildings) * 100;
};
