import { Button } from "@/components/ui/button";
import { TrendingUp, FileText } from "lucide-react";

const CTASection = () => {
  return (
    <section id="cta" className="py-20" style={{ background: "var(--hero-gradient)" }}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground text-center mb-14">
          Start Your Journey
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* For Investors */}
          <div className="bg-card rounded-xl p-8" style={{ boxShadow: "var(--card-shadow)" }}>
            <TrendingUp className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-xl font-serif font-bold text-foreground mb-3">For Investors</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Discover vetted DHC projects, build diversified portfolios, and leverage due diligence services.
            </p>
            <ul className="space-y-3 text-foreground text-sm mb-8">
              <li className="flex items-start gap-2"><span className="text-muted-foreground mt-1">•</span>Browse projects by lifecycle, technology & geography</li>
              <li className="flex items-start gap-2"><span className="text-muted-foreground mt-1">•</span>Invest in single projects or curated portfolios</li>
              <li className="flex items-start gap-2"><span className="text-muted-foreground mt-1">•</span>Build custom portfolios from available projects</li>
              <li className="flex items-start gap-2"><span className="text-muted-foreground mt-1">•</span>Access co-investment with public funds</li>
            </ul>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
              Explore Investments <span className="ml-2">→</span>
            </Button>
          </div>

          {/* For Developers */}
          <div className="bg-card rounded-xl p-8" style={{ boxShadow: "var(--card-shadow)" }}>
            <FileText className="w-8 h-8 text-foreground mb-4" />
            <h3 className="text-xl font-serif font-bold text-foreground mb-3">For Developers</h3>
            <p className="text-muted-foreground leading-relaxed mb-6">
              List your DHC projects, connect with investors and service providers, and access public funding.
            </p>
            <ul className="space-y-3 text-foreground text-sm mb-8">
              <li className="flex items-start gap-2"><span className="text-muted-foreground mt-1">•</span>List and manage your project portfolio</li>
              <li className="flex items-start gap-2"><span className="text-muted-foreground mt-1">•</span>Match with qualified investors automatically</li>
              <li className="flex items-start gap-2"><span className="text-muted-foreground mt-1">•</span>Access legal, financial & technical advisory</li>
              <li className="flex items-start gap-2"><span className="text-muted-foreground mt-1">•</span>Apply for grants and blended finance</li>
            </ul>
            <a href="/developer-signup">
              <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background font-semibold">
                List Your Projects <span className="ml-2">→</span>
              </Button>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
