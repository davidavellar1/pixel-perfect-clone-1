const frameworks = [
  { name: "EU Taxonomy", note: "Climate mitigation" },
  { name: "Energy Efficiency Directive", note: "Efficient DHC (Arts. 24–26)" },
  { name: "Renewable Energy Directive III", note: "DHC targets" },
  { name: "SFDR", note: "Article 8 / 9 classification" },
  { name: "DNSH", note: "Do No Significant Harm" },
];

const PartnersSection = () => {
  return (
    <section className="bg-background py-[70px]">
      <div className="container">
        <h2 className="mb-2 text-center font-display text-[27px] font-semibold tracking-[-0.02em] text-foreground">
          Aligned with the frameworks that govern DHC finance
        </h2>
        <p className="mb-8 text-center text-[15.5px] text-muted-foreground">
          Project data is structured around the European standards investors are required to assess against.
        </p>
        <div className="flex flex-wrap justify-center gap-3.5">
          {frameworks.map((f) => (
            <div
              key={f.name}
              className="flex min-w-[150px] flex-col gap-0.5 rounded-[10px] border border-border bg-card px-5 py-3.5"
            >
              <span className="font-display text-[14.5px] font-medium text-[#2b3a52]">{f.name}</span>
              <span className="text-xs text-subtle-foreground">{f.note}</span>
            </div>
          ))}
        </div>
        <p className="mx-auto mt-6 max-w-[640px] text-center text-[12.5px] text-subtle-foreground">
          DHC Market structures projects around these frameworks. Compliance for any individual project is assessed
          and stated by the developer or named third-party assessors — not by DHC Market.
        </p>
      </div>
    </section>
  );
};

export default PartnersSection;
