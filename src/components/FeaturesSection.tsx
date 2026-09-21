const features = [
  {
    icon: "🛡️",
    title: "De-Risked Assets",
    description: "Access projects with verified technical feasibility and confirmed public grant awards.",
  },
  {
    icon: "🌍",
    title: "European Deal Flow",
    description: "A pan-European pipeline of Greenfield, Brownfield, and Modernization projects.",
  },
  {
    icon: "📈",
    title: "Portfolio Building",
    description: "Construct a diversified portfolio of DHC assets with blended yield targets.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="bg-background py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-14">
          Why DHC Marketplace?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-card rounded-xl p-8 transition-shadow duration-300"
              style={{ boxShadow: "var(--card-shadow)" }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--card-shadow-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--card-shadow)")}
            >
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-serif font-bold text-foreground mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
