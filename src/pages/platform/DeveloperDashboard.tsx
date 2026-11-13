import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { AlertCircle, Clock, FileText, Gauge, ListChecks, Lock, Mail, Plus, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { effectiveState, slaStatus, stageIndex } from "@/lib/access";
import { TECHNOLOGIES } from "@/lib/profileSettings";
import { cn } from "@/lib/utils";
import StatTile from "@/components/platform/StatTile";
import DealsSwitch from "@/components/platform/DealsSwitch";
import ManageDocumentsDialog from "@/components/project/ManageDocumentsDialog";
import ManageAdvisorsDialog from "@/components/project/ManageAdvisorsDialog";
import ManageTechnicalDialog from "@/components/project/ManageTechnicalDialog";

type Interest = Tables<"project_interest">;
type Request = Tables<"access_request">;
type Project = Tables<"project">;

const VISIBILITY: Record<Project["visibility"], { label: string; className: string }> = {
  listed: { label: "Listed", className: "bg-success-soft text-[#137347]" },
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  archived: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setFailed(false);
    try {
      const { data: profile, error: profileError } = await supabase.from("developer_profiles").select("id").eq("user_id", user.id).maybeSingle();
      if (profileError) throw profileError;
      if (!profile) {
        setProjects([]); setInterests([]); setRequests([]);
        return;
      }
      const { data: owned, error: ownedError } = await supabase.from("project").select("*").eq("developer_id", profile.id).order("created_at", { ascending: false });
      if (ownedError) throw ownedError;
      const projectRows = owned || [];
      setProjects(projectRows);
      const ids = projectRows.map((project) => project.id);
      if (!ids.length) {
        setInterests([]); setRequests([]);
        return;
      }
      const [interestResult, requestResult] = await Promise.all([
        supabase.from("project_interest").select("*").in("project_id", ids).order("introduced_at", { ascending: false }),
        supabase.from("access_request").select("*").in("project_id", ids).order("submitted_at", { ascending: true }),
      ]);
      if (interestResult.error) throw interestResult.error;
      if (requestResult.error) throw requestResult.error;
      setInterests(interestResult.data || []);
      setRequests(requestResult.data || []);
    } catch (error) {
      console.error("Could not load listings", error);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const interestedInvestors = new Set(interests.map((interest) => interest.investor_user_id)).size;
  const activeDeals = interests.filter((interest) => stageIndex(interest.stage) >= stageIndex("access_granted")).length;
  const liveCount = projects.filter((project) => project.visibility === "listed").length;
  const pending = requests.filter((request) => effectiveState(request) === "pending");
  // Access granted but the full data room not yet released: also waiting on the lister.
  const roomReviews = requests.filter((request) => request.state === "granted");

  const stat = (value: number) => (loading ? "…" : String(value));

  return (
    <div className="max-w-[1100px] space-y-5">
      <DealsSwitch />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold text-foreground">Listing</h1>
          <p className="mt-1 text-[15px] text-muted-foreground">Projects you have listed and the investors interested in them.</p>
        </div>
      </div>

      {failed && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-5 py-4 text-sm">
          <span className="flex items-center gap-2 text-foreground"><AlertCircle className="h-4 w-4 text-destructive" aria-hidden="true" />We couldn't load your listings.</span>
          <Button size="sm" variant="outline" onClick={() => void load()}><RefreshCw className="h-4 w-4" />Try again</Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-5 shadow-card lg:col-span-2">
          <h2 className="font-display text-base font-semibold">Listing performance</h2>
          <p className="mb-4 mt-1 text-[13px] text-muted-foreground">Across all your projects</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile icon={ListChecks} label="Projects live" value={stat(liveCount)} />
            <StatTile icon={Mail} label="Interested investors" value={stat(interestedInvestors)} />
            <StatTile icon={Lock} label="Investors with access" value={stat(activeDeals)} tone="success" />
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-base font-semibold">Needs your answer</h2>
            <Link to="/app/access-requests" className="text-[13px] font-medium text-primary hover:underline">All requests</Link>
          </div>
          <div className="mt-3 space-y-2.5">
            {loading ? <><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></> : !pending.length && !roomReviews.length ? (
              <p className="py-6 text-center text-[13px] text-muted-foreground">Nothing is waiting on you.</p>
            ) : (
              <>
                {pending.slice(0, 3).map((request) => {
                  const sla = slaStatus(request);
                  return <Link key={request.id} to={`/app/access-requests?request=${request.id}`} className="flex gap-2.5 rounded-lg bg-[#fdf3e1] p-3 text-[13px] leading-snug transition-colors hover:bg-[#fbe9c8]">
                    <Clock className="mt-0.5 h-4 w-4 flex-none text-[#8a5a12]" aria-hidden="true" />
                    <span><strong className="font-semibold">Access request</strong> on {projectById.get(request.project_id)?.title || "your listing"}<span className="mt-0.5 block text-xs text-[#4f5d70]">Pending {sla.workingDays} working day{sla.workingDays === 1 ? "" : "s"}</span></span>
                  </Link>;
                })}
                {roomReviews.slice(0, Math.max(0, 3 - pending.length)).map((request) => (
                  <Link key={request.id} to={`/app/data-room-requests?request=${request.id}`} className="flex gap-2.5 rounded-lg bg-surface-2 p-3 text-[13px] leading-snug transition-colors hover:bg-muted">
                    <Lock className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                    <span><strong className="font-semibold">Data room</strong> decision on {projectById.get(request.project_id)?.title || "your listing"}<span className="mt-0.5 block text-xs text-[#4f5d70]">Identity shared, full access not yet released</span></span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-card">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-semibold">Your projects</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Drafts and published listings, with investor interest on each.</p>
          </div>
          <Button asChild size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/5"><Link to="/app/submit-project"><Plus className="h-4 w-4" />New listing</Link></Button>
        </div>

        {loading ? (
          <div className="space-y-2" aria-hidden="true"><Skeleton className="h-11 w-full" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-full" /></div>
        ) : !projects.length && !failed ? (
          <div className="rounded-lg border border-dashed border-border px-6 py-10 text-center">
            <p className="font-display text-lg font-semibold">List your first project</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Listings stay anonymous until you accept an investor's request. It's free, and you can save a draft at any step.</p>
            <Button asChild className="mt-4"><Link to="/app/submit-project"><Plus className="h-4 w-4" />List a project</Link></Button>
          </div>
        ) : (
          <div className="relative overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[820px] border-collapse text-[13px]">
              <thead>
                <tr className="bg-background text-left text-[#4f5d70]">
                  <th scope="col" className="px-3.5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-3.5 py-3 font-semibold">Project</th>
                  <th scope="col" className="px-3.5 py-3 font-semibold">Technology</th>
                  <th scope="col" className="px-3.5 py-3 font-semibold">Capacity</th>
                  <th scope="col" className="px-3.5 py-3 font-semibold">Location</th>
                  <th scope="col" className="px-3.5 py-3 font-semibold">Interest</th>
                  <th scope="col" className="px-3.5 py-3 font-semibold">Requests</th>
                  <th scope="col" className="px-3.5 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const projectInterests = interests.filter((interest) => interest.project_id === project.id).length;
                  const projectPending = pending.filter((request) => request.project_id === project.id).length;
                  const status = VISIBILITY[project.visibility];
                  return (
                    <tr key={project.id} className="border-t border-border">
                      <td className="px-3.5 py-3.5"><span className={cn("inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold", status.className)}>{status.label}</span></td>
                      <td className="px-3.5 py-3.5 font-semibold text-foreground">{project.title}</td>
                      <td className="px-3.5 py-3.5 text-[#4f5d70]">{TECHNOLOGIES[project.technology] || project.technology}</td>
                      <td className="px-3.5 py-3.5 text-[#4f5d70]">{project.capacity_mw != null ? `${project.capacity_mw} MW` : "—"}</td>
                      <td className="px-3.5 py-3.5 text-[#4f5d70]">{[project.city, project.country_code].filter(Boolean).join(", ") || "—"}</td>
                      <td className="px-3.5 py-3.5">{projectInterests}</td>
                      <td className="px-3.5 py-3.5">{projectPending ? <span className="inline-block whitespace-nowrap rounded-full bg-[#fdf3e1] px-2.5 py-0.5 text-[11px] font-semibold text-[#8a5a12]">{projectPending} pending</span> : <span className="text-[#4f5d70]">—</span>}</td>
                      <td className="px-3.5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="outline" asChild><Link to={`/app/projects/${project.slug}`}>Open</Link></Button>
                          <ManageDocumentsDialog projectId={project.id} projectTitle={project.title} trigger={<Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Documents for ${project.title}`} title="Documents"><FileText className="h-4 w-4" /></Button>} />
                          <ManageAdvisorsDialog projectId={project.id} projectTitle={project.title} trigger={<Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Advisors for ${project.title}`} title="Advisors"><Users className="h-4 w-4" /></Button>} />
                          <ManageTechnicalDialog projectId={project.id} projectTitle={project.title} trigger={<Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Technical details for ${project.title}`} title="Technical details"><Gauge className="h-4 w-4" /></Button>} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default DeveloperDashboard;
