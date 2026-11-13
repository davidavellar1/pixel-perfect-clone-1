import { Link } from "@/lib/router-compat";
import ProjectCard from "@/components/project/ProjectCard";
import { Button } from "@/components/ui/button";
import { useProjectListings } from "@/hooks/useProjectListings";

const ProjectsSection = () => {
  const { projects, loading, error } = useProjectListings();
  if (loading || error || !projects.length) return null;
  return (
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
        {projects.slice(0, 3).map((project) => (
          <ProjectCard key={project.id} project={project} context="public" />
        ))}
      </div>
      <div className="mt-10 text-center">
        <Button variant="hero" size="lg" asChild>
          <Link to="/sign-up">Start exploring →</Link>
        </Button>
        <p className="mt-3.5 text-[13px] text-subtle-foreground">
          Free to join. Browsing is anonymized; identities reveal only after the developer accepts your request.
        </p>
      </div>
    </div>
  </section>
);
};

export default ProjectsSection;
