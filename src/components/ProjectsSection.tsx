import { Link } from "@/lib/router-compat";
import ProjectCard from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/button";
import type { ProjectListing } from "@/hooks/useProjectListings";

export const previewProjects: ProjectListing[] = [
  { id: "preview-waste", slug: "waste-heat", title: "", teaserTitle: "Waste heat network", city: "", region: "Auvergne-Rhone-Alpes", country: "France", category: "Modernization", technology: "Waste heat", stage: "Development", generation: "4G", publicSupport: true, capacityMw: 8, capex: 12e6, targetIrr: null, equitySought: null, minTicket: null, instrument: null, offtakeLoadPct: 87, accessState: "teaser", watchlisted: false },
  { id: "preview-geo", slug: "geothermal", title: "", teaserTitle: "Geothermal network", city: "", region: "Hovedstaden", country: "Denmark", category: "Expansion", technology: "Geothermal", stage: "Construction", generation: "4G", publicSupport: true, capacityMw: 30, capex: 45e6, targetIrr: null, equitySought: null, minTicket: null, instrument: null, offtakeLoadPct: 91, accessState: "teaser", watchlisted: false },
  { id: "preview-pump", slug: "heat-pump", title: "", teaserTitle: "Heat pump network", city: "", region: "Noord-Holland", country: "Netherlands", category: "Greenfield", technology: "Heat pump", stage: "Development", generation: "5G", publicSupport: false, capacityMw: 18, capex: 38e6, targetIrr: null, equitySought: null, minTicket: null, instrument: null, offtakeLoadPct: 44, accessState: "teaser", watchlisted: false },
];

const ProjectsSection = () => <section id="projects" className="bg-secondary/50 py-20"><div className="container mx-auto px-4"><p className="mb-4 text-center text-xs font-semibold uppercase text-muted-foreground">Marketplace preview</p><h2 className="mb-4 text-center font-display text-3xl font-semibold text-foreground md:text-4xl">A glimpse of live opportunities</h2><p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">Projects remain anonymized until the developer accepts an access request.</p><div className="grid gap-6 md:grid-cols-3">{previewProjects.map((project) => <ProjectCard key={project.id} project={project} context="public" />)}</div><div className="mt-10 flex justify-center"><Button variant="outline" size="lg" asChild><Link to="/sign-in?redirect=/app/opportunities">Start exploring</Link></Button></div></div></section>;
export default ProjectsSection;
