import { useMemo, useState } from "react";
import { Building2, Check, ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useDialogParam } from "@/hooks/useDialogParam";
import EligibilityDialog from "@/components/platform/EligibilityDialog";
import {
  APPLICANT_LABEL,
  COUNTRY_NAMES,
  INSTRUMENT_LABEL,
  LEVEL_LABEL,
  callLabel,
  callState,
  dateOf,
  factsOf,
  fits,
  geographyLabel,
  humanize,
  isAcceptingApplications,
  isStale,
  sortRank,
  useFundingCatalogue,
  useOwnProjects,
  type FundingEntry,
} from "@/lib/funding";

const CallBadge = ({ entry }: { entry: FundingEntry }) => {
  const state = callState(entry);
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1.5 text-[11px] font-semibold",
        state.kind === "open" &&
          (state.urgent ? "bg-warning/15 text-warning" : "bg-success/10 text-success"),
        (state.kind === "rolling" || state.kind === "standing") && "bg-success/10 text-success",
        state.kind === "upcoming" && "bg-accent/10 text-accent",
        (state.kind === "none" || state.kind === "paused" || state.kind === "national") &&
          "bg-muted text-muted-foreground",
      )}
    >
      {callLabel(state)}
    </span>
  );
};

const PublicFunding = () => {
  const { entries, loading } = useFundingCatalogue();
  const { projects } = useOwnProjects();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [country, setCountry] = useState("all");
  const [stage, setStage] = useState("all");
  const [applicant, setApplicant] = useState("all");
  const [openOnly, setOpenOnly] = useState(false);
  const { value: eligibilitySlug, open, close } = useDialogParam("eligibility");
  const activeEntry = entries.find((item) => item.slug === eligibilitySlug) ?? null;

  const options = useMemo(() => {
    const uniq = (values: string[]) => [...new Set(values)].sort();
    return {
      types: uniq(entries.flatMap((e) => e.instrument_types)),
      countries: uniq(entries.flatMap((e) => e.country_codes)).sort((a, b) =>
        (COUNTRY_NAMES[a] || a).localeCompare(COUNTRY_NAMES[b] || b),
      ),
      stages: uniq(entries.flatMap((e) => e.stages)),
      applicants: uniq(entries.flatMap((e) => e.applicant_types)),
    };
  }, [entries]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries
      .filter((e) => {
        const text = [e.name, e.name_en || "", e.administering_body, e.summary]
          .join(" ")
          .toLowerCase();
        if (needle && !text.includes(needle)) return false;
        if (type !== "all" && !e.instrument_types.includes(type)) return false;
        if (country === "eu-wide" && !(e.level === "eu" || e.level === "ifi")) return false;
        if (country !== "all" && country !== "eu-wide" && !e.country_codes.includes(country))
          return false;
        if (stage !== "all" && e.stages.length && !e.stages.includes(stage)) return false;
        if (
          applicant !== "all" &&
          e.applicant_types.length &&
          !e.applicant_types.includes(applicant)
        )
          return false;
        if (openOnly && !isAcceptingApplications(e)) return false;
        return true;
      })
      .sort((a, b) => {
        const [ra, va] = sortRank(a);
        const [rb, vb] = sortRank(b);
        return ra - rb || va - vb || (a.name_en || a.name).localeCompare(b.name_en || b.name);
      });
  }, [entries, query, type, country, stage, applicant, openOnly]);

  const lastUpdated = entries.reduce<string | null>(
    (max, e) => (!max || e.last_verified_at > max ? e.last_verified_at : max),
    null,
  );
  const countryCount = new Set(entries.flatMap((e) => e.country_codes)).size;
  const reset = () => {
    setQuery("");
    setType("all");
    setCountry("all");
    setStage("all");
    setApplicant("all");
    setOpenOnly(false);
  };

  return (
    <div className="max-w-7xl min-w-0 space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          Public Funding &amp; Blended Finance
        </h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Public co-financing instruments that de-risk DHC projects and lower the cost of private
          capital.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
          <Check className="h-3.5 w-3.5" />
          Free for developers and investors - no platform fee on public funding
        </div>
      </header>

      <section className="flex items-center gap-5 rounded-lg bg-primary px-5 py-6 text-primary-foreground sm:px-7">
        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10 sm:flex">
          <Building2 className="h-6 w-6 text-primary-foreground/80" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-xl font-semibold">
            Public capital is often the first door - and the one that unlocks the rest.
          </h2>
          <p className="mt-1.5 max-w-4xl text-sm leading-6 text-primary-foreground/75">
            Grants, guarantees, and concessional debt absorb early-stage and first-loss risk, making
            a project investable for private capital. Browse the instruments below and check the
            indicative fit against your project. Applications go directly to the funding body.
          </p>
        </div>
      </section>

      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_190px_170px_170px_190px]">
          <div className="relative md:col-span-2 xl:col-span-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search programmes, funding bodies…"
              className="h-11 bg-card pl-10"
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11 bg-card">
              <SelectValue placeholder="All instrument types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All instrument types</SelectItem>
              {options.types.map((v) => (
                <SelectItem key={v} value={v}>
                  {INSTRUMENT_LABEL[v] || humanize(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger className="h-11 bg-card">
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              <SelectItem value="eu-wide">EU-wide</SelectItem>
              {options.countries.map((v) => (
                <SelectItem key={v} value={v}>
                  {COUNTRY_NAMES[v] || v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="h-11 bg-card">
              <SelectValue placeholder="All stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {options.stages.map((v) => (
                <SelectItem key={v} value={v}>
                  {humanize(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={applicant} onValueChange={setApplicant}>
            <SelectTrigger className="h-11 bg-card">
              <SelectValue placeholder="All applicants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All applicants</SelectItem>
              {options.applicants.map((v) => (
                <SelectItem key={v} value={v}>
                  {APPLICANT_LABEL[v] || humanize(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch id="open-only" checked={openOnly} onCheckedChange={setOpenOnly} />
            <Label htmlFor="open-only" className="text-sm">
              Accepting applications now
            </Label>
          </div>
          {!loading && entries.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {entries.length} programmes across {countryCount} countries
            </p>
          )}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          Indicative information from official sources, checked regularly. Always confirm criteria
          and deadlines on the official page.
          {lastUpdated && ` Catalogue updated ${dateOf(lastUpdated)}.`}
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[270px] rounded-lg" />
          ))}
        </div>
      ) : !entries.length ? (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center">
          <p className="font-display font-semibold text-foreground">
            The funding catalogue is being built – check back soon.
          </p>
        </div>
      ) : filtered.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((entry) => {
            const facts = factsOf(entry);
            const matches = projects.filter((p) => fits(entry, p)).length;
            return (
              <article
                key={entry.id}
                className="flex min-h-[270px] min-w-0 flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {entry.name}
                    </h3>
                    {entry.name_en && entry.name_en !== entry.name && (
                      <p className="text-xs text-muted-foreground">{entry.name_en}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {entry.administering_body} · {LEVEL_LABEL[entry.level] || entry.level} ·{" "}
                      {geographyLabel(entry)}
                    </p>
                  </div>
                  <CallBadge entry={entry} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {entry.instrument_types.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-primary"
                    >
                      {INSTRUMENT_LABEL[t] || humanize(t)}
                    </span>
                  ))}
                  {isStale(entry) && (
                    <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[11px] font-semibold text-warning">
                      Needs re-check
                    </span>
                  )}
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{entry.summary}</p>
                {facts.length > 0 && (
                  <p className="mt-3 text-[13px] font-medium text-foreground/80">
                    {facts.join(" · ")}
                  </p>
                )}
                {entry.key_conditions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.key_conditions.slice(0, 4).map((item) => (
                      <span
                        key={item}
                        className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs text-foreground/75"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
                  <Button
                    onClick={() => open(entry.slug)}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    Check eligibility
                  </Button>
                  <a
                    href={entry.official_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
                  >
                    Official page <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  {matches > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent">
                      <Check className="h-3.5 w-3.5" />
                      Indicative fit for {matches} of your projects
                    </span>
                  )}
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    Last verified {dateOf(entry.last_verified_at)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center">
          <p className="font-display font-semibold text-foreground">
            {openOnly
              ? "No programme matching these filters is accepting applications right now"
              : "No funding instruments match these filters"}
          </p>
          {openOnly && (
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Call-based programmes appear here again when their next call opens. Turn the toggle
              off to see every programme, including upcoming and closed calls.
            </p>
          )}
          <Button variant="outline" className="mt-4" onClick={reset}>
            Clear filters
          </Button>
        </div>
      )}

      <EligibilityDialog entry={activeEntry} projects={projects} onClose={close} />
    </div>
  );
};

export default PublicFunding;
