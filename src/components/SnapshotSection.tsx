import { Check } from "lucide-react";

const bullets = [
  "Technical: heat source, network efficiency, contracted connections",
  "Financial: capital stack, revenue model, regulatory revenue caps",
  "Regulatory: national tariff regime, concession framework, EU comparison",
  "Sustainability: Taxonomy, EED, RED III, DNSH — verified by named bodies",
];

const rows: { k: string; v: string; note?: string; green?: boolean }[] = [
  { k: "Technology", v: "Waste-heat recovery" },
  { k: "Location", v: "France · Auvergne-Rhône-Alpes" },
  { k: "Capacity", v: "5–10 MW" },
  { k: "Contracted connections", v: "87%" },
  { k: "Heat-source type", v: "Industrial waste heat" },
  { k: "Target equity IRR", note: "· developer-stated", v: "12.0%" },
  { k: "Public co-financing", v: "Committed", green: true },
];

const SnapshotSection = () => {
  return (
    <section className="relative overflow-hidden bg-navy-900 py-[84px] text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-32 h-[420px] w-[420px]"
        style={{ background: "radial-gradient(circle, rgb(47 128 237 / 0.18), transparent 65%)" }}
      />
      <div className="container relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div>
          <span className="eyebrow text-accent">Why comparable matters</span>
          <h2 className="mt-3 mb-3.5 font-display text-[32px] font-semibold tracking-[-0.02em]">
            Every project follows the same structure.
          </h2>
          <p className="mb-4 text-[16.5px] text-[#aebbcd]">
            So you spend your time evaluating opportunities — not deciphering them. Each listing presents the same
            standardized technical, financial, regulatory, and sustainability fields, with European benchmarks for
            context.
          </p>
          <ul className="grid gap-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-[15px] text-[#cdd7e4]">
                <Check className="mt-0.5 h-[18px] w-[18px] flex-none text-accent" strokeWidth={2} />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[14px] border border-white/10 bg-gradient-to-b from-navy-700 to-[#0c2036] p-2 shadow-[0_30px_60px_-30px_rgb(0_0_0/0.6)]">
          <div className="flex gap-1 border-b border-white/10 px-2.5 py-2 text-[12.5px] text-[#8fa0b6]">
            <span className="rounded-md bg-primary/20 px-2.5 py-1 text-white">Overview</span>
            <span className="rounded-md px-2.5 py-1">Technical</span>
            <span className="rounded-md px-2.5 py-1">Financial</span>
            <span className="rounded-md px-2.5 py-1">Regulatory</span>
          </div>
          <div className="p-3.5">
            {rows.map((r, i) => (
              <div
                key={r.k}
                className={`flex justify-between gap-4 px-1 py-2.5 text-[13.5px] ${i < rows.length - 1 ? "border-b border-white/5" : ""}`}
              >
                <span className="text-[#90a0b6]">
                  {r.k}
                  {r.note ? <span className="text-[#7d8da3]"> {r.note}</span> : null}
                </span>
                <span
                  className={`font-display font-semibold ${r.green ? "text-success-strong" : "text-[#eaf0f7]"}`}
                >
                  {r.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SnapshotSection;
