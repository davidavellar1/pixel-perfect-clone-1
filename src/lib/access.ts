/**
 * Request-and-approval access gate.
 * Nothing about a project is revealed until the developer accepts a request.
 * The confidentiality agreement is signed at submission and becomes operative
 * only when the developer accepts, so nda_effective_at stays null while pending.
 */
import type { Database, Tables } from "@/integrations/supabase/types";

export type AccessState = Database["public"]["Enums"]["access_state"];
export type DeclineReason = Database["public"]["Enums"]["access_decline_reason"];
export type AccessScope = Database["public"]["Enums"]["access_scope"];
export type EntityType = Database["public"]["Enums"]["investor_entity_type"];
export type TicketBand = Database["public"]["Enums"]["ticket_band"];
export type InstrumentSought = Database["public"]["Enums"]["instrument_sought"];
export type ConstructionRiskAppetite = Database["public"]["Enums"]["construction_risk_appetite"];
export type CapitalSource = Database["public"]["Enums"]["capital_source"];
export type DecisionProcess = Database["public"]["Enums"]["decision_process"];

export type AccessRequestRow = Tables<"access_request">;
export type AccessAnswersRow = Tables<"access_request_answers">;
export type AccessCriteriaRow = Tables<"listing_access_criteria">;

/** teaser is the absence of a live request, so it is not stored. */
export type ViewerAccess = "teaser" | AccessState;

export const ACCESS_STATE_LABEL: Record<ViewerAccess, string> = {
  teaser: "Anonymized listing",
  pending: "Request pending with the developer",
  granted: "Access granted",
  granted_full: "Access granted in full",
  declined: "Request declined",
  withdrawn: "Request withdrawn",
  lapsed: "Request lapsed without a decision",
};

/** Only these two states reveal identity, counterparties and the data tabs. */
export const isGranted = (state: ViewerAccess) => state === "granted" || state === "granted_full";
export const isDataRoomOpen = (state: ViewerAccess) => state === "granted_full";

export const DECLINE_REASONS: { value: DeclineReason; label: string }[] = [
  { value: "ticket_too_small", label: "Ticket too small for this listing" },
  { value: "wrong_instrument", label: "Instrument sought does not match" },
  { value: "conflict", label: "Conflict declared or identified" },
  { value: "process_closed", label: "Process is closed" },
  { value: "not_now", label: "Not now, revisit later" },
  { value: "other", label: "Other" },
];

export const declineReasonLabel = (reason: DeclineReason | null) =>
  DECLINE_REASONS.find((entry) => entry.value === reason)?.label || "No reason recorded";

export const ENTITY_TYPES: { value: EntityType; label: string }[] = [
  { value: "infra_fund", label: "Infrastructure fund" },
  { value: "pension", label: "Pension" },
  { value: "insurer", label: "Insurer" },
  { value: "family_office", label: "Family office" },
  { value: "regional_fund", label: "Regional fund" },
  { value: "municipal_utility", label: "Municipal utility" },
  { value: "esco", label: "ESCO" },
  { value: "corporate", label: "Corporate" },
  { value: "bank_or_debt_fund", label: "Bank or debt fund" },
  { value: "other", label: "Other" },
];

export const TICKET_BANDS: { value: TicketBand; label: string; floor: number }[] = [
  { value: "under_1m", label: "Under 1M", floor: 0 },
  { value: "1m_3m", label: "1M to 3M", floor: 1_000_000 },
  { value: "3m_5m", label: "3M to 5M", floor: 3_000_000 },
  { value: "5m_10m", label: "5M to 10M", floor: 5_000_000 },
  { value: "10m_plus", label: "10M and above", floor: 10_000_000 },
];

export const ticketBandLabel = (band: TicketBand | null) =>
  TICKET_BANDS.find((entry) => entry.value === band)?.label || "Not stated";

export const INSTRUMENTS_SOUGHT: { value: InstrumentSought; label: string }[] = [
  { value: "equity", label: "Equity" },
  { value: "debt", label: "Debt" },
  { value: "either", label: "Either" },
];

export const CONSTRUCTION_RISK: { value: ConstructionRiskAppetite; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "only_fixed_price_date_certain", label: "Only with a fixed-price, date-certain EPC" },
];

export const CAPITAL_SOURCES: { value: CapitalSource; label: string }[] = [
  { value: "fund_with_dry_powder", label: "Fund with dry powder" },
  { value: "balance_sheet", label: "Balance sheet" },
  { value: "club_to_be_assembled", label: "Club to be assembled" },
  { value: "advising_a_client", label: "Advising a client" },
];

export const DECISION_PROCESSES: { value: DecisionProcess; label: string }[] = [
  { value: "discretionary", label: "Discretionary" },
  { value: "ic_approval", label: "Investment committee approval" },
  { value: "lp_consent", label: "LP consent" },
];

export const INTEREST_DRIVERS = [
  "Regulatory regime",
  "Technology",
  "Geography",
  "Size",
  "Public co-finance",
];

export const optionLabel = <T extends string>(options: { value: T; label: string }[], value: T | null) =>
  options.find((entry) => entry.value === value)?.label || "Not stated";

/* ------------------------------------------------------------------ pipeline */

export type PipelineStage = Database["public"]["Enums"]["deal_stage"];

export const PIPELINE_STAGES: { value: PipelineStage; label: string }[] = [
  { value: "watchlisted", label: "Watchlisted" },
  { value: "interest_submitted", label: "Interest submitted" },
  { value: "access_granted", label: "Access granted" },
  { value: "data_room", label: "Data room" },
  { value: "ioi", label: "IOI" },
  { value: "loi", label: "LOI" },
  { value: "closed", label: "Closed" },
];

/** Older rows used the pre-gate vocabulary. Fold them into the current ladder. */
const LEGACY_STAGE: Record<string, PipelineStage> = {
  interest_logged: "interest_submitted",
  due_diligence: "data_room",
  term_sheet: "loi",
  financial_close: "closed",
};

export const normaliseStage = (stage: string): PipelineStage =>
  (LEGACY_STAGE[stage] || stage) as PipelineStage;

export const stageLabel = (stage: string) =>
  PIPELINE_STAGES.find((entry) => entry.value === normaliseStage(stage))?.label || "Watchlisted";

export const stageIndex = (stage: string) =>
  PIPELINE_STAGES.findIndex((entry) => entry.value === normaliseStage(stage));

/* ------------------------------------------------------------------- fit line */

export interface FitItem {
  label: string;
  ok: boolean;
  detail: string;
}

/** Informational only. The fit line never blocks and never auto-decides. */
export const computeFit = (
  answers: Pick<AccessAnswersRow, "ticket_band" | "instrument_sought" | "construction_risk_appetite" | "conflicts_declared"> | null,
  criteria: AccessCriteriaRow | null,
): FitItem[] => {
  if (!answers) return [];
  const floor = TICKET_BANDS.find((entry) => entry.value === answers.ticket_band)?.floor ?? 0;
  const minTicket = criteria?.min_ticket ? Number(criteria.min_ticket) : null;
  const accepted = criteria?.instruments_accepted || [];
  const instrumentOk =
    !accepted.length || answers.instrument_sought === "either" || accepted.includes(answers.instrument_sought);
  const constructionOk =
    !criteria?.require_construction_risk_appetite ||
    answers.construction_risk_appetite === "yes" ||
    answers.construction_risk_appetite === "only_fixed_price_date_certain";

  return [
    {
      label: "Ticket band meets the minimum",
      ok: minTicket === null || floor >= minTicket,
      detail: minTicket === null ? "No minimum set" : `Minimum ${eurCompact(minTicket)}, band ${ticketBandLabel(answers.ticket_band)}`,
    },
    {
      label: "Instrument matches",
      ok: instrumentOk,
      detail: accepted.length ? `Accepted: ${accepted.join(", ")}` : "All instruments accepted",
    },
    {
      label: "Construction-risk appetite matches",
      ok: constructionOk,
      detail: optionLabel(CONSTRUCTION_RISK, answers.construction_risk_appetite),
    },
    {
      label: "No conflicts declared",
      ok: !answers.conflicts_declared,
      detail: answers.conflicts_declared ? "Conflicts declared, read the detail below" : "None declared",
    },
  ];
};

export const fitPassesEverything = (items: FitItem[]) => items.length > 0 && items.every((item) => item.ok);

export const eurCompact = (value: number) =>
  Math.abs(value) >= 1_000_000 ? `EUR ${(value / 1_000_000).toFixed(1)}M` : `EUR ${Math.round(value).toLocaleString("en-GB")}`;

/* ----------------------------------------------------------------------- SLA */

export const SLA_REMINDER_HOURS = 48;
export const SLA_ESCALATION_WORKING_DAYS = 5;
export const SLA_LAPSE_WORKING_DAYS = 10;
export const REOPEN_BLOCK_DAYS = 90;
export const FEE_TAIL_MONTHS = 36;

/** Counts working days elapsed, Monday to Friday, excluding the submission day. */
export const workingDaysSince = (iso: string, now = new Date()) => {
  const start = new Date(iso);
  let days = 0;
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) days += 1;
  }
  return days;
};

export interface SlaStatus {
  workingDays: number;
  calendarDays: number;
  /** Paused while the developer is waiting on an answer to their question. */
  paused: boolean;
  reminderDue: boolean;
  escalated: boolean;
  lapsed: boolean;
  label: string;
}

export const slaStatus = (request: AccessRequestRow, now = new Date()): SlaStatus => {
  const submitted = request.submitted_at || request.requested_at;
  const paused = Boolean(request.developer_question_at && !request.investor_reply_at);
  const clockStart = request.investor_reply_at || submitted;
  const workingDays = workingDaysSince(clockStart, now);
  const calendarDays = Math.floor((now.getTime() - new Date(submitted).getTime()) / 86_400_000);
  const hours = (now.getTime() - new Date(clockStart).getTime()) / 3_600_000;
  const lapsed = !paused && workingDays >= SLA_LAPSE_WORKING_DAYS;
  const escalated = !paused && !lapsed && workingDays >= SLA_ESCALATION_WORKING_DAYS;
  const reminderDue = !paused && !lapsed && !escalated && hours >= SLA_REMINDER_HOURS;
  return {
    workingDays,
    calendarDays,
    paused,
    reminderDue,
    escalated,
    lapsed,
    label: paused
      ? "Clock paused, awaiting the investor's reply"
      : lapsed
      ? "Lapsed, no decision within 10 working days"
      : escalated
      ? "Escalated, past 5 working days"
      : reminderDue
      ? "Reminder sent, past 48 hours"
      : "Within the 3 working day target",
  };
};

/** Lapse is a notice to both parties. Silence never accepts a request. */
export const effectiveState = (request: AccessRequestRow, now = new Date()): AccessState =>
  request.state === "pending" && slaStatus(request, now).lapsed ? "lapsed" : request.state;

export const canResubmit = (request: AccessRequestRow, now = new Date()) => {
  if (request.state !== "declined") return true;
  if (!request.reopen_allowed_at) return false;
  return new Date(request.reopen_allowed_at) <= now;
};

export const addMonths = (iso: string, months: number) => {
  const date = new Date(iso);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
};

export const addDays = (iso: string, days: number) => {
  const date = new Date(iso);
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

export const formatDate = (value: string | null | undefined) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Not recorded";

/* ------------------------------------------------------------- NDA summary */

export const NDA_TERMS: { title: string; body: string }[] = [
  {
    title: "Scope of confidential information",
    body: "All information disclosed on this listing once access is granted, including the developer identity, the location, counterparties, and the technical, financial, transaction and process material, whether marked confidential or not.",
  },
  {
    title: "Permitted use",
    body: "Evaluating a possible investment in this project only. No disclosure to any third party other than the advisers named in your request, who are bound on the same terms.",
  },
  { title: "Term", body: "Twenty-four months from the date this agreement takes effect." },
  {
    title: "Return or destruction",
    body: "On written request, return or destroy the material and any copies, other than one archival copy held for compliance.",
  },
  {
    title: "Non-solicitation",
    body: "No approach to or solicitation of the developer's counterparties, including the heat-source host and offtakers, for twelve months without the developer's written consent.",
  },
  { title: "Governing law", body: "The laws of Ireland, with the courts of Ireland having non-exclusive jurisdiction." },
  {
    title: "Effect",
    body: "This agreement takes effect when the developer accepts your request.",
  },
];
