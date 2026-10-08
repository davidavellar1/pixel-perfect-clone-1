import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";

export type FundingProgramme = Tables<"funding_programme">;
export type FundingCall = Tables<"funding_call">;
export type FundingEntry = FundingProgramme & { funding_call: FundingCall[] };
export type OwnProject = Pick<
  Tables<"project">,
  "id" | "slug" | "title" | "country_code" | "lifecycle_stage" | "technology" | "project_type"
>;

export const EU27 = [
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
];

export const COUNTRY_NAMES: Record<string, string> = {
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  HR: "Croatia",
  CY: "Cyprus",
  CZ: "Czechia",
  DK: "Denmark",
  EE: "Estonia",
  FI: "Finland",
  FR: "France",
  DE: "Germany",
  GR: "Greece",
  HU: "Hungary",
  IE: "Ireland",
  IT: "Italy",
  LV: "Latvia",
  LT: "Lithuania",
  LU: "Luxembourg",
  MT: "Malta",
  NL: "Netherlands",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SK: "Slovakia",
  SI: "Slovenia",
  ES: "Spain",
  SE: "Sweden",
  IS: "Iceland",
  LI: "Liechtenstein",
  NO: "Norway",
};

export const LEVEL_LABEL: Record<string, string> = {
  eu: "EU",
  ifi: "Development bank",
  national: "National",
  regional: "Regional",
};

export const INSTRUMENT_LABEL: Record<string, string> = {
  grant: "Grant",
  loan: "Loan",
  guarantee: "Guarantee",
  equity: "Equity",
  technical_assistance: "Technical assistance",
  risk_cover: "Risk cover",
  tax_incentive: "Tax incentive",
  blended: "Blended finance",
};

export const APPLICANT_LABEL: Record<string, string> = {
  municipality: "Municipality",
  municipal_utility: "Municipal utility",
  private_developer: "Private developer",
  sme: "SME",
  large_company: "Large company",
  cooperative: "Cooperative",
  public_body: "Public body",
  financial_intermediary: "Financial intermediary",
};

export const humanize = (value: string) =>
  value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

const DAY = 86_400_000;
export const ageDays = (iso: string) => (Date.now() - new Date(iso).getTime()) / DAY;
export const isStale = (p: FundingProgramme) => ageDays(p.last_verified_at) > 90;
export const isHidden = (p: FundingProgramme) => ageDays(p.last_verified_at) > 180;

export const isEuWide = (p: FundingProgramme) =>
  EU27.every((code) => p.country_codes.includes(code));

export const geographyLabel = (p: FundingProgramme) => {
  if (isEuWide(p)) return "EU-wide";
  const names = p.country_codes.map((c) => COUNTRY_NAMES[c] || c);
  const base =
    names.length > 3 ? `${names.slice(0, 3).join(", ")} +${names.length - 3}` : names.join(", ");
  return p.regions.length ? `${base} (${p.regions.join(", ")})` : base || "Not stated";
};

/** Date of a timestamp as written in its own offset (avoids showing the day before/after). */
export const dateOf = (iso: string) => {
  const d = iso.slice(0, 10);
  const [y, m, day] = d.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, day)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
};

export type CallState =
  | { kind: "open"; call: FundingCall; urgent: boolean }
  | { kind: "upcoming"; call: FundingCall }
  | { kind: "rolling"; call: FundingCall }
  | { kind: "standing" }
  | { kind: "national" }
  | { kind: "paused" }
  | { kind: "none" };

export const callState = (p: FundingEntry): CallState => {
  if (p.status === "paused") return { kind: "paused" };
  const calls = p.funding_call || [];
  const open = calls
    .filter(
      (c) =>
        c.status === "open" &&
        !c.rolling &&
        c.deadline_at &&
        new Date(c.deadline_at).getTime() > Date.now(),
    )
    .sort((a, b) => new Date(a.deadline_at!).getTime() - new Date(b.deadline_at!).getTime());
  if (open[0])
    return {
      kind: "open",
      call: open[0],
      urgent: new Date(open[0].deadline_at!).getTime() - Date.now() < 30 * DAY,
    };
  const rolling = calls.find((c) => c.status === "open" && c.rolling);
  if (rolling) return { kind: "rolling", call: rolling };
  const upcoming = calls
    .filter((c) => c.status === "upcoming")
    .sort((a, b) => (a.opens_at || "9999").localeCompare(b.opens_at || "9999"));
  if (upcoming[0]) return { kind: "upcoming", call: upcoming[0] };
  // Programmes without call windows accept applications for as long as they run.
  if (p.application_mode === "standing" && p.status === "active") return { kind: "standing" };
  if (p.application_mode === "national_calls") return { kind: "national" };
  return { kind: "none" };
};

export const callLabel = (s: CallState) => {
  switch (s.kind) {
    case "open":
      return `Open · closes ${dateOf(s.call.deadline_at!)}${s.call.deadline_note ? ` (${s.call.deadline_note})` : ""}`;
    case "upcoming":
      return s.call.opens_at ? `Opens ${dateOf(s.call.opens_at)}` : "Upcoming";
    case "rolling":
      return "Rolling";
    case "standing":
      return "Apply any time";
    case "national":
      return "Via national calls";
    case "paused":
      return "Paused";
    default:
      return "No open call";
  }
};

/** Accepting applications today: an open or rolling call, or a programme without call windows. */
export const isAcceptingApplications = (p: FundingEntry) =>
  ["open", "rolling", "standing"].includes(callState(p).kind);

export const sortRank = (p: FundingEntry) => {
  const s = callState(p);
  if (s.kind === "open") return [0, new Date(s.call.deadline_at!).getTime()] as const;
  if (s.kind === "rolling" || s.kind === "standing") return [1, 0] as const;
  if (s.kind === "upcoming")
    return [
      2,
      s.call.opens_at ? new Date(s.call.opens_at).getTime() : Number.MAX_SAFE_INTEGER,
    ] as const;
  return [3, 0] as const;
};

export const formatEur = (v: number) =>
  v >= 1_000_000_000
    ? `EUR ${(v / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}bn`
    : v >= 1_000_000
      ? `EUR ${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
      : v >= 1_000
        ? `EUR ${Math.round(v / 1_000)}k`
        : `EUR ${Math.round(v)}`;

export const factsOf = (p: FundingProgramme) => {
  const facts: string[] = [];
  if (p.max_aid_pct != null) facts.push(`Up to ${Number(p.max_aid_pct)}% of eligible costs`);
  if (p.min_amount_eur != null && p.max_amount_eur != null)
    facts.push(`${formatEur(Number(p.min_amount_eur))}–${formatEur(Number(p.max_amount_eur))}`);
  else if (p.max_amount_eur != null) facts.push(`Up to ${formatEur(Number(p.max_amount_eur))}`);
  else if (p.min_amount_eur != null) facts.push(`From ${formatEur(Number(p.min_amount_eur))}`);
  if (p.budget_eur != null) facts.push(`Budget ${formatEur(Number(p.budget_eur))}`);
  else if (p.budget_note) facts.push(p.budget_note);
  return facts;
};

export type CriterionResult = { label: string; state: "meets" | "fails" | "open"; detail: string };

export const fitCriteria = (p: FundingProgramme, project: OwnProject): CriterionResult[] => {
  const check = (
    label: string,
    allowed: string[],
    value: string,
    show: (v: string) => string,
  ): CriterionResult =>
    !allowed.length
      ? { label, state: "open", detail: "Not restricted" }
      : allowed.includes(value)
        ? { label, state: "meets", detail: show(value) }
        : {
            label,
            state: "fails",
            detail: `${show(value)} – accepted: ${allowed.map(show).join(", ")}`,
          };
  return [
    p.country_codes.includes(project.country_code)
      ? {
          label: "Country",
          state: "meets",
          detail: COUNTRY_NAMES[project.country_code] || project.country_code,
        }
      : {
          label: "Country",
          state: "fails",
          detail: `${COUNTRY_NAMES[project.country_code] || project.country_code} is not covered`,
        },
    check("Stage", p.stages, project.lifecycle_stage, humanize),
    check("Technology", p.technologies, project.technology, humanize),
    check("Project type", p.project_types, project.project_type, humanize),
  ];
};

export const fits = (p: FundingProgramme, project: OwnProject) =>
  fitCriteria(p, project).every((c) => c.state !== "fails");

export const useFundingCatalogue = () => {
  const [entries, setEntries] = useState<FundingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("funding_programme").select("*, funding_call(*)");
    if (error) console.error("Funding catalogue query failed", error);
    setEntries(((data || []) as FundingEntry[]).filter((p) => !isHidden(p)));
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return { entries, loading, reload: load };
};

export const useOwnProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<OwnProject[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) {
        setProjects([]);
        setLoading(false);
        return;
      }
      const { data: profile } = await supabase
        .from("developer_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) {
        if (!cancelled) {
          setProjects([]);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("project")
        .select("id, slug, title, country_code, lifecycle_stage, technology, project_type")
        .eq("developer_id", profile.id)
        .order("created_at", { ascending: false });
      if (!cancelled) {
        setProjects((data || []) as OwnProject[]);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);
  return { projects, loading };
};
