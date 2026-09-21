import { Link } from "@/lib/router-compat";
import ProjectCard from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/button";
import type { ProjectListing } from "@/hooks/useProjectListings";

export const previewProjects: ProjectListing[] = [
  { id: "preview-waste", slug: "waste-heat", title: "", teaserTitle: "Waste heat network", city: "", region: "Auvergne-Rhone-Alpes", country: "France", category: "Modernization", technology: "Waste heat", stage: "Development", generation: "4G", publicSupport: true, capacityMw: 8, capex: 12e6, targetIrr: null, equitySought: null, minTicket: null, instrument: null, offtakeLoadPct: 87, accessState: "teaser", watchlisted: false },
  { id: "preview-geo", slug: "geothermal", title: "", teaserTitle: "Geothermal network", city: "", region: "Hovedstaden", country: "Denmark", category: "Expansion", technology: "Geothermal", stage: "Construction", generation: "4G", publicSupport: true, capacityMw: 30, capex: 45e6, targetIrr: null, equitySought: null, minTicket: null, instrument: null, offtakeLoadPct: 91, accessState: "teaser", watchlisted: false },
  { id: "preview-pump", slug: "heat-pump", title: "", teaserTitle: "Heat pump network", city: "", region: "Noord-Holland", country: "Netherlands", category: "Greenfield", technology: "Heat pump", stage: "Development", generation: "5G", publicSupport: false, capacityMw: 18, capex: 38e6, targetIrr: null, equitySought: null, minTicket: null, instrument: null, offtakeLoadPct: 44, accessState: "teaser", watchlisted: false },
  { id: "preview-biomass", slug: "biomass", title: "", teaserTitle: "Biomass network", city: "", region: "Stockholm", country: "Sweden", category: "Expansion", technology: "Biomass", stage: "Construction", generation: "3G", publicSupport: true, capacityMw: 35, capex: 32e6, targetIrr: null, equitySought: null, minTicket: null, instrument: null, offtakeLoadPct: 88, accessState: "teaser", watchlisted: false },
  { id: "preview-solar", slug: "solar-thermal", title: "", teaserTitle: "Solar thermal network", city: "", region: "Uusimaa", country: "Finland", category: "Greenfield", technology: "Solar thermal", stage: "Concept", generation: "4G", publicSupport: true, capacityMw: 40, capex: 55e6, targetIrr: null, equitySought: null, minTicket: null, instrument: null, offtakeLoadPct: null, accessState: "teaser", watchlisted: false },
  { id: "preview-waste-2", slug: "waste-heat-nrw", title: "", teaserTitle: "Waste heat network", city: "", region: "North Rhine-Westphalia", country: "Germany", category: "Modernization", technology: "Waste heat", stage: "Construction", generation: "3G", publicSupport: true, capacityMw: 20, capex: 22e6, targetIrr: null, equitySought: null, minTicket: null, instrument: null, offtakeLoadPct: 92, accessState: "teaser", watchlisted: false },
];

const ProjectsSection = () => (
  <section id="projects" className="bg-background py-20">
    <div className="container">
      <div className="mx-auto mb-10 max-w-[640px] text-center">
        <h2 className="mb-3 font-display text-[34px] font-semibold tracking-[-0.02em] text-foreground">
          A glimpse of the marketplace
        </h2>
        <p className="text-base text-muted-foreground">
          A sample of live opportunities, shown anonymized. Create a free account to explore the full marketplace and
          unlock standardized project detail.
        </p>
      </div>
      <div className="mx-auto grid max-w-[1080px] gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
        {previewProjects.map((project) => (
          <ProjectCard key={project.id} project={project} context="public" />
        ))}
      </div>
      <div className="mt-10 text-center">
        <Button variant="hero" size="lg" asChild>
          <Link to="/sign-up">Start exploring →</Link>
        </Button>
        <p className="mt-3.5 text-[13px] text-subtle-foreground">
          Free to join. Browsing is anonymized; identities reveal only when you choose to connect.
        </p>
      </div>
    </div>
  </section>
);

export default ProjectsSection;
