import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Check, Clock, ExternalLink, FileText, Lock, Plus, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { ACCESS_STATE_LABEL, stageIndex } from "@/lib/access";
import ManageDocumentsDialog from "@/components/project/ManageDocumentsDialog";
import ManageAdvisorsDialog from "@/components/project/ManageAdvisorsDialog";
import ManageTechnicalDialog from "@/components/project/ManageTechnicalDialog";

type Interest = Tables<"project_interest">;
type Request = Tables<"access_request">;
type Project = Tables<"project">;

const StatBox = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-background p-4">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
  </div>
);

const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: profile } = await supabase.from("developer_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!profile) {
      setLoading(false);
      return;
    }
    const { data: owned } = await supabase.from("project").select("*").eq("developer_id", profile.id).order("created_at", { ascending: false });
    const projectRows = owned || [];
    setProjects(projectRows);
    const ids = projectRows.map((project) => project.id);
    if (!ids.length) {
      setInterests([]);
      setRequests([]);
      setLoading(false);
      return;
    }
    const [{ data: interestRows }, { data: requestRows }] = await Promise.all([
      supabase.from("project_interest").select("*").in("project_id", ids).order("introduced_at", { ascending: false }),
      supabase.from("access_request").select("*").in("project_id", ids).order("submitted_at", { ascending: false }),
    ]);
    setInterests(interestRows || []);
    setRequests(requestRows || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const interestedBuyers = new Set(interests.map((interest) => interest.investor_user_id)).size;
  const activeDeals = interests.filter((interest) => stageIndex(interest.stage) >= stageIndex("access_granted")).length;

  // Decisions are taken on the dedicated review screen so the full agreement record is written.



  return (
    <div className="max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">My Listings</h1>
          <p className="mt-1 text-muted-foreground">Manage live projects, review access requests, and decide who sees your listing.</p>
        </div>
        <Button asChild><Link to="/app/submit-project"><Plus className="h-4 w-4" /> New listing</Link></Button>
      </div>

      <section className="rounded-lg border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-semibold">Seller area</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <StatBox label="Opportunities live" value={loading ? "..." : String(projects.filter((project) => project.visibility === "listed").length)} />
          <StatBox label="Interested buyers" value={loading ? "..." : String(interestedBuyers)} />
          <StatBox label="Active deals" value={loading ? "..." : String(activeDeals)} />
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Access requests</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{requests.filter((request) => request.state === "pending").length} awaiting your decision</span>
            <Button size="sm" variant="outline" asChild><Link to="/app/access-requests">Open review screen</Link></Button>
          </div>
        </div>
        <div className="space-y-3">
          {!requests.length && <p className="rounded-md bg-muted p-5 text-sm text-muted-foreground">No investors have sent an access request yet. Nothing on your listings is revealed until you accept one.</p>}
          {requests.slice(0, 5).map((request) => {
            const project = projectById.get(request.project_id);
            return (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-4 rounded-md border border-border bg-background px-5 py-4">
                <div>
                  <p className="font-semibold">{project?.title || "Project"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Submitted {new Date(request.submitted_at).toLocaleDateString("en-GB")}</p>
                </div>
                {request.state === "pending" ? (
                  <Button size="sm" asChild>
                    <Link to={`/app/access-requests?request=${request.id}`}><Clock className="h-4 w-4" /> Review request</Link>
                  </Button>
                ) : request.state === "granted" ? (
                  <Button size="sm" asChild>
                    <Link to={`/app/data-room-requests?request=${request.id}`}><Lock className="h-4 w-4" /> Review data room</Link>
                  </Button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold capitalize text-muted-foreground">
                    {request.state.startsWith("granted") ? <Check className="h-3.5 w-3.5 text-success" /> : <X className="h-3.5 w-3.5" />}{ACCESS_STATE_LABEL[request.state]}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border border-border bg-card p-6 shadow-card">
        <h2 className="mb-4 font-display text-lg font-semibold">Published projects and deal funnel</h2>
        <div className="space-y-3">
          {!projects.length && !loading && <p className="rounded-md bg-muted p-5 text-sm text-muted-foreground">No listings yet. Publish your first project to start receiving interest.</p>}
          {projects.map((project) => {
            const projectInterests = interests.filter((interest) => interest.project_id === project.id);
            const projectRequests = requests.filter((request) => request.project_id === project.id);
            return (
              <article key={project.id} className="rounded-md border border-border bg-background p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><h3 className="font-display font-semibold">{project.title}</h3><p className="mt-1 text-xs capitalize text-muted-foreground">{project.city}, {project.country_code} | {project.lifecycle_stage.replace(/_/g, " ")} | {project.capacity_mw} MW</p></div>
                  <div className="flex items-center gap-2">
                    <ManageDocumentsDialog
                      projectId={project.id}
                      projectTitle={project.title}
                      trigger={<Button size="sm" variant="outline"><FileText className="h-3.5 w-3.5" /> Documents</Button>}
                    />
                    <ManageAdvisorsDialog
                      projectId={project.id}
                      projectTitle={project.title}
                      trigger={<Button size="sm" variant="outline"><Users className="h-3.5 w-3.5" /> Advisors</Button>}
                    />
                    <Button size="sm" variant="outline" asChild><Link to={`/app/projects/${project.slug}`}>Open <ExternalLink className="h-3.5 w-3.5" /></Link></Button>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <StatBox label="Interest submitted" value={String(projectInterests.length)} />
                  <StatBox label="Access requests" value={String(projectRequests.length)} />
                  <StatBox label="Access granted" value={String(projectRequests.filter((request) => request.state === "granted" || request.state === "granted_full").length)} />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default DeveloperDashboard;