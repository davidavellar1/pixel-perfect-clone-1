import { ArrowRight, Building2, Heart, Landmark, Lock, MapPin } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { toast } from "sonner";
import type { ProjectListing } from "@/hooks/useProjectListings";
import { isGranted } from "@/lib/access";

interface ProjectCardProps { project: ProjectListing; context: "public" | "app"; onWatchlistChange?: (watchlisted: boolean) => void; }
import { capacityBand, capexBand } from "@/lib/bands";
const stripe: Record<string, string> = { Expansion: "bg-accent", Modernization: "bg-warning", Greenfield: "bg-success", "New Construction": "bg-success" };

const Metric = ({ label, value, note }: { label: string; value: string; note?: string }) => <div className="min-w-0"><p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p><p className="mt-1 truncate font-display text-sm font-semibold text-foreground">{value}</p>{note && <p className="mt-0.5 text-[10px] text-muted-foreground">{note}</p>}</div>;

const ProjectCard = ({ project, context, onWatchlistChange }: ProjectCardProps) => {
  const { user } = useAuth();
  const revealed = isGranted(project.accessState);
  const pending = project.accessState === "pending";
  const watchlist = useWatchlist();
  const watchlisted = watchlist.has(project.id);
  const toggleWatchlist = async () => {
    if (!user) return;
    if (watchlisted) {
      const result = await watchlist.remove(project.id);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Removed from watchlist", { action: { label: "Undo", onClick: () => { void watchlist.add(project.id); } } });
      onWatchlistChange?.(false);
    } else {
      const result = await watchlist.add(project.id);
      if (!result.ok) { toast.error(result.error); return; }
      toast.success("Added to watchlist");
      onWatchlistChange?.(true);
    }
  };
  const title = `${project.teaserTitle}, ${project.region}`;
  const location = project.region;
  const metrics = [
    { label: "Capacity", value: project.capacityBand ?? capacityBand(project.capacityMw) },
    { label: "Capex", value: project.capexBand ?? capexBand(project.capex) ?? "" },
    { label: "Lifecycle stage", value: project.stage },
  ];
  const href = context === "app" ? `/app/projects/${project.slug}` : "/sign-up";
  return <article className="flex min-h-[390px] flex-col overflow-hidden rounded-lg border border-border bg-card shadow-card transition-shadow hover:shadow-card-hover">
    <div className={cn("h-1.5", stripe[project.category] || "bg-primary")} />
    <div className="flex flex-1 flex-col p-5">
      <div className="flex min-h-[54px] flex-wrap content-start gap-1.5">
        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-semibold text-secondary-foreground">{project.category}</span>
        <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{project.stage}</span>
        <span className="rounded-full bg-success/10 px-2.5 py-1 text-[10px] font-semibold text-success">{project.generation}</span>
        {pending && <span className="rounded-full bg-warning/15 px-2.5 py-1 text-[10px] font-semibold text-warning">Pending</span>}

      </div>
      <h3 className="line-clamp-2 min-h-[2lh] shrink-0 font-display text-lg font-semibold leading-6 text-foreground">{title}</h3>
      <p className="mt-1 flex h-7 items-start gap-1.5 text-xs text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{location}</p>
      <p className="mt-2 flex h-6 items-center gap-1.5 text-xs text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{project.technology}</p>
      <div className="mt-4 grid grid-cols-3 gap-3 border-y border-border py-4">{metrics.map((metric) => <Metric key={metric.label} {...metric} />)}</div>
      {project.offtakeLoadPct != null && <div className="py-3"><Metric label="Offtake committed" value={`${project.offtakeLoadPct.toFixed(0)}% of design load`} note="developer-stated" /></div>}
      {project.minTicketBand && <div className="pb-3"><Metric label="Minimum ticket" value={project.minTicketBand} /></div>}
      <p className="mb-4 text-[11px] text-muted-foreground">{project.transactionTermsPublished ? "Transaction terms published" : "Terms not yet published, expressions of interest are indicative"}</p>
      <div className="mt-auto flex items-center gap-2 border-t border-border pt-4">
        <Button variant="outline" className="flex-1 justify-between" asChild><Link to={href}>{context === "public" ? "Create account" : "View project"}<ArrowRight className="h-4 w-4" /></Link></Button>
        {context === "app" && <Button type="button" variant="outline" size="icon" aria-label={watchlisted ? "Remove from watchlist" : "Add to watchlist"} aria-pressed={watchlisted} title={watchlisted ? "Remove from watchlist" : "Add to watchlist"} onClick={toggleWatchlist}><Heart className={cn("h-4 w-4", watchlisted && "fill-accent text-accent")} /></Button>}
      </div>
      {!revealed && <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Lock className="h-3 w-3" />Identity and exact figures are locked</p>}
    </div>
  </article>;
};
export default ProjectCard;
