import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, FolderOpen, Heart, Info, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ACCESS_STATE_LABEL, PIPELINE_STAGES, effectiveState, normaliseStage, slaStatus, stageLabel } from "@/lib/access";

type Interest = Tables<"project_interest">;
type Project = Tables<"project">;
type Request = Tables<"access_request">;
type Watch = Tables<"watchlist_item">;
type Finance = Tables<"financial_summary">;
type Process = Tables<"project_process">;
type CaseRow = Tables<"project_case">;
type CapitalStackItem = Tables<"capital_stack_item">;
type InvestorProfile = Tables<"investor_profiles">;

type Stage = (typeof PIPELINE_STAGES)[number]["value"];

const stageOrder: Stage[] = PIPELINE_STAGES.map((entry) => entry.value);
const COMMITTED_STAGES: Stage[] = ["loi", "closed"];

const nextActionByStage: Partial<Record<Stage, string>> = {
  watchlisted: "Express interest to start the gate",
  interest_submitted: "Awaiting the developer's decision",
  access_granted: "Review the unlocked project detail",
  data_room: "Work through the data room",
  ioi: "Firm the indication into an LOI",
  loi: "Move to close",
  closed: "Confirm the close with the developer",
};

// Mandate size is estimated from the investor's self-reported investment range and is not a verified figure.
const mandateEstimateByRange: Record<string, number> = {
  under_1m: 1_000_000,
  "1m_5m": 5_000_000,
  "5m_25m": 25_000_000,
  "25m_100m": 100_000_000,
  over_100m: 150_000_000,
} as Record<string, number>;

const daysBetween = (a: Date, b: Date) => Math.max(0, Math.round((a.getTime() - b.getTime()) / 86_400_000));
const addMonths = (date: Date, months: number) => { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; };
const addDays = (date: Date, days: number) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB");

interface PassedDeal { id: string; projectTitle: string; reason: string; loggedAt: string; }

const InvestorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"interests" | "deals" | "watch" | "passed">("interests");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [watchlist, setWatchlist] = useState<Watch[]>([]);
  const [finance, setFinance] = useState<Finance[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [stackItems, setStackItems] = useState<CapitalStackItem[]>([]);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [asOf] = useState(() => new Date());

  const [owners, setOwners] = useState<Record<string, string>>({});
  const [nextActions, setNextActions] = useState<Record<string, string>>({});
  const [passedDeals, setPassedDeals] = useState<PassedDeal[]>([]);
  const [passedForm, setPassedForm] = useState({ projectTitle: "", reason: "" });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: interestRows }, { data: requestRows }, { data: watchRows }, { data: investorProfileRow }] = await Promise.all([
      supabase.from("project_interest").select("*").eq("investor_user_id", user.id).order("introduced_at", { ascending: false }),
      supabase.from("access_request").select("*").eq("investor_user_id", user.id),
      supabase.from("watchlist_item").select("*").eq("user_id", user.id),
      supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    const allIds = Array.from(new Set([...(interestRows || []).map((row) => row.project_id), ...(watchRows || []).map((row) => row.project_id)]));
    if (allIds.length) {
      const [{ data: projectRows }, { data: financeRows }, { data: processRows }, { data: caseRows }] = await Promise.all([
        supabase.from("project").select("*").in("id", allIds),
        supabase.from("financial_summary").select("*").in("project_id", allIds),
        supabase.from("project_process").select("*").in("project_id", allIds),
        supabase.from("project_case").select("*").in("project_id", allIds),
      ]);
      setProjects(projectRows || []);
      setFinance(financeRows || []);
      setProcesses(processRows || []);
      setCases(caseRows || []);
      const financeIds = (financeRows || []).map((row) => row.id);
      if (financeIds.length) {
        const { data: stackRows } = await supabase.from("capital_stack_item").select("*").in("financial_summary_id", financeIds);
        setStackItems(stackRows || []);
      } else {
        setStackItems([]);
      }
    } else {
      setProjects([]); setFinance([]); setProcesses([]); setCases([]); setStackItems([]);
    }
    setInterests(interestRows || []); setRequests(requestRows || []); setWatchlist(watchRows || []);
    setInvestorProfile(investorProfileRow || null);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const financeByProject = useMemo(() => new Map(finance.map((row) => [row.project_id, row])), [finance]);
  const processByProject = useMemo(() => new Map(processes.map((row) => [row.project_id, row])), [processes]);
  const casesByProject = useMemo(() => {
    const map = new Map<string, CaseRow[]>();
    cases.forEach((row) => { const list = map.get(row.project_id) || []; list.push(row); map.set(row.project_id, list); });
    return map;
  }, [cases]);

  const isCommitted = useCallback((interest: Interest) => COMMITTED_STAGES.includes(normaliseStage(interest.stage)), []);
  const committedInterests = useMemo(() => interests.filter(isCommitted), [interests, isCommitted]);
  const indicatedInterests = useMemo(() => interests.filter((interest) => !isCommitted(interest)), [interests, isCommitted]);

  const committedProjects = committedInterests.map((interest) => projectById.get(interest.project_id)).filter((project): project is Project => Boolean(project));
  const committedCapacity = committedProjects.reduce((sum, project) => sum + Number(project.capacity_mw), 0);
  const committedCapital = committedInterests.reduce((sum, interest) => sum + Number(interest.indicated_commitment || 0), 0);
  const indicatedCapital = indicatedInterests.reduce((sum, interest) => sum + Number(interest.indicated_commitment || 0), 0);

  const engagedProjects = interests.map((interest) => projectById.get(interest.project_id)).filter((project): project is Project => Boolean(project));
  const totalCapacity = engagedProjects.reduce((sum, project) => sum + Number(project.capacity_mw), 0);
  const totalCapex = engagedProjects.reduce((sum, project) => sum + Number(financeByProject.get(project.id)?.capex || project.headline_investment || 0), 0);

  const irrRows = engagedProjects.filter((project) => project.headline_irr_pct != null);
  const irrValues = irrRows.map((project) => Number(project.headline_irr_pct));
  const irrMin = irrValues.length ? Math.min(...irrValues) : null;
  const irrMax = irrValues.length ? Math.max(...irrValues) : null;

  const approvedRooms = requests.filter((request) => request.status === "approved").length;
  const activeDeals = interests.filter((interest) => ["data_room", "ioi", "loi", "closed"].includes(normaliseStage(interest.stage))).length;
  const funnel = stageOrder.map((stage) => ({ stage, label: stageLabel(stage), value: interests.filter((interest) => normaliseStage(interest.stage) === stage).length }));
  const maxFunnel = Math.max(1, ...funnel.map((item) => item.value));

  // Funnel conversion and median time in stage (proxy: days since introduced_at to updated_at for interests currently past that stage).
  const overallConversion = interests.length ? (interests.filter((interest) => normaliseStage(interest.stage) === "closed").length / interests.length) * 100 : 0;
  const stageDurations = interests.map((interest) => daysBetween(new Date(interest.updated_at), new Date(interest.introduced_at))).filter((n) => n >= 0).sort((a, b) => a - b);
  const medianDays = stageDurations.length ? stageDurations[Math.floor(stageDurations.length / 2)] : 0;

  const mandateSize = investorProfile?.investment_range ? mandateEstimateByRange[investorProfile.investment_range] || 0 : 0;
  const mandateDeployed = interests.filter((interest) => normaliseStage(interest.stage) === "closed").reduce((sum, interest) => sum + Number(interest.indicated_commitment || 0), 0);
  const mandateRemaining = Math.max(0, mandateSize - committedCapital);

  const derisked = useMemo(() => {
    const committedFinanceIds = committedProjects.map((project) => financeByProject.get(project.id)?.id).filter((id): id is string => Boolean(id));
    const relevantItems = stackItems.filter((item) => committedFinanceIds.includes(item.financial_summary_id) && /grant|public|subsid/i.test(item.label));
    const coveredAmount = relevantItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalCapex = committedProjects.reduce((sum, project) => sum + Number(financeByProject.get(project.id)?.capex || 0), 0);
    const pct = totalCapex ? (coveredAmount / totalCapex) * 100 : 0;
    return { coveredAmount, totalCapex, pct };
  }, [committedProjects, financeByProject, stackItems]);

  const kpis = [
    ["Capacity engaged", `${totalCapacity.toLocaleString()} MW`, `${interests.length} project${interests.length === 1 ? "" : "s"}`],
    ["Capex engaged", totalCapex ? `\u20ac${(totalCapex / 1_000_000).toFixed(1)}M` : "\u20ac0", "developer-stated"],
    ["Target IRR range", irrValues.length ? `${irrMin!.toFixed(1)}% \u2013 ${irrMax!.toFixed(1)}%` : "Not available", "unverified, developer-stated"],
    ["Active deals", String(activeDeals), "due diligence or later"],
    ["Interests expressed", String(interests.length), `${watchlist.length} watchlisted`],
    ["Data rooms open", String(approvedRooms), `${requests.filter((request) => request.status === "requested").length} pending`],
  ];

  const rows = tab === "watch" ? watchlist : interests;

  const setOwner = (id: string, value: string) => setOwners((prev) => ({ ...prev, [id]: value }));
  const setNextAction = (id: string, value: string) => setNextActions((prev) => ({ ...prev, [id]: value }));

  const logPassedDeal = () => {
    if (!passedForm.projectTitle.trim() || !passedForm.reason.trim()) return;
    setPassedDeals((prev) => [{ id: crypto.randomUUID(), projectTitle: passedForm.projectTitle.trim(), reason: passedForm.reason.trim(), loggedAt: new Date().toISOString() }, ...prev]);
    setPassedForm({ projectTitle: "", reason: "" });
  };

  return (
    <div className="max-w-[1240px]">
      <div className="mb-6"><h1 className="font-display text-[28px] font-semibold">Pipeline</h1><p className="mt-1 text-[15px] text-muted-foreground">Your account-specific pipeline of projects progressing toward close.</p></div>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([label, value, sub]) => <div key={label} className="rounded-lg border border-border border-l-[3px] border-l-accent bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1.5 font-display text-xl font-semibold">{loading ? "..." : value}</p><p className="mt-1 text-[11px] text-muted-foreground">{sub}</p></div>)}
      </div>

      <div className="mb-7 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-1 font-display text-sm font-semibold">Concentration by project (committed capital)</h2>
          <p className="mb-4 text-[11px] text-muted-foreground">Computed on committed positions only (term sheet or financial close). Committed capital: \u20ac{(committedCapital / 1_000_000).toFixed(2)}M.</p>
          {!committedProjects.length ? <p className="rounded-md bg-muted p-5 text-sm text-muted-foreground">No committed positions yet. Committed positions appear here once a deal reaches term sheet or financial close.</p> : <div className="space-y-3">{committedProjects.map((project) => { const pct = committedCapacity ? Number(project.capacity_mw) / committedCapacity * 100 : 0; return <div key={project.id}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate">{project.title}</span><strong>{pct.toFixed(0)}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div></div>; })}</div>}
          <div className="mt-4 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            Indicated interest (not committed): \u20ac{(indicatedCapital / 1_000_000).toFixed(2)}M across {indicatedInterests.length} project{indicatedInterests.length === 1 ? "" : "s"}. Indicated figures are not committed capital.
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-sm font-semibold">Pipeline by stage</h2>
          <div className="space-y-2.5">{funnel.map((item) => <div key={item.stage} className="flex items-center gap-3"><span className="w-28 shrink-0 text-xs text-muted-foreground">{item.label}</span><div className="h-7 min-w-8 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground" style={{ width: `${Math.max(8, item.value / maxFunnel * 100)}%` }}>{item.value}</div></div>)}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Conversion to close</p><p className="mt-1 font-display text-lg font-semibold">{overallConversion.toFixed(0)}%</p></div>
            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Median time in stage</p><p className="mt-1 font-display text-lg font-semibold">{medianDays}d</p></div>
          </div>
        </section>
      </div>

      <div className="mb-7 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-sm font-semibold">Mandate capacity</h2>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Committed</p><p className="mt-1 font-display text-lg font-semibold">\u20ac{(committedCapital / 1_000_000).toFixed(1)}M</p></div>
            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Deployed</p><p className="mt-1 font-display text-lg font-semibold">\u20ac{(mandateDeployed / 1_000_000).toFixed(1)}M</p></div>
            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Remaining</p><p className="mt-1 font-display text-lg font-semibold">{mandateSize ? `\u20ac${(mandateRemaining / 1_000_000).toFixed(1)}M` : "Not available"}</p></div>
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">Mandate size is estimated from your stated investment range and is unverified, self-reported.</p>
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="mb-1 flex items-center gap-1.5">
            <h2 className="font-display text-sm font-semibold">De-risking coverage</h2>
            <Tooltip>
              <TooltipTrigger asChild><button type="button" aria-label="Definition"><Info className="h-3.5 w-3.5 text-muted-foreground" /></button></TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">Share of capex on committed positions covered by grant, public or subsidy line items in the capital stack. Restricted to committed positions.</TooltipContent>
            </Tooltip>
          </div>
          <p className="mb-4 text-[11px] text-muted-foreground">As of {fmtDate(asOf)}</p>
          {!committedProjects.length ? <p className="rounded-md bg-muted p-5 text-sm text-muted-foreground">No committed positions yet.</p> : (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, derisked.pct)}%` }} /></div>
              <p className="mt-2 text-xs text-muted-foreground">{derisked.pct.toFixed(0)}% of committed capex (\u20ac{(derisked.totalCapex / 1_000_000).toFixed(1)}M) is covered by grant or public co-financing line items.</p>
            </div>
          )}
        </section>
      </div>

      <div className="mb-5 flex gap-1.5 border-b border-border">
        {([['interests', 'My interests'], ['deals', 'Deals'], ['watch', 'Watchlist'], ['passed', 'Passed deals']] as const).map(([id, label]) => <Button key={id} variant="ghost" onClick={() => setTab(id)} className={cn("rounded-none border-b-2", tab === id ? "border-accent text-accent" : "border-transparent text-muted-foreground")}>{label}</Button>)}
      </div>

      {tab === "passed" ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="mb-3 text-xs text-muted-foreground">Passed deals are logged locally in this browser session only. They are not saved to your account.</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
              <Input placeholder="Project name" value={passedForm.projectTitle} onChange={(event) => setPassedForm((prev) => ({ ...prev, projectTitle: event.target.value }))} />
              <Textarea placeholder="Reason for passing" value={passedForm.reason} onChange={(event) => setPassedForm((prev) => ({ ...prev, reason: event.target.value }))} className="min-h-9" />
              <Button onClick={logPassedDeal}>Log passed deal</Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            {!passedDeals.length && <p className="p-6 text-sm text-muted-foreground">No passed deals logged in this session.</p>}
            {passedDeals.map((deal) => <div key={deal.id} className="border-b border-border px-6 py-4 last:border-0"><p className="font-semibold">{deal.projectTitle}</p><p className="mt-1 text-xs text-muted-foreground">Reason: {deal.reason}</p><p className="mt-1 text-[11px] text-muted-foreground">Logged {fmtDate(new Date(deal.loggedAt))} (this session only)</p></div>)}
          </div>
        </div>
      ) : tab === "deals" ? (
        <div className="space-y-3">
          {!interests.length && <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">No active deals yet.</p>}
          {interests.map((interest) => {
            const project = projectById.get(interest.project_id);
            if (!project) return null;
            const process = processByProject.get(project.id);
            const projectCases = casesByProject.get(project.id) || [];
            const dealRequest = requests.find((item) => item.project_id === project.id);
            // The introduction is logged when the developer accepts, never at submission.
            const introducedAt = new Date(dealRequest?.introduction_logged_at || interest.introduced_at);
            const feeTailExpiry = addMonths(introducedAt, 36);
            const exclusivityExpiry = process?.exclusivity_days ? addDays(introducedAt, process.exclusivity_days) : null;
            const daysInStage = daysBetween(new Date(), new Date(interest.updated_at));
            const owner = owners[interest.id] ?? profile?.display_name ?? "Unassigned";
            const nextAction = nextActions[interest.id] ?? nextActionByStage[normaliseStage(interest.stage)] ?? "Review the next step";
            return (
              <article key={interest.id} className="rounded-lg border border-border bg-card p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div><h3 className="font-display font-semibold">{project.title}</h3><p className="mt-1 text-xs capitalize text-muted-foreground">{project.city}, {project.country_code} | {stageLabel(interest.stage)}</p></div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/app/projects/${project.slug}`)}>Open project</Button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-accent" /> {dealRequest?.introduction_logged_at ? `Introduction logged ${fmtDate(introducedAt)}` : "No introduction logged yet"}</span>
                  <span>Days in stage: <strong className="text-foreground">{daysInStage}</strong></span>
                  <span>Fee-tail expiry: <strong className="text-foreground">{dealRequest?.introduction_logged_at ? fmtDate(feeTailExpiry) : "Not started"}</strong></span>
                  <span>Exclusivity expiry: <strong className="text-foreground">{exclusivityExpiry ? fmtDate(exclusivityExpiry) : "Not available"}</strong></span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-muted-foreground">Owner<Input className="mt-1" value={owner} onChange={(event) => setOwner(interest.id, event.target.value)} /></label>
                  <label className="text-xs text-muted-foreground">Next action<Input className="mt-1" value={nextAction} onChange={(event) => setNextAction(interest.id, event.target.value)} /></label>
                </div>
                {projectCases.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {projectCases.map((row) => <span key={row.id} className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">{row.name} case: {row.equity_irr_pct != null ? `${Number(row.equity_irr_pct).toFixed(1)}% IRR` : "IRR n/a"}{row.min_dscr != null ? `, DSCR ${Number(row.min_dscr).toFixed(2)}x` : ""}</span>)}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {!rows.length && <div className="flex flex-col items-center p-10 text-center"><FolderOpen className="mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold">{tab === "watch" ? "Your watchlist is empty" : "No interests expressed yet"}</p><p className="mt-1 text-sm text-muted-foreground">Browse opportunities to start building your pipeline.</p><Button className="mt-4" onClick={() => navigate("/app")}>Browse projects</Button></div>}
          {rows.map((row) => { const project = projectById.get(row.project_id); if (!project) return null; const request = requests.find((item) => item.project_id === project.id); return <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4 last:border-0"><div><p className="font-semibold">{project.title}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{project.technology.replace(/_/g, " ")} | {project.capacity_mw} MW | {project.city}, {project.country_code}</p></div><div className="flex items-center gap-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{tab === "watch" ? <Heart className="h-3.5 w-3.5" /> : request && effectiveState(request) === "granted_full" ? <FolderOpen className="h-3.5 w-3.5 text-success" /> : <Building2 className="h-3.5 w-3.5" />}{tab === "watch" ? "Saved" : request ? ACCESS_STATE_LABEL[effectiveState(request)] : "Watchlisted"}</span>{tab !== "watch" && request && effectiveState(request) === "pending" && <span className="text-xs text-muted-foreground">{slaStatus(request).workingDays} working days pending</span>}<Button size="sm" variant="outline" onClick={() => navigate(`/app/projects/${project.slug}`)}>Open</Button></div></div>; })}
        </div>
      )}
    </div>
  );
};

export default InvestorDashboard;
