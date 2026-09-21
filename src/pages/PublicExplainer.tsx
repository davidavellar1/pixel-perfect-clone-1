import { Link } from "@/lib/router-compat";
import { ArrowRight, BadgeCheck, Building2, Check, FileSearch, Handshake, Landmark, Network, Scale, Search, ShieldCheck, Users } from "lucide-react";
import PublicShell from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";

type ExplainerKind = "ecosystem" | "public-funding" | "how-it-works";

const pages = {
  ecosystem: {
    eyebrow: "DHC specialist ecosystem",
    title: "Bring the right expertise into your project at the right time.",
    lead: "Connect with financial, legal, technical, and sustainability specialists who understand district heating and cooling projects across Europe.",
    primary: "Find specialist support",
    primaryTo: "/sign-up?role=developer",
    sectionLabel: "Expertise around the transaction",
    sectionTitle: "Support from feasibility through financial close",
    sectionText: "DHC projects cross engineering, regulation, finance, procurement, and public policy. The ecosystem helps developers and investors find relevant support without turning the platform into an adviser.",
    cards: [
      ["Financial", "Build bankable models, capital structures, funding strategies, and transaction materials.", Landmark],
      ["Legal and regulatory", "Navigate concessions, procurement, permitting, contracts, and market-specific rules.", Scale],
      ["Technical", "Strengthen feasibility, engineering, heat-source, network, and operating assumptions.", Network],
      ["Sustainability", "Document emissions baselines, EU framework alignment, and evidence for impact claims.", ShieldCheck],
    ],
    steps: [["Describe the need", "Choose the project and the expertise required."], ["Review suggested partners", "See specialists matched to the project and request."], ["Request assistance", "Send one structured request with the relevant context."], ["Work directly", "Agree scope, terms, and delivery with the selected specialist."]],
    noteTitle: "Introductions stay transparent",
    note: "Partners may pay DHC Market a referral fee when an engagement starts. This never changes the price shown to you, and the relationship is disclosed before you send a request.",
    finalTitle: "Move the next project decision forward",
    finalText: "Join DHC Market to request specialist help against a real project listing.",
  },
  "public-funding": {
    eyebrow: "Public funding",
    title: "Find public co-financing that can strengthen the capital stack.",
    lead: "Explore relevant European and national grants, loans, guarantees, and blended-finance instruments using the facts already stored in each project listing.",
    primary: "Explore funding support",
    primaryTo: "/sign-up?role=developer",
    sectionLabel: "A clearer route to public capital",
    sectionTitle: "Screen instruments without re-entering project data",
    sectionText: "Eligibility checks compare an instrument's published criteria with the selected project's geography, technology, stage, size, and sustainability facts. Results guide the next conversation, not a funding decision.",
    cards: [
      ["Discover", "Search grants, loans, guarantees, and blended-finance programmes relevant to DHC.", Search],
      ["Check eligibility", "Compare existing listing facts with the criteria published for each instrument.", FileSearch],
      ["Understand the fit", "See which criteria match, which need evidence, and which may block eligibility.", BadgeCheck],
      ["Request an introduction", "Ask for a warm introduction to the institution when the project appears suitable.", Handshake],
    ],
    steps: [["Select an instrument", "Review its purpose, geography, project types, and key criteria."], ["Choose a project", "Use facts from an existing listing rather than entering them again."], ["Review the result", "See matched criteria and any evidence still required."], ["Request a warm introduction", "Send the project context to the funding contact through DHC Market."]],
    noteTitle: "Free to use, with no platform fee",
    note: "Public funding discovery, eligibility checks, and warm-introduction requests are free. Funding institutions make their own decisions, and DHC Market does not guarantee eligibility or an award.",
    finalTitle: "Add public funding to the project strategy",
    finalText: "Create a project listing, then check relevant instruments against its real facts.",
  },
} as const;

const PublicExplainer = ({ kind }: { kind: ExplainerKind }) => {
  if (kind === "how-it-works") return null;
  const page = pages[kind];
  return (
    <PublicShell>
      <section className="bg-hero-gradient py-20 text-primary-foreground md:py-24">
        <div className="container">
          <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-display text-xs font-semibold uppercase text-accent">{page.eyebrow}</span>
          <h1 className="mt-5 max-w-[20ch] font-display text-4xl font-semibold leading-tight md:text-5xl">{page.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-primary-foreground/70">{page.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3"><Button variant="hero" size="lg" asChild><Link to={page.primaryTo}>{page.primary}<ArrowRight /></Link></Button><Button variant="hero-outline" size="lg" asChild><Link to="/how-it-works">See how it works</Link></Button></div>
        </div>
      </section>

      <section className="bg-card py-20">
        <div className="container">
          <div className="mb-10 max-w-3xl"><p className="eyebrow">{page.sectionLabel}</p><h2 className="mt-3 font-display text-3xl font-semibold">{page.sectionTitle}</h2><p className="mt-4 leading-7 text-muted-foreground">{page.sectionText}</p></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{page.cards.map(([title, text, Icon]) => <article key={title} className="rounded-lg border border-border bg-background p-6"><span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/10"><Icon className="h-5 w-5 text-accent" /></span><h3 className="mt-5 font-display font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="container"><div className="mb-10 text-center"><p className="eyebrow">How it works</p><h2 className="mt-3 font-display text-3xl font-semibold">From need to direct connection</h2></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{page.steps.map(([title, text], index) => <article key={title} className="rounded-lg border border-border bg-card p-6"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-accent-foreground">{index + 1}</span><h3 className="mt-4 font-display font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div></div>
      </section>

      <section className="bg-card py-20"><div className="container"><div className="flex gap-4 rounded-lg border border-border border-l-4 border-l-accent bg-background p-7"><Check className="mt-0.5 h-6 w-6 shrink-0 text-accent" /><div><h2 className="font-display text-lg font-semibold">{page.noteTitle}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{page.note}</p></div></div></div></section>

      <section className="bg-hero-gradient py-20 text-center text-primary-foreground"><div className="mx-auto max-w-3xl px-5"><Building2 className="mx-auto text-accent" /><h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">{page.finalTitle}</h2><p className="mx-auto mt-4 max-w-2xl text-primary-foreground/65">{page.finalText}</p><div className="mt-7 flex flex-wrap justify-center gap-3"><Button variant="hero" size="lg" asChild><Link to="/sign-up?role=developer">Join as a developer<ArrowRight /></Link></Button><Button variant="hero-outline" size="lg" asChild><Link to="/sign-up?role=investor">Join as an investor</Link></Button></div></div></section>
    </PublicShell>
  );
};

export default PublicExplainer;