import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Building2,
  Check,
  Info,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import PublicShell from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { FEE_SENTENCE } from "@/lib/fee";

const reasons = [
  { icon: Building2, title: "Tangible real assets", text: "Physical networks with long lives and high barriers to entry." },
  { icon: ShieldCheck, title: "Contracted demand", text: "Offtake under long-term agreements, often with a municipal anchor." },
  { icon: Activity, title: "Inflation linkage", text: "Tariffs frequently indexed, giving a degree of inflation protection." },
  { icon: Sparkles, title: "EU policy backing", text: "Aligned with EED, RED III, and the EU Taxonomy decarbonization push." },
];

const comparison = [
  ["Regulatory regime", "Concession (FR)"],
  ["Return profile", "Stable, contracted"],
  ["Offtake committed", "87% (71% contracted)"],
  ["Public co-financing", "ADEME grant, committed"],
  ["EED Art. 26 status", "Aligned, 2025 threshold"],
  ["Taxonomy", "Activity 4.15, aligned"],
];

const steps = [
  ["Browse anonymized", "Filter the pipeline by technology, geography, regime, size, and de-risking signals."],
  ["Express interest", "Send a short request and a signed confidentiality agreement. The developer decides. They can also decline, and nothing is revealed if they do. Most answer within 3 working days."],
  ["Diligence", "On acceptance, identity, counterparties and every data tab open. The data room is a separate approval by the same developer."],
  ["Connect and close", "Take it forward directly with the developer toward financial close."],
];

const ForInvestors = () => (
  <PublicShell>
    <section className="bg-hero-gradient py-20 text-primary-foreground md:py-24">
      <div className="mx-auto max-w-6xl px-5 lg:px-7">
        <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-display text-xs font-semibold uppercase text-accent">
          For investors
        </span>
        <h1 className="mt-5 max-w-[19ch] font-display text-4xl font-semibold leading-tight md:text-5xl">
          A standardized, pan-European pipeline of district energy.
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-primary-foreground/70">
          Discover, compare, and connect with district heating and cooling projects across Europe, each presented in the same structured format, with the regulatory regime typed and the de-risking laid out. Then build a diversified position.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" variant="hero" asChild>
            <Link to="/sign-up?role=investor">Explore opportunities <ArrowRight /></Link>
          </Button>
          <Button size="lg" variant="hero-outline" asChild>
            <Link to="/app/bundle-builder">See the bundle builder</Link>
          </Button>
        </div>
        <p className="mt-4 text-sm text-primary-foreground/50">
          Free to join. Browse anonymized; nothing is revealed until the developer accepts your request, and the data room is approved separately. Ticket sizes range from about EUR 1M minimum tickets up to whole-ticket infrastructure allocations, so smaller investors can find a fit while infrastructure investors remain the primary audience.
        </p>
        <p className="mt-2 text-sm text-primary-foreground/50">{FEE_SENTENCE}</p>
      </div>
    </section>

    <section className="bg-secondary py-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-7">
        <div className="mb-11 max-w-3xl">
          <p className="font-display text-xs font-semibold uppercase text-accent">Why district energy</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">Real assets, contracted cash flows, policy tailwind</h2>
          <p className="mt-4 leading-7 text-muted-foreground">District heating and cooling offers infrastructure characteristics investors want, but the pipeline is fragmented and hard to source. That is the problem we solve.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {reasons.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-lg border border-border bg-card p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/10"><Icon className="h-5 w-5 text-accent" /></span>
              <h3 className="mt-4 font-display font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-card py-20">
      <div className="mx-auto grid max-w-6xl gap-11 px-5 md:grid-cols-2 md:items-center lg:px-7">
        <div>
          <p className="font-display text-xs font-semibold uppercase text-accent">Comparable, finally</p>
          <h2 className="mt-3 font-display text-3xl font-semibold">Every project, the same five-tab profile</h2>
          <p className="mt-4 leading-7 text-muted-foreground">No two developers present a project the same way. We do. Each opportunity arrives in one structure: technical, financial, sustainability, structure and market, with the regulatory regime typed into one of six archetypes so you can compare a Danish non-profit network against a French concession at a glance.</p>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-background shadow-card">
          <div className="border-b border-border bg-secondary px-5 py-3 font-display text-xs font-semibold uppercase text-muted-foreground">Structure and market, standardized</div>
          {comparison.map(([key, value], index) => (
            <div key={key} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3.5 text-sm last:border-0">
              <span className="text-muted-foreground">{key}</span>
              <span className={index === 0 ? "rounded-md bg-accent/10 px-2 py-1 font-display text-xs font-semibold text-accent" : "font-display font-semibold"}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="bg-card pb-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-7">
        <div className="grid overflow-hidden rounded-lg bg-foreground p-8 text-primary-foreground md:grid-cols-2 md:items-center md:gap-12 md:p-12">
          <div>
            <span className="inline-flex rounded-full bg-accent/15 px-3 py-1 font-display text-xs font-semibold text-accent">Headline tool</span>
            <h2 className="mt-4 font-display text-3xl font-semibold">Build a diversified position with the bundle builder</h2>
            <p className="mt-4 leading-7 text-primary-foreground/65">Select multiple projects and see your aggregate capacity, capital, and blended target IRR update live, with a de-risking score that rewards spreading capital across geographies and regulatory regimes, not just adding correlated assets.</p>
            <ul className="mt-5 space-y-3 text-sm text-primary-foreground/80">
              {["Aggregate MW, capital, and blended IRR as you select", "Diversification by country, regime, technology, and stage", "Set a strategy by KPI and surface the best-fit projects"].map((item) => <li key={item} className="flex gap-3"><Check className="h-5 w-5 shrink-0 text-accent" />{item}</li>)}
            </ul>
          </div>
          <div className="mt-8 rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-6 md:mt-0">
            {[["Aggregate capacity", "86 MW"], ["Aggregate capital", "€124M"], ["Blended target IRR", "9.4%"]].map(([key, value]) => <div key={key} className="flex justify-between py-2.5 text-sm"><span className="text-primary-foreground/50">{key}</span><strong className="font-display">{value}</strong></div>)}
            <div className="mt-4 flex h-16 items-end gap-1.5" aria-label="Bundle diversification chart">
              {["h-4/5", "h-3/5", "h-2/5", "h-3/4", "h-1/3"].map((height, index) => <span key={index} className={`flex-1 rounded-t-sm bg-accent ${height}`} />)}
            </div>
            <div className="mt-4 flex items-baseline justify-between border-t border-primary-foreground/10 pt-4"><span className="text-xs text-primary-foreground/50">De-risking via spread</span><strong className="font-display text-2xl text-success">78 / 100</strong></div>
          </div>
        </div>
      </div>
    </section>

    <section className="bg-background py-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-7">
        <div className="mb-10 text-center"><p className="font-display text-xs font-semibold uppercase text-accent">How it works</p><h2 className="mt-3 font-display text-3xl font-semibold">From browse to close</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map(([title, text], index) => <article key={title} className="rounded-lg border border-border bg-secondary p-6"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-accent-foreground">{index + 1}</span><h3 className="mt-4 font-display font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}
        </div>
      </div>
    </section>

    <section className="bg-card pb-20">
      <div className="mx-auto max-w-6xl px-5 lg:px-7">
        <div className="flex gap-4 rounded-lg border border-border border-l-4 border-l-accent bg-secondary p-7">
          <Info className="mt-0.5 h-6 w-6 shrink-0 text-accent" />
          <div><h2 className="font-display text-lg font-semibold">A neutral connector, not an adviser</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">DHC Market is transaction infrastructure. It does not underwrite, rate, or recommend any project, and it never holds your capital. All returns and risk figures are developer-stated or attributed to a named source, and your SFDR classification remains entirely your own to determine from the inputs each project provides.</p></div>
        </div>
      </div>
    </section>

    <section className="bg-hero-gradient py-20 text-center text-primary-foreground">
      <div className="mx-auto max-w-3xl px-5">
        <h2 className="font-display text-3xl font-semibold md:text-4xl">Source district energy on your terms</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-primary-foreground/65">Join free, browse anonymized, and build a diversified, de-risked DHC position across Europe.</p>
        <Button className="mt-7" size="lg" variant="hero" asChild><Link to="/sign-up?role=investor">Explore opportunities <ArrowRight /></Link></Button>
      </div>
    </section>
  </PublicShell>
);

export default ForInvestors;