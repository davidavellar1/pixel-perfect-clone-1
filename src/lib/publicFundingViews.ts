import type { Database } from "@/integrations/supabase/types";

/**
 * Public-funding views for the dashboards and the portfolio view. Pure functions over the
 * public_funding rows the viewer can read (RLS admits the owner and accepted investors only),
 * so every figure here is one the viewer is entitled to. Nothing is estimated: a row without
 * an amount or a recorded status is reported as such and left out of the arithmetic.
 */

export type FundingStatus = Database["public"]["Enums"]["public_funding_status"];

export interface FundingRow {
  projectId: string;
  projectLabel: string;
  body: string | null;
  source: string;
  amount: number | null;
  status: FundingStatus | null;
  decisionDate: string | null;
  conditions: string | null;
}

export const UNAWARDED: readonly FundingStatus[] = ["intending", "applied", "decision_pending"];

export const FUNDING_STATUS_LABEL: Record<FundingStatus, string> = {
  intending: "Intending to apply",
  applied: "Applied",
  decision_pending: "Decision pending",
  awarded: "Awarded",
  declined: "Declined",
};

export const statusLabel = (status: FundingStatus | null) => (status ? FUNDING_STATUS_LABEL[status] : "Status not recorded");
export const bodyLabel = (row: Pick<FundingRow, "body">) => row.body?.trim() || "Deciding body not stated";

const isUnawarded = (row: FundingRow) => row.status !== null && UNAWARDED.includes(row.status);
const hasAmount = (row: FundingRow): row is FundingRow & { amount: number } => row.amount !== null && Number.isFinite(row.amount);

export interface BodyGroup {
  body: string;
  amount: number;
  rows: FundingRow[];
}

/** Unawarded funding grouped by the body that decides it, largest first, decision dates ascending. */
export function unawardedByBody(rows: FundingRow[]): BodyGroup[] {
  const groups = new Map<string, FundingRow[]>();
  for (const row of rows.filter(isUnawarded)) groups.set(bodyLabel(row), [...(groups.get(bodyLabel(row)) ?? []), row]);
  return [...groups].map(([body, list]) => ({
    body,
    amount: list.filter(hasAmount).reduce((sum, row) => sum + row.amount, 0),
    rows: [...list].sort((a, b) => (a.decisionDate ?? "9999").localeCompare(b.decisionDate ?? "9999")),
  })).sort((a, b) => b.amount - a.amount);
}

export interface ContingentCapex {
  contingent: number;
  totalCapex: number;
  pct: number;
  projects: number;
  rowsWithoutAmount: number;
  rowsWithoutStatus: number;
  byBody: BodyGroup[];
}

/**
 * Share of capex that depends on public funding not yet awarded. The denominator is the stated
 * capex of the projects whose records the viewer can read; projects without stated capex are
 * left out of both sides.
 */
export function contingentCapex(rows: FundingRow[], capexByProject: Map<string, number | null>): ContingentCapex | null {
  const projects = [...capexByProject].filter((entry): entry is [string, number] => entry[1] !== null && Number.isFinite(entry[1]) && entry[1] > 0);
  if (!projects.length) return null;
  const included = new Set(projects.map(([id]) => id));
  const relevant = rows.filter((row) => included.has(row.projectId));
  const totalCapex = projects.reduce((sum, [, capex]) => sum + capex, 0);
  const contingent = relevant.filter(isUnawarded).filter(hasAmount).reduce((sum, row) => sum + row.amount, 0);
  return {
    contingent,
    totalCapex,
    pct: contingent / totalCapex * 100,
    projects: projects.length,
    rowsWithoutAmount: relevant.filter((row) => isUnawarded(row) && !hasAmount(row)).length,
    rowsWithoutStatus: relevant.filter((row) => row.status === null).length,
    byBody: unawardedByBody(relevant),
  };
}

/**
 * Public support per euro of equity sought, in two readings: awarded funding only, and awarded
 * plus everything still being sought. Only projects with stated equity sought are counted.
 */
export function supportPerEquityEuro(rows: FundingRow[], equityByProject: Map<string, number | null>) {
  const projects = [...equityByProject].filter((entry): entry is [string, number] => entry[1] !== null && Number.isFinite(entry[1]) && entry[1] > 0);
  if (!projects.length) return null;
  const included = new Set(projects.map(([id]) => id));
  const relevant = rows.filter((row) => included.has(row.projectId)).filter(hasAmount);
  const equity = projects.reduce((sum, [, value]) => sum + value, 0);
  const awarded = relevant.filter((row) => row.status === "awarded").reduce((sum, row) => sum + row.amount, 0);
  const sought = relevant.filter(isUnawarded).reduce((sum, row) => sum + row.amount, 0);
  return { equity, projects: projects.length, awarded, sought, awardedOnly: awarded / equity, ifAllAwarded: (awarded + sought) / equity };
}

/** What still has to be decided before financial close, earliest decision first. */
export const beforeClose = (rows: FundingRow[]) =>
  rows.filter(isUnawarded).sort((a, b) => (a.decisionDate ?? "9999").localeCompare(b.decisionDate ?? "9999"));

/** Awarded funding that carries stated conditions (clawback or other treatment) still running. */
export const runningConditions = (rows: FundingRow[]) =>
  rows.filter((row) => row.status === "awarded" && Boolean(row.conditions?.trim()));
