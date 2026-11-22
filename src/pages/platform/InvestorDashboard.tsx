import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { Building2, FolderOpen, Heart, Info, LockOpen, Send, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import StatTile from "@/components/platform/StatTile";
import DealsSwitch from "@/components/platform/DealsSwitch";
import { BeforeClosePanel, ContingentCapexPanel, RunningConditionsPanel } from "@/components/platform/PublicFundingViews";
import { usePublicFundingRows } from "@/hooks/usePublicFundingRows";
import { TICKETS } from "@/lib/profileSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { useProjectListings } from "@/hooks/useProjectListings";
import { useInvestorQualification } from "@/hooks/useInvestorQualification";
import { canReadAcceptedFigures } from "@/lib/projectDisclosure";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ACCESS_STATE_LABEL, PIPELINE_STAGES, effectiveState, isGranted, normaliseStage, slaStatus, stageLabel, workingDaysSince } from "@/lib/access";

type Interest = Tables<"project_interest">;
type Project = Pick<Tables<"project">, "id" | "public_ref" | "title" | "city" | "country_code" | "capacity_mw" | "headline_investment"> & { technology: string; capacityBand: string | null };
type Request = Tables<"access_request">;
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

const daysBetween = (a: Date, b: Date) => Math.max(0, Math.round((a.getTime() - b.getTime()) / 86_400_000));
const addMonths = (date: Date, months: number) => { const d = new Date(date); d.setMonth(d.getMonth() + months); return d; };
const addDays = (date: Date, days: number) => { const d = new Date(date); d.setDate(d.getDate() + days); return d; };
const fmtDate = (d: Date) => d.toLocaleDateString("en-GB");


const InvestorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"pipeline" | "realised" | "watch">("pipeline");
  const [interests, setInterests] = useState<Interest[]>([]);
  const { projects: listings } = useProjectListings();
  const { qualified } = useInvestorQualification();
  const projects: Project[] = listings.map(row => ({ id: row.id, public_ref: row.publicRef, title: row.title,
    city: row.city, country_code: row.country, technology: row.technology,
    capacity_mw: qualified && row.exactFiguresAvailable ? row.capacityMw : null,
    headline_investment: qualified && row.exactFiguresAvailable ? row.capex : null, capacityBand: row.capacityBand ?? null }));
  const [requests, setRequests] = useState<Request[]>([]);
  // Shared with the cards, project page and sidebar so the tab updates without a reload.
  const { items: watchlist } = useWatchlist();
  const [finance, setFinance] = useState<Finance[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [stackItems, setStackItems] = useState<CapitalStackItem[]>([]);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [asOf] = useState(() => new Date());

  const [owners, setOwners] = useState<Record<string, string>>({});
  const [nextActions, setNextActions] = useState<Record<string, string>>({});

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
    const entitledIds = allIds.filter(id => (requestRows ?? []).some(row => row.project_id === id && canReadAcceptedFigures(effectiveState(row), qualified)));
    if (entitledIds.length) {
      const [{ data: financeRows }, { data: processRows }, { data: caseRows }] = await Promise.all([
        supabase.from("financial_summary").select("*").in("project_id", entitledIds),
        supabase.from("project_process").select("*").in("project_id", entitledIds),
        supabase.from("project_case").select("*").in("project_id", entitledIds),
      ]);
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
      setFinance([]); setProcesses([]); setCases([]); setStackItems([]);
    }
    setInterests(interestRows || []); setRequests(requestRows || []);
    setInvestorProfile(investorProfileRow || null);
    setLoading(false);
  }, [user, qualified]);

  useEffect(() => { load(); }, [load]);

  const [alerts, setAlerts] = useState<Tables<"notification">[] | null>(null);
  useEffect(() => {
    if (!user) return;
    void supabase.from("notification").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3).then(({ data }) => setAlerts(data || []));
  }, [user]);

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  // Public-funding views read only records RLS opens to this investor (accepted and qualified).
  const fundingLabels = useMemo(() => new Map(projects.map((project) => [project.id, project.title])), [projects]);
  const funding = usePublicFundingRows(interests.map((interest) => interest.project_id), fundingLabels);
  const realisedIds = new Set(interests.filter((interest) => normaliseStage(interest.stage) === "closed").map((interest) => interest.project_id));

  // A project saved elsewhere since this page loaded: fetch its details once.
  const fetchedFor = useRef(new Set<string>());
  useEffect(() => {
    if (loading) return;
    const missing = watchlist.filter((w) => !w.id.startsWith("pending-") && !projectById.has(w.project_id) && !fetchedFor.current.has(w.project_id));
    if (!missing.length) return;
    missing.forEach((w) => fetchedFor.current.add(w.project_id));
    void load();
  }, [watchlist, projectById, loading, load]);
  const financeByProject = useMemo(() => new Map((qualified ? finance : []).map((row) => [row.project_id, row])), [finance, qualified]);
  const processByProject = useMemo(() => new Map((qualified ? processes : []).map((row) => [row.project_id, row])), [processes, qualified]);
  const casesByProject = useMemo(() => {
    const map = new Map<string, CaseRow[]>();
    (qualified ? cases : []).forEach((row) => { const list = map.get(row.project_id) || []; list.push(row); map.set(row.project_id, list); });
    return map;
  }, [cases, qualified]);

  const isCommitted = useCallback((interest: Interest) => COMMITTED_STAGES.includes(normaliseStage(interest.stage)), []);
  const committedInterests = useMemo(() => interests.filter(isCommitted), [interests, isCommitted]);
  const indicatedInterests = useMemo(() => interests.filter((interest) => !isCommitted(interest)), [interests, isCommitted]);

  const committedProjects = committedInterests.map((interest) => projectById.get(interest.project_id)).filter((project): project is Project => Boolean(project));
  // R7: only stated capacities are summed; an unknown capacity is never counted as 0 MW.
  const committedCapacity = committedProjects.reduce((sum, project) => project.capacity_mw != null ? sum + Number(project.capacity_mw) : sum, 0);
  const committedCapital = committedInterests.reduce((sum, interest) => sum + Number(interest.indicated_commitment || 0), 0);
  const indicatedCapital = indicatedInterests.reduce((sum, interest) => sum + Number(interest.indicated_commitment || 0), 0);

  const engagedProjects = interests.map((interest) => projectById.get(interest.project_id)).filter((project): project is Project => Boolean(project));
  const capacityKnown = engagedProjects.filter((project) => project.capacity_mw != null);
  const totalCapacity = capacityKnown.reduce((sum, project) => sum + Number(project.capacity_mw), 0);
  const capexOf = (project: Project) => financeByProject.get(project.id)?.capex ?? project.headline_investment ?? null;
  const capexKnown = engagedProjects.filter((project) => capexOf(project) != null);
  const totalCapex = capexKnown.reduce((sum, project) => sum + Number(capexOf(project)), 0);
  const knownOf = (known: number) => `${known} of ${engagedProjects.length} project${engagedProjects.length === 1 ? "" : "s"} stated`;

  const approvedRooms = requests.filter((request) => request.state === "granted_full").length;
  const activeDeals = interests.filter((interest) => ["data_room", "ioi", "loi", "closed"].includes(normaliseStage(interest.stage))).length;
  const funnel = stageOrder.map((stage) => ({ stage, label: stageLabel(stage), value: interests.filter((interest) => normaliseStage(interest.stage) === stage).length }));
  const maxFunnel = Math.max(1, ...funnel.map((item) => item.value));

  // Elapsed working days are measured from the logged introduction, not from a stage transition.
  const overallConversion = interests.length ? (interests.filter((interest) => normaliseStage(interest.stage) === "closed").length / interests.length) * 100 : 0;
  const stageDurations = requests.flatMap(request => request.introduction_logged_at ? [workingDaysSince(request.introduction_logged_at, asOf)] : []).filter((n) => n >= 0).sort((a, b) => a - b);
  const medianDays = stageDurations.length ? stageDurations[Math.floor(stageDurations.length / 2)] : 0;

  const mandateDeployed = interests.filter((interest) => normaliseStage(interest.stage) === "closed").reduce((sum, interest) => sum + Number(interest.indicated_commitment || 0), 0);

  const derisked = useMemo(() => {
    const committedFinanceIds = committedProjects.map((project) => financeByProject.get(project.id)?.id).filter((id): id is string => Boolean(id));
    const relevantItems = stackItems.filter((item) => committedFinanceIds.includes(item.financial_summary_id) && /grant|public|subsid/i.test(item.label));
    const coveredAmount = relevantItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const totalCapex = committedProjects.reduce((sum, project) => sum + Number(financeByProject.get(project.id)?.capex || 0), 0);
    const pct = totalCapex ? (coveredAmount / totalCapex) * 100 : 0;
    return { coveredAmount, totalCapex, pct };
  }, [committedProjects, financeByProject, stackItems]);

  // Tiles without any stated figure are omitted rather than shown as zero.
  const kpis = [
    ...(capacityKnown.length ? [["Capacity engaged", `${totalCapacity.toLocaleString()} MW`, knownOf(capacityKnown.length)]] : []),
    ...(capexKnown.length ? [["Capex engaged", `\u20ac${(totalCapex / 1_000_000).toFixed(1)}M`, `${knownOf(capexKnown.length)}, developer-stated`]] : []),
    ["Active deals", String(activeDeals), "due diligence or later"],
    ["Interests expressed", String(interests.length), `${watchlist.length} watchlisted`],
    ["Data rooms open", String(approvedRooms), `${requests.filter((request) => request.status === "requested").length} pending`],
  ];

  const rows = watchlist;
  const dealList = interests.filter((interest) => (normaliseStage(interest.stage) === "closed") === (tab === "realised"));

  const setOwner = (id: string, value: string) => setOwners((prev) => ({ ...prev, [id]: value }));
  const setNextAction = (id: string, value: string) => setNextActions((prev) => ({ ...prev, [id]: value }));

  return (
    <div className="max-w-workspace">
      <DealsSwitch />
      <div className="mb-6"><h1 className="font-display text-[28px] font-semibold">Investing</h1><p className="mt-1 text-[15px] text-muted-foreground">Projects you have reviewed, asked to see, or are negotiating on.</p></div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Your activity</h2>
          <p className="mb-4 mt-1 text-[13px] text-muted-foreground">Across every project you have engaged with</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile icon={Heart} label="Watchlisted" value={loading ? "…" : String(watchlist.length)} />
            <StatTile icon={Send} label="Access requests sent" value={loading ? "…" : String(requests.length)} />
            <StatTile icon={LockOpen} label="Access granted" value={loading ? "…" : String(requests.filter((request) => isGranted(effectiveState(request))).length)} tone="success" />
          </div>
        </section>
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-baseline justify-between gap-3"><h2 className="font-display text-base font-semibold">Alerts</h2><Link to="/app/notifications" className="text-[13px] font-medium text-primary hover:underline">See all</Link></div>
          <div className="mt-3 space-y-2.5">
            {alerts === null ? <><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></> : !alerts.length ? <p className="py-6 text-center text-[13px] text-muted-foreground">No notifications for now.</p> : alerts.map((alert) => {
              const body = <><span className={cn("mt-1.5 h-2 w-2 flex-none rounded-full", alert.read_at ? "bg-subtle-foreground" : "bg-primary")} aria-hidden="true" /><span><strong className="font-semibold">{alert.title}</strong>{alert.body ? <span className="block text-muted-foreground">{alert.body}</span> : null}<span className="mt-0.5 block text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span></span></>;
              return alert.link ? <Link key={alert.id} to={alert.link} className="flex gap-2.5 rounded-lg bg-background p-3 text-[13px] leading-snug transition-colors hover:bg-muted">{body}</Link> : <div key={alert.id} className="flex gap-2.5 rounded-lg bg-background p-3 text-[13px] leading-snug">{body}</div>;
            })}
          </div>
        </section>
      </div>

      <section className="mb-8 rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-display text-base font-semibold">Your deals</h2>
        <p className="mb-4 mt-1 text-[13px] text-muted-foreground">Every project you have expressed interest in, and where it stands.</p>
        {loading ? <div className="space-y-2" aria-hidden="true"><Skeleton className="h-11 w-full" /><Skeleton className="h-14 w-full" /></div> : !interests.length ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <p className="font-display text-lg font-semibold">Here you will see the projects you are pursuing</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Express interest on a listing to request access. Its status and next step show up here.</p>
            <Button asChild className="mt-4"><Link to="/app/opportunities">Browse opportunities</Link></Button>
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[760px] border-collapse text-[13px]">
              <thead><tr className="bg-background text-left text-muted-foreground"><th scope="col" className="px-3.5 py-3 font-semibold">Status</th><th scope="col" className="px-3.5 py-3 font-semibold">Project</th><th scope="col" className="px-3.5 py-3 font-semibold">Technology</th><th scope="col" className="px-3.5 py-3 font-semibold">Capacity</th><th scope="col" className="px-3.5 py-3 font-semibold">Location</th><th scope="col" className="px-3.5 py-3 font-semibold">Stage</th><th scope="col" className="px-3.5 py-3"><span className="sr-only">Open</span></th></tr></thead>
              <tbody>
                {interests.map((interest) => {
                  const project = projectById.get(interest.project_id);
                  if (!project) return null;
                  const request = requests.find((item) => item.project_id === project.id);
                  const state = request ? effectiveState(request) : null;
                  const chip = !state ? { label: "Interest logged", className: "bg-muted text-muted-foreground" } : isGranted(state) ? { label: state === "granted_full" ? "Data room open" : "Access granted", className: "bg-success-soft text-success" } : state === "pending" ? { label: "Request pending", className: "bg-info-soft text-info" } : { label: ACCESS_STATE_LABEL[state].replace(/^Request /, "").replace(/^./, (c) => c.toUpperCase()), className: "bg-muted text-muted-foreground" };
                  return <tr key={interest.id} className="border-t border-border">
                    <td className="px-3.5 py-3.5"><span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold", chip.className)}>{chip.label}</span></td>
                    <td className="px-3.5 py-3.5 font-semibold text-foreground">{project.title}</td>
                    <td className="px-3.5 py-3.5 text-muted-foreground">{project.technology}</td>
                    <td className="px-3.5 py-3.5 text-muted-foreground">{project.capacity_mw != null ? `${project.capacity_mw} MW` : project.capacityBand ?? ""}</td>
                    <td className="px-3.5 py-3.5 text-muted-foreground">{[project.city, project.country_code].filter(Boolean).join(", ")}</td>
                    <td className="px-3.5 py-3.5 text-muted-foreground">{stageLabel(normaliseStage(interest.stage))}{state === "pending" && request ? ` · ${slaStatus(request).workingDays} working days` : ""}</td>
                    <td className="px-3.5 py-3.5 text-right"><Button size="sm" variant="outline" onClick={() => navigate(`/app/projects/${project.public_ref}`)}>Open</Button></td>
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {requests.length > 0 && <>
      <h2 className="mb-3 font-display text-lg font-semibold">Portfolio analytics</h2>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([label, value, sub]) => <div key={label} className="rounded-lg border border-border border-l-[3px] border-l-accent bg-card px-4 py-3.5"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1.5 font-display text-xl font-semibold">{loading ? "..." : value}</p><p className="mt-1 text-[11px] text-muted-foreground">{sub}</p></div>)}
      </div>

      <div className="mb-7 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-1 font-display text-sm font-semibold">Concentration by project (committed capital)</h2>
          <p className="mb-4 text-[11px] text-muted-foreground">Computed on committed positions only (term sheet or financial close). Committed capital: €{(committedCapital / 1_000_000).toFixed(2)}M.</p>
          {!committedProjects.length ? <p className="rounded-md bg-muted p-5 text-sm text-muted-foreground">No committed positions yet. Committed positions appear here once a deal reaches term sheet or financial close.</p> : <div className="space-y-3">{committedProjects.filter((project) => project.capacity_mw != null).map((project) => { const pct = committedCapacity ? Number(project.capacity_mw) / committedCapacity * 100 : 0; return <div key={project.id}><div className="mb-1.5 flex justify-between gap-3 text-xs"><span className="truncate">{project.title}</span><strong>{pct.toFixed(0)}%</strong></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} /></div></div>; })}</div>}
          <div className="mt-4 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            Indicated interest (not committed): €{(indicatedCapital / 1_000_000).toFixed(2)}M across {indicatedInterests.length} project{indicatedInterests.length === 1 ? "" : "s"}. Indicated figures are not committed capital.
          </div>
        </section>
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-sm font-semibold">Pipeline by stage</h2>
          <div className="space-y-2.5">{funnel.map((item) => <div key={item.stage} className="flex items-center gap-3"><span className="w-28 shrink-0 text-xs text-muted-foreground">{item.label}</span><div className={cn("h-7 rounded-md py-1 text-xs font-semibold", item.value ? "bg-accent px-2.5 text-accent-foreground" : "text-muted-foreground")} style={{ width: `${item.value / maxFunnel * 100}%` }}>{item.value}</div></div>)}</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Conversion to close</p><p className="mt-1 font-display text-lg font-semibold">{overallConversion.toFixed(0)}%</p></div>
            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Median working days since introduction</p><p className="mt-1 font-display text-lg font-semibold">{medianDays} working days</p></div>
          </div>
        </section>
      </div>

      <div className="mb-7 grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="mb-4 font-display text-sm font-semibold">Mandate capacity</h2>
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Committed, not deployed</p><p className="mt-1 font-display text-lg font-semibold">€{((committedCapital - mandateDeployed) / 1_000_000).toFixed(1)}M</p></div>
            <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Deployed</p><p className="mt-1 font-display text-lg font-semibold">€{(mandateDeployed / 1_000_000).toFixed(1)}M</p></div>
            {investorProfile?.ticket_band && <div className="rounded-md bg-muted p-3"><p className="text-muted-foreground">Stated ticket band</p><p className="mt-1 font-display text-lg font-semibold">{TICKETS[investorProfile.ticket_band]}</p></div>}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground">A stated ticket band is not total mandate capacity. Committed and deployed amounts use saved indicated commitments.</p>
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
              <p className="mt-2 text-xs text-muted-foreground">{derisked.pct.toFixed(0)}% of committed capex (€{(derisked.totalCapex / 1_000_000).toFixed(1)}M) is covered by grant or public co-financing line items.</p>
            </div>
          )}
        </section>
      </div>
      <div className="mb-7"><ContingentCapexPanel rows={funding.rows} capexByProject={funding.capexByProject} scope={`Projects you are engaged with whose records are open to you (${funding.visibleProjects} of ${new Set(interests.map((interest) => interest.project_id)).size})`} /></div>

      </>}
      <div className="mb-5 flex gap-1.5 overflow-x-auto border-b border-border">
        {([['pipeline', 'Pipeline'], ['realised', 'Realised'], ['watch', 'Watchlist']] as const).map(([id, label]) => <Button key={id} variant="ghost" onClick={() => setTab(id)} className={cn("rounded-none border-b-2", tab === id ? "border-accent text-accent" : "border-transparent text-muted-foreground")}>{label}</Button>)}
      </div>

      {tab !== "watch" ? (
        <div className="space-y-3">
          {tab === "pipeline" ? <BeforeClosePanel rows={funding.rows.filter((row) => !realisedIds.has(row.projectId))} /> : <>
            <p className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">Realised positions show what was stated at underwriting. DHC Market does not record realised returns, valuations or cash received.</p>
            <RunningConditionsPanel rows={funding.rows.filter((row) => realisedIds.has(row.projectId))} />
          </>}
          {!dealList.length && <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">{tab === "realised" ? "No realised positions yet. A position moves here once financial close is confirmed." : "No deals in your pipeline yet."}</p>}
          {dealList.map((interest) => {
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
                  <div><h3 className="font-display font-semibold">{project.title}</h3><p className="mt-1 text-xs capitalize text-muted-foreground">{[[project.city, project.country_code].filter(Boolean).join(", "), stageLabel(interest.stage)].filter(Boolean).join(" | ")}</p></div>
                  <Button variant="outline" size="sm" onClick={() => navigate(`/app/projects/${project.public_ref}`)}>Open project</Button>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><TrendingUp className="h-4 w-4 text-accent" /> {dealRequest?.introduction_logged_at ? `Introduction logged ${fmtDate(introducedAt)}` : "No introduction logged yet"}</span>
                  <span>Days in stage: <strong className="text-foreground">{daysInStage}</strong></span>
                  {dealRequest?.introduction_logged_at && <span>Fee-tail expiry: <strong className="text-foreground">{fmtDate(feeTailExpiry)}</strong></span>}
                  {exclusivityExpiry && <span>Exclusivity expiry: <strong className="text-foreground">{fmtDate(exclusivityExpiry)}</strong></span>}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-muted-foreground">Owner<Input className="mt-1" value={owner} onChange={(event) => setOwner(interest.id, event.target.value)} /></label>
                  <label className="text-xs text-muted-foreground">Next action<Input className="mt-1" value={nextAction} onChange={(event) => setNextAction(interest.id, event.target.value)} /></label>
                </div>
                {projectCases.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {projectCases.filter((row) => row.equity_irr_pct != null || row.min_dscr != null).map((row) => <span key={row.id} className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">{[`${row.name} case at underwriting`, row.equity_irr_pct != null ? `target IRR ${Number(row.equity_irr_pct).toFixed(1)}%` : null, row.min_dscr != null ? `DSCR ${Number(row.min_dscr).toFixed(2)}x` : null].filter(Boolean).join(", ")}</span>)}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {!rows.length && <div className="flex flex-col items-center p-10 text-center"><FolderOpen className="mb-3 h-8 w-8 text-muted-foreground" /><p className="font-semibold">{tab === "watch" ? "Your watchlist is empty" : "No interests expressed yet"}</p><p className="mt-1 text-sm text-muted-foreground">Browse opportunities to start building your pipeline.</p><Button className="mt-4" onClick={() => navigate("/app")}>Browse projects</Button></div>}
          {rows.map((row) => { const project = projectById.get(row.project_id); if (!project) return null; const request = requests.find((item) => item.project_id === project.id); return <div key={row.id} className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4 last:border-0"><div><p className="font-semibold">{project.title}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{[project.technology.replace(/_/g, " "), project.capacity_mw != null ? `${project.capacity_mw} MW` : project.capacityBand, [project.city, project.country_code].filter(Boolean).join(", ")].filter(Boolean).join(" | ")}</p></div><div className="flex items-center gap-3"><span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{tab === "watch" ? <Heart className="h-3.5 w-3.5" /> : request && effectiveState(request) === "granted_full" ? <FolderOpen className="h-3.5 w-3.5 text-success" /> : <Building2 className="h-3.5 w-3.5" />}{tab === "watch" ? "Saved" : request ? ACCESS_STATE_LABEL[effectiveState(request)] : "Watchlisted"}</span>{tab !== "watch" && request && effectiveState(request) === "pending" && <span className="text-xs text-muted-foreground">{slaStatus(request).workingDays} working days pending</span>}<Button size="sm" variant="outline" onClick={() => navigate(`/app/projects/${project.public_ref}`)}>Open</Button></div></div>; })}
        </div>
      )}
    </div>
  );
};

export default InvestorDashboard;
