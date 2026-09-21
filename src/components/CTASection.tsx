import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="bg-cta-gradient py-[90px] text-center text-white">
      <div className="container">
        <h2 className="mb-3.5 font-display text-[30px] font-semibold tracking-[-0.02em] md:text-[38px]">
          Raising capital, or deploying it?
        </h2>
        <p className="mx-auto mb-7 max-w-[560px] text-[17px] text-[#bcc8d8]">
          Start with a clearer view of the European DHC pipeline.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5">
          <Button variant="hero" size="lg" asChild>
            <a href="/sign-up">Explore projects →</a>
          </Button>
          <Button variant="hero-outline" size="lg" asChild>
            <a href="/developer-signup">List a project</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
