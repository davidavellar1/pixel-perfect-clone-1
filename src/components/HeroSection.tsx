import { Button } from "@/components/ui/button";
import { TrendingUp, ArrowRight, Building2 } from "lucide-react";

const HeroSection = () => {
  return (
    <section
      className="relative min-h-[55vh] flex items-center pt-16 overflow-hidden"
      style={{ background: "var(--hero-gradient)" }}
    >
      <div className="container mx-auto px-4 py-14">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-primary-foreground leading-tight mb-6">
            Invest in the{" "}
            <span className="text-accent">Future</span> of District Heating and Cooling
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 mb-10 max-w-2xl leading-relaxed">
            The premier marketplace connecting district heating & cooling developers with global infrastructure capital.
          </p>
          <div className="flex flex-wrap gap-4">
            <a href="/investors">
              <Button variant="hero" size="lg">
                <TrendingUp className="w-4 h-4 mr-2" />
                I'm an Investor
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </a>
            <a href="/developer-signup">
              <Button variant="hero-outline" size="lg">
                <Building2 className="w-4 h-4 mr-2" />
                I'm a Developer
              </Button>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default HeroSection;
