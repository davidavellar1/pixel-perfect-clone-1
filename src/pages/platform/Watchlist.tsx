import { useMemo, useState } from "react";
import { AlertCircle, Heart } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProjectCard from "@/components/project/ProjectCard";
import { useProjectListings } from "@/hooks/useProjectListings";
import { useWatchlist } from "@/hooks/useWatchlist";

const GRID = "grid gap-5 md:grid-cols-2 xl:grid-cols-3";

const CardSkeleton = () => (
  <div
    className="flex min-h-[390px] flex-col overflow-hidden rounded-lg border border-border bg-card p-5"
    aria-hidden="true"
  >
    <div className="flex gap-1.5">
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="mt-5 h-6 w-4/5" />
    <Skeleton className="mt-2 h-4 w-2/5" />
    <Skeleton className="mt-3 h-4 w-1/3" />
    <div className="mt-5 grid grid-cols-3 gap-3 border-y border-border py-4">
      <Skeleton className="h-9" />
      <Skeleton className="h-9" />
      <Skeleton className="h-9" />
    </div>
    <Skeleton className="mt-auto h-10 w-full" />
  </div>
);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

const Watchlist = () => {
  const {
    projects,
    loading: projectsLoading,
    error: projectsError,
    reload: reloadProjects,
  } = useProjectListings();
  const watchlist = useWatchlist();
  const [clearing, setClearing] = useState(false);

  const loading = projectsLoading || watchlist.loading;
  const error = watchlist.error || projectsError;

  // Newest saved first, keeping only projects that are still listed and visible to this user.
  const { saved, unlistedIds } = useMemo(() => {
    const byId = new Map(projects.map((p) => [p.id, p]));
    const list = watchlist.items.flatMap((item) => {
      const project = byId.get(item.project_id);
      return project ? [project] : [];
    });
    const missing = watchlist.items
      .filter((item) => !byId.has(item.project_id) && !item.id.startsWith("pending-"))
      .map((item) => item.project_id);
    return { saved: list, unlistedIds: missing };
  }, [projects, watchlist.items]);

  const retry = () => {
    void watchlist.reload();
    void reloadProjects();
  };

  const clearUnlisted = async () => {
    setClearing(true);
    const results = await Promise.all(unlistedIds.map((id) => watchlist.remove(id)));
    setClearing(false);
    const failed = results.filter((r) => !r.ok).length;
    if (failed)
      toast.error(`Couldn't remove ${plural(failed, "saved project")}. Please try again.`);
    else toast.success("Removed projects that are no longer listed");
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase text-accent">My workspace</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="font-display text-3xl font-semibold text-foreground">Watchlist</h1>
          {!loading && !error && (
            <span className="text-sm font-medium text-muted-foreground">
              {plural(saved.length, "project")}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Projects you're tracking. You'll see changes to their status here.
        </p>
      </header>

      {error && !loading ? (
        <div
          role="alert"
          className="flex flex-col items-center rounded-lg border border-border bg-card px-6 py-14 text-center"
        >
          <AlertCircle className="mb-3 h-8 w-8 text-destructive" />
          <p className="font-display font-semibold text-foreground">
            We couldn't load your watchlist
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
          <Button variant="outline" className="mt-5" onClick={retry}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className={GRID} aria-busy="true" aria-label="Loading your watchlist">
          {[0, 1, 2].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {unlistedIds.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
              <span>
                {plural(unlistedIds.length, "saved project")}{" "}
                {unlistedIds.length === 1 ? "is" : "are"} no longer listed.
              </span>
              <Button variant="ghost" size="sm" onClick={clearUnlisted} disabled={clearing}>
                {clearing ? "Removing…" : unlistedIds.length === 1 ? "Remove it" : "Remove them"}
              </Button>
            </div>
          )}

          {saved.length ? (
            <div className={GRID}>
              {saved.map((project) => (
                <ProjectCard key={project.id} project={project} context="app" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                <Heart className="h-5 w-5 text-accent" />
              </span>
              <p className="font-display text-lg font-semibold text-foreground">
                Your watchlist is empty
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Tap the heart on any opportunity to save it here.
              </p>
              <Button className="mt-5 bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link to="/app/opportunities">Browse opportunities</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Watchlist;
