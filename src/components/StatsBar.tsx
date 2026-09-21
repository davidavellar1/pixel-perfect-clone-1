const stats = [
  { value: "€2.4B+", label: "Pipeline value" },
  { value: "120+", label: "Projects listed" },
  { value: "45+", label: "Active investors" },
];

const StatsBar = () => {
  return (
    <section className="border-b border-border bg-card">
      <div className="container grid grid-cols-1 gap-7 py-12 md:grid-cols-3">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={`text-center ${i < stats.length - 1 ? "border-b border-border pb-6 md:border-b-0 md:border-r md:pb-0" : ""}`}
          >
            <div className="font-display text-[46px] font-semibold tracking-[-0.02em] text-foreground">
              {stat.value}
            </div>
            <div className="mt-1.5 font-display text-sm font-medium text-muted-foreground">{stat.label}</div>
            <div className="mt-1 text-[11.5px] italic text-subtle-foreground">
              illustrative — not live data
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsBar;
