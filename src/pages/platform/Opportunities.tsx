import { useMemo, useState } from "react";
import { Filter, Grid3X3, Map, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/project/ProjectCard";
import { useProjectListings } from "@/hooks/useProjectListings";
import { useAppShell } from "@/contexts/AppShellContext";
import { INSTRUMENT_LABEL } from "@/data/investorGrade";
import { cn } from "@/lib/utils";

const SelectFilter = ({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: string[] }) => <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground"><span>{label}</span><select className="h-10 rounded-md border border-input bg-background px-3 text-sm font-normal text-foreground" value={value} onChange={(event) => setValue(event.target.value)}><option value="all">All</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;

const Opportunities = () => {
  const { projects, loading, reload } = useProjectListings();
  const { collapsed } = useAppShell();
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "map">("grid");
  const [country, setCountry] = useState("all"); const [technology, setTechnology] = useState("all"); const [stage, setStage] = useState("all");
  const [capacity, setCapacity] = useState("all"); const [capex, setCapex] = useState("all"); const [ticket, setTicket] = useState("all"); const [instrument, setInstrument] = useState("all");
  const values = (key: "country" | "technology" | "stage") => Array.from(new Set(projects.map((p) => p[key]))).sort();
  const filtered = useMemo(() => projects.filter((project) => {
    const q = query.trim().toLowerCase(); const searchable = `${project.title} ${project.teaserTitle} ${project.city} ${project.region} ${project.country} ${project.technology}`.toLowerCase();
    const capacityMatch = capacity === "all" || (capacity === "under10" && project.capacityMw < 10) || (capacity === "10to25" && project.capacityMw >= 10 && project.capacityMw < 25) || (capacity === "25to50" && project.capacityMw >= 25 && project.capacityMw < 50) || (capacity === "50plus" && project.capacityMw >= 50);
    const capexMatch = capex === "all" || (capex === "under15" && project.capex != null && project.capex < 15e6) || (capex === "15to30" && project.capex != null && project.capex >= 15e6 && project.capex < 30e6) || (capex === "30to50" && project.capex != null && project.capex >= 30e6 && project.capex < 50e6) || (capex === "50plus" && project.capex != null && project.capex >= 50e6);
    const ticketMatch = ticket === "all" || (ticket === "under1" && project.minTicket != null && project.minTicket < 1e6) || (ticket === "1to5" && project.minTicket != null && project.minTicket >= 1e6 && project.minTicket <= 5e6) || (ticket === "over5" && project.minTicket != null && project.minTicket > 5e6);
    return (!q || searchable.includes(q)) && (country === "all" || project.country === country) && (technology === "all" || project.technology === technology) && (stage === "all" || project.stage === stage) && capacityMatch && capexMatch && ticketMatch && (instrument === "all" || project.instrument === instrument);
  }), [projects, query, country, technology, stage, capacity, capex, ticket, instrument]);

  return <div className="mx-auto w-full max-w-[1180px] space-y-6">
    <header><p className="text-xs font-semibold uppercase text-accent">Discover</p><h1 className="mt-2 font-display text-3xl font-semibold text-foreground">Opportunities</h1><p className="mt-2 text-sm text-muted-foreground">Compare live district heating and cooling projects across Europe.</p></header>
    <section className="border-y border-border py-5"><div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4" />Filter opportunities</div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1.5 text-xs font-semibold text-muted-foreground sm:col-span-2"><span>Search</span><span className="relative"><Search className="absolute left-3 top-3 h-4 w-4" /><Input className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Technology, region, or project" /></span></label>
      <SelectFilter label="Country" value={country} setValue={setCountry} options={values("country")} /><SelectFilter label="Technology" value={technology} setValue={setTechnology} options={values("technology")} />
      <SelectFilter label="Stage" value={stage} setValue={setStage} options={values("stage")} /><SelectFilter label="Capacity" value={capacity} setValue={setCapacity} options={["under10","10to25","25to50","50plus"]} />
      <SelectFilter label="Capex" value={capex} setValue={setCapex} options={["under15","15to30","30to50","50plus"]} /><SelectFilter label="Minimum ticket" value={ticket} setValue={setTicket} options={["under1","1to5","over5"]} />
      <SelectFilter label="Instrument" value={instrument} setValue={setInstrument} options={Object.keys(INSTRUMENT_LABEL)} />
    </div></section>
    <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 py-3 backdrop-blur"><p className="text-sm text-muted-foreground">{loading ? "Loading opportunities..." : `${filtered.length} result${filtered.length === 1 ? "" : "s"}`}</p><div className="flex rounded-md border border-border p-1"><Button size="sm" variant={view === "grid" ? "secondary" : "ghost"} onClick={() => setView("grid")}><Grid3X3 />Grid</Button><Button size="sm" variant={view === "map" ? "secondary" : "ghost"} onClick={() => setView("map")}><Map />Map</Button></div></div>
    {view === "map" ? <div className="flex min-h-[460px] items-center justify-center border border-border bg-muted/40 text-sm text-muted-foreground">Map view is being prepared.</div> : <div className={cn("grid gap-5", collapsed ? "sm:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 min-[1500px]:grid-cols-3")}>{filtered.map((project) => <ProjectCard key={project.id} project={project} context="app" onWatchlistChange={reload} />)}</div>}
    {!loading && !filtered.length && <p className="py-16 text-center text-sm text-muted-foreground">No opportunities match these filters.</p>}
  </div>;
};
export default Opportunities;
