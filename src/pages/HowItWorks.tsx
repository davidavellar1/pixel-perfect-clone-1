import { Link } from "react-router-dom";
import { ArrowRight, Check, CirclePlus, Info, ShieldCheck, UserRoundPlus } from "lucide-react";
import PublicShell from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";

const developerSteps = [
  ["List your project", "A stage-first wizard turns it into a standardized, anonymized profile."],
  ["Receive requests", "Investors send a request and a signed confidentiality agreement. Nothing is revealed until you accept."],
  ["Decide on your terms", "You accept, ask a question or decline. The data room is a separate acceptance."],
];

const investorSteps = [
  ["Discover the pipeline", "Browse anonymized projects, filtered by technology, geography, and regime."],
  ["Express interest", "Send the request and the signed agreement. If the developer accepts, the project reveals and the introduction is logged."],
  ["Diligence and connect", "Open the data room, then take it forward toward close, directly."],
];

const accessTiers = [
  { number: "0", title: "Public", detail: "Anonymized teaser cards, technology, country, capacity and capex bands. No identities, no exact figures.", gate: "Anyone", tone: "bg-muted-foreground" },
  { number: "1", title: "Signed in", detail: "The full standardized overview, still anonymized: region not city, banded figures, no counterparties.", gate: "Free account", tone: "bg-primary/70" },
  { number: "2", title: "Request accepted by the developer", detail: "Developer, exact location, counterparties, every data tab and Q&A reveal. The agreement takes effect and the introduction is logged on acceptance.", gate: "Fee-binding", tone: "bg-primary" },
  { number: "3", title: "Data room", detail: "Confidential model, EIA, term sheet, and EPC, released only on the developer's approval.", gate: "Developer-approved", tone: "bg-foreground" },
];

const supportCards = [
  {
    title: "A built-in de-risking layer",
    description: "Public money sits alongside private capital on many projects, and the platform helps surface it, for free.",
    icon: ShieldCheck,
    points: [
      "A free matcher maps projects to EIB, recovery funds, EBRD, and national instruments",
      "Grants, concessional debt, and guarantees absorb risk ahead of private capital",
      "Each project shows its public co-financing status and amount",
    ],
  },
  {
    title: "An ecosystem of advisors",
    description: "Both sides can reach vetted partners for the work a DHC transaction actually requires, without leaving the platform.",
    icon: UserRoundPlus,
    points: [
      "Financial, legal, and technical advisers experienced in district energy",
      "Engineering, EIA, and feasibility support to make a project bankable",
      "Any partner referral fee is disclosed up front, so incentives stay transparent",
    ],
  },
];

const SectionHeading = ({ label, title, description }: { label: string; title: string; description: string }) => (
  <div className="mx-auto mb-11 max-w-2xl text-center">
    <p className="font-display text-xs font-semibold uppercase text-primary">{label}</p>
    <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-foreground md:text-4xl">{title}</h2>
    <p className="mt-4 leading-7 text-muted-foreground">{description}</p>
  </div>
);

const JourneyColumn = ({ title, steps, investor = false }: { title: string; steps: string[][]; investor?: boolean }) => (
  <div className="flex flex-col gap-3">
    <div className={`rounded-sm px-4 py-3 text-center font-display font-semibold ${investor ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"}`}>
      {title}
    </div>
    {steps.map(([stepTitle, detail]) => (
      <article key={stepTitle} className="flex-1 rounded-sm border border-border bg-card p-4">
        <h3 className="font-display text-sm font-semibold text-card-foreground">{stepTitle}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{detail}</p>
      </article>
    ))}
  </div>
);

const HowItWorks = () => (
  <PublicShell>
    <section className="bg-hero-gradient px-5 py-16 text-center text-primary-foreground md:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 font-display text-xs font-semibold uppercase text-accent">
          How it works
        </p>
        <h1 className="mx-auto mt-5 max-w-[18ch] font-display text-4xl font-semibold leading-tight md:text-5xl">
          One neutral platform where two sides meet.
        </h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-primary-foreground/70">
          DHC Market connects district heating and cooling developers with private investors, public co-financing, and advisory partners. It facilitates the introduction. It does not invest, advise, or hold any money. Here is how it works for both sides.
        </p>
      </div>
    </section>

    <section className="bg-card px-5 py-16 md:py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading label="The flow" title="Two journeys, one introduction" description="Developers list and investors discover. The platform keeps both anonymous until they choose to connect, then gets out of the way." />
        <div className="grid items-stretch gap-4 md:grid-cols-[1fr_76px_1fr] md:gap-2">
          <JourneyColumn title="Developer" steps={developerSteps} />
          <div className="flex items-center justify-center md:flex-col">
            <div className="h-px flex-1 bg-border md:h-auto md:w-px" />
            <div className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center rounded-full bg-foreground text-primary-foreground shadow-card-hover">
              <CirclePlus className="text-accent" />
              <span className="mt-1 font-display text-[10px] font-semibold uppercase text-primary-foreground/65">Intro</span>
            </div>
            <div className="h-px flex-1 bg-border md:h-auto md:w-px" />
          </div>
          <JourneyColumn title="Investor" steps={investorSteps} investor />
        </div>
      </div>
    </section>

    <section className="bg-background px-5 py-16 md:py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading label="Trust by design" title="Information reveals in four tiers" description="Nothing sensitive is exposed up front. Each tier unlocks more, and a developer's identity reveals only when that developer accepts the investor's request." />
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          {accessTiers.map((tier) => (
            <article key={tier.number} className="grid items-center gap-4 rounded-sm border border-border bg-card p-5 sm:grid-cols-[54px_1fr_auto]">
              <div className={`flex h-[54px] w-[54px] items-center justify-center rounded-sm font-display text-xl font-bold text-primary-foreground ${tier.tone}`}>{tier.number}</div>
              <div>
                <h3 className="font-display font-semibold text-card-foreground">{tier.title}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{tier.detail}</p>
              </div>
              <span className="hidden rounded-full bg-muted px-3 py-1.5 font-display text-xs font-semibold text-muted-foreground sm:inline-flex">{tier.gate}</span>
            </article>
          ))}
        </div>
        <p className="mx-auto mt-5 max-w-2xl text-center text-sm leading-6 text-muted-foreground">Only capacity and capex are banded before reveal, and location stays at region level. The developer accepting your request at tier 2 is what logs the introduction between you and them.</p>
      </div>
    </section>

    <section className="bg-card px-5 py-16 md:py-20">
      <div className="mx-auto max-w-5xl">
        <SectionHeading label="More than a listing" title="A full ecosystem around every project" description="Connecting capital is the core, but a DHC deal needs more than an introduction. The platform surfaces the public funding and the partners that get a project to close." />
        <div className="grid gap-5 md:grid-cols-2">
          {supportCards.map(({ title, description, icon: Icon, points }) => (
            <article key={title} className="rounded-sm border border-border bg-card p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-primary/10"><Icon className="text-primary" /></div>
              <h3 className="mt-5 font-display text-xl font-semibold text-card-foreground">{title}</h3>
              <p className="mt-3 leading-7 text-muted-foreground">{description}</p>
              <ul className="mt-4 space-y-3">
                {points.map((point) => <li key={point} className="flex gap-3 text-sm leading-6 text-foreground/80"><Check className="mt-1 h-4 w-4 shrink-0 text-primary" />{point}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-card px-5 pb-16 md:pb-20">
      <div className="mx-auto flex max-w-4xl gap-4 rounded-sm border border-border border-l-4 border-l-primary bg-background p-6 md:p-7">
        <Info className="mt-1 shrink-0 text-primary" />
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">A neutral connector</h2>
          <p className="mt-2 leading-7 text-muted-foreground">The platform does not underwrite, rate, or recommend any project, and it never holds capital. All returns and risk figures are developer-stated or attributed to a named source. It is transaction infrastructure: it makes the right introductions, keeps them protected, and lets the two sides transact directly.</p>
        </div>
      </div>
    </section>

    <section className="bg-hero-gradient px-5 py-16 text-center text-primary-foreground md:py-20">
      <div className="mx-auto max-w-3xl">
        <h2 className="font-display text-3xl font-semibold md:text-4xl">See it from your side</h2>
        <p className="mt-4 text-lg text-primary-foreground/70">Whether you are raising for a project or sourcing one, the path is built for you.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="hero-outline" asChild><Link to="/for-developers">I'm a developer</Link></Button>
          <Button size="lg" variant="hero-outline" asChild><Link to="/for-investors">I'm an investor</Link></Button>
          <Button size="lg" variant="hero" asChild><Link to="/sign-up">Get started<ArrowRight /></Link></Button>
        </div>
      </div>
    </section>
  </PublicShell>
);

export default HowItWorks;