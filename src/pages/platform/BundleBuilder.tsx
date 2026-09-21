import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

type BundleProject = {
  id: number;
  name: string;
  tech: string;
  src: string;
  country: string;
  regime: string;
  stage: string;
  mw: number;
  capex: number;
  irr: number;
  contr: number;
  loi: number;
};

const PROJECTS: BundleProject[] = [
  { id: 1, name: "Lyon Waste Heat Recovery", tech: "Waste heat", src: "Waste heat", country: "France", regime: "Concession", stage: "Development", mw: 8, capex: 12, irr: 12.0, contr: 71, loi: 16 },
  { id: 2, name: "Copenhagen Geothermal Network", tech: "Geothermal", src: "Geothermal", country: "Denmark", regime: "Non-profit", stage: "Construction", mw: 32, capex: 45, irr: 8.5, contr: 84, loi: 7 },
  { id: 3, name: "Amsterdam Aquathermal Network", tech: "Heat pump", src: "Heat pump", country: "Netherlands", regime: "In transition", stage: "Development", mw: 16, capex: 38, irr: 10.2, contr: 30, loi: 14 },
  { id: 4, name: "Stockholm Biomass CHP", tech: "Biomass", src: "Biomass", country: "Sweden", regime: "Market-based", stage: "Construction", mw: 30, capex: 33, irr: 9.2, contr: 74, loi: 14 },
  { id: 5, name: "Helsinki Solar Thermal Grid", tech: "Solar thermal", src: "Solar thermal", country: "Finland", regime: "Market-based", stage: "Concept", mw: 28, capex: 55, irr: 9.8, contr: 0, loi: 22 },
  { id: 6, name: "Munich Heat Pump Integration", tech: "Heat pump", src: "Heat pump", country: "Germany", regime: "Ex-post", stage: "Development", mw: 22, capex: 30, irr: 11.0, contr: 55, loi: 18 },
  { id: 7, name: "Ruhr Industrial Waste Heat", tech: "Waste heat", src: "Waste heat", country: "Germany", regime: "Ex-post", stage: "Construction", mw: 14, capex: 22, irr: 7.8, contr: 88, loi: 4 },
  { id: 8, name: "Warsaw Geothermal Expansion", tech: "Geothermal", src: "Geothermal", country: "Poland", regime: "Ex-ante regulated", stage: "Construction", mw: 40, capex: 80, irr: 7.5, contr: 80, loi: 9 },
];

const PALETTE = ["#2f80ed", "#1d9e75", "#d6a23a", "#6b3fa0", "#3aa0a0", "#c2762e", "#4a72c4"];
const OFFTAKE_LEVELS = ["Any", "Letter of intent", "Contracted"] as const;
const STAGES = ["Concept", "Development", "Construction"];

const uniq = (key: keyof BundleProject) => [...new Set(PROJECTS.map((p) => String(p[key])))];

const Chip = ({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "tech" | "off" | "loi" }) => (
  <span
    className={cn(
      "rounded-md px-2 py-0.5 font-display text-[11px] font-medium",
      tone === "plain" && "bg-muted text-muted-foreground",
      tone === "tech" && "bg-accent/10 text-accent",
      tone === "off" && "bg-[#e6f5ec] text-[#1f9d63]",
      tone === "loi" && "bg-[#fdf3e2] text-[#b7791f]",
    )}
  >
    {children}
  </span>
);

const Option = ({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-md border px-3 py-1.5 font-display text-xs font-medium transition-colors",
      on ? "border-accent bg-accent/10 text-accent" : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40",
    )}
  >
    {children}
  </button>
);

const Donut = ({ data, total }: { data: [string, number][]; total: number }) => {
  const C = 2 * Math.PI * 30;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width="80" height="80" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="30" fill="none" stroke="hsl(var(--muted))" strokeWidth="14" />
        {data.map(([label, value], i) => {
          const len = (value / total) * C;
          const dash = `${len} ${C - len}`;
          const el = (
            <circle
              key={label}
              cx="40"
              cy="40"
              r="30"
              fill="none"
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth="14"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              transform="rotate(-90 40 40)"
            />
          );
          offset += len;
          return el;
        })}
      </svg>
      <div className="flex flex-1 flex-col gap-1.5">
        {data.map(([label, value], i) => (
          <div key={label} className="flex items-center gap-2 text-[11.5px]">
            <span className="h-2 w-2 flex-none rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="flex-1 truncate text-foreground/75">{label}</span>
            <span className="font-display font-semibold">{Math.round((value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Bars = ({ data }: { data: [string, number][] }) => {
  const max = Math.max(...data.map((d) => d[1]));
  return (
    <div>
      {data.map(([label, value], i) => (
        <div key={label} className="mb-1.5 flex items-center gap-2">
          <span className="w-[74px] flex-none truncate text-[11.5px] text-foreground/75">{label}</span>
          <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
            <div className="h-full rounded" style={{ width: `${(value / max) * 100}%`, background: PALETTE[i % PALETTE.length] }} />
          </div>
          <span className="w-7 text-right font-display text-[11px] font-semibold">{value}</span>
        </div>
      ))}
    </div>
  );
};

const AggCard = ({ label, value, unit }: { label: string; value: string; unit?: string }) => (
  <div className="rounded-xl bg-muted/60 px-3 py-3">
    <p className="font-display text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-lg font-semibold text-foreground">
      {value}
      {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
    </p>
  </div>
);

const BundleBuilder = () => {
  const [mode, setMode] = useState<"build" | "strategy">("build");
  const [selected, setSelected] = useState<number[]>([]);
  const [geo, setGeo] = useState<string[]>([]);
  const [tech, setTech] = useState<string[]>([]);
  const [stage, setStage] = useState<string[]>([]);
  const [source, setSource] = useState<string[]>([]);
  const [offtake, setOfftake] = useState<(typeof OFFTAKE_LEVELS)[number]>("Any");
  const [minIrr, setMinIrr] = useState(8);

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const matchScore = (p: BundleProject) => {
    let s = 0;
    let n = 0;
    if (geo.length) { n++; if (geo.includes(p.country)) s++; }
    if (tech.length) { n++; if (tech.includes(p.tech)) s++; }
    if (stage.length) { n++; if (stage.includes(p.stage)) s++; }
    if (source.length) { n++; if (source.includes(p.src)) s++; }
    n++; if (p.irr >= minIrr) s++;
    if (offtake !== "Any") {
      n++;
      const committed = p.contr + p.loi;
      if (offtake === "Contracted" ? p.contr >= 50 : committed >= 50) s++;
    }
    return n ? Math.round((s / n) * 100) : 100;
  };

  const list = useMemo(() => {
    const items = PROJECTS.map((p) => ({ ...p, fit: matchScore(p) }));
    return mode === "strategy" ? items.sort((a, b) => b.fit - a.fit) : items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, geo, tech, stage, source, offtake, minIrr]);

  const chosen = PROJECTS.filter((p) => selected.includes(p.id));
  const mw = chosen.reduce((a, p) => a + p.mw, 0);
  const cap = chosen.reduce((a, p) => a + p.capex, 0);
  const wIrr = cap ? chosen.reduce((a, p) => a + p.irr * p.capex, 0) / cap : 0;
  const wContr = cap ? chosen.reduce((a, p) => a + p.contr * p.capex, 0) / cap : 0;
  const wComm = cap ? chosen.reduce((a, p) => a + (p.contr + p.loi) * p.capex, 0) / cap : 0;

  const group = (key: keyof BundleProject, metric: "capex" | "mw") =>
    Object.entries(
      chosen.reduce<Record<string, number>>((acc, p) => {
        const k = String(p[key]);
        acc[k] = (acc[k] || 0) + p[metric];
        return acc;
      }, {}),
    ).sort((a, b) => b[1] - a[1]) as [string, number][];

  const spread = (key: keyof BundleProject) => {
    const g = group(key, "capex");
    const hhi = g.reduce((a, [, v]) => a + (v / cap) * (v / cap), 0);
    return 1 - hhi;
  };

  const dscore = cap ? Math.round((spread("country") * 0.4 + spread("regime") * 0.4 + spread("tech") * 0.2) * 100) : 0;
  const level = dscore >= 66 ? "Well spread" : dscore >= 40 ? "Moderate spread" : "Concentrated";
  const nCountry = new Set(chosen.map((p) => p.country)).size;
  const nRegime = new Set(chosen.map((p) => p.regime)).size;

  return (
    <div className="max-w-[1300px]">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Bundle builder</h1>
        <p className="mt-1 max-w-[78ch] text-sm leading-6 text-muted-foreground">
          Aggregate several opportunities into one diversified position, or set a strategy and let the tool surface the
          projects that fit. Figures are developer stated; the platform does not advise or underwrite.
        </p>
      </div>

      <div className="my-5 flex w-max gap-2 rounded-xl border border-border bg-card p-1.5">
        {(["build", "strategy"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={cn(
              "rounded-lg px-4 py-2 font-display text-sm font-semibold transition-colors",
              mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {m === "build" ? "Build a bundle" : "Strategy finder"}
          </button>
        ))}
      </div>

      {mode === "strategy" && (
        <div className="mb-5 rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-[15px] font-semibold">Define your strategy</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold">Geographies</p>
              <div className="flex flex-wrap gap-1.5">
                {uniq("country").map((v) => (
                  <Option key={v} on={geo.includes(v)} onClick={() => toggle(geo, setGeo, v)}>{v}</Option>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold">Technologies</p>
              <div className="flex flex-wrap gap-1.5">
                {uniq("tech").map((v) => (
                  <Option key={v} on={tech.includes(v)} onClick={() => toggle(tech, setTech, v)}>{v}</Option>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold">Project stage</p>
              <div className="flex flex-wrap gap-1.5">
                {STAGES.map((v) => (
                  <Option key={v} on={stage.includes(v)} onClick={() => toggle(stage, setStage, v)}>{v}</Option>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold">Energy source emphasis</p>
              <div className="flex flex-wrap gap-1.5">
                {uniq("src").map((v) => (
                  <Option key={v} on={source.includes(v)} onClick={() => toggle(source, setSource, v)}>{v}</Option>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold">
                Minimum target IRR <span className="font-normal text-muted-foreground">(developer stated)</span>
              </p>
              <div className="flex items-center gap-3">
                <Slider value={[minIrr]} min={0} max={15} step={0.5} onValueChange={(v) => setMinIrr(v[0])} className="flex-1" />
                <span className="w-14 text-right font-display text-sm font-semibold">{minIrr.toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold">Minimum offtake commitment</p>
              <div className="flex flex-wrap gap-1.5">
                {OFFTAKE_LEVELS.map((v) => (
                  <Option key={v} on={offtake === v} onClick={() => setOfftake(v)}>{v}</Option>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-[15px] font-semibold">
              {mode === "build" ? "Select projects to bundle" : "Projects ranked by strategy fit"}
            </h3>
            {mode === "strategy" && (
              <span className="text-xs text-muted-foreground">Set filters above; ranked best fit first</span>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {list.map((p) => {
              const sel = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelected(sel ? selected.filter((id) => id !== p.id) : [...selected, p.id])}
                  className={cn(
                    "grid grid-cols-[auto_1fr_auto] items-center gap-3.5 rounded-xl border bg-card px-4 py-3.5 text-left transition-colors",
                    sel ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border hover:border-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-[22px] w-[22px] flex-none items-center justify-center rounded-md border-2",
                      sel ? "border-accent bg-accent text-accent-foreground" : "border-border",
                    )}
                  >
                    {sel && (
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-display text-[14.5px] font-semibold">{p.name}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <Chip tone="tech">{p.tech}</Chip>
                      <Chip>{p.country}</Chip>
                      <Chip>{p.stage}</Chip>
                      <Chip>{p.regime}</Chip>
                      {p.contr > 0 && <Chip tone="off">{p.contr}% contracted</Chip>}
                      {p.loi > 0 && <Chip tone="loi">+{p.loi}% LOI</Chip>}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-[15px] font-semibold">{p.mw} MW</span>
                    <span className="block text-xs text-muted-foreground">&euro;{p.capex}M</span>
                    <span className="mt-0.5 block font-display text-xs font-semibold text-accent">{p.irr.toFixed(1)}%</span>
                    {mode === "strategy" && (
                      <>
                        <span className="mt-2 ml-auto block h-[5px] w-[120px] overflow-hidden rounded bg-muted">
                          <span className="block h-full bg-accent" style={{ width: `${p.fit}%` }} />
                        </span>
                        <span className="mt-1 block text-[11px] text-muted-foreground">{p.fit}% fit</span>
                      </>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6">
          <h3 className="font-display text-[15px] font-semibold">Bundle summary</h3>
          <p className="mb-4 mt-1 text-xs text-muted-foreground">
            {chosen.length ? `${chosen.length} project${chosen.length > 1 ? "s" : ""} selected` : "No projects selected"}
          </p>

          {!chosen.length ? (
            <p className="px-2 py-8 text-center text-[13px] leading-6 text-muted-foreground">
              Select projects on the left to see aggregate capacity, capital, blended IRR, and diversification.
            </p>
          ) : (
            <div>
              <div className="mb-4 grid grid-cols-2 gap-2.5">
                <AggCard label="Aggregate capacity" value={String(mw)} unit="MW" />
                <AggCard label="Aggregate capital" value={`\u20ac${cap}`} unit="M" />
                <AggCard label="Blended target IRR" value={`${wIrr.toFixed(1)}%`} />
                <AggCard label="Offtake committed" value={`${Math.round(wComm)}%`} />
              </div>

              <div className="mb-4 rounded-xl bg-[linear-gradient(120deg,#0f2740,#0b1b2e)] px-4 py-4 text-white">
                <div className="flex items-baseline justify-between">
                  <span className="font-display text-[11px] font-semibold uppercase tracking-wider text-[#9fb2c9]">
                    De-risking via spread
                  </span>
                  <span className="text-xs text-[#aebbcd]">{level}</span>
                </div>
                <div className="my-2 h-[7px] overflow-hidden rounded bg-white/15">
                  <div className="h-full rounded bg-[linear-gradient(90deg,#3ea0ff,#1f9d63)]" style={{ width: `${dscore}%` }} />
                </div>
                <p className="font-display text-2xl font-bold">
                  {dscore}
                  <span className="text-[13px] font-normal text-[#aebbcd]"> / 100</span>
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[#aebbcd]">
                  Across {nCountry} {nCountry > 1 ? "countries" : "country"} and {nRegime} regulatory{" "}
                  {nRegime > 1 ? "regimes" : "regime"}. Spreading across regimes and geographies reduces policy and
                  demand correlation; {Math.round(wContr)}% of demand is contracted, {Math.round(wComm - wContr)}% under
                  letter of intent.
                </p>
              </div>

              <div className="mb-4">
                <p className="mb-2 font-display text-xs font-semibold text-muted-foreground">Capital by country</p>
                <Donut data={group("country", "capex")} total={cap} />
              </div>
              <div className="mb-4">
                <p className="mb-2 font-display text-xs font-semibold text-muted-foreground">Capital by regulatory regime</p>
                <Donut data={group("regime", "capex")} total={cap} />
              </div>
              <div className="mb-4">
                <p className="mb-2 font-display text-xs font-semibold text-muted-foreground">Capacity by technology (MW)</p>
                <Bars data={group("tech", "mw")} />
              </div>
              <div className="mb-4">
                <p className="mb-2 font-display text-xs font-semibold text-muted-foreground">Capacity by stage (MW)</p>
                <Bars data={group("stage", "mw")} />
              </div>

              <div className="flex gap-2.5">
                <Button variant="outline" className="flex-1" onClick={() => setSelected([])}>
                  Clear
                </Button>
                <Button
                  className="flex-1"
                  onClick={() =>
                    toast.success("Bundle saved", {
                      description: "An introduction request is sent for each developer approved project.",
                    })
                  }
                >
                  Save bundle
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BundleBuilder;
