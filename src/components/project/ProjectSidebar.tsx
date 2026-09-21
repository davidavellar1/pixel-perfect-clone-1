import { Button } from "@/components/ui/button";
import { ProjectDetail } from "@/data/projectsData";
import { Building2, CheckCircle } from "lucide-react";

interface ProjectSidebarProps {
  project: ProjectDetail;
  onRequestAccess: () => void;
  loadingAuth: boolean;
}

const ProjectSidebar = ({ project, onRequestAccess, loadingAuth }: ProjectSidebarProps) => {
  return (
    <div className="space-y-6">
      {/* Key Investment Data */}
      <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--card-shadow)" }}>
        <h3 className="text-lg font-serif font-bold text-foreground mb-5">Key investment data</h3>
        <div className="space-y-0">
          {[
            { label: "Total capex", value: project.capex },
            { label: "Equity required", value: project.equityRequired },
            { label: "Min. ticket", value: project.minTicket },
            { label: "Target equity IRR", value: project.targetIRR, highlight: true },
            { label: "Target unlevered IRR", value: project.unleveragedIRR },
            { label: "Payback period", value: project.paybackPeriod },
            { label: "Concession term", value: project.concessionTerm },
            { label: "First revenue", value: project.firstRevenue },
          ].map((item, i) => (
            <div key={item.label}>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`text-sm font-bold ${item.highlight ? "text-primary" : "text-foreground"}`}>
                  {item.value}
                </span>
              </div>
              {i < 7 && <div className="border-t border-border" />}
            </div>
          ))}
        </div>

        {/* Funding progress */}
        <div className="mt-4 mb-4">
          <p className="text-xs text-primary mb-1">
            Funding progress {project.fundingProgress}% raised - {project.fundingRemaining} remaining
          </p>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${project.fundingProgress}%` }}
            />
          </div>
        </div>

        <Button
          onClick={onRequestAccess}
          disabled={loadingAuth}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full"
        >
          Express investment interest
        </Button>
      </div>

      {/* Project Developer */}
      <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--card-shadow)" }}>
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
        <div className="space-y-0">
          {[
            { label: "HQ", value: project.developer.hq },
            { label: "Founded", value: project.developer.founded },
            { label: "DHC projects", value: project.developer.dhcProjects },
            { label: "Total capacity", value: project.developer.totalCapacity },
          ].map((item, i) => (
            <div key={item.label}>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className="text-sm font-bold text-foreground">{item.value}</span>
              </div>
              {i < 3 && <div className="border-t border-border" />}
            </div>
          ))}
        </div>
        <Button variant="outline" className="w-full mt-4 rounded-full">
          View developer profile
        </Button>
      </div>

      {/* Advisors */}
      {project.advisors && project.advisors.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--card-shadow)" }}>
          <h3 className="text-base font-serif font-bold text-foreground mb-4">Advisors on this project</h3>
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
          <Button variant="outline" className="w-full mt-4 rounded-full">
            Find advisors for your project
          </Button>
        </div>
      )}

      {/* Public Funding */}
      {project.publicFunding && project.publicFunding.length > 0 && (
        <div className="bg-purple-50 rounded-xl border border-purple-200 p-6">
          <h3 className="text-base font-serif font-bold text-purple-900 mb-4">Public funding</h3>
          <div className="space-y-3">
            {project.publicFunding.map((fund) => (
              <div key={fund.source} className="flex justify-between items-center">
                <span className="text-sm text-purple-700">{fund.source}</span>
                <span className="text-sm font-bold text-purple-900">
                  {fund.amount} ✓ {fund.status}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-purple-600 mt-3 leading-relaxed">
            €{project.publicFunding.reduce((sum, f) => sum + parseFloat(f.amount.replace(/[^0-9.]/g, "")), 0).toFixed(1)}M in public co-financing reduces first-loss risk and lowers the cost of capital for private investors.
          </p>
          <Button variant="outline" className="w-full mt-4 rounded-full border-purple-300 text-purple-700 hover:bg-purple-100">
            Explore public funding hub
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProjectSidebar;
