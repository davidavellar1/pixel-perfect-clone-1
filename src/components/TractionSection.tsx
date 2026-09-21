import { Button } from "@/components/ui/button";

const TractionSection = () => {
  return (
    <section className="border-y border-border bg-card py-16 text-center">
      <div className="container">
        <span className="eyebrow">Early access</span>
        <h3 className="mx-auto mb-3 mt-3 max-w-[680px] font-display text-[25px] font-semibold tracking-[-0.02em] text-foreground">
          We're onboarding our first cohort of projects and investors now.
        </h3>
        <p className="mx-auto mb-6 max-w-[560px] text-base text-muted-foreground">
          DHC Market is built on European energy data and the regulatory frameworks that govern district-energy
          finance. If you're developing or financing DHC, you can help shape the standard.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="hero" size="lg" asChild>
            <a href="/developer-signup">Join as a developer</a>
          </Button>
          <Button variant="dark" size="lg" asChild>
            <a href="/investor-signup">Join as an investor</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TractionSection;
