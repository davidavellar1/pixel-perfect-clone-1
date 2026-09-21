import { ArrowLeftRight, Landmark, Sparkles } from "lucide-react";

const pillars = [
  {
    icon: ArrowLeftRight,
    title: "Connect",
    body: "Standardized, comparable projects matched to private capital across the EU — with controlled, step-by-step disclosure.",
    tag: "Core marketplace",
  },
  {
    icon: Landmark,
    title: "De-risk with public capital",
    body: "Route projects to EIB, EU programmes, and national development funds (EIFO, IFU) so public co-financing lowers risk and draws in private investment.",
    tag: "Free",
  },
  {
    icon: Sparkles,
    title: "Structure with experts",
    body: "Access vetted financial, legal, and technical advisors to bring projects to bankable standard — including aggregation into investable portfolios.",
    tag: "Ecosystem",
  },
];

const FeaturesSection = () => {
  return (
    <section className="bg-background py-20">
      <div className="container">
        <div className="mx-auto mb-12 max-w-[640px] text-center">
          <span className="eyebrow">What the platform does</span>
          <h2 className="mt-3 mb-2.5 font-display text-[34px] font-semibold tracking-[-0.02em] text-foreground">
            One marketplace, three connections
          </h2>
          <p className="text-[16.5px] text-muted-foreground">
            We don't invest, underwrite, or advise. We standardize information and make the right introductions.
          </p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {pillars.map((p) => (
            <div
              key={p.title}
              className="rounded-[14px] border border-border bg-card p-7 transition-all duration-200 hover:-translate-y-[3px] hover:shadow-card-hover"
            >
              <div className="mb-4 flex h-[46px] w-[46px] items-center justify-center rounded-[11px] bg-primary/10">
                <p.icon className="h-[23px] w-[23px] text-primary" strokeWidth={1.7} />
              </div>
              <h3 className="mb-2 font-display text-xl font-semibold text-foreground">{p.title}</h3>
              <p className="text-[15px] text-muted-foreground">{p.body}</p>
              <span className="mt-3.5 inline-block rounded-full bg-primary/10 px-2.5 py-1 font-display text-xs font-semibold text-primary">
                {p.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
