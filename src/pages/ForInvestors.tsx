import { Link } from "@/lib/router-compat";
import { Activity, ArrowRight, Building2, Check, Info, ShieldCheck, Sparkles } from "lucide-react";
import PublicShell from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { FEE_SENTENCE } from "@/lib/fee";

const reasons = [
  {
    icon: Building2,
    title: "Tangible real assets",
    text: "Physical networks with long lives and high barriers to entry.",
  },
  {
    icon: ShieldCheck,
    title: "Contracted demand",
    text: "Offtake under long-term agreements, often with a municipal anchor.",
  },
  {
    icon: Activity,
    title: "Inflation linkage",
    text: "Tariffs frequently indexed, giving a degree of inflation protection.",
  },
  {
    icon: Sparkles,
    title: "EU policy backing",
    text: "Aligned with EED, RED III, and the EU Taxonomy decarbonization push.",
  },
];

const steps = [
  [
    "Browse anonymized",
    "Filter the pipeline by technology, geography, regime, size, and de-risking signals.",
  ],
  [
    "Express interest",
    "Send a short request and a signed confidentiality agreement. The developer decides. They can also decline, and nothing is revealed if they do. A decision is typically sought within 3 working days.",
  ],
  [
    "Diligence",
    "On acceptance, identity, counterparties and every data tab open. The data room is a separate approval by the same developer.",
  ],
  ["Connect and close", "Take it forward directly with the developer toward financial close."],
];

const ForInvestors = () => (
  <PublicShell>
    <section className="bg-hero-gradient py-20 text-primary-foreground md:py-24">
      <div className="container">
        <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-display text-xs font-semibold uppercase text-accent">
          For investors
        </span>
        <h1 className="mt-5 max-w-[19ch] font-display text-4xl font-semibold leading-tight md:text-5xl">
          A standardized, pan-European pipeline of district energy.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-inverse-subtle">
          Discover, compare, and connect with district heating and cooling projects across Europe,
          each presented in the same structured format, with the regulatory regime typed and the
          de-risking laid out. Then build a diversified position.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" variant="hero" asChild>
            <Link to="/sign-up">
              Explore opportunities <ArrowRight />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="public-secondary">
            <Link to="/sign-up">Create a free account</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-inverse-subtle">
          Free to join. Browse anonymized; nothing is revealed until the developer accepts your
          request, and the data room is approved separately. Ticket bands are published by each developer.
        </p>
        <p className="mt-2 text-sm text-inverse-subtle">{FEE_SENTENCE}</p>
      </div>
    </section>

    <section className="bg-secondary py-20">
      <div className="container">
        <div className="mb-11 max-w-3xl">
          <p className="eyebrow">Why district energy</p>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            Real assets, contracted cash flows, policy tailwind
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            District heating and cooling offers infrastructure characteristics investors want, but
            the pipeline is fragmented and hard to source. That is the problem we solve.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-lg border border-border bg-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/10">
                <Icon className="h-5 w-5 text-accent" />
              </span>
              <h3 className="mt-4 font-display font-semibold text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-card py-20">
      <div className="container">
        <div>
          <p className="eyebrow">Comparable, finally</p>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            Every project, the same standardized profile
          </h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            No two developers present a project the same way. We do. Each opportunity arrives in one
            structure: technical, financial, sustainability, structure and market, with the
            regulatory regime typed into one of six archetypes so you can compare a Danish
            non-profit network against a French concession at a glance.
          </p>
        </div>

      </div>
    </section>

    <section className="bg-card pb-20">
      <div className="container">
        <div className="overflow-hidden rounded-lg bg-foreground p-8 text-primary-foreground md:p-12">
          <div>
            <span className="inline-flex rounded-full bg-accent/15 px-3 py-1 font-display text-xs font-semibold text-accent">
              Headline tool
            </span>
            <h2 className="mt-4 font-display text-3xl font-semibold md:text-4xl">
              Build a diversified position with the bundle builder
            </h2>
            <p className="mt-4 leading-7 text-inverse-subtle">
              Select multiple projects and see your aggregate capacity, capital, and base-case IRR from disclosed developer-stated inputs. Locked listings retain published bands until the developer grants access.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
              {[
                "Developer-stated capacity, capital, and blended IRR (base case) for granted listings",
                "Diversification by country, regime, technology, and stage",
                "Compare listings against your own criteria",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <Check className="h-5 w-5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>

    <section className="bg-background py-20">
      <div className="container">
        <div className="mb-10 text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">From browse to close</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, text], index) => (
            <article key={title} className="rounded-lg border border-border bg-secondary p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-accent-foreground">
                {index + 1}
              </span>
              <h3 className="mt-4 font-display font-semibold text-2xl">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-card pb-20">
      <div className="container">
        <div className="flex gap-4 rounded-lg border border-border border-l-4 border-l-accent bg-secondary p-7">
          <Info className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
          <div>
            <h3 className="font-display text-2xl font-semibold">
              A neutral connector, not an adviser
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              DHC Market is transaction infrastructure. It does not underwrite, rate, or recommend
              any project, and it never holds your capital. All returns and risk figures are
              developer-stated or attributed to a named source, and your SFDR classification remains
              entirely your own to determine from the inputs each project provides.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-hero-gradient py-20 text-center text-primary-foreground">
      <div className="mx-auto max-w-3xl px-5">
        <h2 className="font-display text-3xl font-semibold md:text-4xl">
          Source district energy on your terms
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-inverse-subtle">
          Join free, browse anonymized, and build a diversified, de-risked DHC position across
          Europe.
        </p>
        <Button className="mt-7" size="lg" variant="hero" asChild>
          <Link to="/sign-up">
            Explore opportunities <ArrowRight />
          </Link>
        </Button>
      </div>
    </section>
  </PublicShell>
);

export default ForInvestors;
