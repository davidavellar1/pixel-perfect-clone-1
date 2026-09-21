const tracks = [
  {
    title: "For developers",
    steps: [
      "List your project at no cost, in the standard format investors expect.",
      "Surface eligible public co-financing and connect with advisors to reach bankable standard.",
      "Receive qualified interest from investors and manage Q&A from one dashboard.",
      "Engage directly and progress toward financial close.",
    ],
  },
  {
    title: "For investors",
    steps: [
      "Browse anonymized opportunities and filter to your mandate.",
      "Open a standardized overview to assess fit before committing time.",
      "Express interest to unlock full project identity, detail, and the data room.",
      "Engage the developer directly; we facilitate, you decide.",
    ],
  },
];

const HowItWorksTracks = () => {
  return (
    <section className="bg-surface-2 py-20">
      <div className="container">
        <div className="mx-auto mb-10 max-w-[640px] text-center">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-3 font-display text-[34px] font-semibold tracking-[-0.02em] text-foreground">
            Two sides, one process
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {tracks.map((t) => (
            <div key={t.title} className="rounded-[14px] border border-border bg-card p-7">
              <h3 className="mb-4 font-display text-xl font-semibold text-foreground">{t.title}</h3>
              {t.steps.map((s, i) => (
                <div key={s} className="flex gap-3.5 py-2.5">
                  <div className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-navy-800 font-display text-[13px] font-semibold text-white">
                    {i + 1}
                  </div>
                  <p className="text-[14.5px] text-[#3a4961]">{s}</p>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksTracks;
