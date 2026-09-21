import { useMemo, useState } from "react";
import { Building2, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDialogParam } from "@/hooks/useDialogParam";
import EligibilityDialog from "@/components/platform/EligibilityDialog";

type FundingInstrument = {
  name: string;
  organization: string;
  geography: string;
  type: string;
  stages: string[];
  description: string;
  eligibility: string[];
  match?: string;
};

const INSTRUMENTS: FundingInstrument[] = [
  {
    name: "European Investment Bank",
    organization: "EIB",
    geography: "EU-wide",
    type: "Senior debt & guarantees",
    stages: ["Development", "Construction"],
    description: "Long-tenor senior debt and guarantee products for energy-efficiency and district-energy infrastructure, including framework loans via national intermediaries.",
    eligibility: ["EU-wide", "All DHC tech", "Development → Construction", "Typically €25M+"],
    match: "Matches 2 of your projects",
  },
  {
    name: "EU LIFE Programme",
    organization: "European Commission",
    geography: "EU-wide",
    type: "Grant & technical assistance",
    stages: ["Concept", "Development"],
    description: "Grants and technical-assistance support for clean-energy transition projects, including feasibility and replication of efficient DHC schemes.",
    eligibility: ["EU-wide", "Renewable / efficient DHC", "Concept → Development"],
  },
  {
    name: "EBRD Green Cities",
    organization: "EBRD",
    geography: "Selected markets",
    type: "Blended / concessional",
    stages: ["Development"],
    description: "Blended finance combining concessional and commercial funding for municipal green infrastructure, with technical assistance for project preparation.",
    eligibility: ["CEE & selected", "Municipal DHC", "Development"],
    match: "Matches 1 of your projects",
  },
  {
    name: "EIFO",
    organization: "Denmark's Export & Investment Fund",
    geography: "Denmark",
    type: "Co-investment & debt",
    stages: ["Development", "Construction"],
    description: "Co-investment capital and debt for green infrastructure with a Danish nexus, including district-energy and export-linked projects.",
    eligibility: ["Denmark / DK-linked", "All DHC tech", "Development → Construction"],
  },
  {
    name: "IFU",
    organization: "Investment Fund for Developing Countries",
    geography: "Eligible markets",
    type: "Co-investment equity",
    stages: ["Development"],
    description: "Risk capital and equity co-investment alongside private investors for sustainable infrastructure in eligible markets.",
    eligibility: ["Eligible markets", "Equity co-invest", "Development"],
  },
  {
    name: "National Recovery & Resilience Funds",
    organization: "Member-state RRF allocations",
    geography: "EU-wide",
    type: "Grant & co-investment",
    stages: ["Concept", "Development", "Construction"],
    description: "National recovery-plan allocations earmarked for heating decarbonization, varying by member state - grants and co-investment capital.",
    eligibility: ["By member state", "Decarbonization DHC", "Concept → Construction"],
  },
];

const PublicFunding = () => {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [country, setCountry] = useState("all");
  const [stage, setStage] = useState("all");
  const { value: eligibilityName, open, close } = useDialogParam("eligibility");
  const activeInstrument = INSTRUMENTS.find((item) => item.name === eligibilityName) ?? null;

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return INSTRUMENTS.filter((instrument) => {
      const matchesQuery = !needle || [instrument.name, instrument.organization, instrument.description]
        .some((value) => value.toLowerCase().includes(needle));
      const matchesType = type === "all" || instrument.type === type;
      const matchesCountry = country === "all" || instrument.geography === country || instrument.geography === "EU-wide";
      const matchesStage = stage === "all" || instrument.stages.includes(stage);
      return matchesQuery && matchesType && matchesCountry && matchesStage;
    });
  }, [country, query, stage, type]);

  const checkEligibility = (name: string) => open(name);


  return (
    <div className="max-w-7xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground">Public Funding &amp; Blended Finance</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Public co-financing instruments that de-risk DHC projects and lower the cost of private capital.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
          <Check className="h-3.5 w-3.5" />
          Free for developers and investors - no platform fee on public funding
        </div>
      </header>

      <section className="flex items-center gap-5 rounded-lg bg-primary px-7 py-6 text-primary-foreground">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
          <Building2 className="h-6 w-6 text-primary-foreground/80" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Public capital is often the first door - and the one that unlocks the rest.</h2>
          <p className="mt-1.5 max-w-4xl text-sm leading-6 text-primary-foreground/75">
            Grants, guarantees, and concessional debt absorb early-stage and first-loss risk, making a project investable for private capital. Browse the instruments below, check eligibility against your project, and we'll route a warm introduction to the relevant institution.
          </p>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-[minmax(240px,1fr)_220px_170px_170px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search instruments, institutions…" className="h-11 bg-card pl-10" />
        </div>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="All instrument types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All instrument types</SelectItem>
            {[...new Set(INSTRUMENTS.map((item) => item.type))].map((value) => <SelectItem key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="All countries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            <SelectItem value="EU-wide">EU-wide</SelectItem>
            <SelectItem value="Denmark">Denmark</SelectItem>
            <SelectItem value="Selected markets">Selected markets</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stage} onValueChange={setStage}>
          <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="All stages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            <SelectItem value="Concept">Concept</SelectItem>
            <SelectItem value="Development">Development</SelectItem>
            <SelectItem value="Construction">Construction</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((instrument) => (
            <article key={instrument.name} className="flex min-h-[270px] flex-col rounded-lg border border-border bg-card p-6 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">{instrument.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{instrument.organization} · {instrument.geography}</p>
                </div>
                <span className="shrink-0 rounded-full bg-secondary px-3 py-1.5 text-[11px] font-semibold text-primary">{instrument.type}</span>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{instrument.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {instrument.eligibility.map((item) => (
                  <span key={item} className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-foreground/75">{item}</span>
                ))}
              </div>
              <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                <Button onClick={() => checkEligibility(instrument.name)} className="bg-accent text-accent-foreground hover:bg-accent/90">Check eligibility</Button>
                {instrument.match && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent"><Check className="h-3.5 w-3.5" />{instrument.match}</span>}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center">
          <p className="font-display font-semibold text-foreground">No funding instruments match these filters</p>
          <Button variant="outline" className="mt-4" onClick={() => { setQuery(""); setType("all"); setCountry("all"); setStage("all"); }}>Clear filters</Button>
        </div>
      )}

      <EligibilityDialog instrument={activeInstrument} onClose={close} />
    </div>
  );
};

export default PublicFunding;