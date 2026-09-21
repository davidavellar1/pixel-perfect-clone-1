import { Link } from "@/lib/router-compat";
import { ArrowRight, Building2, Check, Landmark, LockKeyhole, Network, Scale, Search, ShieldCheck, Users } from "lucide-react";
import PublicShell from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { FEE_SENTENCE } from "@/lib/fee";

type Audience = "developer" | "investor";

const copy = {
  developer: {
    eyebrow: "For project developers",
    title: "Reach private capital across Europe, on your terms.",
    lead: "DHC Market puts your district heating or cooling project in front of pension funds, infrastructure funds, and other private investors actively looking for it, through one standardized, anonymized listing. A smooth path from listing to close, free for developers.",
    primary: "Start a listing",
    note: "Always free for developers. The 1% success fee is paid by the investor, only if a deal closes.",
    coreTitle: "Direct access to investors, without the cold outreach",
    coreText: "Raising for a DHC project usually means chasing introductions one fund at a time. Here, your standardized profile reaches a vetted pool of private investors whose mandate fits your technology, geography, and size, and you stay anonymous until you decide to engage.",
    bullets: ["Reach pension funds, infrastructure funds, and co-investors in one place", "A guided submission turns your project into a profile investors can compare", "Anonymous until an investor executes the confidentiality agreement; you approve data room access only"],
    valueLabel: "Why developers list here",
    valueTitle: "One standardized listing, the right audience",
    valueLead: "Present your project in the format institutional investors expect, and reach them across Europe, without giving up control of your identity or your data.",
    values: [
      ["A bankable profile", "A guided, stage-aware submission turns your project into a standardized profile investors can compare, with capital stack, regime, offtake, and emissions laid out clearly."],
      ["Anonymous until you choose", "Your project appears anonymized. Identity, location, and counterparties reveal only when an investor expresses genuine interest."],
      ["Ecosystem and public funding", "Tap advisory partners and check eligibility for public co-financing that can de-risk your raise. Supporting tools, not the price of entry."],
    ],
    steps: [["Submit", "The stage-first wizard asks only for what your project's stage supports."], ["Get matched", "Reach investors whose mandate fits your technology, geography, and size."], ["Manage interest", "Track interest, answer questions, and grant data-room access on your terms."], ["Close", "Take it to financial close. The success fee is the investor's, never yours."]],
    controlTitle: "Your project, your terms",
    controlText: "The platform is a neutral connector, not a fund or an adviser. It makes the right introductions while you control what is revealed and when.",
    controls: [["Gated reveal", "Anonymous at first. Identity reveals once an investor executes the confidentiality agreement, and the confidential data room opens only on your approval."], ["Protected introductions", "Every introduction is logged and attributed, so your connections cannot be circumvented."], ["Developer-stated figures", "Returns and figures remain clearly attributed to the project developer. The platform never rates them."]],
    fee: "Free",
    feeTitle: "Free for developers, end to end.",
    feeText: "No charge to list, receive investor interest, use the ecosystem, or check public funding.",
    finalTitle: "Put your project in front of the right capital",
    finalText: "Join as a developer, list free, and reach the private capital looking for district energy opportunities.",
    finalCta: "Join as a developer",
  },
  investor: {
    eyebrow: "For private investors",
    title: "Find comparable DHC opportunities across Europe.",
    lead: "DHC Market gives infrastructure funds, pension funds, family offices, and strategic investors one structured view of district heating and cooling projects, from first screen to direct developer engagement.",
    primary: "Join as an investor",
    note: "Browse anonymized opportunities free. A 1% success fee applies only to realized transactions introduced through DHC Market.",
    coreTitle: "A relevant pipeline, without starting every search from zero",
    coreText: "DHC opportunities are fragmented across local markets and presented in inconsistent formats. DHC Market brings them into one comparable pipeline so your team can screen mandate fit quickly and focus diligence where it matters.",
    bullets: ["Filter by geography, technology, stage, capacity, and ticket size", "Compare every opportunity through the same technical and commercial structure", "Engage the developer directly after expressing interest"],
    valueLabel: "Why investors use DHC Market",
    valueTitle: "Comparable opportunities, controlled access",
    valueLead: "Build a clearer view of the European DHC pipeline while keeping decisions, diligence, and negotiations in your own hands.",
    values: [
      ["Standardized screening", "Review consistent technical, financial, regulatory, and sustainability fields before committing diligence time."],
      ["Progressive disclosure", "Browse anonymized listings, express interest to unlock identity, and request confidential documents when ready."],
      ["Portfolio perspective", "Compare individual projects, assemble potential bundles, and assess diversification across technologies and markets."],
    ],
    steps: [["Set your mandate", "Tell us the regions, technologies, stages, and ticket sizes that fit your strategy."], ["Screen projects", "Review standardized overviews and compare relevant opportunities side by side."], ["Express interest", "Unlock full detail, ask questions, and request access to the confidential data room."], ["Close", "Negotiate directly with the developer and confirm the realized transaction when it closes."]],
    controlTitle: "Your mandate, your decision",
    controlText: "DHC Market structures information and introductions. It does not underwrite projects, provide investment advice, or make investment decisions.",
    controls: [["Mandate-led discovery", "Search and matching focus attention on opportunities aligned with your stated strategy."], ["Direct engagement", "Once interest is expressed, engage the project developer without an opaque intermediary layer."], ["Clear attribution", "Forecasts and returns remain developer-stated, with named evidence and assessors where available."]],
    fee: "1%",
    feeTitle: "Success-based, not subscription-based.",
    feeText: "The investor pays 1% of realized transaction value only after both parties confirm a close introduced by DHC Market.",
    finalTitle: "Build your European DHC pipeline",
    finalText: "Join as an investor and start screening standardized district heating and cooling opportunities.",
    finalCta: "Join as an investor",
  },
} as const;

const AudiencePage = ({ audience }: { audience: Audience }) => {
  const c = copy[audience];
  const signUp = `/sign-up?role=${audience}`;
  const signalRows = audience === "developer"
    ? [["Infrastructure fund", "25-50 MW mandate", "Interested"], ["Pension fund", "Contracted-demand focus", "Reviewing"], ["Public co-investor", "Nordic blended finance", "Interested"], ["Your listing", "Anonymized until you reveal", "3 interested"]]
    : [["Waste heat network", "France, 5-10 MW", "Strong fit"], ["Geothermal expansion", "Denmark, 25-50 MW", "Review"], ["Heat pump network", "Netherlands, 10-25 MW", "New"], ["Your mandate", "Europe, infrastructure", "12 matches"]];

  return (
    <PublicShell>
      <section className="bg-hero-gradient py-20 text-primary-foreground md:py-24">
        <div className="mx-auto max-w-6xl px-5 lg:px-7">
          <span className="mb-5 inline-flex rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 font-display text-xs font-semibold uppercase text-accent">{c.eyebrow}</span>
          <h1 className="max-w-[17ch] font-display text-4xl font-semibold leading-tight md:text-5xl">{c.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-primary-foreground/70">{c.lead}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" variant="hero" asChild><Link to={signUp}>{c.primary}<ArrowRight /></Link></Button>
            <Button size="lg" variant="hero-outline" asChild><Link to="/how-it-works">See how it works</Link></Button>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/50">{c.note}</p>
        </div>
      </section>

      <section className="bg-card py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-7">
          <div className="grid overflow-hidden rounded-lg bg-foreground text-primary-foreground md:grid-cols-[1.08fr_1fr]">
            <div className="p-8 md:p-12">
              <span className="inline-flex rounded-full bg-accent/15 px-3 py-1 font-display text-xs font-semibold text-accent">The core value</span>
              <h2 className="mt-4 font-display text-3xl font-semibold">{c.coreTitle}</h2>
              <p className="mt-4 leading-7 text-primary-foreground/65">{c.coreText}</p>
              <ul className="mt-6 space-y-3">
                {c.bullets.map((bullet) => <li key={bullet} className="flex gap-3 text-sm text-primary-foreground/80"><Check className="mt-0.5 h-5 w-5 shrink-0 text-success" />{bullet}</li>)}
              </ul>
            </div>
            <div className="m-6 self-center rounded-lg border border-primary-foreground/10 bg-primary-foreground/5 p-5 md:m-10">
              {signalRows.map(([name, detail, status]) => <div key={name} className="flex items-center gap-3 border-b border-primary-foreground/10 py-3 last:border-0"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent/15"><Users className="h-4 w-4 text-accent" /></div><div><p className="font-display text-sm font-semibold">{name}</p><p className="text-xs text-primary-foreground/45">{detail}</p></div><span className="ml-auto text-xs font-semibold text-success">{status}</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card pb-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-7">
          <div className="mb-10 max-w-3xl"><p className="font-display text-xs font-semibold uppercase text-accent">{c.valueLabel}</p><h2 className="mt-3 font-display text-3xl font-semibold">{c.valueTitle}</h2><p className="mt-3 text-muted-foreground">{c.valueLead}</p></div>
          <div className="grid gap-5 md:grid-cols-3">
            {c.values.map(([title, text], index) => { const Icon = [Building2, LockKeyhole, Landmark][index]; return <article key={title} className="rounded-lg border border-border bg-background p-7"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-md bg-accent/10"><Icon className="text-accent" /></div><h3 className="font-display text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>; })}
          </div>
        </div>
      </section>

      <section className="bg-secondary py-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-7">
          <div className="mb-10 text-center"><p className="font-display text-xs font-semibold uppercase text-accent">How it works</p><h2 className="mt-3 font-display text-3xl font-semibold">From first screen to close</h2></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{c.steps.map(([title, text], index) => <article key={title} className="rounded-lg border border-border bg-card p-6"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent font-display text-sm font-bold text-accent-foreground">{index + 1}</span><h3 className="mt-4 font-display font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></article>)}</div>
        </div>
      </section>

      <section className="bg-card py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2 md:items-center lg:px-7">
          <div><p className="font-display text-xs font-semibold uppercase text-accent">You stay in control</p><h2 className="mt-3 font-display text-3xl font-semibold">{c.controlTitle}</h2><p className="mt-4 leading-7 text-muted-foreground">{c.controlText}</p></div>
          <div className="space-y-3">{c.controls.map(([title, text], index) => { const Icon = [LockKeyhole, ShieldCheck, Scale][index]; return <div key={title} className="flex gap-4 rounded-lg border border-border bg-background p-5"><Icon className="mt-0.5 shrink-0 text-accent" /><div><h3 className="font-display text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div></div>; })}</div>
        </div>
      </section>

      <section className="bg-card pb-20">
        <div className="mx-auto max-w-6xl px-5 lg:px-7"><div className="flex flex-wrap items-center gap-7 rounded-lg bg-foreground p-8 text-primary-foreground md:px-11"><strong className="font-display text-4xl text-accent">{c.fee}</strong><div className="min-w-[220px] flex-1"><h2 className="font-display text-xl font-semibold">{c.feeTitle}</h2><p className="mt-1 text-sm text-primary-foreground/60">{c.feeText}</p><p className="mt-2 text-xs text-primary-foreground/50">{FEE_SENTENCE}</p></div><Button variant="hero" asChild><Link to={signUp}>{c.primary}</Link></Button></div></div>
      </section>

      <section className="bg-hero-gradient py-20 text-center text-primary-foreground">
        <div className="mx-auto max-w-3xl px-5"><h2 className="font-display text-3xl font-semibold md:text-4xl">{c.finalTitle}</h2><p className="mx-auto mt-4 max-w-2xl text-primary-foreground/65">{c.finalText}</p><Button className="mt-7" size="lg" variant="hero" asChild><Link to={signUp}>{c.finalCta}<ArrowRight /></Link></Button></div>
      </section>
    </PublicShell>
  );
};

export default AudiencePage;