import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { ProjectDetail } from "@/lib/blankProject";
import { Building2, CheckCircle } from "lucide-react";
import { publicFundingTotal } from "@/lib/figureDisclosure";

interface ProjectSidebarProps {
  project: ProjectDetail;
  onRequestAccess: () => void;
  loadingAuth: boolean;
  /** The signed-in developer owns this listing. */
  isOwner?: boolean;
  granted?: boolean;
  context?: "public" | "app";
}

const ProjectSidebar = ({
  project,
  onRequestAccess,
  loadingAuth,
  isOwner = false,
  granted = false,
  context = "public",
}: ProjectSidebarProps) => {
  return (
    <div className="space-y-6">
      {/* Key Investment Data */}
      <div
        className="bg-card rounded-xl border border-border p-6 shadow-card"
      >
        <h3 className="text-lg font-serif font-bold text-foreground mb-5">Key investment data</h3>
        <div className="space-y-0">
          {[
            { label: "Total capex", value: project.capex },
            { label: "Equity required", value: project.equityRequired },
            { label: "Min. ticket", value: project.minTicket },
            { label: "Payback period", value: project.paybackPeriod },
            { label: "Concession term", value: project.concessionTerm },
            { label: "First revenue", value: project.firstRevenue },
          ].filter((item) => Boolean(item.value)).map((item, i) => (
            <div key={item.label}>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span
                  className="text-sm font-bold text-foreground"
                >
                  {item.value}
                </span>
              </div>
              {i < 7 && <div className="border-t border-border" />}
            </div>
          ))}
        </div>

        {/* Funding progress - only once the developer has reported one */}
        {project.fundingProgress > 0 && (
          <div className="mt-4 mb-4">
            <p className="text-xs text-primary mb-1">
              Funding progress {project.fundingProgress}% raised - {project.fundingRemaining}{" "}
              remaining
            </p>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${project.fundingProgress}%` }}
              />
            </div>
          </div>
        )}


      </div>

      {/* Project Developer */}
      <div
        className="bg-card rounded-xl border border-border p-6 shadow-card"
      >
        <h3 className="text-base font-serif font-bold text-foreground mb-4">Project developer</h3>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{project.developer.name}</p>
            {project.developer.verified && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                Verified developer <CheckCircle className="w-3 h-3 text-primary" />
              </p>
            )}
          </div>
        </div>
        {/* Only rows the developer has actually filled in */}
        {(() => {
          const rows = [
            { label: "HQ", value: project.developer.hq },
            { label: "Founded", value: project.developer.founded },
            { label: "DHC projects", value: project.developer.dhcProjects },
            { label: "Total capacity", value: project.developer.totalCapacity },
          ].filter((row) => row.value);
          if (rows.length === 0) {
            return (
              <p className="text-sm text-muted-foreground">
                {granted || isOwner ? "The developer has not published a company profile yet." : "Opens when the developer accepts your request."}
              </p>
            );
          }
          return (
            <div className="space-y-0">
              {rows.map((item, i) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-bold text-foreground">{item.value}</span>
                  </div>
                  {i < rows.length - 1 && <div className="border-t border-border" />}
                </div>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Advisors */}
      {project.advisors && project.advisors.length > 0 && (
        <div
          className="bg-card rounded-xl border border-border p-6 shadow-card"
        >
          <h3 className="text-base font-serif font-bold text-foreground mb-4">
            Advisors on this project
          </h3>
          <div className="space-y-3">
            {project.advisors.map((advisor) => (
              <div key={advisor.name} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">
                    {advisor.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{advisor.name}</p>
                  <p className="text-xs text-muted-foreground">{advisor.role}</p>
                </div>
              </div>
            ))}
          </div>
          {isOwner && (
            <Button variant="outline" className="w-full mt-4 rounded-full" asChild>
              <Link to="/app/ecosystem">Find advisors for your project</Link>
            </Button>
          )}
        </div>
      )}

      {/* Public Funding */}
      {project.publicFunding && project.publicFunding.length > 0 && (
        <div className="bg-info-soft rounded-xl border border-info p-6">
          <h3 className="text-base font-serif font-bold text-info mb-4">Public funding</h3>
          <div className="space-y-3">
            {project.publicFunding.map((fund) => (
              <div key={fund.source} className="flex justify-between items-center">
                <span className="text-sm text-info">{fund.source}</span>
                <span className="text-sm font-bold text-info">
                  {fund.amount} ✓ {fund.status}
                </span>
              </div>
            ))}
          </div>
          {project.publicFunding.some((fund) => fund.numericAmount != null) && (
            <p className="text-xs text-info mt-3 leading-relaxed">
              Developer-stated public co-financing: {new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(publicFundingTotal(project.publicFunding))}.
            </p>
          )}
          <Button
            variant="outline"
            className="w-full mt-4 rounded-full border-info text-info hover:bg-info-soft"
            asChild
          >
            <Link to={context === "app" ? "/app/public-funding" : "/public-funding"}>
              Explore public funding hub
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;
