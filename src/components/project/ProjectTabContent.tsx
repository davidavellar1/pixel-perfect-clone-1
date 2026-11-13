import { useState } from "react";
import { ProjectDetail } from "@/lib/blankProject";
import { ownershipRows } from "@/lib/figureDisclosure";
import { asOfLine, eur } from "@/data/investorGrade";
import ProjectCharts from "@/components/ProjectCharts";
import { FileText, Shield, CloudOff, Gauge, Zap, Activity, CheckCircle, XCircle, MinusCircle, BookOpen, ClipboardList, Lock, Clock, FileSpreadsheet, Leaf, Scale, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { emptyInvestorGrade, type InvestorGradeBundle } from "@/data/investorGrade";
import OfftakeLadderBar from "@/components/project/OfftakeLadderBar";
import TransactionTab from "@/components/project/TransactionTab";
import ConstructionPackageSection from "@/components/project/ConstructionPackageSection";
import { CasesSection, MarginSection } from "@/components/project/FinancialGradeSections";
import ProjectDocuments from "@/components/project/ProjectDocuments";
import ProjectQA from "@/components/project/ProjectQA";

export type DataRoomStatus = "none" | "pending" | "approved";

export interface AsOfDates {
  financial?: string | null;
  technical?: string | null;
  regulatory?: string | null;
}

interface ProjectTabContentProps {
  project: ProjectDetail;
  activeTab: string;
  numericCapex?: number | null;
  granted?: boolean;
  projectId?: string;
  dataRoomStatus?: DataRoomStatus;
  onRequestDataRoom?: () => void;
  grade?: InvestorGradeBundle;
  asOf?: AsOfDates;
  breakeven?: { dscr1x: number | null; irrZero: number | null };
  isOwner?: boolean;
  userId?: string | null;
}

const ProjectTabContent = ({
  project,
  numericCapex = null,
  granted = false,
  activeTab,
  projectId,
  dataRoomStatus = "none",
  onRequestDataRoom,
  grade = emptyInvestorGrade,
  asOf = {},
  breakeven = { dscr1x: null, irrZero: null },
  isOwner = false,
  userId = null,
}: ProjectTabContentProps) => {
  if (activeTab === "Overview") return <OverviewTab project={project} grade={grade} numericCapex={numericCapex} granted={granted} asOf={asOf.financial} />;
  if (activeTab === "Transaction") return <TransactionTab grade={grade} asOf={asOf.financial} />;
  if (activeTab === "Technical") return <TechnicalTab project={project} grade={grade} asOf={asOf.technical} />;
  if (activeTab === "Financial") {
    return (
      <FinancialTab
        project={project}
        numericCapex={numericCapex}
        granted={granted}
        grade={grade}
        asOf={asOf.financial}
        breakeven={{ ...breakeven, contracted: grade.ladder?.contracted_count ?? null }}
      />
    );
  }
  if (activeTab === "Sustainability") return <SustainabilityTab project={project} asOf={asOf.technical} />;
  if (activeTab === "Structure & market") return <StructureMarketTab project={project} grade={grade} asOf={asOf.regulatory} />;
  if (activeTab === "Documents") {
    return projectId ? (
      <ProjectDocuments projectId={projectId} dataRoomStatus={dataRoomStatus} />
    ) : (
      <DocumentsTab />
    );
  }
  if (activeTab === "Q&A") return <ProjectQA projectId={projectId} userId={userId} isOwner={isOwner} />;
  return null;
};

/* ─── Overview ─── */
function OverviewTab({ project, grade, numericCapex, granted, asOf }: { project: ProjectDetail; grade: InvestorGradeBundle; numericCapex: number | null; granted: boolean; asOf?: string | null }) {
  return (
    <div className="space-y-10">
      <OfftakeLadderBar ladder={grade.ladder} />
      {/* Project Summary */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Project summary</h2>
        <div className="border-t border-border mb-4" />
        <p className="text-muted-foreground leading-relaxed mb-4">{project.summary}</p>
        {project.summaryExtended && (
          <div className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {project.summaryExtended}
          </div>
        )}
      </div>

      {/* Development Timeline */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Development timeline</h2>
        <div className="border-t border-border mb-6" />
        {project.timeline.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-6 text-sm text-muted-foreground">
            The developer has not published a timeline for this project yet.
          </p>
        ) : (
        <div className="relative ml-4">
          <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
          {project.timeline.map((step, i) => (
            <div key={i} className="relative pl-10 pb-10 last:pb-0">
              <div className={`absolute left-0.5 top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                step.status === "completed"
                  ? "bg-primary"
                  : step.status === "in_progress"
                  ? "border-2 border-primary bg-background"
                  : "border-2 border-muted-foreground/30 bg-background"
              }`}>
                {step.status === "in_progress" && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <h4 className="text-base font-bold text-foreground">{step.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.status === "completed" && "Completed · "}
                {step.status === "in_progress" && "In progress · "}
                {step.status === "planned" && "Planned · "}
                {step.date}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
        )}
      </div>

      {granted && numericCapex != null && <ProjectCharts capexNum={numericCapex} granted={granted} energyMix={project.energyMix ?? []} asOf={asOf} />}

    </div>
  );
}

/* ─── Technical ─── */
function TechnicalTab({ project, grade, asOf }: { project: ProjectDetail; grade: InvestorGradeBundle; asOf?: string | null }) {
  return (
    <div className="space-y-10">
      <ConstructionPackageSection construction={grade.construction} asOf={asOf} />
      {/* Technology & Heat Source */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Technology & heat source</h2>
        <div className="border-t border-border mb-4" />
        {project.technologyCards.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-6 text-sm text-muted-foreground">
            The developer has not published technology detail for this project yet.
          </p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.technologyCards.map((card) => (
            <div key={card.title} className="bg-muted/50 border border-border rounded-xl p-5">
              <h4 className="text-sm font-bold text-foreground mb-2">{card.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* Operating Parameters */}
      {project.operatingParameters && project.operatingParameters.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Operating parameters</h2>
          <div className="border-t border-border mb-6" />
          <div className="bg-muted/50 border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left p-4 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Parameter</th>
                  <th className="text-left p-4 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Value</th>
                  <th className="text-left p-4 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Benchmark / Context</th>
                </tr>
              </thead>
              <tbody>
                {project.operatingParameters.map((param, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="p-4 font-bold text-foreground">{param.parameter}</td>
                    <td className="p-4 text-muted-foreground">{param.value}</td>
                    <td className="p-4 text-muted-foreground">{param.benchmark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Development timeline</h2>
        <div className="border-t border-border mb-6" />
        {project.timeline.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-6 text-sm text-muted-foreground">
            The developer has not published a timeline for this project yet.
          </p>
        ) : (
        <div className="relative ml-4">
          <div className="absolute left-3 top-3 bottom-3 w-px bg-border" />
          {project.timeline.map((step, i) => (
            <div key={i} className="relative pl-10 pb-10 last:pb-0">
              <div className={`absolute left-0.5 top-1 w-5 h-5 rounded-full flex items-center justify-center ${
                step.status === "completed"
                  ? "bg-primary"
                  : step.status === "in_progress"
                  ? "border-2 border-primary bg-background"
                  : "border-2 border-muted-foreground/30 bg-background"
              }`}>
                {step.status === "in_progress" && <div className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              <h4 className="text-base font-bold text-foreground">{step.title}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {step.status === "completed" && "Completed · "}
                {step.status === "in_progress" && "In progress · "}
                {step.status === "planned" && "Planned · "}
                {step.date}
              </p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
        )}
      </div>
    </div>
  );
}

/* ─── Financial ─── */
function FinancialTab({
  project,
  grade,
  asOf,
  breakeven,
  numericCapex,
  granted,
}: {
  project: ProjectDetail;
  numericCapex: number | null;
  granted: boolean;
  grade: InvestorGradeBundle;
  asOf?: string | null;
  breakeven: { dscr1x: number | null; irrZero: number | null; contracted: number | null };
}) {
  return (
    <div className="space-y-10">
      <MarginSection margin={grade.margin} asOf={asOf} />
      {/* Capital Stack */}
      {granted && project.capitalStack && project.capitalStack.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Capital stack</h2>
          <p className="mb-3 text-xs text-muted-foreground">Developer-stated. {asOf ? asOfLine("Financial information", asOf) : "As-of date not provided"}.</p>
          <div className="border-t border-border mb-6" />
          <div className="bg-muted/50 border border-border rounded-xl p-6">
            <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase mb-4">
              TOTAL PROJECT FINANCING{numericCapex != null ? ` - ${eur(numericCapex)}` : ""}
            </p>
            <div className="flex rounded-lg overflow-hidden h-10 mb-6">
              {project.capitalStack.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-center text-xs font-medium text-inverse-foreground"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                >
                  {item.label} {item.percentage}%
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {project.capitalStack.map((item) => (
                <div key={item.label} className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm font-bold text-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{item.amount}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CasesSection cases={grade.cases} breakeven={breakeven} />


      {/* Revenue Model */}
      {project.revenueStreams && project.revenueStreams.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Revenue model</h2>
          <div className="border-t border-border mb-6" />
          <div className="bg-muted/50 border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Revenue stream</th>
                  <th className="text-left p-4 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Structure</th>
                  <th className="text-left p-4 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">% of Revenue</th>
                  <th className="text-left p-4 text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase">Counterparty</th>
                </tr>
              </thead>
              <tbody>
                {project.revenueStreams.map((stream, i) => (
                  <tr key={i} className="border-b border-border last:border-b-0">
                    <td className="p-4 font-bold text-foreground">{stream.stream}</td>
                    <td className="p-4 text-muted-foreground">{stream.structure}</td>
                    <td className="p-4 text-muted-foreground">{stream.percentRevenue}</td>
                    <td className="p-4 text-muted-foreground">{stream.counterparty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Risk Summary */}
      {project.risks && project.risks.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Risk summary</h2>
          <div className="border-t border-border mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.risks.map((risk) => (
              <div key={risk.title} className="bg-muted/50 border border-border rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-foreground">{risk.title}</h4>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    risk.severity === "Low"
                      ? "bg-success-soft text-success"
                      : risk.severity === "Medium"
                      ? "bg-warning-soft text-warning-foreground"
                      : "bg-destructive-soft text-destructive"
                  }`}>
                    {risk.severity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{risk.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Structure & Market ─── */
function StructureMarketTab({ project, grade, asOf }: { project: ProjectDetail; grade: InvestorGradeBundle; asOf?: string | null }) {
  const owners = ownershipRows(grade.transaction?.post_money_ownership);
  const date = grade.transaction?.as_of ?? asOf;
  return <div className="space-y-10">
    {owners.length > 0 && <section>
      <h2 className="mb-3 font-display text-2xl font-semibold">Ownership structure - {project.title}</h2>
      <p className="mb-5 text-xs text-muted-foreground">Developer-stated. {date ? asOfLine("Ownership", date) : "As-of date not provided"}.</p>
      <div className="mb-5 flex h-10 overflow-hidden rounded-md" aria-label="Developer-stated ownership shares">
        {owners.map((owner, index) => <div key={owner.name} style={{ width: `${owner.share}%` }} className={index % 2 ? "bg-accent" : "bg-primary"} title={`${owner.name}: ${owner.share}%`} />)}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{owners.map((owner) => <div key={owner.name} className="rounded-md border border-border bg-card p-4"><p className="font-semibold">{owner.name}</p><p className="text-sm text-muted-foreground">{owner.share}%</p></div>)}</div>
    </section>}
    {project.country && <section><h2 className="mb-3 font-display text-2xl font-semibold">National regulatory profile - {project.country}</h2>
      {project.country === "France" && <p className="text-sm text-muted-foreground">French support bodies: ADEME and BPI France. District heating concession terms are project-specific.</p>}
    </section>}
  </div>;
}

/* ─── Sustainability & Compliance ─── */
function SustainabilityTab({ project, asOf }: { project: ProjectDetail; asOf?: string | null }) {
  return (
    <div className="space-y-10">
      <p className="text-xs text-muted-foreground">Developer-stated. {asOf ? asOfLine("Sustainability information", asOf) : "As-of date not provided"}.</p>
      {/* Key Sustainability Metrics */}
      {project.sustainabilityMetrics && project.sustainabilityMetrics.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Key sustainability metrics</h2>
          <div className="border-t border-border mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.sustainabilityMetrics.map((metric, i) => {
              const icons = [
                <CloudOff key="ico" className="w-5 h-5 text-success" />,
                <Gauge key="ico" className="w-5 h-5 text-success" />,
                <Zap key="ico" className="w-5 h-5 text-success" />,
                <Activity key="ico" className="w-5 h-5 text-success" />,
              ];
              return (
                <div key={i} className="bg-muted/50 border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-1">
                    {icons[i % icons.length]}
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{metric.label}</p>
                  </div>
                  <p className="text-2xl font-serif font-bold text-foreground mb-1">{metric.value}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{metric.context}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CO2 Impact */}
      {project.co2Detail && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">CO₂ impact</h2>
          <div className="border-t border-border mb-6" />
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-start gap-6">
            <div className="text-center md:text-left">
              <p className="text-4xl font-serif font-bold text-foreground">
                {project.co2Detail.tonnes.toLocaleString()}
              </p>
              <p className="text-sm text-primary">
                tCO₂e avoided<br />per year
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {project.co2Detail.equivalentCars && <>Developer-stated equivalent: {project.co2Detail.equivalentCars} cars annually. </>}{project.co2Detail.lifetimeReduction && <>Developer-stated lifetime reduction: {project.co2Detail.lifetimeReduction} of CO₂ equivalent.</>}
            </p>
          </div>
        </div>
      )}
      {project.euTaxonomy && <section><h2 className="mb-3 font-display text-2xl font-semibold">EU Taxonomy activity 4.15 - district heating and cooling distribution</h2><p className="text-sm text-muted-foreground">Developer-stated objective: {project.euTaxonomy.objective}</p></section>}

      {/* Energy Mix */}
      {project.energyMix && project.energyMix.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Primary energy source mix</h2>
          <div className="border-t border-border mb-6" />
          <div className="flex rounded-lg overflow-hidden h-8 mb-4">
            {project.energyMix.map((source, i) => (
              <div
                key={source.source}
                className="flex items-center justify-center text-xs font-medium text-inverse-foreground"
                style={{
                  width: `${source.percentage}%`,
                  backgroundColor: i === 0 ? "var(--primary)" : i === 1 ? "var(--success)" : "var(--muted-foreground)",
                }}
              >
                {source.source.split(" ")[0]} {source.percentage}%
              </div>
            ))}
          </div>
          <div className="space-y-1">
            {project.energyMix.map((source, i) => (
              <div key={source.source} className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-3 h-3 rounded-sm" style={{
                  backgroundColor: i === 0 ? "var(--primary)" : i === 1 ? "var(--success)" : "var(--muted-foreground)",
                }} />
                {source.source} - {source.percentage}%
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SDGs */}
      {project.sdgs && project.sdgs.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Sustainable Development Goals</h2>
          <div className="border-t border-border mb-6" />
          <div className="flex flex-wrap gap-4">
            {project.sdgs.map((sdg) => (
              <div key={sdg.number} className="bg-muted/50 border border-border rounded-xl p-4 flex items-start gap-3 min-w-[180px]">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-inverse-foreground font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: sdg.color }}
                >
                  {sdg.number}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{sdg.title}</p>
                  <p className="text-xs text-muted-foreground">{sdg.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SFDR */}
      {project.sfdr && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">SFDR classification</h2>
          <div className="border-t border-border mb-6" />
          <div className="bg-info-soft border border-info rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-info-soft flex items-center justify-center text-info font-bold text-sm flex-shrink-0">
                <Scale className="h-4 w-4" />
              </div>
              <div>
                <h4 className="mb-1 text-sm font-bold text-info">SFDR classification is the investor's to make</h4>
                <p className="text-sm leading-relaxed text-info">
                  The platform does not classify this investment under SFDR. Project data and annual impact reporting are provided so that
                  each investor can reach its own classification under its own policy.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Documents ─── */
function DocumentsTab() {
  return <p className="text-sm text-muted-foreground">The developer has not published documents for this listing.</p>;
}

export default ProjectTabContent;
