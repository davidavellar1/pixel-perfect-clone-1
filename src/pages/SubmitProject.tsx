import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Info, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { sel, todayISO, RowsEditor, MultiSelect, ErrorNote } from "@/components/submit/wizardFields";
import {
  CASE_ORDER,
  CASE_LABEL,
  INSTRUMENT_LABEL,
  DEFAULT_RESERVED_MATTERS,
  DEFAULT_EXIT_ROUTES,
  type CaseRecord,
} from "@/data/investorGrade";
import { FEE_SENTENCE } from "@/lib/fee";

/* ---------------------------------- data ---------------------------------- */

const STAGES = [
  { id: "Concept", desc: "Idea / pre-feasibility" },
  { id: "Feasibility", desc: "Studied, modelling" },
  { id: "Development", desc: "Ready-to-build" },
  { id: "Construction", desc: "Being built" },
  { id: "Operational", desc: "Running, has actuals" },
];

const COUNTRIES = [
  "Austria", "Belgium", "Croatia", "Czech Republic", "Denmark", "Estonia", "Finland",
  "France", "Germany", "Hungary", "Italy", "Latvia", "Lithuania", "Netherlands",
  "Norway", "Poland", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden",
  "Switzerland", "United Kingdom",
];

const COUNTRY_CODES: Record<string, string> = {
  Austria: "AT", Belgium: "BE", Croatia: "HR", "Czech Republic": "CZ", Denmark: "DK",
  Estonia: "EE", Finland: "FI", France: "FR", Germany: "DE", Hungary: "HU", Italy: "IT",
  Latvia: "LV", Lithuania: "LT", Netherlands: "NL", Norway: "NO", Poland: "PL", Romania: "RO",
  Slovakia: "SK", Slovenia: "SI", Spain: "ES", Sweden: "SE", Switzerland: "CH", "United Kingdom": "GB",
};

const STAGE_VALUES = { Concept: "concept", Feasibility: "feasibility", Development: "development", Construction: "construction", Operational: "operational" } as const;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const TECHNOLOGIES = [
  ["Waste heat", "waste_heat_recovery"], ["Geothermal", "geothermal"], ["Large heat pump", "large_heat_pump"],
  ["Solar thermal", "solar_thermal"], ["Biomass / CHP", "biomass_chp"], ["Thermal storage", "thermal_storage"], ["Hybrid", "hybrid"],
] as const;

const CAPACITY_BANDS = ["Under 10 MW", "10-25 MW", "25-50 MW", "50+ MW"];
const CAPEX_BANDS = ["Under 15M EUR", "15-30M EUR", "30-50M EUR", "50M+ EUR"];

type CaseRow = { enabled: boolean; connections: string; powerPrice: string; capexVariancePct: string; equityIrrPct: string; minDscr: string };
const blankCase = (enabled: boolean): CaseRow => ({ enabled, connections: "", powerPrice: "", capexVariancePct: "", equityIrrPct: "", minDscr: "" });
const caseHasValue = (c: CaseRow) => [c.connections, c.powerPrice, c.capexVariancePct, c.equityIrrPct, c.minDscr].some((v) => v.trim() !== "");

/* ------------------------------- primitives ------------------------------- */

const Field = ({
  label,
  required,
  optional,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="mb-5">
    <Label className="mb-2 block text-sm font-semibold">
      {label}
      {required && <span className="ml-1 text-accent">*</span>}
      {optional && (
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">{optional}</span>
      )}
    </Label>
    {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
    {children}
    <ErrorNote message={error} />
  </div>
);

const StepHead = ({
  n,
  total,
  title,
  pill,
  pillTone,
}: {
  n: number;
  total: number;
  title: string;
  pill?: string;
  pillTone?: "t1" | "t2";
}) => (
  <div className="mb-1.5 flex flex-wrap items-center gap-2">
    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
      Step {n} of {total} - {title}
    </span>
    {pill && (
      <span
        className={cn(
          "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
          pillTone === "t1" ? "bg-accent/10 text-accent" : "bg-muted text-muted-foreground",
        )}
      >
        {pill}
      </span>
    )}
  </div>
);

const AsOfField = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <Field label="Figures as of" required hint="Defaults to today. Change it if these figures are from an earlier cut.">
    <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="max-w-[220px]" />
  </Field>
);

function RowList({
  columns,
  addLabel,
  placeholders,
  selectAt,
  selectOptions,
  initial = 2,
}: {
  columns: string;
  addLabel: string;
  placeholders: string[];
  selectAt?: number;
  selectOptions?: string[];
  initial?: number;
}) {
  const [rows, setRows] = useState(Array.from({ length: initial }, (_, i) => i));
  return (
    <div>
      {rows.map((r) => (
        <div key={r} className="mb-2 grid gap-2" style={{ gridTemplateColumns: columns }}>
          {placeholders.map((p, i) =>
            selectAt === i && selectOptions ? (
              <select key={i} className={cn(sel, "py-2 text-xs")} defaultValue={selectOptions[0]}>
                {selectOptions.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            ) : (
              <Input key={i} placeholder={p} className="h-10 text-sm" />
            ),
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, (prev.at(-1) ?? 0) + 1])}
        className="mt-1 rounded-lg border border-dashed border-border px-3.5 py-2 text-xs font-medium text-accent hover:bg-accent/5"
      >
        + {addLabel}
      </button>
    </div>
  );
}

/* --------------------------------- page ----------------------------------- */

export default function SubmitProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cur, setCur] = useState(0);
  const [stage, setStage] = useState("");
  const [summary, setSummary] = useState("");
  const [mandate, setMandate] = useState(false);
  const [thirdParty, setThirdParty] = useState(false);
  const [country, setCountry] = useState("France");
  const [region, setRegion] = useState("");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [projectType, setProjectType] = useState<"greenfield" | "brownfield" | "expansion" | "modernisation">("greenfield");
  const [technology, setTechnology] = useState<"waste_heat_recovery" | "geothermal" | "large_heat_pump" | "solar_thermal" | "biomass_chp" | "thermal_storage" | "hybrid">("waste_heat_recovery");
  const [capacity, setCapacity] = useState("");
  const [capacityBand, setCapacityBand] = useState("");
  const [capex, setCapex] = useState("");
  const [capexBand, setCapexBand] = useState("");
  const [targetIrr, setTargetIrr] = useState("");
  const [co2, setCo2] = useState("");
  const [renewableShare, setRenewableShare] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  // offtake commitment ladder
  const [ladderAsOf, setLadderAsOf] = useState(todayISO());
  const [totalBuildings, setTotalBuildings] = useState("");
  const [contractedCount, setContractedCount] = useState("");
  const [contractedLoadPct, setContractedLoadPct] = useState("");
  const [signedCount, setSignedCount] = useState("");
  const [signedLoadPct, setSignedLoadPct] = useState("");
  const [negotiationCount, setNegotiationCount] = useState("");
  const [negotiationLoadPct, setNegotiationLoadPct] = useState("");

  // technical / construction package
  const [technicalAsOf, setTechnicalAsOf] = useState(todayISO());
  const [epcContractor, setEpcContractor] = useState("");
  const [epcNamedInDataroom, setEpcNamedInDataroom] = useState(false);
  const [contractType, setContractType] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [ldRate, setLdRate] = useState("");
  const [ldCapPct, setLdCapPct] = useState("");
  const [security, setSecurity] = useState("");
  const [contingencyAmount, setContingencyAmount] = useState("");
  const [contingencyPct, setContingencyPct] = useState("");
  const [scheduleFloatMonths, setScheduleFloatMonths] = useState("");
  const [permitsStatus, setPermitsStatus] = useState("");
  const [interfaceRisk, setInterfaceRisk] = useState("");
  const [omContract, setOmContract] = useState("");

  // financial
  const [financialAsOf, setFinancialAsOf] = useState(todayISO());
  const [heatPurchasePrice, setHeatPurchasePrice] = useState("");
  const [purchaseIndex, setPurchaseIndex] = useState("");
  const [customerTariff, setCustomerTariff] = useState("");
  const [tariffIndex, setTariffIndex] = useState("");
  const [grossSpread, setGrossSpread] = useState("");
  const [opexPerKwh, setOpexPerKwh] = useState("");
  const [indexationMismatchNote, setIndexationMismatchNote] = useState("");
  const [dscr1xConnections, setDscr1xConnections] = useState("");
  const [irrZeroConnections, setIrrZeroConnections] = useState("");
  const [debtMarginBps, setDebtMarginBps] = useState("");
  const [gearingPct, setGearingPct] = useState("");
  const [lockupDscr, setLockupDscr] = useState("");
  const [dsraMonths, setDsraMonths] = useState("");
  const [cases, setCases] = useState<Record<CaseRecord["name"], CaseRow>>({
    base: blankCase(true), downside: blankCase(true), stress: blankCase(false), upside: blankCase(false),
  });

  // transaction
  const [transactionAsOf, setTransactionAsOf] = useState(todayISO());
  const [instrument, setInstrument] = useState<keyof typeof INSTRUMENT_LABEL>("equity");
  const [equitySought, setEquitySought] = useState("");
  const [stakeOfferedPct, setStakeOfferedPct] = useState("");
  const [minTicket, setMinTicket] = useState("");
  const [clubAllowed, setClubAllowed] = useState(false);
  const [clubMaxParticipants, setClubMaxParticipants] = useState("");
  const [boardSeatThreshold, setBoardSeatThreshold] = useState("");
  const [observerThreshold, setObserverThreshold] = useState("");
  const [reservedMatters, setReservedMatters] = useState<string[]>(DEFAULT_RESERVED_MATTERS);
  const [preEmption, setPreEmption] = useState(true);
  const [rofr, setRofr] = useState(true);
  const [tagAlong, setTagAlong] = useState(true);
  const [dragAlongThreshold, setDragAlongThreshold] = useState("");
  const [distributionPolicy, setDistributionPolicy] = useState("");
  const [firstDistributionYear, setFirstDistributionYear] = useState("");
  const [exitRoutes, setExitRoutes] = useState<string[]>([]);
  const [expectedHoldYears, setExpectedHoldYears] = useState("");
  const [preMoneyEquity, setPreMoneyEquity] = useState("");
  const [sponsorCashFunded, setSponsorCashFunded] = useState("");
  const [postMoneyOwnership, setPostMoneyOwnership] = useState<Record<string, string>[]>([{ holder: "", pct: "" }]);
  const [useOfProceeds, setUseOfProceeds] = useState<Record<string, string>[]>([{ item: "", amount: "" }]);
  const [drawdownTranches, setDrawdownTranches] = useState<Record<string, string>[]>([{ tranche: "", amount: "", trigger: "" }]);
  const [targetEquityIrrPct, setTargetEquityIrrPct] = useState("");
  const [downsideEquityIrrPct, setDownsideEquityIrrPct] = useState("");

  // access criteria
  const [accessMinTicket, setAccessMinTicket] = useState("");
  const [instrumentsAccepted, setInstrumentsAccepted] = useState<string[]>([]);
  const [requireConstructionAppetite, setRequireConstructionAppetite] = useState(false);
  const [autoAcceptQualified, setAutoAcceptQualified] = useState(false);
  const [notifyUsers, setNotifyUsers] = useState("");

  // process
  const [processAsOf, setProcessAsOf] = useState(todayISO());
  const [processType, setProcessType] = useState<"bilateral" | "competitive">("bilateral");
  const [ioiDeadline, setIoiDeadline] = useState("");
  const [managementMeetingsWindow, setManagementMeetingsWindow] = useState("");
  const [loiDeadline, setLoiDeadline] = useState("");
  const [exclusivityDays, setExclusivityDays] = useState("");
  const [targetClose, setTargetClose] = useState("");
  const [conditionsPrecedent, setConditionsPrecedent] = useState<Record<string, string>[]>([{ condition: "" }]);
  const [adviserDisclosed, setAdviserDisclosed] = useState(false);
  const [partiesUnderNda, setPartiesUnderNda] = useState("");

  // regulatory / structure
  const [regulatoryAsOf, setRegulatoryAsOf] = useState(todayISO());
  const [eedPathYear, setEedPathYear] = useState("2025");
  const [eedPath, setEedPath] = useState<"renewable_waste_heat_share" | "ghg_reduction">("renewable_waste_heat_share");

  const early = stage === "Concept" || stage === "Feasibility";
  const lateStage = stage === "Development" || stage === "Construction" || stage === "Operational";
  const anonFlag = useMemo(
    () => /\b(Lyon|Copenhagen|Aarhus|Paris|Berlin|SAS|GmbH|A\/S|Energie|Stadtwerke)\b/.test(summary),
    [summary],
  );

  const STEPS = useMemo(() => {
    const all = [
      { key: "basics", label: "Project basics", tag: "Start here" },
      { key: "overview", label: "Overview", tag: "Anonymized teaser" },
      { key: "technical", label: "Technical", tag: "" },
      { key: "financial", label: "Financial", tag: "" },
      { key: "transaction", label: "Transaction", tag: "" },
      { key: "process", label: "Process", tag: "" },
      { key: "access", label: "Access criteria", tag: "" },
      { key: "sustainability", label: "Sustainability", tag: "" },
      { key: "structure", label: "Structure & market", tag: "" },
      { key: "review", label: "Review & publish", tag: "" },
    ];
    return early ? all.filter((s) => s.key !== "transaction" && s.key !== "process") : all;
  }, [early]);

  const stepIndex = (key: string) => STEPS.findIndex((s) => s.key === key);
  const curKey = STEPS[cur]?.key ?? "basics";

  const goto = (i: number) => {
    if (!stage && i > 0) {
      toast.error("Please select a lifecycle stage first.");
      return;
    }
    setCur(Math.min(Math.max(i, 0), STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filledCaseCount = CASE_ORDER.filter((name) => name !== "base" ? cases[name].enabled && caseHasValue(cases[name]) : true).length;
  const downsideProvided = caseHasValue(cases.downside) && cases.downside.enabled;
  const casesInvalid = lateStage && !downsideProvided;

  const toggleReservedMatter = (o: string) =>
    setReservedMatters((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));
  const toggleExitRoute = (o: string) =>
    setExitRoutes((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]));

  const publish = async () => {
    setPublishError("");
    if (!mandate) {
      toast.error("Please accept the listing mandate to publish.");
      return;
    }
    if (!user || !stage || !title.trim() || !city.trim() || !summary.trim() || Number(capacity) <= 0) {
      toast.error("Complete the project title, city, summary, stage, and installed capacity before publishing.");
      return;
    }
    if (casesInvalid) {
      setPublishError("A downside case (in addition to the base case) is required once a project is ready to build or later.");
      goto(stepIndex("financial"));
      return;
    }
    setPublishing(true);
    let { data: developer, error: profileError } = await supabase
      .from("developer_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!profileError && !developer) {
      // First listing for this account: create the developer profile from the signup details.
      const meta = (user.user_metadata || {}) as Record<string, string>;
      const created = await supabase.from("developer_profiles").insert({
        user_id: user.id,
        full_name: meta.full_name || user.email || "Developer",
        company_name: meta.company_name || null,
      }).select("id").single();
      developer = created.data;
      profileError = created.error;
    }
    if (profileError || !developer) {
      toast.error(profileError?.message || "A developer profile is required before publishing.");
      setPublishing(false);
      return;
    }
    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const { data: project, error } = await supabase.from("project").insert({
      slug, developer_id: developer.id, title: title.trim(), summary: summary.trim(), description: summary.trim(),
      country_code: COUNTRY_CODES[country], city: city.trim(), lifecycle_stage: STAGE_VALUES[stage as keyof typeof STAGE_VALUES],
      project_type: projectType, technology, capacity_mw: Number(capacity), visibility: "listed",
      headline_investment: capex ? Number(capex) : null, headline_irr_pct: targetIrr ? Number(targetIrr) : null,
      headline_co2_tonnes: co2 ? Number(co2) : null,
      technical_as_of: technicalAsOf || null, financial_as_of: financialAsOf || null, regulatory_as_of: regulatoryAsOf || null,
    }).select("id").single();
    if (error || !project) {
      toast.error(error?.message || "The listing could not be published.");
      setPublishing(false);
      return;
    }
    const projectId = project.id;
    const childWrites = [];

    if (capex || targetIrr || dscr1xConnections || irrZeroConnections || debtMarginBps || gearingPct || lockupDscr || dsraMonths) {
      childWrites.push(supabase.from("financial_summary").insert({
        project_id: projectId, currency: "EUR",
        capex: capex ? Number(capex) : null, target_irr_pct: targetIrr ? Number(targetIrr) : null,
        dscr_1x_connections: dscr1xConnections ? Number(dscr1xConnections) : null,
        irr_zero_connections: irrZeroConnections ? Number(irrZeroConnections) : null,
        debt_margin_bps: debtMarginBps ? Number(debtMarginBps) : null,
        gearing_pct: gearingPct ? Number(gearingPct) : null,
        lockup_dscr: lockupDscr ? Number(lockupDscr) : null,
        dsra_months: dsraMonths ? Number(dsraMonths) : null,
      }));
    }
    if (co2 || renewableShare) {
      childWrites.push(supabase.from("sustainability_profile").insert({
        project_id: projectId, co2_tonnes_per_year: co2 ? Number(co2) : null, renewable_share_pct: renewableShare ? Number(renewableShare) : null,
      }));
    }
    if (totalBuildings || contractedCount || signedCount || negotiationCount) {
      childWrites.push(supabase.from("offtake_ladder").insert({
        project_id: projectId, as_of: ladderAsOf || null,
        total_buildings: totalBuildings ? Number(totalBuildings) : null,
        contracted_count: Number(contractedCount || 0), contracted_load_pct: Number(contractedLoadPct || 0),
        signed_connection_count: Number(signedCount || 0), signed_connection_load_pct: Number(signedLoadPct || 0),
        in_negotiation_count: Number(negotiationCount || 0), in_negotiation_load_pct: Number(negotiationLoadPct || 0),
      }));
    }
    if (lateStage && (epcContractor || contractType || contractValue)) {
      childWrites.push(supabase.from("construction_package").insert({
        project_id: projectId, as_of: technicalAsOf || null,
        epc_contractor: epcContractor || null, epc_named_in_dataroom: epcNamedInDataroom,
        contract_type: contractType || null, contract_value: contractValue ? Number(contractValue) : null,
        ld_rate: ldRate || null, ld_cap_pct: ldCapPct ? Number(ldCapPct) : null, security: security || null,
        contingency_amount: contingencyAmount ? Number(contingencyAmount) : null, contingency_pct: contingencyPct ? Number(contingencyPct) : null,
        schedule_float_months: scheduleFloatMonths ? Number(scheduleFloatMonths) : null,
        permits_status: permitsStatus || null, interface_risk: interfaceRisk || null, om_contract: omContract || null,
      }));
    }
    if (heatPurchasePrice || customerTariff || grossSpread || opexPerKwh) {
      childWrites.push(supabase.from("margin_profile").insert({
        project_id: projectId, as_of: financialAsOf || null,
        heat_purchase_price: heatPurchasePrice ? Number(heatPurchasePrice) : null, purchase_index: purchaseIndex || null,
        customer_tariff: customerTariff ? Number(customerTariff) : null, tariff_index: tariffIndex || null,
        gross_spread: grossSpread ? Number(grossSpread) : null, opex_per_kwh: opexPerKwh ? Number(opexPerKwh) : null,
        indexation_mismatch_note: indexationMismatchNote || null,
      }));
    }
    CASE_ORDER.forEach((name) => {
      const c = cases[name];
      if (name !== "base" && (!c.enabled || !caseHasValue(c))) return;
      childWrites.push(supabase.from("project_case").insert({
        project_id: projectId, name,
        connections: c.connections ? Number(c.connections) : null,
        power_price: c.powerPrice ? Number(c.powerPrice) : null,
        capex_variance_pct: c.capexVariancePct ? Number(c.capexVariancePct) : null,
        equity_irr_pct: c.equityIrrPct ? Number(c.equityIrrPct) : null,
        min_dscr: c.minDscr ? Number(c.minDscr) : null,
      }));
    });
    if (!early) {
      const transactionRow: TablesInsert<"project_transaction"> = {
        project_id: projectId, as_of: transactionAsOf || null, instrument: instrument as TablesInsert<"project_transaction">["instrument"],
        equity_sought: equitySought ? Number(equitySought) : null, stake_offered_pct: stakeOfferedPct ? Number(stakeOfferedPct) : null,
        min_ticket: minTicket ? Number(minTicket) : null,
        club_max_participants: clubAllowed && clubMaxParticipants ? Number(clubMaxParticipants) : null,
        board_seat_threshold: boardSeatThreshold ? Number(boardSeatThreshold) : null,
        observer_threshold: observerThreshold ? Number(observerThreshold) : null,
        reserved_matters: reservedMatters, pre_emption: preEmption, rofr, tag_along: tagAlong,
        drag_along_threshold: dragAlongThreshold ? Number(dragAlongThreshold) : null,
        distribution_policy: distributionPolicy || null, first_distribution_year: firstDistributionYear ? Number(firstDistributionYear) : null,
        exit_routes: exitRoutes, expected_hold_years: expectedHoldYears ? Number(expectedHoldYears) : null,
        pre_money_equity: preMoneyEquity ? Number(preMoneyEquity) : null, sponsor_cash_funded: sponsorCashFunded ? Number(sponsorCashFunded) : null,
        post_money_ownership: postMoneyOwnership.filter((r) => r.holder || r.pct),
        use_of_proceeds: useOfProceeds.filter((r) => r.item || r.amount),
        drawdown_tranches: drawdownTranches.filter((r) => r.tranche || r.amount),
        target_equity_irr_pct: targetEquityIrrPct ? Number(targetEquityIrrPct) : null,
        downside_equity_irr_pct: downsideEquityIrrPct ? Number(downsideEquityIrrPct) : null,
      };
      childWrites.push(supabase.from("project_transaction").insert(transactionRow));
      childWrites.push(supabase.from("project_process").insert({
        project_id: projectId, as_of: processAsOf || null, process_type: processType,
        ioi_deadline: ioiDeadline || null, management_meetings_window: managementMeetingsWindow || null,
        loi_deadline: loiDeadline || null, exclusivity_days: exclusivityDays ? Number(exclusivityDays) : null,
        target_close: targetClose || null,
        conditions_precedent: conditionsPrecedent.map((r) => r.condition).filter(Boolean),
        adviser_disclosed: adviserDisclosed, parties_under_nda: partiesUnderNda ? Number(partiesUnderNda) : null,
      }));
    }

    childWrites.push(supabase.from("listing_access_criteria").insert({
      project_id: projectId,
      min_ticket: accessMinTicket ? Number(accessMinTicket) : null,
      instruments_accepted: instrumentsAccepted,
      require_construction_risk_appetite: requireConstructionAppetite,
      auto_accept_qualified: autoAcceptQualified,
      notify_users: notifyUsers.split(",").map((entry) => entry.trim()).filter(Boolean),
    }));

    const results = await Promise.all(childWrites);
    if (results.some((result) => result.error)) toast.warning("The listing is live, but some optional figures could not be saved.");
    else toast.success("Listing published. It now appears in My Listings and the marketplace.");
    navigate("/app/developer");
  };

  return (
    <div className="bg-background">
      {/* progress */}
      <div className="h-[3px] bg-border">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${((cur + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <div className="mx-auto grid max-w-[980px] lg:grid-cols-[250px_1fr]">
        {/* rail */}
        <aside className="border-b border-border p-6 lg:border-b-0 lg:border-r lg:py-8">
          <h2 className="text-sm font-semibold text-muted-foreground">New listing</h2>
          <p className="mb-6 text-lg font-semibold">{stage ? `${stage} project` : "Untitled project"}</p>
          <div className="space-y-0.5">
            {STEPS.map((s, i) => {
              const done = i < cur;
              const on = i === cur;
              return (
                <button
                  key={s.key}
                  onClick={() => goto(i)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted/60",
                    on && "bg-accent/10",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-border bg-card text-xs font-semibold text-muted-foreground",
                      done && "border-emerald-600 bg-emerald-600 text-white",
                      on && "border-accent text-accent",
                    )}
                  >
                    {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span>
                    <span className={cn("text-sm font-medium", on && "text-accent")}>{s.label}</span>
                    {s.tag && (
                      <span className="mt-0.5 block text-[11px] text-muted-foreground">{s.tag}</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          {early && (
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-700">
              Transaction and process terms are skipped at this stage - there is no offer to structure yet.
            </p>
          )}
        </aside>

        {/* form */}
        <main className="max-w-[680px] px-6 py-9 lg:px-12">
          {/* STEP: basics */}
          {curKey === "basics" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Start here" />
              <h1 className="mb-2 text-[27px] font-semibold">Project basics</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                We adapt the rest of the form to your project's stage, so you are only asked for
                information that exists yet. Nothing here reveals your identity to investors.
              </p>

              <Field
                label="Lifecycle stage"
                required
                hint="This drives the whole form. Earlier stages ask for far less."
              >
                <div className="flex flex-wrap gap-2">
                  {STAGES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStage(s.id)}
                      className={cn(
                        "min-w-[130px] flex-1 rounded-lg border border-border bg-card p-3.5 text-left transition",
                        stage === s.id && "border-accent bg-accent/10",
                      )}
                    >
                      <span className="block text-sm font-semibold">{s.id}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Project title" required>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Metropolitan waste heat network" />
              </Field>

              <Field label="Project type" required>
                <select className={sel} value={projectType} onChange={(e) => setProjectType(e.target.value as typeof projectType)}>
                  <option value="greenfield">Greenfield (new construction)</option>
                  <option value="brownfield">Brownfield</option>
                  <option value="modernisation">Modernisation</option>
                  <option value="expansion">Expansion</option>
                </select>
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Primary technology" required>
                  <select className={sel} value={technology} onChange={(e) => setTechnology(e.target.value as typeof technology)}>
                    {TECHNOLOGIES.map(([label, value]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Network generation" required>
                  <select className={sel}>
                    <option>4G - low temperature (under 70 C)</option>
                    <option>3G - high temperature (70-120 C)</option>
                    <option>5G - ambient loop</option>
                    <option>Transitioning</option>
                  </select>
                </Field>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Country" required>
                  <select className={sel} value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Region (NUTS-2)" required>
                  <Input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Auvergne-Rhone-Alpes"
                  />
                </Field>
              </div>
              <Field label="City" required>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Lyon" />
              </Field>
            </section>
          )}

          {/* STEP: overview */}
          {curKey === "overview" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Overview" pill="Shown anonymized at sign-in" pillTone="t1" />
              <h1 className="mb-2 text-[27px] font-semibold">Overview</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                This is your teaser. Investors see it anonymized, with banded figures, before they
                express interest.
              </p>

              <Field
                label="Anonymized summary"
                required
                hint="Describe the opportunity without naming the city, developer, or counterparties."
              >
                <Textarea
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="min-h-[88px]"
                  placeholder="e.g. Industrial waste-heat recovery feeding an established metropolitan network"
                />
                {anonFlag ? (
                  <div className="mt-2 flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-700">
                    <TriangleAlert className="mt-px h-4 w-4 flex-none" />
                    This looks like it may contain a name or city. Please keep the summary anonymous.
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                    <ShieldCheck className="mt-px h-4 w-4 flex-none" />
                    No identifying names detected. Identity stays hidden until an investor expresses
                    interest.
                  </div>
                )}
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Capacity band" required hint="Exact MW revealed at interest.">
                  <select className={sel} value={capacityBand} onChange={(e) => setCapacityBand(e.target.value)}>
                    <option value="">Select a band</option>
                    {CAPACITY_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
                <Field label="Capex band" required hint="Exact figure revealed at interest.">
                  <select className={sel} value={capexBand} onChange={(e) => setCapexBand(e.target.value)}>
                    <option value="">Select a band</option>
                    {CAPEX_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </Field>
              </div>

              <Field
                label="Offtake commitment ladder"
                optional={early ? "(optional - early stage)" : undefined}
                hint={
                  early
                    ? "At this stage, leave blank or note anchor loads. Shown to investors as \"early stage\", never as 0%."
                    : "For each tier, enter the count and its share of design load. Shown to investors both as a share of buildings and a share of design load."
                }
              >
                <div className="mb-3">
                  <Input type="number" min="0" placeholder="Total buildings in scope" value={totalBuildings} onChange={(e) => setTotalBuildings(e.target.value)} />
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-[1fr_100px_100px] items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Contracted</span>
                    <Input type="number" min="0" placeholder="Count" value={contractedCount} onChange={(e) => setContractedCount(e.target.value)} />
                    <Input type="number" min="0" max="100" placeholder="% of load" value={contractedLoadPct} onChange={(e) => setContractedLoadPct(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-[1fr_100px_100px] items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Signed connection agreement</span>
                    <Input type="number" min="0" placeholder="Count" value={signedCount} onChange={(e) => setSignedCount(e.target.value)} />
                    <Input type="number" min="0" max="100" placeholder="% of load" value={signedLoadPct} onChange={(e) => setSignedLoadPct(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-[1fr_100px_100px] items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">In negotiation</span>
                    <Input type="number" min="0" placeholder="Count" value={negotiationCount} onChange={(e) => setNegotiationCount(e.target.value)} />
                    <Input type="number" min="0" max="100" placeholder="% of load" value={negotiationLoadPct} onChange={(e) => setNegotiationLoadPct(e.target.value)} />
                  </div>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Counts are a share of total buildings; percentages are a share of design load.</p>
              </Field>

              <AsOfField value={ladderAsOf} onChange={setLadderAsOf} />

              <Field
                label="Target equity IRR"
                optional="(optional)"
                hint="Always shown to investors as developer-stated. Sits below the fold, not in the card headline."
              >
                <div className="grid gap-2.5 sm:grid-cols-[1fr_150px]">
                  <Input type="number" step="0.1" placeholder="e.g. 9.5" value={targetIrr} onChange={(e) => setTargetIrr(e.target.value)} />
                  <select className={cn(sel, "text-xs")} defaultValue={early ? "Basis: indicative" : "Basis: modelled"}>
                    <option>Basis: indicative</option><option>Basis: modelled</option>
                    <option>Basis: committed</option><option>Basis: actual</option>
                  </select>
                </div>
              </Field>

              <Field
                label="Public co-financing status"
                required
                hint="Amount and source are revealed only at interest."
              >
                <select className={sel}>
                  <option>None</option><option>In progress</option><option>Committed</option>
                </select>
              </Field>
            </section>
          )}

          {/* STEP: technical */}
          {curKey === "technical" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Technical" pill="Revealed at interest" pillTone="t2" />
              <h1 className="mb-2 text-[27px] font-semibold">Technical</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                Where the heat comes from, how it is delivered, and how the network performs.
              </p>

              <Field label="Heat-source ownership" required>
                <select
                  className={sel}
                  onChange={(e) => setThirdParty(e.target.value === "Third-party supplied")}
                >
                  <option>Self-owned</option>
                  <option>Third-party supplied</option>
                </select>
              </Field>
              {thirdParty && (
                <Field
                  label="Third-party supply terms"
                  hint="Contract in place, length, and what happens if the host exits."
                >
                  <Input placeholder="e.g. 15-yr supply agreement with industrial host, renewable" />
                </Field>
              )}

              <Field label="Site / land status" required>
                <select className={sel}>
                  <option>Contracted</option><option>In negotiation</option><option>Not yet</option>
                </select>
              </Field>

              <Field
                label="Supply / return temperature"
                optional={early ? "(design target)" : "(optional)"}
              >
                <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_150px]">
                  <Input type="number" placeholder="Supply C" />
                  <Input type="number" placeholder="Return C" />
                  <select className={cn(sel, "text-xs")}>
                    <option>Designed</option><option>Modelled</option><option>Measured</option>
                  </select>
                </div>
              </Field>

              <Field
                label="Network heat loss"
                optional="(optional)"
                hint="EU range roughly 8-15%. Mark whether designed or measured."
              >
                <div className="grid gap-2.5 sm:grid-cols-[1fr_150px]">
                  <Input type="number" placeholder="%" />
                  <select className={cn(sel, "text-xs")}>
                    <option>Designed</option><option>Modelled</option><option>Measured</option>
                  </select>
                </div>
              </Field>

              <Field
                label="Installed capacity (exact MW)"
                required
                hint="Banded on the card; exact figure revealed at interest."
              >
                <Input type="number" min="0.1" step="0.1" placeholder="e.g. 8" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
              </Field>
              <Field
                label="Annual heat output"
                optional="(optional)"
                hint="Used with emissions to derive GHG intensity."
              >
                <Input type="number" placeholder="GWh / yr" />
              </Field>
              <Field label="Total heated area" optional="(optional)">
                <Input type="number" placeholder="m2" />
              </Field>
              <Field label="Building / demand mix" optional="(optional)">
                <Input placeholder="e.g. apartment 54%, municipal 31%, commercial 15%" />
              </Field>
              <Field label="Asset design lifespan" optional="(optional)">
                <Input type="number" placeholder="years" />
              </Field>
              <Field label="Thermal storage" optional="(optional)">
                <Input placeholder="e.g. water tank, 2,500 m3, daily load-shifting" />
              </Field>
              <Field
                label="Development timeline"
                optional="(optional)"
                hint="Phases shown as a tracker on the project page."
              >
                <RowList
                  columns="1.2fr .9fr .6fr 1.6fr"
                  addLabel="Add milestone"
                  placeholders={["Phase", "", "Year", "Short note"]}
                  selectAt={1}
                  selectOptions={["Completed", "In progress", "Planned"]}
                />
              </Field>

              <div className={cn("rounded-xl border p-5", lateStage ? "border-border bg-card" : "border-dashed border-border bg-muted/30 opacity-70")}>
                <h4 className="mb-1 text-sm font-semibold">
                  Construction package
                  {!lateStage && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional at this stage)</span>}
                  {lateStage && <span className="ml-1 text-accent">*</span>}
                </h4>
                <p className="mb-4 text-xs text-muted-foreground">
                  {lateStage
                    ? "Required once a project is ready to build or later."
                    : "Fill this in once an EPC contractor and contract terms exist. Greyed out at concept, pre-feasibility, and feasibility."}
                </p>
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Input placeholder="EPC contractor" value={epcContractor} onChange={(e) => setEpcContractor(e.target.value)} />
                  <select className={sel} value={contractType} onChange={(e) => setContractType(e.target.value)}>
                    <option value="">Contract type</option>
                    <option>Lump-sum turnkey</option><option>EPC</option><option>EPCM</option><option>Multi-contract</option>
                  </select>
                  <Input type="number" placeholder="Contract value (EUR)" value={contractValue} onChange={(e) => setContractValue(e.target.value)} />
                  <Input placeholder="LD rate (e.g. 0.1%/day)" value={ldRate} onChange={(e) => setLdRate(e.target.value)} />
                  <Input type="number" placeholder="LD cap (% of contract value)" value={ldCapPct} onChange={(e) => setLdCapPct(e.target.value)} />
                  <Input placeholder="Security (e.g. parent guarantee, bond)" value={security} onChange={(e) => setSecurity(e.target.value)} />
                  <Input type="number" placeholder="Contingency amount (EUR)" value={contingencyAmount} onChange={(e) => setContingencyAmount(e.target.value)} />
                  <Input type="number" placeholder="Contingency (%)" value={contingencyPct} onChange={(e) => setContingencyPct(e.target.value)} />
                  <Input type="number" placeholder="Schedule float (months)" value={scheduleFloatMonths} onChange={(e) => setScheduleFloatMonths(e.target.value)} />
                  <Input placeholder="Permits status" value={permitsStatus} onChange={(e) => setPermitsStatus(e.target.value)} />
                  <Input placeholder="Interface risk" value={interfaceRisk} onChange={(e) => setInterfaceRisk(e.target.value)} />
                  <Input placeholder="O&M contract" value={omContract} onChange={(e) => setOmContract(e.target.value)} />
                </div>
                <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={epcNamedInDataroom} onCheckedChange={(v) => setEpcNamedInDataroom(Boolean(v))} />
                  EPC contractor is named in the data room
                </label>
              </div>

              <div className="mt-5">
                <AsOfField value={technicalAsOf} onChange={setTechnicalAsOf} />
              </div>
            </section>
          )}

          {/* STEP: financial */}
          {curKey === "financial" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Financial" pill="Revealed at interest" pillTone="t2" />
              <h1 className="mb-2 text-[27px] font-semibold">Financial</h1>

              {early ? (
                <>
                  <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                    At this stage we keep financials light and clearly indicative.
                  </p>
                  <Field label="Indicative capex range">
                    <select className={sel}>
                      {CAPEX_BANDS.map((b) => <option key={b}>{b}</option>)}
                    </select>
                  </Field>
                  <Field label="Equity sought (indicative)">
                    <Input placeholder="e.g. ~8M EUR" />
                  </Field>
                  <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-center text-sm leading-relaxed text-muted-foreground">
                    <b className="text-foreground">Detailed financials are skipped at this stage.</b>
                    <br />
                    Capital stack, debt terms, and DSCR will be asked for once the project reaches
                    development. Investors see these fields marked "not yet available at this stage",
                    so an early project never looks incomplete.
                  </div>
                  <div className="mt-5">
                    <AsOfField value={financialAsOf} onChange={setFinancialAsOf} />
                  </div>
                </>
              ) : (
                <>
                  <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                    How the project is capitalized and where revenue comes from.
                  </p>
                  <Field label="Total project financing" required>
                    <Input type="number" placeholder="EUR (e.g. 12000000)" value={capex} onChange={(e) => setCapex(e.target.value)} />
                  </Field>
                  <Field
                    label="Capital stack"
                    hint="Each tranche: amount and counterparty. Shown as a stacked bar; counterparties revealed at interest."
                  >
                    <RowList
                      columns="1.2fr 1fr 1.4fr"
                      addLabel="Add tranche"
                      placeholders={["Tranche (e.g. Equity)", "Amount EUR", "Counterparty"]}
                      initial={3}
                    />
                  </Field>
                  <Field label="Grant treatment" optional="(if a grant is present)">
                    <select className={sel}>
                      <option>Non-repayable</option><option>Clawback-conditional</option>
                      <option>Milestone-conditional</option>
                    </select>
                  </Field>
                  <Field
                    label="Debt terms"
                    optional="(if available)"
                    hint="Tenor, margin, fixed vs floating, hedged %."
                  >
                    <Input placeholder="e.g. 18-yr, EURIBOR+180bps, 70% hedged" />
                  </Field>
                  <div className="grid gap-3.5 sm:grid-cols-3">
                    <Field label="Debt margin" optional="(bps)">
                      <Input type="number" placeholder="e.g. 180" value={debtMarginBps} onChange={(e) => setDebtMarginBps(e.target.value)} />
                    </Field>
                    <Field label="Gearing" optional="(%)">
                      <Input type="number" placeholder="e.g. 65" value={gearingPct} onChange={(e) => setGearingPct(e.target.value)} />
                    </Field>
                    <Field label="Lock-up DSCR" optional="(x)">
                      <Input type="number" step="0.01" placeholder="e.g. 1.15" value={lockupDscr} onChange={(e) => setLockupDscr(e.target.value)} />
                    </Field>
                    <Field label="DSRA" optional="(months)">
                      <Input type="number" placeholder="e.g. 6" value={dsraMonths} onChange={(e) => setDsraMonths(e.target.value)} />
                    </Field>
                    <Field label="DSCR at 1x connections" optional="(x)">
                      <Input type="number" step="0.01" value={dscr1xConnections} onChange={(e) => setDscr1xConnections(e.target.value)} />
                    </Field>
                    <Field label="Equity IRR at zero connections" optional="(%)">
                      <Input type="number" step="0.1" value={irrZeroConnections} onChange={(e) => setIrrZeroConnections(e.target.value)} />
                    </Field>
                  </div>
                  <Field
                    label="Revenue ceiling / return constraint"
                    required
                    hint="What caps the upside. We tailor the sub-fields to your regime once you set it in Structure."
                  >
                    <select className={sel}>
                      <option>Ex-ante regulated allowed return</option>
                      <option>Non-profit / break-even</option>
                      <option>Market-based (no cap)</option>
                      <option>Concession tariff ceiling</option>
                      <option>Ex-post (clause-validity risk)</option>
                    </select>
                  </Field>
                  <Field
                    label="Revenue model"
                    required
                    hint="Streams and their share of revenue. Counterparties revealed at interest."
                  >
                    <RowList
                      columns="1.5fr .6fr 1.2fr"
                      addLabel="Add stream"
                      placeholders={["Stream (e.g. Concession tariff)", "% of revenue", "Counterparty"]}
                    />
                  </Field>
                  <Field label="Offtake terms" optional="(optional)">
                    <Input placeholder="e.g. take-or-pay, 80% volume floor, 20-yr" />
                  </Field>
                  <Field label="Offtaker credit quality" optional="(optional)">
                    <Input placeholder="e.g. municipal anchor plus investment-grade commercial offtakers" />
                  </Field>

                  <div className="my-6 rounded-xl border border-border bg-card p-5">
                    <h4 className="mb-3 text-sm font-semibold">Margin and pricing</h4>
                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <Input type="number" placeholder="Heat purchase price (EUR/kWh)" value={heatPurchasePrice} onChange={(e) => setHeatPurchasePrice(e.target.value)} />
                      <Input placeholder="Purchase index" value={purchaseIndex} onChange={(e) => setPurchaseIndex(e.target.value)} />
                      <Input type="number" placeholder="Customer tariff (EUR/kWh)" value={customerTariff} onChange={(e) => setCustomerTariff(e.target.value)} />
                      <Input placeholder="Tariff index" value={tariffIndex} onChange={(e) => setTariffIndex(e.target.value)} />
                      <Input type="number" placeholder="Gross spread (EUR/kWh)" value={grossSpread} onChange={(e) => setGrossSpread(e.target.value)} />
                      <Input type="number" placeholder="Opex per kWh" value={opexPerKwh} onChange={(e) => setOpexPerKwh(e.target.value)} />
                    </div>
                    <Textarea
                      className="mt-3 min-h-[70px]"
                      placeholder="Indexation mismatch note - how purchase and tariff indices can diverge"
                      value={indexationMismatchNote}
                      onChange={(e) => setIndexationMismatchNote(e.target.value)}
                    />
                  </div>

                  <div className="mb-2">
                    <h4 className="mb-1 text-sm font-semibold">
                      Cases <span className="text-accent">*</span>
                    </h4>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Enter a base case and at least one downside case. Ready-to-build projects and later cannot publish with only one case.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 text-left text-muted-foreground">
                          <tr>
                            <th className="p-2">Case</th>
                            <th className="p-2">Connections</th>
                            <th className="p-2">Power price</th>
                            <th className="p-2">Capex variance %</th>
                            <th className="p-2">Equity IRR %</th>
                            <th className="p-2">Min DSCR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {CASE_ORDER.map((name) => {
                            const c = cases[name];
                            const locked = name === "base";
                            return (
                              <tr key={name} className="border-t border-border">
                                <td className="p-2 font-medium">
                                  <label className="flex items-center gap-1.5">
                                    {!locked && (
                                      <Checkbox
                                        checked={c.enabled}
                                        onCheckedChange={(v) => setCases((p) => ({ ...p, [name]: { ...p[name], enabled: Boolean(v) } }))}
                                      />
                                    )}
                                    {CASE_LABEL[name]}
                                  </label>
                                </td>
                                {(["connections", "powerPrice", "capexVariancePct", "equityIrrPct", "minDscr"] as const).map((k) => (
                                  <td key={k} className="p-2">
                                    <Input
                                      disabled={!locked && !c.enabled}
                                      type="number"
                                      className="h-9 text-xs"
                                      value={c[k]}
                                      onChange={(e) => setCases((p) => ({ ...p, [name]: { ...p[name], [k]: e.target.value } }))}
                                    />
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <ErrorNote message={casesInvalid ? "A downside case is required once a project is ready to build or later." : publishError && curKey === "financial" ? publishError : undefined} />
                  </div>

                  <div className="mt-5">
                    <AsOfField value={financialAsOf} onChange={setFinancialAsOf} />
                  </div>
                </>
              )}
            </section>
          )}

          {/* STEP: transaction */}
          {curKey === "transaction" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Transaction" pill="Revealed at interest" pillTone="t2" />
              <h1 className="mb-2 text-[27px] font-semibold">Transaction</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                What is on offer, on what terms, and how an investor exits.
              </p>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Instrument" required>
                  <select className={sel} value={instrument} onChange={(e) => setInstrument(e.target.value as typeof instrument)}>
                    {Object.entries(INSTRUMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </Field>
                <Field label="Equity sought" required>
                  <Input type="number" placeholder="EUR" value={equitySought} onChange={(e) => setEquitySought(e.target.value)} />
                </Field>
                <Field label="Stake offered" optional="(%)">
                  <Input type="number" value={stakeOfferedPct} onChange={(e) => setStakeOfferedPct(e.target.value)} />
                </Field>
                <Field label="Minimum ticket" optional="(EUR)">
                  <Input type="number" value={minTicket} onChange={(e) => setMinTicket(e.target.value)} />
                </Field>
              </div>

              <Field label="Club deal" optional="(allow multiple investors)">
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <Checkbox checked={clubAllowed} onCheckedChange={(v) => setClubAllowed(Boolean(v))} />
                  Club investment allowed
                </label>
                {clubAllowed && (
                  <Input type="number" placeholder="Maximum participants" value={clubMaxParticipants} onChange={(e) => setClubMaxParticipants(e.target.value)} />
                )}
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Board seat threshold" optional="(% stake)">
                  <Input type="number" value={boardSeatThreshold} onChange={(e) => setBoardSeatThreshold(e.target.value)} />
                </Field>
                <Field label="Observer threshold" optional="(% stake)">
                  <Input type="number" value={observerThreshold} onChange={(e) => setObserverThreshold(e.target.value)} />
                </Field>
              </div>

              <Field label="Reserved matters" hint="Prefilled with a standard list; adjust as needed.">
                <MultiSelect options={DEFAULT_RESERVED_MATTERS} selected={reservedMatters} onToggle={toggleReservedMatter} />
              </Field>

              <Field label="Transfer rights">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={preEmption} onCheckedChange={(v) => setPreEmption(Boolean(v))} />Pre-emption</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={rofr} onCheckedChange={(v) => setRofr(Boolean(v))} />ROFR</label>
                  <label className="flex items-center gap-2 text-sm"><Checkbox checked={tagAlong} onCheckedChange={(v) => setTagAlong(Boolean(v))} />Tag along</label>
                </div>
                <Input className="mt-2.5" type="number" placeholder="Drag along threshold (% stake)" value={dragAlongThreshold} onChange={(e) => setDragAlongThreshold(e.target.value)} />
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Distribution policy" optional="(optional)">
                  <Input value={distributionPolicy} onChange={(e) => setDistributionPolicy(e.target.value)} placeholder="e.g. annual, post-DSRA" />
                </Field>
                <Field label="First distribution year" optional="(optional)">
                  <Input type="number" value={firstDistributionYear} onChange={(e) => setFirstDistributionYear(e.target.value)} />
                </Field>
              </div>

              <Field label="Exit routes" hint="Select all that plausibly apply.">
                <MultiSelect options={DEFAULT_EXIT_ROUTES} selected={exitRoutes} onToggle={toggleExitRoute} />
              </Field>

              <Field label="Expected hold period" optional="(years)">
                <Input type="number" value={expectedHoldYears} onChange={(e) => setExpectedHoldYears(e.target.value)} />
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Pre-money equity" optional="(EUR)">
                  <Input type="number" value={preMoneyEquity} onChange={(e) => setPreMoneyEquity(e.target.value)} />
                </Field>
                <Field label="Sponsor cash already funded" optional="(EUR)">
                  <Input type="number" value={sponsorCashFunded} onChange={(e) => setSponsorCashFunded(e.target.value)} />
                </Field>
              </div>

              <Field label="Post-money ownership" optional="(optional)" hint="Holder and resulting share.">
                <RowsEditor
                  columns={[{ key: "holder", placeholder: "Holder" }, { key: "pct", placeholder: "%", type: "number" }]}
                  rows={postMoneyOwnership}
                  onChange={setPostMoneyOwnership}
                  addLabel="Add holder"
                  minRows={1}
                />
              </Field>

              <Field label="Use of proceeds" optional="(optional)">
                <RowsEditor
                  columns={[{ key: "item", placeholder: "Item" }, { key: "amount", placeholder: "Amount EUR", type: "number" }]}
                  rows={useOfProceeds}
                  onChange={setUseOfProceeds}
                  addLabel="Add line"
                  minRows={1}
                />
              </Field>

              <Field label="Drawdown tranches" optional="(optional)">
                <RowsEditor
                  columns={[{ key: "tranche", placeholder: "Tranche" }, { key: "amount", placeholder: "Amount EUR", type: "number" }, { key: "trigger", placeholder: "Trigger" }]}
                  rows={drawdownTranches}
                  onChange={setDrawdownTranches}
                  addLabel="Add tranche"
                  minRows={1}
                />
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label={`Target equity IRR (${CASE_LABEL.base})`} optional="(%)">
                  <Input type="number" step="0.1" value={targetEquityIrrPct} onChange={(e) => setTargetEquityIrrPct(e.target.value)} />
                </Field>
                <Field label={`Downside equity IRR (${CASE_LABEL.downside})`} optional="(%)">
                  <Input type="number" step="0.1" value={downsideEquityIrrPct} onChange={(e) => setDownsideEquityIrrPct(e.target.value)} />
                </Field>
              </div>

              <AsOfField value={transactionAsOf} onChange={setTransactionAsOf} />
            </section>
          )}

          {/* STEP: process */}
          {curKey === "process" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Process" pill="Revealed at interest" pillTone="t2" />
              <h1 className="mb-2 text-[27px] font-semibold">Process</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                How the process is run and the key dates investors should plan around.
              </p>

              <Field label="Process type" required>
                <div className="flex gap-2">
                  {(["bilateral", "competitive"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setProcessType(v)}
                      className={cn("flex-1 rounded-lg border border-border bg-card p-3 text-sm capitalize", processType === v && "border-accent bg-accent/10")}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="IOI deadline" optional="(optional)">
                  <Input type="date" value={ioiDeadline} onChange={(e) => setIoiDeadline(e.target.value)} />
                </Field>
                <Field label="LOI deadline" optional="(optional)">
                  <Input type="date" value={loiDeadline} onChange={(e) => setLoiDeadline(e.target.value)} />
                </Field>
                <Field label="Management meeting window" optional="(optional)">
                  <Input placeholder="e.g. weeks 3-5" value={managementMeetingsWindow} onChange={(e) => setManagementMeetingsWindow(e.target.value)} />
                </Field>
                <Field label="Exclusivity" optional="(days)">
                  <Input type="number" value={exclusivityDays} onChange={(e) => setExclusivityDays(e.target.value)} />
                </Field>
                <Field label="Target close" optional="(optional)">
                  <Input type="date" value={targetClose} onChange={(e) => setTargetClose(e.target.value)} />
                </Field>
                <Field label="Parties with access" optional="(count)">
                  <Input type="number" value={partiesUnderNda} onChange={(e) => setPartiesUnderNda(e.target.value)} />
                </Field>
              </div>

              <Field label="Conditions precedent" optional="(optional)">
                <RowsEditor
                  columns={[{ key: "condition", placeholder: "Condition" }]}
                  rows={conditionsPrecedent}
                  onChange={setConditionsPrecedent}
                  addLabel="Add condition"
                  minRows={1}
                />
              </Field>

              <Field label="Adviser disclosed">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={adviserDisclosed} onCheckedChange={(v) => setAdviserDisclosed(Boolean(v))} />
                  A financial or legal adviser is named in the data room
                </label>
              </Field>

              <AsOfField value={processAsOf} onChange={setProcessAsOf} />
            </section>
          )}

          {/* STEP: access criteria */}
          {curKey === "access" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Access criteria" pill="Seen only by you" pillTone="t1" />
              <h1 className="mb-2 text-[27px] font-semibold">Access criteria</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                These criteria filter nothing. Every request still arrives in your inbox. They only drive the fit line
                shown on each request, and the optional auto-accept below.
              </p>

              <Field label="Minimum ticket" optional="(EUR)">
                <Input type="number" min="0" placeholder="e.g. 3000000" value={accessMinTicket} onChange={(e) => setAccessMinTicket(e.target.value)} />
              </Field>

              <Field label="Instruments accepted">
                <div className="flex flex-wrap gap-2">
                  {["equity", "debt"].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setInstrumentsAccepted((current) => current.includes(value) ? current.filter((entry) => entry !== value) : [...current, value])}
                      className={cn("rounded-lg border border-border bg-card px-4 py-2 text-sm capitalize", instrumentsAccepted.includes(value) && "border-accent bg-accent/10")}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Construction-risk appetite">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={requireConstructionAppetite} onCheckedChange={(v) => setRequireConstructionAppetite(Boolean(v))} />
                  Require an appetite for construction risk
                </label>
              </Field>

              <Field label="Auto-accept qualified requests">
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={autoAcceptQualified} onCheckedChange={(v) => setAutoAcceptQualified(Boolean(v))} />
                  <span>
                    Off by default. Switching this on waives your manual review for requests that pass every fit check,
                    so those investors gain access without you seeing the request first. The data room is never opened
                    automatically.
                  </span>
                </label>
              </Field>

              <Field label="Who receives request notifications" optional="(comma separated emails)">
                <Input placeholder="deals@yourcompany.com, cfo@yourcompany.com" value={notifyUsers} onChange={(e) => setNotifyUsers(e.target.value)} />
              </Field>
            </section>
          )}

          {/* STEP: sustainability */}
          {curKey === "sustainability" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Sustainability" pill="Revealed at interest" pillTone="t2" />
              <h1 className="mb-2 text-[27px] font-semibold">Sustainability</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                Verifiable green credentials, framed against the EU rules. We never auto-assert
                compliance; you state the basis and any verifying body.
              </p>

              <Field
                label="Baseline / counterfactual"
                required
                hint="What the heat replaces. Every emissions figure depends on this."
              >
                <select className={sel}>
                  <option>Individual gas boilers</option><option>Coal CHP</option>
                  <option>Individual electric heating</option><option>Oil heating</option>
                  <option>Older district heating</option>
                </select>
              </Field>
              <Field label="GHG avoidance" optional="(optional, basis-flagged)">
                <div className="grid gap-2.5 sm:grid-cols-[1fr_150px]">
                  <Input type="number" placeholder="tCO2e / yr" value={co2} onChange={(e) => setCo2(e.target.value)} />
                  <select className={cn(sel, "text-xs")}>
                    <option>Modelled</option><option>Measured</option>
                  </select>
                </div>
              </Field>
              <Field label="Renewable / waste-heat share" optional="(optional)">
                <Input type="number" min="0" max="100" placeholder="%" value={renewableShare} onChange={(e) => setRenewableShare(e.target.value)} />
              </Field>
              <Field
                label="EED Article 26 path"
                optional="(optional)"
                hint="State which path to efficient DHC you meet and the applicable threshold year, not just 'compliant'."
              >
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <select className={sel} value={eedPathYear} onChange={(e) => setEedPathYear(e.target.value)}>
                    <option value="2025">Threshold year: 2025</option>
                    <option value="2028">Threshold year: 2028</option>
                    <option value="2035">Threshold year: 2035</option>
                  </select>
                  <select className={sel} value={eedPath} onChange={(e) => setEedPath(e.target.value as typeof eedPath)}>
                    <option value="renewable_waste_heat_share">Path: renewable and waste-heat share</option>
                    <option value="ghg_reduction">Path: GHG reduction</option>
                  </select>
                </div>
              </Field>
              <Field
                label="Energy source mix"
                optional="(optional)"
                hint="Named sources and their share. Shown as a donut and bar on the project page."
              >
                <RowList
                  columns="1.7fr .5fr"
                  addLabel="Add source"
                  placeholders={["Source (e.g. Industrial waste heat)", "%"]}
                  initial={3}
                />
              </Field>
              <Field
                label="Annual emissions: baseline vs project"
                optional="(optional)"
                hint="Drives the CO2 comparison chart and the avoidance figure."
              >
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Input type="number" placeholder="Counterfactual tCO2e/yr" />
                  <Input type="number" placeholder="With-project tCO2e/yr" />
                </div>
              </Field>
              <Field label="GHG intensity" optional="(optional)">
                <Input type="number" step="0.01" placeholder="tCO2e / MWh" />
              </Field>
              <Field
                label="Primary Energy Factor (PEF)"
                optional="(optional)"
              >
                <Input type="number" step="0.01" placeholder="e.g. 0.82" />
              </Field>
              <Field label="Upstream / Scope 3 included?" optional="(optional)">
                <select className={sel}>
                  <option>No</option><option>Yes</option>
                </select>
              </Field>
            </section>
          )}

          {/* STEP: structure */}
          {curKey === "structure" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Structure & market" pill="Revealed at interest" pillTone="t2" />
              <h1 className="mb-2 text-[27px] font-semibold">Structure &amp; market</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                Who owns it, under what regulatory regime, and whether the local authority is behind
                it.
              </p>

              <Field label="Developer structure type" required>
                <select className={sel}>
                  {["Municipal utility", "Arms-length municipal", "Public-private partnership", "Private concession", "Fully private", "Cooperative", "ESCO", "Not-for-profit"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="SPV name & incorporation" optional="(revealed at interest)">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Input placeholder="SPV name" />
                  <Input placeholder="Incorporation country" />
                </div>
              </Field>
              <Field
                label="Ownership / shareholders"
                optional="(optional)"
                hint="Named shareholders, share, and type. Shown as an ownership chart on the project page."
              >
                <RowList
                  columns="1.5fr .5fr 1fr"
                  addLabel="Add shareholder"
                  placeholders={["Shareholder", "%", ""]}
                  selectAt={2}
                  selectOptions={["Public", "Private / developer", "Fund"]}
                />
              </Field>
              <Field
                label="Regulatory regime type"
                required
                hint="Investors filter on this. It sets the revenue-constraint sub-fields in Financial."
              >
                <select className={sel}>
                  <option>Ex-ante cost-based regulated</option>
                  <option>Non-profit / break-even</option>
                  <option>Market-based + transparency</option>
                  <option>Ex-post competition control</option>
                  <option>Contractual / concession</option>
                  <option>In transition</option>
                </select>
              </Field>
              <Field label="Concession counterparty & term" optional="(if concession / PPP)">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Input placeholder="Counterparty (e.g. local authority)" />
                  <Input placeholder="Term (e.g. 25 yrs, to 2052)" />
                </div>
              </Field>
              <Field
                label="Local-authority support"
                optional="(optional but strong signal)"
                hint="Digging / wayleaves, planning status, municipal buildings committed."
              >
                <Input placeholder="e.g. Wayleaves granted; 14 municipal buildings committed" />
              </Field>

              <AsOfField value={regulatoryAsOf} onChange={setRegulatoryAsOf} />
            </section>
          )}

          {/* STEP: review */}
          {curKey === "review" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Review & publish" />
              <h1 className="mb-2 text-[27px] font-semibold">Review &amp; publish</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                Check what investors will see, then accept the listing mandate to go live.
              </p>

              <div className="mb-5 overflow-hidden rounded-xl border border-border bg-card">
                {[
                  ["Stage", stage || "Not provided"],
                  ["Project title", title || "Not provided"],
                  ["Location shown", country ? `${country}${region ? ` - ${region}` : ""}` : "Not provided"],
                  ["Capacity band", capacityBand || "Not provided"],
                  ["Capex band", capexBand || "Not provided"],
                  [
                    "Offtake commitment",
                    totalBuildings
                      ? `${Number(contractedCount || 0) + Number(signedCount || 0)} of ${totalBuildings} buildings - ${(Number(contractedLoadPct || 0) + Number(signedLoadPct || 0)).toFixed(0)}% of design load`
                      : "Not provided",
                  ],
                  ["Identity", "Hidden until interest"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between gap-4 border-b border-border px-4 py-3 text-sm last:border-0"
                  >
                    <span className="text-muted-foreground">{k}</span>
                    <span className="text-right font-semibold">{v}</span>
                  </div>
                ))}
              </div>

              <div className="mb-5 rounded-xl border border-border bg-card p-6">
                <h4 className="mb-3 flex items-center gap-2 text-base font-semibold">
                  <Info className="h-4 w-4 text-accent" /> Listing mandate
                </h4>
                <ul className="mb-4 list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
                  <li>Listing is free to the developer. There is no charge to publish or to receive interest.</li>
                  <li>Introductions made through DHC Market are attributable to the platform.</li>
                  <li>{FEE_SENTENCE}</li>
                  <li>Either party may report a close; the other confirms before any invoice is raised.</li>
                  <li>
                    You agree not to circumvent the platform to avoid the fee on an introduced
                    investor.
                  </li>
                </ul>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3.5 text-sm leading-relaxed",
                    mandate && "border-emerald-500 bg-emerald-50",
                  )}
                >
                  <Checkbox
                    checked={mandate}
                    onCheckedChange={(v) => setMandate(Boolean(v))}
                    className="mt-0.5"
                  />
                  I have read and accept the listing mandate, and confirm I am authorized to list this
                  project.
                </label>
              </div>
              <ErrorNote message={publishError} />
            </section>
          )}

          {/* footer nav */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
            <Button
              variant="outline"
              onClick={() => goto(cur - 1)}
              className={cn(cur === 0 && "invisible")}
            >
              Back
            </Button>
            {cur === STEPS.length - 1 ? (
              <Button onClick={publish} disabled={publishing}>{publishing ? "Publishing..." : "Publish listing"}</Button>
            ) : (
              <Button
                onClick={() => {
                  if (cur === 0 && !stage) {
                    toast.error("Please select a lifecycle stage to continue.");
                    return;
                  }
                  goto(cur + 1);
                }}
              >
                Continue
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
