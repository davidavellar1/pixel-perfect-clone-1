import type React from "react";
import { useMemo, useState, useId, useContext, useRef, Children, cloneElement, isValidElement } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Check, Info, ShieldCheck, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { WizardSelect, WizardOption, todayISO, RowsEditor, MultiSelect, ErrorNote } from "@/components/submit/wizardFields";
import {
  CASE_ORDER,
  CASE_LABEL,
  INSTRUMENT_LABEL,
  type CaseRecord,
} from "@/data/investorGrade";
import { FORM_VERSION, isFieldAsked, recordedQuestionKeys, recordQuestionEvidence, questionEvidenceForStage } from "@/lib/submissionFields";
import { AskedQuestions, QuestionEvidenceContext, useQuestionEvidence } from "@/components/submit/QuestionEvidence";
import { BASIS_FLAGS } from "@/lib/projectAbsence";
import { FEE_SENTENCE } from "@/lib/fee";
import { PublicFundingEditor, type FundingLine } from "@/components/submit/PublicFundingEditor";

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
  questionKeys,
}: {
  label: string;
  required?: boolean;
  optional?: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  questionKeys?: readonly string[];
}) => {
  const question = useContext(QuestionEvidenceContext);
  const visible = questionKeys !== undefined || isFieldAsked(label, question.stage.toLowerCase());
  useQuestionEvidence(questionKeys ?? recordedQuestionKeys([label], question.stage.toLowerCase()), visible);
  const id = useId();
  if (!visible) return null;
  const errorId = `${id}-error`;
  return (
  <div className="mb-5">
    <Label id={`${id}-label`} htmlFor={id} className="mb-2 block text-sm font-semibold">
      {label}
      {required && <span className="ml-1 text-accent">*</span>}
      {optional && (
        <span className="ml-1.5 text-xs font-normal text-muted-foreground">{optional}</span>
      )}
    </Label>
    {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
    {Children.map(children, child => isValidElement(child) ? cloneElement(child as React.ReactElement<Record<string, unknown>>, { id, "aria-labelledby": `${id}-label`, "aria-describedby": error ? errorId : undefined, "aria-invalid": Boolean(error) }) : child)}
    <ErrorNote id={errorId} message={error} />
  </div>
);
};

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

/* --------------------------------- page ----------------------------------- */

export default function SubmitProject() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const shownQuestions = useRef(new Map<string, Set<string>>());
  const [cur, setCur] = useState(0);
  const [stage, setStage] = useState("");
  const [summary, setSummary] = useState("");
  const [mandate, setMandate] = useState(false);
  const [country, setCountry] = useState("France");
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [projectType, setProjectType] = useState<"greenfield" | "brownfield" | "expansion" | "modernisation">("greenfield");
  const [technology, setTechnology] = useState<"waste_heat_recovery" | "geothermal" | "large_heat_pump" | "solar_thermal" | "biomass_chp" | "thermal_storage" | "hybrid">("waste_heat_recovery");
  const [capacity, setCapacity] = useState("");
  const [capex, setCapex] = useState("");
  const [co2, setCo2] = useState("");
  const [renewableShare, setRenewableShare] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  const [siteLand, setSiteLand] = useState("");
  const [supplyTemperature, setSupplyTemperature] = useState("");
  const [returnTemperature, setReturnTemperature] = useState("");
  const [temperatureBasis, setTemperatureBasis] = useState("");
  const [annualHeat, setAnnualHeat] = useState("");
  const [baseline, setBaseline] = useState("");
  const [co2Basis, setCo2Basis] = useState("");
  const [ghgIntensity, setGhgIntensity] = useState("");
  const [developerStructure, setDeveloperStructure] = useState("");
  const [regulatoryRegime, setRegulatoryRegime] = useState("");
  const [concessionCounterparty, setConcessionCounterparty] = useState("");
  const [publicFunding, setPublicFunding] = useState<FundingLine[]>([]);
  const [networkLength, setNetworkLength] = useState("");
  const [households, setHouseholds] = useState("");
  const [concessionTerm, setConcessionTerm] = useState("");
  const [purchaseFloorCap, setPurchaseFloorCap] = useState("");
  const [publicCofinancing, setPublicCofinancing] = useState("");
  const [milestones, setMilestones] = useState<Record<string, string>[]>([]);
  const [capitalStack, setCapitalStack] = useState<Record<string, string>[]>([]);
  const [revenueStreams, setRevenueStreams] = useState<Record<string, string>[]>([]);
  const [energyMix, setEnergyMix] = useState<Record<string, string>[]>([]);
  const [technologyCards, setTechnologyCards] = useState<Record<string, string>[]>([]);
  const [operatingParameters, setOperatingParameters] = useState<Record<string, string>[]>([]);
  const [risks, setRisks] = useState<Record<string, string>[]>([]);
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
  const [targetEquityIrrPct, setTargetEquityIrrPct] = useState("");
  const [downsideEquityIrrPct, setDownsideEquityIrrPct] = useState("");

  // access criteria
  const [accessMinTicket, setAccessMinTicket] = useState("");
  const [instrumentsAccepted, setInstrumentsAccepted] = useState<string[]>([]);
  const [requireConstructionAppetite, setRequireConstructionAppetite] = useState(false);
  const [electronicConsent, setElectronicConsent] = useState(false);
  const [notifyUsers, setNotifyUsers] = useState("");

  // process

  // regulatory / structure
  const [regulatoryAsOf, setRegulatoryAsOf] = useState(todayISO());
  const [eedPathYear, setEedPathYear] = useState("2025");
  const [eedPath, setEedPath] = useState<"renewable_waste_heat_share" | "ghg_reduction">("renewable_waste_heat_share");

  const early = stage === "Concept" || stage === "Feasibility";
  const lateStage = stage === "Development" || stage === "Construction" || stage === "Operational";
  const questionContext = useMemo(() => ({
    stage,
    record: (keys: readonly string[]) => recordQuestionEvidence(shownQuestions.current, stage, keys),
  }), [stage]);
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

  const publish = async () => {
    setPublishError("");
    if (!mandate || !electronicConsent) {
      toast.error("Please accept the listing mandate and consent to electronic execution to publish.");
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
    const meta = (user.user_metadata || {}) as Record<string, string>;
    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const num = (v: string) => (v ? Number(v) : null);

    const caseRows = CASE_ORDER.filter((name) => name === "base" || (cases[name].enabled && caseHasValue(cases[name]))).map((name) => {
      const c = cases[name];
      return {
        name,
        connections: num(c.connections),
        power_price: num(c.powerPrice),
        capex_variance_pct: num(c.capexVariancePct),
        equity_irr_pct: num(c.equityIrrPct),
        min_dscr: num(c.minDscr),
      };
    });

    const payload = {
      slug,
      developer_full_name: meta.full_name || user.email || "Developer",
      developer_company: meta.company_name || null,
      project: {
        title: title.trim(), summary: summary.trim(), description: summary.trim(),
        country_code: COUNTRY_CODES[country], city: city.trim(),
        lifecycle_stage: STAGE_VALUES[stage as keyof typeof STAGE_VALUES],
        project_type: projectType, technology, capacity_mw: Number(capacity), visibility: "listed",
        headline_investment: num(capex), headline_co2_tonnes: num(co2),
        network_length_km: num(networkLength), households_served: num(households), public_cofinancing_status: publicCofinancing || null,
        timeline_start: milestones.map(r => r.target_date).filter(Boolean).sort()[0] || null,
        timeline_end: milestones.map(r => r.target_date).filter(Boolean).sort().at(-1) || null,
        asked_fields: questionEvidenceForStage(shownQuestions.current, stage), form_version: FORM_VERSION,
        technical_as_of: technicalAsOf || null, financial_as_of: financialAsOf || null, regulatory_as_of: regulatoryAsOf || null,
      },
      financial_summary:
        capex || dscr1xConnections || irrZeroConnections || concessionTerm || capitalStack.some(r => r.label) || revenueStreams.some(r => r.stream) || publicFunding.length
          ? {
              currency: "EUR", capex: num(capex),
              dscr_1x_connections: num(dscr1xConnections), irr_zero_connections: num(irrZeroConnections),
              concession_term_years: num(concessionTerm),
            }
          : null,
      sustainability_profile:
        co2 || renewableShare
          ? { co2_tonnes_per_year: num(co2), renewable_share_pct: num(renewableShare) }
          : null,
      offtake_ladder:
        totalBuildings || contractedCount || signedCount || negotiationCount
          ? {
              as_of: ladderAsOf || null, total_buildings: num(totalBuildings),
              contracted_count: Number(contractedCount || 0), contracted_load_pct: Number(contractedLoadPct || 0),
              signed_connection_count: Number(signedCount || 0), signed_connection_load_pct: Number(signedLoadPct || 0),
              in_negotiation_count: Number(negotiationCount || 0), in_negotiation_load_pct: Number(negotiationLoadPct || 0),
            }
          : null,
      construction_package:
        lateStage && (epcContractor || contractType || contractValue)
          ? {
              as_of: technicalAsOf || null, epc_contractor: epcContractor || null,
              epc_named_in_dataroom: epcNamedInDataroom, contract_type: contractType || null,
              contract_value: num(contractValue), ld_rate: ldRate || null, ld_cap_pct: num(ldCapPct),
              security: security || null, contingency_amount: num(contingencyAmount), contingency_pct: num(contingencyPct),
              schedule_float_months: num(scheduleFloatMonths), permits_status: permitsStatus || null,
              interface_risk: interfaceRisk || null, om_contract: omContract || null,
            }
          : null,
      margin_profile:
        heatPurchasePrice || purchaseIndex || customerTariff || tariffIndex || grossSpread || opexPerKwh || indexationMismatchNote || purchaseFloorCap
          ? {
              as_of: financialAsOf || null, heat_purchase_price: num(heatPurchasePrice), purchase_index: purchaseIndex || null,
              customer_tariff: num(customerTariff), tariff_index: tariffIndex || null,
              gross_spread: num(grossSpread), opex_per_kwh: num(opexPerKwh),
              indexation_mismatch_note: indexationMismatchNote || null, purchase_floor_cap: purchaseFloorCap || null,
            }
          : null,
      cases: caseRows,
      project_transaction: early
        ? null
        : {
            as_of: transactionAsOf || null, instrument,
            equity_sought: num(equitySought), stake_offered_pct: num(stakeOfferedPct), min_ticket: num(minTicket),
            club_max_participants: clubAllowed && clubMaxParticipants ? Number(clubMaxParticipants) : null,
            target_equity_irr_pct: num(targetEquityIrrPct), downside_equity_irr_pct: num(downsideEquityIrrPct),
          },
      milestones: milestones.filter(r => r.label).map(r => ({ ...r, target_date: r.target_date || null, status: r.status || "upcoming" })),
      capital_stack: early ? [] : capitalStack.filter(r => r.label).map(r => ({ ...r, amount: num(r.amount || "") })),
      revenue_streams: early ? [] : revenueStreams.filter(r => r.stream).map(r => ({ ...r, pct_of_revenue: num(r.pct_of_revenue || "") })),
      energy_mix: energyMix.filter(r => r.source).map(r => ({ ...r, share_pct: num(r.share_pct || "") })),
      technology_cards: technologyCards.filter(r => r.title),
      operating_parameters: [
        ...operatingParameters.filter(r => r.parameter),
        ...Object.entries({ "Site / land status": siteLand, "Supply temperature": supplyTemperature, "Return temperature": returnTemperature, "Temperature basis": temperatureBasis, "Annual heat output (GWh/year)": annualHeat, "Baseline / counterfactual": baseline, "GHG basis": co2Basis, "GHG intensity (tCO2e/MWh)": ghgIntensity, "Developer structure": developerStructure, "Regulatory regime": regulatoryRegime, "Concession counterparty": concessionCounterparty, "EED threshold year": eedPathYear, "EED path": eedPath }).filter(([, value]) => value).map(([parameter, value]) => ({ parameter, value, benchmark: null })),
      ],
      risks: risks.filter(r => r.category).map(r => ({ ...r, severity: r.severity || "medium" })),
      public_funding: early ? [] : publicFunding.filter(r => r.programme).map(r => ({ ...r, amount: num(r.amount), expected_decision_date: r.expected_decision_date || null })),
      listing_access_criteria: {
        min_ticket: num(accessMinTicket),
        instruments_accepted: instrumentsAccepted,
        require_construction_risk_appetite: requireConstructionAppetite,
        electronic_execution_consent: electronicConsent,
        notify_users: notifyUsers.split(",").map((entry) => entry.trim()).filter(Boolean),
      },
    };

    try {
      const { error } = await supabase.rpc("publish_project", { payload: payload as never });
      if (error) {
        setPublishError(error.message || "The listing could not be published. Nothing was saved - please try again.");
        toast.error("The listing was not published. Nothing was saved, so you can retry safely.");
        return;
      }
      toast.success("Listing published. It now appears in My Listings and the marketplace.");
      navigate("/app/my-deals/listing");
    } catch {
      setPublishError("The publication result could not be confirmed. Check My Listings before trying again.");
      toast.error("The publication result could not be confirmed.");
    } finally {
      setPublishing(false);
    }
  };


  return (
    <QuestionEvidenceContext.Provider value={questionContext}>
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
                      done && "border-success-border bg-success text-inverse-foreground",
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
            <p className="mt-4 rounded-lg bg-warning-soft p-3 text-[11px] leading-relaxed text-warning-foreground">
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
                <WizardSelect value={projectType} onChange={(e) => setProjectType(e.target.value as typeof projectType)}>
                  <WizardOption value="greenfield">Greenfield (new construction)</WizardOption>
                  <WizardOption value="brownfield">Brownfield</WizardOption>
                  <WizardOption value="modernisation">Modernisation</WizardOption>
                  <WizardOption value="expansion">Expansion</WizardOption>
                </WizardSelect>
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Primary technology" required>
                  <WizardSelect value={technology} onChange={(e) => setTechnology(e.target.value as typeof technology)}>
                    {TECHNOLOGIES.map(([label, value]) => (
                      <WizardOption key={value} value={value}>{label}</WizardOption>
                    ))}
                  </WizardSelect>
                </Field>

              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Country" required>
                  <WizardSelect value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map((c) => (
                      <WizardOption key={c}>{c}</WizardOption>
                    ))}
                  </WizardSelect>
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
                  <div className="mt-2 flex gap-2 rounded-lg border border-warning-border bg-warning-soft p-3 text-xs text-warning-foreground">
                    <TriangleAlert className="mt-px h-4 w-4 flex-none" />
                    This looks like it may contain a name or city. Please keep the summary anonymous.
                  </div>
                ) : (
                  <div className="mt-2 flex gap-2 rounded-lg border border-success-border bg-success-soft p-3 text-xs text-success">
                    <ShieldCheck className="mt-px h-4 w-4 flex-none" />
                    No identifying names detected. Identity stays hidden until an investor expresses
                    interest.
                  </div>
                )}
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">


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
                label="Public co-financing status"
                required
                hint="Amount and source are revealed only at interest."
              >
                <WizardSelect value={publicCofinancing} onChange={e => setPublicCofinancing(e.target.value)}>
                  <WizardOption>None</WizardOption><WizardOption>In progress</WizardOption><WizardOption>Committed</WizardOption>
                </WizardSelect>
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




              <Field label="Site / land status" required>
                <WizardSelect value={siteLand} onChange={e => setSiteLand(e.target.value)}>
                  <WizardOption>Contracted</WizardOption><WizardOption>In negotiation</WizardOption><WizardOption>Not yet</WizardOption>
                </WizardSelect>
              </Field>

              <Field
                label="Supply / return temperature"
                optional={early ? "(design target)" : "(optional)"}
              >
                <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_150px]">
                  <Input type="number" placeholder="Supply C" value={supplyTemperature} onChange={e => setSupplyTemperature(e.target.value)} />
                  <Input type="number" placeholder="Return C" value={returnTemperature} onChange={e => setReturnTemperature(e.target.value)} />
                  <WizardSelect value={temperatureBasis} onChange={e => setTemperatureBasis(e.target.value)}>
                    {BASIS_FLAGS.map(value => <WizardOption key={value} value={value}>{value}</WizardOption>)}
                  </WizardSelect>
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
                <Input type="number" placeholder="GWh / yr" value={annualHeat} onChange={e => setAnnualHeat(e.target.value)} />
              </Field>




              <Field label="Network length" optional="(km)"><Input type="number" value={networkLength} onChange={e => setNetworkLength(e.target.value)} /></Field>
              <Field label="Households served" optional="(optional)"><Input type="number" value={households} onChange={e => setHouseholds(e.target.value)} /></Field>
              <Field label="Technology detail" optional="(optional)"><RowsEditor rows={technologyCards} onChange={setTechnologyCards} columns={[{ key: "title", placeholder: "Technology" }, { key: "description", placeholder: "Description" }]} addLabel="Add technology" /></Field>
              <Field label="Operating parameters" optional="(optional)"><RowsEditor rows={operatingParameters} onChange={setOperatingParameters} columns={[{ key: "parameter", placeholder: "Parameter" }, { key: "value", placeholder: "Value" }, { key: "benchmark", placeholder: "Context" }]} addLabel="Add parameter" /></Field>
              <Field
                label="Development timeline"
                optional="(optional)"
                hint="Phases shown as a tracker on the project page."
              >
                <RowsEditor rows={milestones} onChange={setMilestones} columns={[{ key: "label", placeholder: "Phase" }, { key: "target_date", placeholder: "Date", type: "date" }, { key: "status", placeholder: "completed / in_progress / upcoming" }, { key: "description", placeholder: "Short note" }]} addLabel="Add milestone" />
              </Field>

              <div className={cn("rounded-xl border p-5", lateStage ? "border-border bg-card" : "border-dashed border-border bg-muted/30 opacity-70")}>
                <AskedQuestions enabled={lateStage} keys={["construction_package.epc_contractor", "construction_package.contract_type", "construction_package.contract_value", "construction_package.ld_rate", "construction_package.ld_cap_pct", "construction_package.security", "construction_package.contingency_amount", "construction_package.contingency_pct", "construction_package.schedule_float_months", "construction_package.permits_status", "construction_package.interface_risk", "construction_package.om_contract", "construction_package.epc_named_in_dataroom"]} />
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
                  <WizardSelect value={contractType} onChange={(e) => setContractType(e.target.value)}>
                    <WizardOption value="">Contract type</WizardOption>
                    <WizardOption>Lump-sum turnkey</WizardOption><WizardOption>EPC</WizardOption><WizardOption>EPCM</WizardOption><WizardOption>Multi-contract</WizardOption>
                  </WizardSelect>
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


                  <div className="rounded-xl border border-dashed border-border bg-muted/40 p-5 text-center text-sm leading-relaxed text-muted-foreground">
                    <b className="text-foreground">Detailed financials are skipped at this stage.</b>
                    <br />
                    Capital stack and base-case DSCR inputs are collected from development,
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
                    <RowsEditor rows={capitalStack} onChange={setCapitalStack} columns={[{ key: "label", placeholder: "Tranche" }, { key: "amount", placeholder: "Amount EUR", type: "number" }, { key: "provider", placeholder: "Counterparty" }]} addLabel="Add tranche" />
                  </Field>
                  <Field label="Purchase floor / cap" optional="(optional)"><Input value={purchaseFloorCap} onChange={e => setPurchaseFloorCap(e.target.value)} /></Field>
                  <Field label="Three named risks" optional="(optional)"><RowsEditor rows={risks} onChange={setRisks} columns={[{ key: "category", placeholder: "Risk" }, { key: "severity", placeholder: "low / medium / high" }, { key: "description", placeholder: "Description" }, { key: "mitigation", placeholder: "Mitigation" }]} addLabel="Add risk" /></Field>
                  <Field label="Public funding" optional="(optional)"><PublicFundingEditor rows={publicFunding} onChange={setPublicFunding} /></Field>

                  <div className="grid gap-3.5 sm:grid-cols-3">




                    <Field label="DSCR 1x connections (base case)" optional="(count)">
                      <Input type="number" step="0.01" value={dscr1xConnections} onChange={(e) => setDscr1xConnections(e.target.value)} />
                    </Field>
                    <Field label="Zero IRR connections (base case)" optional="(count)">
                      <Input type="number" step="0.1" value={irrZeroConnections} onChange={(e) => setIrrZeroConnections(e.target.value)} />
                    </Field>
                  </div>

                  <Field
                    label="Revenue model"
                    required
                    hint="Streams and their share of revenue. Counterparties revealed at interest."
                  >
                    <RowsEditor rows={revenueStreams} onChange={setRevenueStreams} columns={[{ key: "stream", placeholder: "Stream" }, { key: "pct_of_revenue", placeholder: "%", type: "number" }, { key: "counterparty", placeholder: "Counterparty" }]} addLabel="Add stream" />
                  </Field>



                  <div className="my-6 rounded-xl border border-border bg-card p-5">
                    <AskedQuestions keys={["margin_profile.heat_purchase_price", "margin_profile.purchase_index", "margin_profile.customer_tariff", "margin_profile.tariff_index", "margin_profile.gross_spread", "margin_profile.opex_per_kwh", "margin_profile.indexation_mismatch_note"]} />
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
                                  <AskedQuestions enabled={locked || c.enabled} keys={["connections", "power_price", "capex_variance_pct", "equity_irr_pct", "min_dscr"].map(key => `project_case.${name}.${key}`)} />
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
                  <WizardSelect value={instrument} onChange={(e) => setInstrument(e.target.value as typeof instrument)}>
                    {Object.entries(INSTRUMENT_LABEL).map(([k, v]) => <WizardOption key={k} value={k}>{v}</WizardOption>)}
                  </WizardSelect>
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
                  <><AskedQuestions keys={["project_transaction.club_max_participants"]} /><Input type="number" placeholder="Maximum participants" value={clubMaxParticipants} onChange={(e) => setClubMaxParticipants(e.target.value)} /></>
                )}
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">


              </div>





              <div className="grid gap-3.5 sm:grid-cols-2">


              </div>





              <div className="grid gap-3.5 sm:grid-cols-2">


              </div>







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

          {/* STEP: access criteria */}
          {curKey === "access" && (
            <section>
              <StepHead n={cur + 1} total={STEPS.length} title="Access criteria" pill="Seen only by you" pillTone="t1" />
              <h1 className="mb-2 text-[27px] font-semibold">Access criteria</h1>
              <p className="mb-6 text-[15px] leading-relaxed text-muted-foreground">
                These criteria filter nothing. Every request still arrives in your inbox. They only drive the fit line
                shown before submission and on each request. You decide every request.
              </p>

              <Field label="Minimum ticket" optional="(EUR)" questionKeys={["listing_access_criteria.min_ticket"]}>
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
                <WizardSelect value={baseline} onChange={e => setBaseline(e.target.value)}>
                  <WizardOption>Individual gas boilers</WizardOption><WizardOption>Coal CHP</WizardOption>
                  <WizardOption>Individual electric heating</WizardOption><WizardOption>Oil heating</WizardOption>
                  <WizardOption>Older district heating</WizardOption>
                </WizardSelect>
              </Field>
              <Field label="GHG avoidance" optional="(optional, basis-flagged)">
                <div className="grid gap-2.5 sm:grid-cols-[1fr_150px]">
                  <Input type="number" placeholder="tCO2e / yr" value={co2} onChange={(e) => setCo2(e.target.value)} />
                  <WizardSelect value={co2Basis} onChange={e => setCo2Basis(e.target.value)}>
                    {BASIS_FLAGS.map(value => <WizardOption key={value} value={value}>{value}</WizardOption>)}
                  </WizardSelect>
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
                  <WizardSelect value={eedPathYear} onChange={(e) => setEedPathYear(e.target.value)}>
                    <WizardOption value="2025">Threshold year: 2025</WizardOption>
                    <WizardOption value="2028">Threshold year: 2028</WizardOption>
                    <WizardOption value="2035">Threshold year: 2035</WizardOption>
                  </WizardSelect>
                  <WizardSelect value={eedPath} onChange={(e) => setEedPath(e.target.value as typeof eedPath)}>
                    <WizardOption value="renewable_waste_heat_share">Path: renewable and waste-heat share</WizardOption>
                    <WizardOption value="ghg_reduction">Path: GHG reduction</WizardOption>
                  </WizardSelect>
                </div>
              </Field>
              <Field
                label="Energy source mix"
                optional="(optional)"
                hint="Named sources and their share. Shown as a donut and bar on the project page."
              >
                <RowsEditor rows={energyMix} onChange={setEnergyMix} columns={[{ key: "source", placeholder: "Source" }, { key: "share_pct", placeholder: "%", type: "number" }]} addLabel="Add source" />
              </Field>

              <Field label="GHG intensity" optional="(optional)">
                <Input type="number" step="0.01" placeholder="tCO2e / MWh" value={ghgIntensity} onChange={e => setGhgIntensity(e.target.value)} />
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
                <WizardSelect value={developerStructure} onChange={e => setDeveloperStructure(e.target.value)}>
                  {["Municipal utility", "Arms-length municipal", "Public-private partnership", "Private concession", "Fully private", "Cooperative", "ESCO", "Not-for-profit"].map((o) => (
                    <WizardOption key={o}>{o}</WizardOption>
                  ))}
                </WizardSelect>
              </Field>


              <Field
                label="Regulatory regime type"
                required
                hint="Investors filter on this. It sets the revenue-constraint sub-fields in Financial."
              >
                <WizardSelect value={regulatoryRegime} onChange={e => setRegulatoryRegime(e.target.value)}>
                  <WizardOption>Ex-ante cost-based regulated</WizardOption>
                  <WizardOption>Non-profit / break-even</WizardOption>
                  <WizardOption>Market-based + transparency</WizardOption>
                  <WizardOption>Ex-post competition control</WizardOption>
                  <WizardOption>Contractual / concession</WizardOption>
                  <WizardOption>In transition</WizardOption>
                </WizardSelect>
              </Field>
              <Field label="Concession counterparty & term" optional="(if concession / PPP)">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Input placeholder="Counterparty (e.g. local authority)" value={concessionCounterparty} onChange={e => setConcessionCounterparty(e.target.value)} />
                  <Input type="number" aria-label="Concession term in years" value={concessionTerm} onChange={e => setConcessionTerm(e.target.value)} placeholder="Term in years" />
                </div>
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
                  ["Stage", stage || ""],
                  ["Project title", title || ""],
                  ["Location shown", country ? country : ""],
                  [
                    "Offtake commitment",
                    totalBuildings
                      ? `${Number(contractedCount || 0) + Number(signedCount || 0)} of ${totalBuildings} buildings - ${(Number(contractedLoadPct || 0) + Number(signedLoadPct || 0)).toFixed(0)}% of design load`
                      : "",
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
                    mandate && "border-success-border bg-success-soft",
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
                <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
                  <Checkbox checked={electronicConsent} onCheckedChange={(value) => setElectronicConsent(value === true)} />
                  I consent to electronic execution of confidentiality agreements with investors requesting access to this listing.
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
    </QuestionEvidenceContext.Provider>
  );
}
