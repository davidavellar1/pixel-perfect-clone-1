import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { isGranted } from "@/lib/access";
import { money, capacityBandRange, capexBandRange, type Band } from "@/lib/bands";
import { useProjectListings, type ProjectListing } from "@/hooks/useProjectListings";
import { useBundles } from "@/hooks/useBundles";

const PALETTE = ["#2f80ed", "#1d9e75", "#d6a23a", "#6b3fa0", "#3aa0a0", "#c2762e", "#4a72c4"];
const OFFTAKE_LEVELS = ["Any", "Signed connection", "Contracted"] as const;


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

type Row = {
  id: string;
  granted: boolean;
  name: string;
  tech: string;
  country: string;
  stage: string;
  regime: string;
  mw: number;
  mwBand: Band;
  capex: number | null;
  capexBand: Band | null;
  weight: number;
  irr: number | null;
  contr: number;
  signed: number;
  completeness: number;
  financialAsOf: string | null;
  fit: number;
};

const mid = (b: Band) => (b.max == null ? b.min * 1.2 : (b.min + b.max) / 2);
const fmtM = (v: number) => Math.round(v / 1_000_000);
const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const toRow = (p: ProjectListing): Row => {
  const granted = isGranted(p.accessState);
  const mwBand = capacityBandRange(p.capacityMw || 0);
  const cBand = capexBandRange(p.capex);
  const completeness = [p.capacityMw, p.capex, p.targetIrr, p.equitySought, p.minTicket, p.instrument, p.offtakeLoadPct].filter((v) => v != null && v !== 0 && v !== "").length;
  return {
    id: p.id,
    granted,
    name: granted ? p.title : `${p.teaserTitle}, ${p.region}`,
    tech: p.technology,
    country: p.country,
    stage: p.stage,
    regime: "Not stated",
    mw: granted ? p.capacityMw || 0 : mid(mwBand),
    mwBand,
    capex: granted ? p.capex : null,
    capexBand: cBand,
    weight: granted ? p.capex || 1 : cBand ? mid(cBand) : 1,
    irr: granted ? p.targetIrr : null,
    contr: p.contractedPct ?? 0,
    signed: p.signedPct ?? 0,
    completeness,
    financialAsOf: p.financialAsOf,
    fit: 100,
  };
};

const BundleBuilder = () => {
  const { projects, loading } = useProjectListings();
  const { bundles, saveBundle, renameBundle, deleteBundle } = useBundles();
  const [mode, setMode] = useState<"build" | "strategy">("build");
  const [selected, setSelected] = useState<string[]>([]);
  const [geo, setGeo] = useState<string[]>([]);
  const [tech, setTech] = useState<string[]>([]);
  const [stage, setStage] = useState<string[]>([]);
  const [source, setSource] = useState<string[]>([]);
  const [offtake, setOfftake] = useState<(typeof OFFTAKE_LEVELS)[number]>("Any");
  const [minIrr, setMinIrr] = useState(8);
  const [editing, setEditing] = useState<{ id: string; name: string; notes: string | null } | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveNotes, setSaveNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [bundlesOpen, setBundlesOpen] = useState(false);
  const [bundlesInit, setBundlesInit] = useState(false);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!bundlesInit && bundles.length) { setBundlesOpen(true); setBundlesInit(true); }
  }, [bundles.length, bundlesInit]);

  const rows = useMemo(() => projects.map(toRow), [projects]);
  const listedIds = useMemo(() => new Set(rows.map((r) => r.id)), [rows]);
  const uniq = (key: "country" | "tech" | "stage") => [...new Set(rows.map((r) => r[key]))].sort();

  const toggle = (list: string[], set: (v: string[]) => void, value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const matchScore = (p: Row) => {
    let s = 0;
    let n = 0;
    if (geo.length) { n++; if (geo.includes(p.country)) s++; }
    if (tech.length) { n++; if (tech.includes(p.tech)) s++; }
    if (stage.length) { n++; if (stage.includes(p.stage)) s++; }
    if (source.length) { n++; if (source.includes(p.tech)) s++; }
    if (p.irr != null) { n++; if (p.irr >= minIrr) s++; }
    if (offtake !== "Any") {
      n++;
      if (offtake === "Contracted" ? p.contr >= 50 : p.contr + p.signed >= 50) s++;
    }
    return n ? Math.round((s / n) * 100) : 100;
  };

  const list = useMemo(() => {
    const items = rows.map((p) => ({ ...p, fit: matchScore(p) }));
    return mode === "strategy" ? items.sort((a, b) => b.fit - a.fit) : items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, mode, geo, tech, stage, source, offtake, minIrr]);

  const chosen = rows.filter((p) => selected.includes(p.id));
  const chosenListings = projects.filter((p) => selected.includes(p.id));
  const locked = chosen.filter((p) => !p.granted);
  const grantedRows = chosen.filter((p) => p.granted);

  // Capacity: exact for granted, band range for locked.
  const mwExact = grantedRows.reduce((a, p) => a + p.mw, 0);
  const mwMin = mwExact + locked.reduce((a, p) => a + p.mwBand.min, 0);
  const mwOpen = locked.some((p) => p.mwBand.max == null);
  const mwMax = mwExact + locked.reduce((a, p) => a + (p.mwBand.max ?? p.mwBand.min), 0);
  const mwLabel = !locked.length ? String(Math.round(mwExact)) : mwOpen ? `${Math.round(mwMin)}+` : `${Math.round(mwMin)}–${Math.round(mwMax)}`;

  const capExact = grantedRows.reduce((a, p) => a + (p.capex || 0), 0);
  const lockedCap = locked.filter((p) => p.capexBand);
  const capMin = capExact + lockedCap.reduce((a, p) => a + p.capexBand!.min, 0);
  const capOpen = lockedCap.some((p) => p.capexBand!.max == null);
  const capMax = capExact + lockedCap.reduce((a, p) => a + (p.capexBand!.max ?? p.capexBand!.min), 0);
  const capLabel = !lockedCap.length ? `EUR ${fmtM(capExact)}` : capOpen ? `EUR ${fmtM(capMin)}+` : `EUR ${fmtM(capMin)}–${fmtM(capMax)}`;

  const irrRows = grantedRows.filter((p) => p.irr != null);
  const irrW = irrRows.reduce((a, p) => a + p.weight, 0);
  const wIrr = irrW ? irrRows.reduce((a, p) => a + (p.irr as number) * p.weight, 0) / irrW : null;

  const cap = chosen.reduce((a, p) => a + p.weight, 0);
  const wContr = cap ? chosen.reduce((a, p) => a + p.contr * p.weight, 0) / cap : 0;
  const wComm = cap ? chosen.reduce((a, p) => a + (p.contr + p.signed) * p.weight, 0) / cap : 0;

  const grantedListings = chosenListings.filter((p) => isGranted(p.accessState));
  const equityVals = grantedListings.map((p) => p.equitySought).filter((v): v is number => v != null);
  const ticketVals = grantedListings.map((p) => p.minTicket).filter((v): v is number => v != null);

  const group = (key: "country" | "regime" | "tech" | "stage", metric: "weight" | "mw") =>
    Object.entries(
      chosen.reduce<Record<string, number>>((acc, p) => {
        const k = String(p[key]);
        acc[k] = (acc[k] || 0) + p[metric];
        return acc;
      }, {}),
    )
      .map(([k, v]) => [k, Math.round(v)] as [string, number])
      .sort((a, b) => b[1] - a[1]);

  const spread = (key: "country" | "regime" | "tech") => {
    const g = group(key, "weight");
    const total = g.reduce((a, [, v]) => a + v, 0) || 1;
    return 1 - g.reduce((a, [, v]) => a + (v / total) * (v / total), 0);
  };

  const regimeStated = chosen.some((p) => p.regime !== "Not stated");
  const dscore = cap
    ? Math.round((regimeStated ? spread("country") * 0.4 + spread("regime") * 0.4 + spread("tech") * 0.2 : spread("country") * 0.67 + spread("tech") * 0.33) * 100)
    : 0;
  const level = dscore >= 66 ? "Well spread" : dscore >= 40 ? "Moderate spread" : "Concentrated";
  const nCountry = new Set(chosen.map((p) => p.country)).size;
  const nRegime = new Set(chosen.map((p) => p.regime)).size;
  const nTech = new Set(chosen.map((p) => p.tech)).size;

  const openSave = () => {
    setSaveName(editing?.name || `Bundle – ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`);
    setSaveNotes(editing?.notes || "");
    setSaveOpen(true);
  };

  const submitSave = async () => {
    const name = saveName.trim();
    if (!name) { toast.error("Please give the bundle a name"); return; }
    setSaving(true);
    const result = await saveBundle({ id: editing?.id, name: name.slice(0, 120), notes: saveNotes.trim().slice(0, 2000) || null, projectIds: selected });
    setSaving(false);
    if (!result.ok) { toast.error("Could not save bundle", { description: result.error }); return; }
    setEditing({ id: result.data.id, name: result.data.name, notes: saveNotes.trim() || null });
    setSaveOpen(false);
    toast.success("Bundle saved", { description: "Saved to My bundles. No access requests have been sent." });
  };

  const submitRename = async () => {
    if (!renaming) return;
    const name = renaming.name.trim();
    if (!name) { toast.error("Please give the bundle a name"); return; }
    const result = await renameBundle(renaming.id, name.slice(0, 120));
    if (!result.ok) { toast.error("Could not rename bundle", { description: result.error }); return; }
    if (editing?.id === renaming.id) setEditing({ ...editing, name });
    setRenaming(null);
    toast.success("Bundle renamed");
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const result = await deleteBundle(deleting.id);
    if (!result.ok) { toast.error("Could not delete bundle", { description: result.error }); return; }
    if (editing?.id === deleting.id) setEditing(null);
    setDeleting(null);
    toast.success("Bundle deleted");
  };

  return (
    <div className="max-w-[1300px] min-w-0">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Bundle builder</h1>
        <p className="mt-1 max-w-[78ch] text-sm leading-6 text-muted-foreground">
          Aggregate several opportunities into one diversified position, or set a strategy and let the tool surface the
          projects that fit. Figures are developer stated; the platform does not advise or underwrite.
        </p>
      </div>

      <div className="my-5 flex w-max max-w-full gap-2 rounded-xl border border-border bg-card p-1.5">
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

      {mode === "strategy" && rows.length > 0 && (
        <div className="mb-5 rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-4 font-display text-[15px] font-semibold">Define your strategy</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {([
              ["Geographies", uniq("country"), geo, setGeo],
              ["Technologies", uniq("tech"), tech, setTech],
              ["Project stage", uniq("stage"), stage, setStage],
              ["Energy source emphasis", uniq("tech"), source, setSource],
            ] as [string, string[], string[], (v: string[]) => void][]).map(([label, options, value, set]) => (
              <div key={label}>
                <p className="mb-2 text-xs font-semibold">{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {options.map((v) => (
                    <Option key={v} on={value.includes(v)} onClick={() => toggle(value, set, v)}>{v}</Option>
                  ))}
                </div>
              </div>
            ))}
            <div>
              <p className="mb-2 text-xs font-semibold">
                Minimum target IRR <span className="font-normal text-muted-foreground">(developer stated)</span>
              </p>
              <div className="flex items-center gap-3">
                <Slider value={[minIrr]} min={0} max={15} step={0.5} onValueChange={(v) => setMinIrr(v[0])} className="flex-1" />
                <span className="w-14 text-right font-display text-sm font-semibold">{minIrr.toFixed(1)}%</span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground">Applied only to projects whose figures you can see.</p>
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
        <div className="min-w-0">
          <Collapsible open={bundlesOpen} onOpenChange={setBundlesOpen} className="mb-4 rounded-xl border border-border bg-card">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
              <span className="font-display text-[15px] font-semibold">My bundles <span className="text-xs font-normal text-muted-foreground">({bundles.length})</span></span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", bundlesOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-border px-4 py-3">
              {!bundles.length ? (
                <p className="text-xs text-muted-foreground">No saved bundles yet.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {bundles.map((b) => {
                    const gone = b.projectIds.filter((id) => !listedIds.has(id)).length;
                    return (
                      <li key={b.id} className={cn("flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2", editing?.id === b.id ? "border-accent" : "border-border")}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-semibold">{b.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {b.projectIds.length} project{b.projectIds.length === 1 ? "" : "s"} · Updated {fmtDate(b.updated_at)}
                            {gone > 0 && <span className="text-warning"> · {gone} project{gone === 1 ? "" : "s"} no longer listed</span>}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setSelected(b.projectIds); setEditing({ id: b.id, name: b.name, notes: b.notes }); }}>Open</Button>
                          <Button size="sm" variant="ghost" onClick={() => setRenaming({ id: b.id, name: b.name })}>Rename</Button>
                          <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleting({ id: b.id, name: b.name })}>Delete</Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CollapsibleContent>
          </Collapsible>

          {editing && (
            <p className="mb-3 text-xs text-muted-foreground">
              Editing: <span className="font-semibold text-foreground">{editing.name}</span> ·{" "}
              <button type="button" className="text-accent underline" onClick={() => { setEditing(null); setSelected([]); }}>New bundle</button>
            </p>
          )}

          <div className="mb-3 flex flex-wrap items-center justify-between gap-1">
            <h3 className="font-display text-[15px] font-semibold">
              {mode === "build" ? "Select projects to bundle" : "Projects ranked by strategy fit"}
            </h3>
            {mode === "strategy" && (
              <span className="text-xs text-muted-foreground">Set filters above; ranked best fit first</span>
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-2.5">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[92px] rounded-xl" />)}
            </div>
          ) : !rows.length ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">No listed projects yet</div>
          ) : (
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
                    <span className="flex items-center gap-1.5 font-display text-[14.5px] font-semibold">
                      {!p.granted && <Lock className="h-3.5 w-3.5 flex-none text-muted-foreground" />}
                      <span className="min-w-0 break-words">{p.name}</span>
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      <Chip tone="tech">{p.tech}</Chip>
                      <Chip>{p.country}</Chip>
                      <Chip>{p.stage}</Chip>
                      <Chip>{p.regime}</Chip>
                      {p.contr > 0 && <Chip tone="off">{Math.round(p.contr)}% contracted</Chip>}
                      {p.signed > 0 && <Chip tone="loi">+{Math.round(p.signed)}% signed</Chip>}
                      <Chip>{p.completeness}/7 data points</Chip>
                      {p.granted && <Chip>{p.financialAsOf ? `Figures as of ${fmtDate(p.financialAsOf)}` : "Not dated"}</Chip>}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block font-display text-[15px] font-semibold">{p.granted ? `${p.mw} MW` : p.mwBand.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {p.granted ? (p.capex != null ? money(p.capex) : "—") : p.capexBand?.label ?? "—"}
                    </span>
                    {p.irr != null && <span className="mt-0.5 block font-display text-xs font-semibold text-accent">{p.irr.toFixed(1)}%</span>}
                    {mode === "strategy" && (
                      <>
                        <span className="mt-2 ml-auto block h-[5px] w-[72px] overflow-hidden rounded bg-muted sm:w-[120px]">
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
          )}
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6">
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
              <div className="mb-2 grid grid-cols-2 gap-2.5">
                <AggCard label="Aggregate capacity" value={mwLabel} unit="MW" />
                <AggCard label="Aggregate capital" value={capLabel} unit="M" />
                <div>
                  <AggCard label="Blended target IRR" value={wIrr == null ? "—" : `${wIrr.toFixed(1)}%`} />
                  <p className="mt-1 px-1 text-[10px] text-muted-foreground">developer-stated, {irrRows.length} of {chosen.length} projects</p>
                </div>
                <AggCard label="Offtake committed" value={`${Math.round(wComm)}%`} />
                {equityVals.length > 0 && <AggCard label="Equity sought" value={money(equityVals.reduce((a, v) => a + v, 0))} />}
                {ticketVals.length > 0 && <AggCard label="Minimum ticket" value={money(Math.min(...ticketVals))} />}
              </div>
              {locked.length > 0 && (
                <p className="mb-4 flex items-start gap-1.5 text-[11.5px] text-muted-foreground">
                  <Lock className="mt-0.5 h-3 w-3 flex-none" />
                  {locked.length} project{locked.length === 1 ? " has" : "s have"} locked figures – request access on the project page to see them.
                </p>
              )}

              <div className="mb-4 mt-4 rounded-xl bg-[linear-gradient(120deg,#0f2740,#0b1b2e)] px-4 py-4 text-white">
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
                  {regimeStated
                    ? `Across ${nCountry} ${nCountry > 1 ? "countries" : "country"} and ${nRegime} regulatory ${nRegime > 1 ? "regimes" : "regime"}.`
                    : `Across ${nCountry} ${nCountry > 1 ? "countries" : "country"} and ${nTech} ${nTech > 1 ? "technologies" : "technology"}; regulatory regime not stated.`}{" "}
                  Spreading across geographies and technologies reduces policy and demand correlation; {Math.round(wContr)}% of demand is
                  contracted, {Math.round(wComm - wContr)}% under signed connection agreements.
                </p>
              </div>

              <div className="mb-4">
                <p className="mb-2 font-display text-xs font-semibold text-muted-foreground">Capital by country</p>
                <Donut data={group("country", "weight")} total={group("country", "weight").reduce((a, [, v]) => a + v, 0) || 1} />
              </div>
              {regimeStated && (
                <div className="mb-4">
                  <p className="mb-2 font-display text-xs font-semibold text-muted-foreground">Capital by regulatory regime</p>
                  <Donut data={group("regime", "weight")} total={group("regime", "weight").reduce((a, [, v]) => a + v, 0) || 1} />
                </div>
              )}
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
                <Button className="flex-1" onClick={openSave}>
                  Save bundle
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Update bundle" : "Save bundle"}</DialogTitle>
            <DialogDescription>Saved privately to My bundles. Nothing is sent to developers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="bundle-name">Name</Label>
              <Input id="bundle-name" value={saveName} maxLength={120} onChange={(e) => setSaveName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bundle-notes">Notes (optional)</Label>
              <Textarea id="bundle-notes" value={saveNotes} maxLength={2000} onChange={(e) => setSaveNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={submitSave} disabled={saving || !saveName.trim()}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!renaming} onOpenChange={(o) => !o && setRenaming(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Rename bundle</DialogTitle></DialogHeader>
          <Input value={renaming?.name ?? ""} maxLength={120} onChange={(e) => renaming && setRenaming({ ...renaming, name: e.target.value })} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>Cancel</Button>
            <Button onClick={submitRename} disabled={!renaming?.name.trim()}>Rename</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.name}”?</AlertDialogTitle>
            <AlertDialogDescription>This removes the saved bundle. The projects themselves are not affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BundleBuilder;
