import { Button } from "@/components/ui/button";
import { Landmark, Scale, Wrench } from "lucide-react";

const services = [
  {
    icon: <Landmark className="w-8 h-8 text-muted-foreground" />,
    title: "Financial Advisory",
    description: "Investment structuring, financial modelling, and bankability assessments.",
  },
  {
    icon: <Scale className="w-8 h-8 text-muted-foreground" />,
    title: "Legal Services",
    description: "Concession agreements, PPAs, regulatory compliance, and cross-border frameworks.",
  },
  {
    icon: <Wrench className="w-8 h-8 text-muted-foreground" />,
    title: "Technical Consultancy",
    description: "Feasibility studies, system design, technology selection, and engineering reviews.",
  },
];

const fundingSources = [
  { name: "European Investment Bank", type: "Senior Debt & Guarantees" },
  { name: "European Commission - LIFE", type: "Grants & Technical Assistance" },
  { name: "EBRD Green Cities", type: "Blended Finance" },
  { name: "National Recovery Funds", type: "Co-Investment Capital" },
];

const EcosystemSection = () => {
  return (
    <section id="ecosystem" className="bg-secondary/50 py-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase text-center mb-4">
          Ecosystem
        </p>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-4">
          Beyond Matching - A Full Ecosystem
        </h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14">
          Access curated service providers and public funding programs to support and de-risk investments.
        </p>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {services.map((s) => (
            <div
              key={s.title}
              className="bg-card rounded-xl p-8"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="mb-4">{s.icon}</div>
              <h3 className="text-lg font-serif font-bold text-foreground mb-2">{s.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>

        {/* Public Funding Card */}
        <div
          className="bg-card rounded-xl p-8 max-w-3xl mx-auto"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Landmark className="w-6 h-6 text-muted-foreground" />
            <h3 className="text-lg font-serif font-bold text-foreground">
              Public Funding & Blended Finance
            </h3>
          </div>
          <p className="text-muted-foreground text-sm mb-6">
            Partner with public institutions to access grants, guarantees, and co-investment capital.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {fundingSources.map((f) => (
              <div key={f.name} className="flex items-start gap-3 bg-secondary/50 rounded-lg p-4">
                <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{f.type}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="font-semibold">
            Explore Ecosystem <span className="ml-2">→</span>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EcosystemSection;
