const partners = [
  { initial: "E", name: "European Commission", type: "Policy" },
  { initial: "E", name: "Euroheat & Power", type: "Industry" },
  { initial: "I", name: "IRENA", type: "Knowledge" },
  { initial: "D", name: "District Energy (UNEP)", type: "Institutional" },
  { initial: "C", name: "Climate-KIC", type: "Innovation" },
  { initial: "E", name: "EU Energy Efficiency Fund", type: "Financial" },
];

const PartnersSection = () => {
  return (
    <section className="bg-secondary/50 py-20">
      <div className="container mx-auto px-4">
        <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase text-center mb-4">
          Institutional Partners
        </p>
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-4">
          Backed by Leading Institutions
        </h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14">
          Supported and recommended by key organizations in the European energy transition.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6">
          {partners.map((p) => (
            <div
              key={p.name}
              className="bg-card rounded-xl p-6 text-center"
              style={{ boxShadow: "var(--card-shadow)" }}
            >
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
                <span className="text-sm font-bold text-foreground">{p.initial}</span>
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.type}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
