const figures = [
  { value: "~50%", label: "of EU energy use is heating & cooling" },
  { value: "~25%", label: "renewable share in H&C (2022)" },
  { value: "3 layers", label: "private · public · advisory" },
];

const ProblemSection = () => {
  return (
    <section className="border-b border-border bg-card py-[74px]">
      <div className="container grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
        <div>
          <span className="eyebrow">The financing gap</span>
          <h2 className="mt-2 font-display text-[32px] font-semibold tracking-[-0.02em] text-foreground">
            Capital is available. Comparable information is not.
          </h2>
        </div>
        <div>
          <p className="text-[19px] leading-relaxed text-[#33425a]">
            Heating and cooling is roughly <b className="font-semibold text-foreground">half of Europe's energy use</b>,
            yet DHC investment stays fragmented, locally idiosyncratic, and over-reliant on public budgets. Every
            project is evaluated from scratch, in a different format, under a different national regime.{" "}
            <b className="font-semibold text-foreground">DHC Market closes that gap</b> by presenting projects in one
            standard, comparable structure — and connecting them to the capital and expertise to deliver.
          </p>
          <div className="mt-8 flex flex-wrap gap-9">
            {figures.map((f) => (
              <div key={f.value}>
                <div className="font-display text-[34px] font-semibold text-primary">{f.value}</div>
                <div className="text-[13.5px] text-muted-foreground">{f.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
