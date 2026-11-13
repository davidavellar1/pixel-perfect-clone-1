import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/project/ProjectCard";
import { useProjectListings } from "@/hooks/useProjectListings";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { effectiveState, isGranted } from "@/lib/access";
import { FEE_SENTENCE } from "@/lib/fee";
import type { Tables } from "@/integrations/supabase/types";

export default function WorkspaceOverview() {
  const { user } = useAuth();
  const { projects, loading, error } = useProjectListings();
  const [requests, setRequests] = useState<Tables<"access_request">[] | null>(null);
  const [requestError, setRequestError] = useState(false);
  useEffect(() => {
    if (!user) return;
    let active = true;
    void supabase.from("access_request").select("*").eq("investor_user_id", user.id).then(({ data, error }) => {
      if (!active) return; setRequestError(Boolean(error)); setRequests(error ? null : data ?? []);
    });
    return () => { active = false; };
  }, [user?.id]);
  const states = requests?.map(request => effectiveState(request)) ?? [];
  const granted = states.filter(isGranted).length;
  const rooms = states.filter(state => state === "granted_full").length;
  const position = rooms ? 3 : granted ? 2 : states.some(state => state === "pending") ? 1 : 0;
  return <div className="space-y-8">
    <h1 className="font-display text-3xl font-semibold">Overview</h1>
    <section className="space-y-4 border-b border-border pb-6">
      <h2 className="font-display text-lg font-semibold">Your access ladder</h2>
      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["Anonymized teaser", "Interest and signed NDA", "Developer accepts access", "Separate data room approval"].map((label, index) => <li key={label} className="border-t-2 border-border pt-3">
        <span className="text-xs text-muted-foreground">Step {index + 1}{requests && position === index ? " - Your current position" : ""}</span><p className="mt-1 text-sm font-semibold text-foreground">{label}</p>
      </li>)}</ol>
      {requestError ? <p role="alert">Could not load your activity.</p> : <dl className="flex flex-wrap gap-8">{[["Requests sent", requests?.length], ["Awaiting decision", requests ? states.filter(state => state === "pending").length : undefined], ["Access granted", requests ? granted : undefined], ["Data rooms open", requests ? rooms : undefined]].map(([label, count]) => <div key={label}><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-display text-xl font-semibold">{count ?? "Loading..."}</dd></div>)}</dl>}
      {Boolean(requests?.length) && <Button variant="outline" asChild><Link to="/app/my-deals/investing">View your pipeline and analytics</Link></Button>}
    </section>
    <section className="space-y-3">
      <h2 className="font-display text-lg font-semibold">When you express interest</h2>
      <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">A short form and signed NDA go to the developer. They decide, typically within three working days. Nothing is revealed until they accept, and the NDA becomes operative only then. The data room requires a separate approval. No fee is due until a financial close.</p>
      <p className="max-w-3xl text-sm text-muted-foreground">{FEE_SENTENCE}</p>
    </section>
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Opportunities</h2><Button variant="outline" asChild><Link to="/app/opportunities">All opportunities</Link></Button></div>
      {error ? <p role="alert">Could not load opportunities.</p> : loading ? <p>Loading listings...</p> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{projects.slice(0, 6).map(project => <ProjectCard key={project.id} project={project} context="app" />)}</div>}
    </section>
  </div>;
}