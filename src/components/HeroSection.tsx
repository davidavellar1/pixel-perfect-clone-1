import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-hero-gradient pt-[168px] pb-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid-overlay [background-size:46px_46px]"
        style={{
          maskImage: "radial-gradient(800px 400px at 70% 20%, #000, transparent 75%)",
          WebkitMaskImage: "radial-gradient(800px 400px at 70% 20%, #000, transparent 75%)",
        }}
      />
      <div className="container relative">
        <div className="max-w-[760px]">
          <h1 className="font-display text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] text-white md:text-[60px]">
            Where district heating
            <br />
            and cooling meets <span className="text-accent">capital.</span>
          </h1>
          <p className="mt-6 max-w-[600px] text-lg text-[#bcc8d8] md:text-xl">
            A pan-European marketplace connecting DHC project developers with private investors,
            public co-financing, and the advisors who structure bankable deals.
          </p>
          <div className="mt-9 flex flex-wrap gap-3.5">
            <Button variant="hero" size="lg" asChild>
              <a href="/sign-up">Explore projects →</a>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <a href="/developer-signup">List a project</a>
            </Button>
          </div>
          <p className="mt-6 text-sm text-[#8b9bb0]">
            The project marketplace is open to verified members. Creating an account takes a minute.
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
