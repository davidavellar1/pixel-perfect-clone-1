import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Landmark, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Interest = Tables<"project_interest">;
type Project = Tables<"project">;
type Finance = Tables<"financial_summary">;
type CaseRow = Tables<"project_case">;

const Portfolio = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interests, setInterests] = useState<Interest[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [finance, setFinance] = useState<Finance[]>([]);
  const [cases, setCases] = useState<CaseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: interestRows } = await supabase
      .from("project_interest")
      .select("*")
      .eq("investor_user_id", user.id)
      .eq("stage", "financial_close")
      .order("updated_at", { ascending: false });
    const projectIds = (interestRows || []).map((row) => row.project_id);
    if (projectIds.length) {
      const [{ data: projectRows }, { data: financeRows }, { data: caseRows }] = await Promise.all([
        supabase.from("project").select("*").in("id", projectIds),
        supabase.from("financial_summary").select("*").in("project_id", projectIds),
        supabase.from("project_case").select("*").in("project_id", projectIds),
      ]);
      setProjects(projectRows || []);
      setFinance(financeRows || []);
      setCases(caseRows || []);
    } else {
      setProjects([]); setFinance([]); setCases([]);
    }
    setInterests(interestRows || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const financeByProject = useMemo(() => new Map(finance.map((row) => [row.project_id, row])), [finance]);
  const casesByProject = useMemo(() => {
    const map = new Map<string, CaseRow[]>();
    cases.forEach((row) => { const list = map.get(row.project_id) || []; list.push(row); map.set(row.project_id, list); });
    return map;
  }, [cases]);

  const closedProjects = interests.map((interest) => projectById.get(interest.project_id)).filter((project): project is Project => Boolean(project));
  const totalCapacity = closedProjects.reduce((sum, project) => sum + Number(project.capacity_mw), 0);
  const totalCapex = closedProjects.reduce((sum, project) => sum + Number(financeByProject.get(project.id)?.capex || project.headline_investment || 0), 0);

  return (
    <div className="max-w-[1240px]">
      <div className="mb-6">
        <h1 className="font-display text-[28px] font-semibold">Portfolio</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">Positions that have reached financial close.</p>
      </div>

      {!loading && !interests.length ? (
        <div className="flex flex-col items-center rounded-lg border border-border bg-card p-14 text-center">
          <PackageOpen className="mb-4 h-10 w-10 text-muted-foreground" />
          <p className="font-display text-lg font-semibold">No positions yet</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            Your portfolio stays empty until a deal from your pipeline reaches financial close. Once a project closes, it will
            appear here as a portfolio position.
          </p>
          <Button className="mt-5" variant="outline" onClick={() => navigate("../investor")}>View pipeline</Button>
        </div>
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border border-l-[3px] border-l-accent bg-card px-4 py-3.5">
              <p className="text-xs text-muted-foreground">Closed positions</p>
              <p className="mt-1.5 font-display text-xl font-semibold">{interests.length}</p>
            </div>
            <div className="rounded-lg border border-border border-l-[3px] border-l-accent bg-card px-4 py-3.5">
              <p className="text-xs text-muted-foreground">Capacity closed</p>
              <p className="mt-1.5 font-display text-xl font-semibold">{totalCapacity.toLocaleString()} MW</p>
            </div>
            <div className="rounded-lg border border-border border-l-[3px] border-l-accent bg-card px-4 py-3.5">
              <p className="text-xs text-muted-foreground">Capex closed</p>
              <p className="mt-1.5 font-display text-xl font-semibold">{totalCapex ? `\u20ac${(totalCapex / 1_000_000).toFixed(1)}M` : "\u20ac0"}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">developer-stated</p>
            </div>
          </div>

          <div className="space-y-3">
            {closedProjects.map((project) => {
              const interest = interests.find((row) => row.project_id === project.id);
              const projectCases = casesByProject.get(project.id) || [];
              return (
                <article key={project.id} className="rounded-lg border border-border bg-card p-5">
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h3 className="font-display font-semibold">{project.title}</h3>
                      <p className="mt-1 text-xs capitalize text-muted-foreground">{project.city}, {project.country_code} | Financial close {interest ? new Date(interest.updated_at).toLocaleDateString("en-GB") : ""}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/app/projects/${project.slug}`)}>Open project</Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Landmark className="h-4 w-4 text-accent" /> {project.capacity_mw} MW committed position
                  </div>
                  {projectCases.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {projectCases.map((row) => (
                        <span key={row.id} className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                          {row.name} case: {row.equity_irr_pct != null ? `${Number(row.equity_irr_pct).toFixed(1)}% IRR` : "IRR n/a"}
                          {row.min_dscr != null ? `, DSCR ${Number(row.min_dscr).toFixed(2)}x` : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default Portfolio;
