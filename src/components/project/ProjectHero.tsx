import { Button } from "@/components/ui/button";
import { ProjectDetail } from "@/data/projectsData";
import { MapPin, Heart, Share2, FileText, CheckSquare } from "lucide-react";
import { asOfLine, committedBuildingPct, committedLoadPct, eur, type InvestorGradeBundle } from "@/data/investorGrade";

interface ProjectHeroProps {
  project: ProjectDetail;
  onRequestAccess: () => void;
  loadingAuth: boolean;
  grade?: InvestorGradeBundle;
  asOf?: { financial?: string | null; technical?: string | null; regulatory?: string | null };
  ctaLabel?: string;
}

const ProjectHero = ({ project, onRequestAccess, loadingAuth, grade, asOf, ctaLabel }: ProjectHeroProps) => {
  const ladder = grade?.ladder ?? null;
  const loadPct = committedLoadPct(ladder);
  const buildingPct = committedBuildingPct(ladder);
  const metrics = [
    { label: "Capacity", value: project.capacity },
    { label: "Total capex", value: project.capex },
    {
      label: "Offtake committed",
      value:
        loadPct === null
          ? null
          : `${loadPct}% of design load${buildingPct !== null ? `, ${buildingPct.toFixed(0)}% of buildings` : ""}`,
    },
    { label: "Equity sought", value: grade?.transaction?.equity_sought == null ? null : eur(grade.transaction.equity_sought) },
  ].filter((metric): metric is { label: string; value: string } => Boolean(metric.value));
  return (
    <div className="border-b border-border bg-foreground text-primary-foreground">
      <div className="mx-auto max-w-[980px] px-5 pb-14 pt-10">

        {/* Title */}
        <h1 className="mb-3 font-display text-3xl font-semibold leading-tight text-primary-foreground md:text-4xl">
          {project.title}
        </h1>

        {/* Location & Project Type */}
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/60">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-destructive" />
            {project.location}
          </span>
          <span className="text-primary-foreground/30">|</span>
          <span className="flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            Project Type: {project.badge}
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground">
            Technology: {project.technology}
          </span>
          <span className="rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-medium text-primary-foreground">
            Stage: {project.stage}
          </span>
          {project.publicSupport && (
            <span className="text-xs font-medium px-3 py-1.5 rounded-full border border-green-200 bg-green-50 text-green-700 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" />
              Public funding committed
            </span>
          )}
        </div>

        {/* Header metrics */}
        <div className="mb-3 grid gap-4 rounded-lg border border-primary-foreground/15 bg-primary-foreground/5 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <p className="text-[11px] uppercase text-primary-foreground/60">{metric.label}</p>
              <p className="mt-1 text-lg font-semibold text-primary-foreground">{metric.value}</p>
            </div>
          ))}
        </div>
        <p className="mb-6 text-xs text-primary-foreground/50">
          {asOfLine("Financial information", asOf?.financial)}. {asOfLine("Technical information", asOf?.technical)}.
          All figures are developer-stated.
        </p>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onRequestAccess}
            disabled={loadingAuth}
            className="rounded-md bg-accent px-6 font-semibold text-accent-foreground hover:bg-accent/90"
          >
            {ctaLabel ?? "Express interest"}
          </Button>
          <Button variant="hero-outline">
            <Heart className="w-4 h-4 mr-2" />
            Add to watchlist
          </Button>
          <Button variant="hero-outline">
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectHero;
