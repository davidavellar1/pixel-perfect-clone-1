import { ArrowRight, Building2, Heart, Landmark, Lock, MapPin } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { ProjectListing } from "@/hooks/useProjectListings";
import { isGranted } from "@/lib/access";

interface ProjectCardProps { project: ProjectListing; context: "public" | "app"; onWatchlistChange?: () => void; }
const money = (value: number) => `EUR ${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
const capacityBand = (mw: number) => mw < 10 ? "Under 10 MW" : mw < 25 ? "10-25 MW" : mw < 50 ? "25-50 MW" : "50+ MW";
const capexBand = (value: number | null) => value == null ? null : value < 15_000_000 ? "Under EUR 15M" : value < 30_000_000 ? "EUR 15-30M" : value < 50_000_000 ? "EUR 30-50M" : "EUR 50M+";
const stripe: Record<string, string> = { Expansion: "bg-accent", Modernization: "bg-warning", Greenfield: "bg-success", "New Construction": "bg-success" };

const Metric = ({ label, value, note }: { label: string; value: string; note?: string }) => <div className="min-w-0"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 truncate font-display text-sm font-semibold text-foreground">{value}</p>{note && <p className="mt-0.5 text-[10px] text-muted-foreground">{note}</p>}</div>;

const ProjectCard = ({ project, context, onWatchlistChange }: ProjectCardProps) => {
  const { user } = useAuth();
  const revealed = isGranted(project.accessState);
  const pending = project.accessState === "pending";
  const toggleWatchlist = async () => {
    if (!user) return;
    const result = project.watchlisted
      ? await supabase.from("watchlist_item").delete().eq("project_id", project.id).eq("user_id", user.id)
      : await supabase.from("watchlist_item").insert({ project_id: project.id, user_id: user.id });
    if (result.error) toast.error(result.error.message); else { toast.success(project.watchlisted ? "Removed from watchlist" : "Added to watchlist"); onWatchlistChange?.(); }
  };
  const title = revealed ? project.title : `${project.teaserTitle}, ${project.region}`;
  const location = revealed ? `${project.city}, ${project.country}` : project.region;
  const metrics = revealed
    ? [project.capacityMw ? { label: "Capacity", value: `${project.capacityMw} MW` } : null, project.capex ? { label: "Capex", value: money(project.capex) } : null, project.targetIrr != null ? { label: "Target IRR", value: `${project.targetIrr.toFixed(1)}%`, note: "developer-stated" } : null]
    : [{ label: "Capacity", value: capacityBand(project.capacityMw) }, capexBand(project.capex) ? { label: "Capex", value: capexBand(project.capex) as string } : null, project.offtakeLoadPct != null ? { label: "Offtake", value: `${project.offtakeLoadPct.toFixed(0)}% of load` } : null];
  const terms = revealed ? [project.equitySought ? { label: "Equity sought", value: money(project.equitySought) } : null, project.minTicket ? { label: "Minimum ticket", value: money(project.minTicket) } : null] : [];
  const href = context === "app" ? `/app/projects/${project.slug}` : "/sign-up?role=investor";
  return <article className="flex min-h-[390px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover">
    <div className={cn("h-1.5", stripe[project.category] || "bg-primary")} />
    <div className="flex flex-1 flex-col p-5">
      <div className="flex min-h-[54px] flex-wrap content-start gap-1.5">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">{project.category}</span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{project.stage}</span>
        <span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success">{project.generation}</span>
        {pending && <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[10px] font-semibold text-warning">Pending</span>}
        {project.publicSupport && <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success"><Landmark className="h-3 w-3" />Public co-finance</span>}
      </div>
      <h3 className="line-clamp-2 h-12 font-display text-lg font-semibold leading-6 text-foreground">{title}</h3>
      <p className="mt-1 flex h-7 items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{location}</p>
      <p className="mt-2 flex h-6 items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{project.technology}</p>
      <div className="mt-4 grid grid-cols-3 gap-3 border-y border-border py-4">{metrics.filter(Boolean).map((metric) => metric && <Metric key={metric.label} {...metric} />)}</div>
      {terms.some(Boolean) && <div className="grid grid-cols-2 gap-3 py-3">{terms.filter(Boolean).map((metric) => metric && <Metric key={metric.label} {...metric} />)}</div>}
      <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
        <Button variant="outline" className="flex-1 justify-between" asChild><Link to={href}>{context === "public" ? "Create account" : "View project"}<ArrowRight className="h-4 w-4" /></Link></Button>
        {context === "app" && <Button type="button" variant="outline" size="icon" aria-label={project.watchlisted ? "Remove from watchlist" : "Add to watchlist"} title={project.watchlisted ? "Remove from watchlist" : "Add to watchlist"} onClick={toggleWatchlist}><Heart className={cn("h-4 w-4", project.watchlisted && "fill-accent text-accent")} /></Button>}
      </div>
      {!revealed && <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Lock className="h-3 w-3" />Identity and exact figures are locked</p>}
    </div>
  </article>;
};
export default ProjectCard;
