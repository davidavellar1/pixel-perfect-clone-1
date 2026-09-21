const StatsBar = () => {
  const stats = [
    { value: "€2.4B+", label: "Pipeline Value" },
    { value: "120+", label: "Projects Listed" },
    { value: "45+", label: "Active Investors" },
  ];

  return (
    <section className="bg-card border-b">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl md:text-4xl font-bold text-foreground font-serif">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
