import { useMemo, useState, useId } from "react";
import { Filter, Grid3X3, Map, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/components/ui/sidebar";
import ProjectCard from "@/components/project/ProjectCard";
import { useProjectListings } from "@/hooks/useProjectListings";
import { INSTRUMENT_LABEL } from "@/data/investorGrade";
import { cn } from "@/lib/utils";
import { compareMissingLast } from "@/lib/opportunitySort";
import { Checkbox } from "@/components/ui/checkbox";
import { STAGES,STAGE_LABELS } from "@/lib/submission/stageSchema";
import { publishedBandRange } from "@/lib/bands";

function SelectFilter({ label, value, setValue, options }: { label: string; value: string; setValue: (value: string) => void; options: Record<string, string> }) {
  const id = useId();
  return <div className="space-y-1.5"><Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label><Select value={value} onValueChange={setValue}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem>{Object.entries(options).map(([key, text]) => <SelectItem key={key} value={key}>{text}</SelectItem>)}</SelectContent></Select></div>;
}
const bandLabel = (key: string, value: string) => {
  const numbers = value.match(/\d+/g)?.map(Number) ?? [];
  if (!numbers.length || value.includes(" ")) return value;
  const unit = key === "capacityBand" ? " MW" : "M";
  const prefix = key === "capacityBand" ? "" : "EUR ";
  const range = value.startsWith("under") ? `Under ${prefix}${numbers[0]}${unit}` : value.startsWith("over") ? `${prefix}${numbers[0]}${unit}+` : `${prefix}${numbers.join("-")}${unit}`;
  return range;
};
export default function Opportunities() {
  const { projects, loading, error } = useProjectListings();
  const { state } = useSidebar();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({ country: "all", technology: "all", capacityBand: "all", capexBand: "all", minTicketBand: "all", instrument: "all", category:"all", equitySoughtBand:"all" });
  const [sort, setSort] = useState("close");
  const [stages,setStages]=useState<string[]>([...STAGES]);
  const [terms,setTerms]=useState(false);const [study,setStudy]=useState(false);const [awarded,setAwarded]=useState(false);const [contracted,setContracted]=useState("");
  const activeCount = Object.values(filters).filter(v => v !== "all").length + (query.trim() ? 1 : 0)+Number(terms)+Number(study)+Number(awarded)+Number(Boolean(contracted))+Number(stages.length!==5);
  const clear = () => { setStages([...STAGES]);setTerms(false);setStudy(false);setAwarded(false);setContracted("");setQuery(""); setFilters(Object.fromEntries(Object.keys(filters).map(k => [k, "all"]))); };
  const filtered = useMemo(() => {
    const rows = projects.filter(project => stages.includes(project.stage.toLowerCase()) && (!terms||project.transactionTermsPublished) && (!study||project.feasibilityComplete) && (!awarded||project.publicFundingAwarded) && (!contracted||project.newLoadContractedPct!==null&&project.newLoadContractedPct!==undefined&&project.newLoadContractedPct>=Number(contracted)) && (!query.trim() || `${project.title} ${project.technology} ${project.country}`.toLowerCase().includes(query.trim().toLowerCase())) && Object.entries(filters).every(([key, value]) => value === "all" || project[key as keyof typeof project] === value));
    if (sort === "ticket") rows.sort((a, b) => (a.minTicketSort ?? Infinity) - (b.minTicketSort ?? Infinity));
    if (sort === "capex") rows.sort((a, b) => (publishedBandRange(a.capexBand)?.min ?? Infinity) - (publishedBandRange(b.capexBand)?.min ?? Infinity));
    if(sort==="close")rows.sort((a,b)=>compareMissingLast(a,b,p=>p.targetCloseQuarter));
    if(sort==="equityAsc"||sort==="equityDesc")rows.sort((a,b)=>compareMissingLast(a,b,p=>p.equitySoughtSort,sort==="equityDesc"));
    if(sort==="offtake")rows.sort((a,b)=>compareMissingLast(a,b,p=>p.offtakeLoadPct,true));
    if(sort==="stage")rows.sort((a,b)=>STAGES.indexOf(a.stage.toLowerCase() as typeof STAGES[number])-STAGES.indexOf(b.stage.toLowerCase() as typeof STAGES[number]));
    return rows;
  }, [projects, query, filters, sort, stages,terms,study,awarded,contracted]);
  const options = (key: string) => Object.fromEntries([...new Set(projects.map(p => p[key as keyof typeof p]).filter((v): v is string => typeof v === "string" && Boolean(v)))].sort().map(value => [value, key === "instrument" ? INSTRUMENT_LABEL[value] ?? value : key.endsWith("Band") ? bandLabel(key, value) : value]));
  return <div className="workspace-container space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="font-display text-3xl font-semibold">Opportunities</h1><p className="mt-2 text-sm text-muted-foreground">Compare live district heating and cooling projects across Europe.</p></div><div className="flex items-center gap-3"><span className="text-sm text-muted-foreground">{activeCount} active filters</span><Button variant="ghost" disabled={!activeCount} onClick={clear}>Clear filters</Button></div></header>
    <section className="border-y border-border py-5"><h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4" />Filter opportunities</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="space-y-1.5 sm:col-span-2"><Label htmlFor="opportunity-search">Search</Label><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4" /><Input id="opportunity-search" className="pl-9" value={query} onChange={e => setQuery(e.target.value)} placeholder="Technology, country, or anonymized teaser" /></div></div>
      {[["country", "Country"], ["technology", "Technology"], ["capacityBand", "Capacity"], ["capexBand", "Capex"], ["minTicketBand", "Minimum ticket"], ["instrument", "Instrument"], ["category","Project type"], ["equitySoughtBand","Equity sought band"]].map(([key, label]) => <SelectFilter key={key} label={label} value={filters[key] ?? "all"} setValue={v => setFilters(f => ({ ...f, [key]: v }))} options={options(key)} />)}
    </div><fieldset className="mt-5"><legend className="mb-2 text-sm font-semibold">Lifecycle stages</legend><div className="flex flex-wrap gap-4">{STAGES.map(stage=><Label key={stage} className="flex items-center gap-2"><Checkbox checked={stages.includes(stage)} onCheckedChange={checked=>setStages(v=>checked?[...v,stage]:v.filter(s=>s!==stage))}/>{STAGE_LABELS[stage]}</Label>)}</div></fieldset><div className="mt-5 flex flex-wrap gap-5">{[["Transaction terms published",terms,setTerms],["Feasibility study complete",study,setStudy],["Public co-financing awarded",awarded,setAwarded]].map(([label,checked,set])=><Label key={String(label)} className="flex items-center gap-2"><Checkbox checked={Boolean(checked)} onCheckedChange={value=>(set as (v:boolean)=>void)(value===true)}/>{String(label)}</Label>)}<Label className="flex items-center gap-2">New load contracted, minimum percent of design load<Input type="number" min={0} max={100} className="w-24" value={contracted} onChange={e=>setContracted(e.target.value)}/></Label></div></section>
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3"><p role="status" className="text-sm text-muted-foreground">{loading ? "" : `${filtered.length} results`}</p><div className="flex flex-wrap items-end gap-4"><SelectFilter label="Sort by" value={sort} setValue={setSort} options={{ close:"Closest to financial close", equityAsc:"Equity sought band, low to high", equityDesc:"Equity sought band, high to low", offtake:"Offtake committed", stage:"Lifecycle stage", newest: "Newest", ticket: "Minimum ticket, low to high", capex: "Capex band, low to high" }} /><ToggleGroup type="single" value="grid" aria-label="Opportunity view"><ToggleGroupItem value="grid" aria-label="Grid view"><Grid3X3 />Grid</ToggleGroupItem><ToggleGroupItem value="map" disabled aria-label="Map view unavailable" title="Map view unavailable" className="opacity-40"><Map /></ToggleGroupItem></ToggleGroup></div></div>
    {error ? <p role="alert">Could not load opportunities.</p> : <div className={cn("grid gap-5", state === "collapsed" ? "sm:grid-cols-2 xl:grid-cols-3" : "md:grid-cols-2 xl:grid-cols-3")}>{loading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-lg" />) : filtered.map((project,index) => <div key={project.id}>{((sort==="close"&&!project.targetCloseQuarter&&(index===0||filtered[index-1]?.targetCloseQuarter))||((sort==="equityAsc"||sort==="equityDesc")&&project.equitySoughtSort==null&&(index===0||filtered[index-1]?.equitySoughtSort!=null)))&&<h2 className="mb-3 text-sm font-semibold">{sort==="close"?"Close date not yet set":"Not yet determined"}</h2>}<ProjectCard project={project} context="app" /></div>)}</div>}
    {!loading && !filtered.length && <div className="py-12 text-center"><p className="text-sm text-muted-foreground">No opportunities match these filters.</p><Button variant="outline" className="mt-3" onClick={clear}>Clear filters</Button></div>}
  </div>;
}
