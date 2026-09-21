import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDialogParam } from "@/hooks/useDialogParam";
import AssistanceDialog from "@/components/platform/AssistanceDialog";

type AdvisorCategory = "Financial" | "Legal" | "Technical";

type Advisor = {
  initials: string;
  name: string;
  category: AdvisorCategory;
  label: string;
  description: string;
  tags: string[];
};

const ADVISORS: Advisor[] = [
  {
    initials: "EY",
    name: "EY - Infrastructure",
    category: "Financial",
    label: "Financial advisory",
    description: "Investment structuring, financial modelling, and bankability assessments for energy-transition infrastructure.",
    tags: ["Modelling", "Bankability", "EU-wide"],
  },
  {
    initials: "AG",
    name: "Artelia Group",
    category: "Technical",
    label: "Technical advisory",
    description: "Feasibility studies, system design, technology selection, and engineering reviews for district-energy networks.",
    tags: ["Feasibility", "System design", "FR · EU"],
  },
  {
    initials: "CM",
    name: "Clifford-Mercer LLP",
    category: "Legal",
    label: "Legal services",
    description: "Concession agreements, PPAs, regulatory compliance, and cross-border frameworks for DHC transactions.",
    tags: ["Concessions", "PPAs", "Cross-border"],
  },
  {
    initials: "RA",
    name: "Rambøll",
    category: "Technical",
    label: "Technical advisory",
    description: "District-energy planning, low-temperature network design, and decarbonization roadmaps across the Nordics and beyond.",
    tags: ["Network design", "Low-temp DHC", "Nordics"],
  },
  {
    initials: "PW",
    name: "PwC - Capital Projects",
    category: "Financial",
    label: "Financial advisory",
    description: "Transaction advisory, due-diligence support, and capital-structure optimization for infrastructure deals.",
    tags: ["Transaction", "Due diligence", "EU-wide"],
  },
  {
    initials: "BV",
    name: "Bureau Veritas",
    category: "Technical",
    label: "Technical advisory",
    description: "Independent verification: EU Taxonomy alignment, DNSH assessment, and technical due diligence.",
    tags: ["Taxonomy", "DNSH", "Verification"],
  },
];

const FILTERS = ["All advisors", "Financial", "Legal", "Technical"] as const;
type Filter = (typeof FILTERS)[number];

const Ecosystem = () => {
  const [filter, setFilter] = useState<Filter>("All advisors");
  const { value: assist, open, close } = useDialogParam("assist");

  const advisors = useMemo(
    () => filter === "All advisors" ? ADVISORS : ADVISORS.filter((advisor) => advisor.category === filter),
    [filter],
  );

  const requestAssistance = (advisor?: Advisor) => open(advisor ? advisor.name : "any");
  const preselected = assist && assist !== "any"
    ? ADVISORS.find((advisor) => advisor.name === assist) ?? null
    : null;

  return (
    <div className="max-w-7xl space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground">Ecosystem</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Connect with vetted financial, legal, and technical advisors to bring projects to bankable standard.
        </p>
      </header>

      <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter advisors by category">
        {FILTERS.map((item) => (
          <Button
            key={item}
            type="button"
            variant={filter === item ? "default" : "outline"}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
            className={cn(
              "h-10 px-4 font-display",
              filter === item
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-card text-foreground/80 hover:bg-muted hover:text-foreground",
            )}
          >
            {item}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {advisors.map((advisor) => (
          <article
            key={advisor.name}
            className="flex min-h-[290px] flex-col rounded-lg border border-border bg-card p-6 transition-[border-color,box-shadow] hover:border-foreground/15 hover:shadow-md"
          >
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted font-display text-base font-bold text-foreground/75">
                {advisor.initials}
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base font-semibold text-foreground">{advisor.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{advisor.label}</p>
              </div>
            </div>

            <p className="mt-4 text-[13.5px] leading-6 text-foreground/70">{advisor.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {advisor.tags.map((tag) => (
                <span key={tag} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground/75">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-auto border-t border-border pt-4">
              <Button variant="outline" className="w-full bg-card" onClick={() => requestAssistance(advisor)}>
                Request assistance
              </Button>
            </div>
          </article>
        ))}
      </div>

      <section className="flex flex-col items-start justify-between gap-6 rounded-lg bg-primary px-7 py-7 text-primary-foreground lg:flex-row lg:items-center">
        <div>
          <h2 className="font-display text-xl font-semibold">Not sure who you need?</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-primary-foreground/75">
            Tell us about your project and where it's stuck - financing structure, regulatory questions, technical feasibility - and we'll match you to the right partner and make the introduction.
          </p>
        </div>
        <Button
          className="h-11 shrink-0 bg-accent px-6 text-accent-foreground hover:bg-accent/90"
          onClick={() => requestAssistance()}
        >
          Request assistance for a project
          <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      <p className="max-w-5xl text-xs leading-5 text-muted-foreground">
        Advisory partners may pay DHC Market a referral fee for qualified introductions. This does not affect the fees you pay your chosen advisor, and you are free to engage any advisor. Connecting investors and developers to each other remains separate and is never influenced by advisory relationships.
      </p>

      {assist && (
        <AssistanceDialog advisors={ADVISORS} preselected={preselected} onClose={close} />
      )}
    </div>
  );
};

export default Ecosystem;