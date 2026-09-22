import { useState } from "react";
import { ProjectDetail } from "@/data/projectsData";
import ProjectCharts from "@/components/ProjectCharts";
import { FileText, Shield, CloudOff, Gauge, Zap, Activity, CheckCircle, XCircle, MinusCircle, BookOpen, ClipboardList, Lock, Clock, FileSpreadsheet, Leaf, Scale, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { emptyInvestorGrade, type InvestorGradeBundle } from "@/data/investorGrade";
import OfftakeLadderBar from "@/components/project/OfftakeLadderBar";
import TransactionTab from "@/components/project/TransactionTab";
import ConstructionPackageSection from "@/components/project/ConstructionPackageSection";
import { CasesSection, MarginSection } from "@/components/project/FinancialGradeSections";
import ProjectDocuments from "@/components/project/ProjectDocuments";

export type DataRoomStatus = "none" | "pending" | "approved";

export interface AsOfDates {
  financial?: string | null;
  technical?: string | null;
  regulatory?: string | null;
}

interface ProjectTabContentProps {
  project: ProjectDetail;
  activeTab: string;
  projectId?: string;
  dataRoomStatus?: DataRoomStatus;
  onRequestDataRoom?: () => void;
  grade?: InvestorGradeBundle;
  asOf?: AsOfDates;
  breakeven?: { dscr1x: number | null; irrZero: number | null };
}

const ProjectTabContent = ({
  project,
  activeTab,
  projectId,
  dataRoomStatus = "none",
  onRequestDataRoom,
  grade = emptyInvestorGrade,
  asOf = {},
  breakeven = { dscr1x: null, irrZero: null },
}: ProjectTabContentProps) => {
  if (activeTab === "Overview") return <OverviewTab project={project} grade={grade} />;
  if (activeTab === "Transaction") return <TransactionTab grade={grade} asOf={asOf.financial} />;
  if (activeTab === "Technical") return <TechnicalTab project={project} grade={grade} asOf={asOf.technical} />;
  if (activeTab === "Financial") {
    return (
      <FinancialTab
        project={project}
        grade={grade}
        asOf={asOf.financial}
        breakeven={{ ...breakeven, contracted: grade.ladder?.contracted_count ?? null }}
      />
    );
  }
  if (activeTab === "Sustainability") return <SustainabilityTab project={project} />;
  if (activeTab === "Structure & market") return <StructureMarketTab project={project} />;
  if (activeTab === "Documents") {
    return projectId ? (
      <ProjectDocuments projectId={projectId} dataRoomStatus={dataRoomStatus} />
    ) : (
      <DocumentsTab project={project} dataRoomStatus={dataRoomStatus} onRequestDataRoom={onRequestDataRoom} />
    );
  }
  if (activeTab === "Q&A") return <QATab project={project} />;
  return null;
};

/* ─── Overview ─── */
function OverviewTab({ project, grade }: { project: ProjectDetail; grade: InvestorGradeBundle }) {
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

      {/* Charts — an illustrative model, only shown once a capex figure exists */}
      {Number.isFinite(parseFloat(project.capex.replace(/[^0-9.]/g, ""))) && (
        <ProjectCharts
          projectTitle={project.title}
          capexNum={parseFloat(project.capex.replace(/[^0-9.]/g, ""))}
          technology={project.technology}
        />
      )}
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
}: {
  project: ProjectDetail;
  grade: InvestorGradeBundle;
  asOf?: string | null;
  breakeven: { dscr1x: number | null; irrZero: number | null; contracted: number | null };
}) {
  return (
    <div className="space-y-10">
      <MarginSection margin={grade.margin} asOf={asOf} />
      {/* Capital Stack */}
      {project.capitalStack && project.capitalStack.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Capital stack</h2>
          <div className="border-t border-border mb-6" />
          <div className="bg-muted/50 border border-border rounded-xl p-6">
            <p className="text-xs font-semibold tracking-[0.1em] text-muted-foreground uppercase mb-4">
              TOTAL PROJECT FINANCING - {project.capex}
            </p>
            <div className="flex rounded-lg overflow-hidden h-10 mb-6">
              {project.capitalStack.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-center text-xs font-medium text-white"
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
                      ? "bg-emerald-100 text-emerald-700"
                      : risk.severity === "Medium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-700"
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
function StructureMarketTab({ project }: { project: ProjectDetail }) {
  const companyStructures = [
    { icon: "🏛", title: "Municipal utility", desc: "100% publicly owned. No private equity.", highlighted: false },
    { icon: "🤝", title: "Consumer cooperative", desc: "Non-profit, consumer-owned. Profits reinvested. Dominant in Denmark.", highlighted: false },
    { icon: "🏢", title: "Arms-length municipal company", desc: "Municipality-owned but commercially run.", highlighted: false },
    { icon: "🤝", title: "Public-private partnership", desc: "Joint SPV with public and private shareholders. Concession-backed.", highlighted: true },
    { icon: "📜", title: "Private concession", desc: "Fully private operator under public concession. Common in France.", highlighted: false },
    { icon: "💼", title: "Fully private / investor-owned", desc: "No public stake. Market-based returns.", highlighted: false },
    { icon: "⚡", title: "ESCO model", desc: "Energy service company finances, builds, and operates under service contract.", highlighted: false },
    { icon: "🏘", title: "Not-for-profit / housing association", desc: "Community-anchored, limited return.", highlighted: false },
  ];

  const ownershipData = [
    { name: "City of Lyon", share: "20%", role: "Public shareholder", color: "bg-amber-100 text-amber-900 border-amber-300" },
    { name: "Lyon Energy Partners", share: "60%", role: "Lead developer · Private", color: "bg-primary text-primary-foreground border-primary" },
    { name: "Green Infrastructure Fund I", share: "20%", role: "Infrastructure fund", color: "bg-sky-100 text-sky-900 border-sky-300" },
  ];

  return (
    <div className="space-y-10">
      {/* Developer Company Structure */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Developer company structure</h2>
        <div className="border-t border-border mb-4" />
        <p className="text-muted-foreground leading-relaxed mb-6">
          The legal and ownership structure of a DHC developer directly affects investor governance rights, profit distribution, regulatory classification, and exit options.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {companyStructures.map((item, i) => (
            <div
              key={i}
              className={`relative border rounded-xl p-4 text-left transition-colors ${
                item.highlighted
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card"
              }`}
            >
              {item.highlighted && (
                <span className="absolute -top-2.5 right-3 bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-full">
                  This project
                </span>
              )}
              <span className="text-xl mb-2 block">{item.icon}</span>
              <h4 className="text-sm font-bold text-foreground mb-1 leading-tight">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ownership Structure */}
      <div>
        <div className="border border-border rounded-xl p-6 bg-card">
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase text-center mb-6">
            Ownership Structure - {project.title} SPV
          </p>

          {/* Shareholders row */}
          <div className="grid grid-cols-3 gap-6 mb-0 max-w-xl mx-auto">
            {ownershipData.map((owner, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <span className="text-2xl font-bold text-foreground mb-2">{owner.share}</span>
                <div className={`rounded-lg border px-4 py-4 w-full h-20 flex flex-col items-center justify-center ${owner.color}`}>
                  <p className="text-sm font-semibold leading-tight">{owner.name}</p>
                  <p className="text-xs opacity-80 mt-0.5">{owner.role}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Connector lines - vertical stubs down from each box */}
          <div className="grid grid-cols-3 gap-6 max-w-xl mx-auto">
            {ownershipData.map((_, i) => (
              <div key={i} className="flex justify-center">
                <div className="w-0.5 h-8 bg-muted-foreground/40" />
              </div>
            ))}
          </div>
          {/* Horizontal bar connecting all three */}
          <div className="max-w-xl mx-auto px-[calc(100%/6)]">
            <div className="h-0.5 bg-muted-foreground/40 w-full" />
          </div>
          {/* Center vertical stub down to SPV */}
          <div className="flex justify-center">
            <div className="w-0.5 h-8 bg-muted-foreground/40" />
          </div>

          {/* Project SPV */}
          <div className="flex justify-center">
            <div className="bg-primary text-primary-foreground rounded-xl px-8 py-5 text-center min-w-[280px]">
              <p className="text-[10px] font-semibold tracking-widest uppercase opacity-70 mb-1">Project SPV</p>
              <p className="text-sm font-bold">{project.title} SPV</p>
              <p className="text-xs opacity-80 mt-0.5">Incorporated France · PPP / Joint Venture</p>
            </div>
          </div>
        </div>
      </div>

      {/* National Regulatory Profile */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">National regulatory profile - France</h2>
        <div className="border-t border-border mb-6" />

        <div className="border border-border rounded-xl overflow-hidden bg-card">
          {/* Header */}
          <div className="bg-primary/10 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">FR</div>
              <div>
                <h3 className="text-lg font-serif font-bold text-foreground">France</h3>
                <p className="text-sm text-muted-foreground">Loi Énergie-Climat · CRE regulator</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Investor risk rating</p>
              <span className="inline-block bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Stable / predictable
              </span>
            </div>
          </div>

          {/* Grid of regulatory items */}
          <div className="divide-y divide-border">
            {[
              ["Tariff-setting mechanism", "Regulated tariff with CPI-indexation under concession agreements", "Regulator", "CRE (Commission de Régulation de l'Énergie)"],
              ["Price cap / ceiling", "Tariff ceiling set by concession contract; CPI-indexed annually", "Tariff revision cycle", "Annual · CPI-indexation permitted"],
              ["Connection obligation", "Mandatory connection zones (périmètre de développement prioritaire) designated by local authorities", "Concession framework", "Strong - 20-30 year concessions standard; legally well-established"],
              ["Market structure", "Mix of public régie, semi-public SEM, and private concessions; private share growing", "EU Taxonomy integration", "Advanced - green permit expediting for renewable DHC projects"],
            ].map((row, i) => (
              <div key={i} className="grid grid-cols-2 divide-x divide-border">
                <div className="px-6 py-4">
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">{row[0]}</p>
                  <p className="text-sm text-foreground">{row[1]}</p>
                </div>
                <div className="px-6 py-4">
                  <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">{row[2]}</p>
                  <p className="text-sm text-foreground">{row[3]}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Key investor note */}
          <div className="mx-6 my-5 bg-muted/60 border border-border rounded-lg px-5 py-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Key investor note:</span> France's DHC regulatory framework is among the most mature in Europe. Concession contracts provide long-term revenue visibility with CPI-indexed tariffs. The primary revenue constraint is the tariff ceiling defined in the concession agreement. Municipal connection obligations in designated priority zones reduce demand risk significantly.
            </p>
          </div>
        </div>
      </div>

      {/* EU Market Regulatory Comparison */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">EU market regulatory comparison</h2>
        <div className="border-t border-border mb-6" />

        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <div className="px-6 py-4 bg-muted/40 border-b border-border">
            <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground">Key regulatory parameters by country</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20">
                  {["Country", "Tariff regime", "Regulator", "Price cap", "Concession framework", "Risk"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[
                  { code: "DK", country: "Denmark", tariff: "Cost-reflective, non-profit", regulator: "Forsyningstilsynet", cap: "No hard cap; cost-plus", concession: "Strong · 30yr standard", risk: "Stable", riskColor: "bg-emerald-100 text-emerald-700" },
                  { code: "NL", country: "Netherlands", tariff: "Price cap (gas parity)", regulator: "ACM", cap: "Yes - gas equivalent", concession: "Moderate · transitioning", risk: "Moderate", riskColor: "bg-amber-100 text-amber-700" },
                  { code: "DE", country: "Germany", tariff: "Unregulated - competition law", regulator: "Bundeskartellamt", cap: "None", concession: "Variable by Bundesland", risk: "Moderate", riskColor: "bg-amber-100 text-amber-700" },
                  { code: "SE", country: "Sweden", tariff: "Deregulated - market-based", regulator: "Energimarknadsinspektionen", cap: "None", concession: "Limited - no national framework", risk: "Moderate", riskColor: "bg-amber-100 text-amber-700" },
                  { code: "FR", country: "France", tariff: "Concession-based · municipal", regulator: "CRE / Municipality", cap: "Set in concession", concession: "Strong · Délégation de Service Public", risk: "Stable", riskColor: "bg-emerald-100 text-emerald-700" },
                  { code: "IT", country: "Italy", tariff: "Regulated · ARERA-approved", regulator: "ARERA", cap: "Yes - regulated tariff", concession: "Moderate · municipal concessions", risk: "Moderate", riskColor: "bg-amber-100 text-amber-700" },
                  { code: "AT", country: "Austria", tariff: "Price-regulated · cost-based", regulator: "E-Control", cap: "Cost-plus ceiling", concession: "Strong · long-term municipal", risk: "Stable", riskColor: "bg-emerald-100 text-emerald-700" },
                  { code: "PL", country: "Poland", tariff: "Cost-plus · regulator-approved", regulator: "URE", cap: "Yes - cost-plus ceiling", concession: "Moderate · developing", risk: "Moderate", riskColor: "bg-amber-100 text-amber-700" },
                  { code: "CZ", country: "Czech Republic", tariff: "Price-regulated · ERÚ-approved", regulator: "ERÚ", cap: "Yes - price cap", concession: "Moderate · municipal licenses", risk: "Moderate", riskColor: "bg-amber-100 text-amber-700" },
                  { code: "LT", country: "Lithuania", tariff: "Regulated · cost-plus", regulator: "VERT", cap: "Yes - regulated ceiling", concession: "Strong · state-owned networks", risk: "Stable", riskColor: "bg-emerald-100 text-emerald-700" },
                  { code: "LV", country: "Latvia", tariff: "Regulated · cost-based", regulator: "SPRK", cap: "Yes - cost-based cap", concession: "Strong · municipal ownership", risk: "Stable", riskColor: "bg-emerald-100 text-emerald-700" },
                  { code: "EE", country: "Estonia", tariff: "Regulated · competition-based", regulator: "Competition Authority", cap: "Yes - price regulation", concession: "Moderate · licensing system", risk: "Stable", riskColor: "bg-emerald-100 text-emerald-700" },
                  { code: "FI", country: "Finland", tariff: "Largely unregulated", regulator: "Energy Authority", cap: "None", concession: "Limited - primarily municipal", risk: "Stable", riskColor: "bg-emerald-100 text-emerald-700" },
                  { code: "GB", country: "United Kingdom", tariff: "Voluntary (Heat Trust) · Ofgem incoming", regulator: "Ofgem (from 2026)", cap: "Under development", concession: "Weak - being established", risk: "Transitional", riskColor: "bg-orange-100 text-orange-700" },
                ].map((row, i) => (
                  <tr
                    key={i}
                    className={row.code === "FR" ? "bg-primary/5" : ""}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-[10px] font-bold text-muted-foreground tracking-wider mr-2">{row.code}</span>
                      <span className="font-semibold text-foreground">{row.country}</span>
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{row.tariff}</td>
                    <td className="px-4 py-3.5 text-foreground">{row.regulator}</td>
                    <td className="px-4 py-3.5 text-foreground">{row.cap}</td>
                    <td className="px-4 py-3.5 text-foreground">{row.concession}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${row.riskColor}`}>
                        {row.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sustainability & Compliance ─── */
function SustainabilityTab({ project }: { project: ProjectDetail }) {
  return (
    <div className="space-y-10">
      {/* Key Sustainability Metrics */}
      {project.sustainabilityMetrics && project.sustainabilityMetrics.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Key sustainability metrics</h2>
          <div className="border-t border-border mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {project.sustainabilityMetrics.map((metric, i) => {
              const icons = [
                <CloudOff key="ico" className="w-5 h-5 text-emerald-600" />,
                <Gauge key="ico" className="w-5 h-5 text-emerald-600" />,
                <Zap key="ico" className="w-5 h-5 text-emerald-600" />,
                <Activity key="ico" className="w-5 h-5 text-emerald-600" />,
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
              Equivalent to removing approximately <strong className="text-foreground">{project.co2Detail.equivalentCars} cars from the road annually</strong>. Over the {project.concessionTerm.replace(" years", "-year")} concession, the project is projected to avoid over {project.co2Detail.lifetimeReduction} of CO₂ equivalent.
            </p>
          </div>
          {/* CO2 Baseline vs Project Chart */}
          {(() => {
            const concessionYears = parseInt(project.concessionTerm) || 25;
            const steps = Math.floor(concessionYears / 5);
            const avoided = project.co2Detail.tonnes; // annual tCO₂e avoided
            // Baseline = total annual emissions without the project; avoided is ~80% reduction
            const baseline = Math.round(avoided / 0.8);
            const withProject = baseline - avoided;
            const chartData = Array.from({ length: steps }, (_, i) => ({
              year: `Y${(i + 1) * 5}`,
              baseline,
              withProject,
            }));
            return (
              <div className="mt-6 bg-muted/50 border border-border rounded-xl p-5">
                <p className="text-sm font-semibold text-foreground mb-1">CO₂ emissions comparison</p>
                <p className="text-xs text-muted-foreground mb-4">Annual emissions (tCO₂e / yr) - difference = {avoided.toLocaleString()} tCO₂e avoided</p>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                      formatter={(value: number) => [`${value.toLocaleString()} tCO₂e`, undefined]}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="baseline" name="Baseline (no project)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="withProject" name="With project" fill="hsl(152 69% 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>
      )}

      {/* DNSH Assessment */}
      {project.euTaxonomy && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Do No Significant Harm (DNSH)</h2>
          <div className="border-t border-border mb-6" />
          <div className="flex items-center gap-6 text-sm text-muted-foreground mb-4">
            <p><span className="font-semibold text-foreground">Assessed by:</span> Bureau Veritas</p>
            <p><span className="font-semibold text-foreground">Date:</span> January 2025</p>
          </div>
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/60">
                  <th className="text-left py-2.5 px-4 font-semibold text-foreground">Environmental objective</th>
                  <th className="text-left py-2.5 px-4 font-semibold text-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {([
                  { objective: "Climate change mitigation", status: "pass" },
                  { objective: "Climate change adaptation", status: "pass" },
                  { objective: "Water & marine resources", status: "pass" },
                  { objective: "Circular economy transition", status: "pass" },
                  { objective: "Pollution prevention & control", status: "pass" },
                  { objective: "Biodiversity & ecosystems", status: "not-assessed" },
                ] as { objective: string; status: "pass" | "not-pass" | "not-assessed" }[]).map((row, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-3 px-4 text-muted-foreground">{row.objective}</td>
                    <td className="py-3 px-4">
                      {row.status === "pass" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: "hsl(152 69% 40%)" }}>
                          <CheckCircle className="w-4 h-4" /> Pass
                        </span>
                      ) : row.status === "not-pass" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive">
                          <XCircle className="w-4 h-4" /> Not pass
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <MinusCircle className="w-4 h-4" /> Not assessed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EU Regulatory Compliance */}
      <div>
        <h2 className="text-2xl font-serif font-bold text-foreground mb-3">EU regulatory compliance</h2>
        <div className="border-t border-border mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              icon: "✦",
              iconBg: "bg-amber-50 text-amber-700",
              title: "EU Taxonomy - Climate mitigation (Reg. 2020/852)",
              description: "Substantial contribution confirmed under Annex I of the Climate Delegated Act. Independently verified by Bureau Veritas.",
              footer: "✓ Verified · January 2025",
            },
            {
              icon: "⚡",
              iconBg: "bg-orange-50 text-orange-600",
              title: "Energy Efficiency Directive, efficient district heating and cooling (Art. 26)",
              description: "Article 26 is a share test, not a primary energy factor test. The project meets the Article 26 path on renewable and waste-heat share, with 85% of supply from renewable sources and recovered waste heat against the threshold applying from 2030.",
              footer: "Article 26 path met on renewable and waste-heat share, threshold year 2030. Developer-stated.",
            },
            {
              icon: "🌿",
              iconBg: "bg-green-50 text-green-700",
              title: "Renewable Energy Directive III, district heating and cooling targets (Art. 25)",
              description: "The project's 85% renewable share substantially exceeds the RED III binding target of 49% renewable in district heating and cooling by 2030.",
              footer: "Exceeds the 2030 target. Developer-stated.",
            },
            {
              icon: "9",
              iconBg: "bg-muted text-foreground font-bold",
              title: "SFDR classification",
              description: "SFDR classification is the investor's to make. The project data supports a climate change mitigation objective, and the developer provides the annual impact reporting an investor needs, but the platform does not assign an article to this investment.",
              footer: "Classification determined by the investor.",
            },
          ].map((item, i) => (
            <div key={i} className="border border-border rounded-xl p-5 bg-card flex gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg ${item.iconBg}`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground text-sm leading-snug">{item.title}</h3>
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 shrink-0">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Compliant
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                <p className="text-sm text-green-700 font-medium mt-3">{item.footer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Energy Mix */}
      {project.energyMix && project.energyMix.length > 0 && (
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Primary energy source mix</h2>
          <div className="border-t border-border mb-6" />
          <div className="flex rounded-lg overflow-hidden h-8 mb-4">
            {project.energyMix.map((source, i) => (
              <div
                key={source.source}
                className="flex items-center justify-center text-xs font-medium text-white"
                style={{
                  width: `${source.percentage}%`,
                  backgroundColor: i === 0 ? "hsl(var(--primary))" : i === 1 ? "hsl(152 69% 50%)" : "hsl(var(--muted-foreground))",
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
                  backgroundColor: i === 0 ? "hsl(var(--primary))" : i === 1 ? "hsl(152 69% 50%)" : "hsl(var(--muted-foreground))",
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
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
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
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-200 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                9
              </div>
              <div>
                <h4 className="mb-1 text-sm font-bold text-purple-800">SFDR classification is the investor's to make</h4>
                <p className="text-sm leading-relaxed text-purple-700">
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
type DocItem = {
  title: string;
  meta: string;
  icon: typeof FileText;
  iconColor: string;
  iconBg: string;
  gated?: boolean;
};

const DOCUMENT_LIST: DocItem[] = [
  {
    title: "Information Memorandum",
    meta: "PDF · 48 pages · Updated March 2025",
    icon: FileText,
    iconColor: "text-rose-600",
    iconBg: "bg-rose-50",
  },
  {
    title: "EU Taxonomy Assessment Report",
    meta: "PDF · 24 pages · Bureau Veritas · January 2025",
    icon: BookOpen,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50",
  },
  {
    title: "Technical Feasibility Study (Summary)",
    meta: "PDF · 32 pages · Rambøll · Q3 2023",
    icon: ClipboardList,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-50",
  },
  {
    title: "Financial Model (Excel)",
    meta: "XLSX · Full project finance model · Data room access required",
    icon: FileSpreadsheet,
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
    gated: true,
  },
  {
    title: "Environmental Impact Assessment",
    meta: "PDF · 112 pages · Data room access required",
    icon: Leaf,
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
    gated: true,
  },
  {
    title: "Legal Term Sheet",
    meta: "PDF · Concession agreement terms · Data room access required",
    icon: Scale,
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
    gated: true,
  },
  {
    title: "EPC Contract Summary",
    meta: "PDF · Vinci Energies fixed-price contract · Data room access required",
    icon: FileSignature,
    iconColor: "text-muted-foreground",
    iconBg: "bg-muted",
    gated: true,
  },
];

function DocumentsTab({
  project: _project,
  dataRoomStatus = "none",
  onRequestDataRoom,
}: {
  project: ProjectDetail;
  dataRoomStatus?: DataRoomStatus;
  onRequestDataRoom?: () => void;
}) {
  const openDocs = DOCUMENT_LIST.filter((d) => !d.gated);
  const dataRoomDocs = DOCUMENT_LIST.filter((d) => d.gated);
  const approved = dataRoomStatus === "approved";

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Open documents</h2>
      <div className="border-t border-border mb-6" />
      <div className="space-y-3">
        {openDocs.map((doc) => {
          const Icon = doc.icon;
          return (
            <div
              key={doc.title}
              className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 ${doc.iconBg}`}>
                  <Icon className={`w-5 h-5 ${doc.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.meta}</p>
                </div>
              </div>
              <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 ml-3">
                Download
              </Button>
            </div>
          );
        })}
      </div>

      {/* Confidential data room (T3) */}
      <div className="mt-8 rounded-xl border border-dashed border-primary/30 bg-muted/30 p-6">
        <div className="flex items-center gap-3 mb-2">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Confidential data room</h3>
          <span className="ml-auto rounded-full bg-primary/10 text-primary px-3 py-0.5 text-xs font-semibold">
            Developer-approved
          </span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">
          The financial model, EIA, term sheet, and EPC contract require the developer's approval before access.
          Request access and the developer is notified to approve.
        </p>

        {approved ? (
          <div className="space-y-3">
            {dataRoomDocs.map((doc) => {
              const Icon = doc.icon;
              return (
                <div
                  key={doc.title}
                  className="flex items-center justify-between bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{doc.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{doc.meta}</p>
                    </div>
                  </div>
                  <Button size="sm" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 ml-3">
                    Download
                  </Button>
                </div>
              );
            })}
          </div>
        ) : dataRoomStatus === "pending" ? (
          <div className="flex items-center gap-2.5 rounded-lg border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-700 dark:text-amber-500">
            <Clock className="w-4 h-4 shrink-0" />
            <span>Your access request is with the developer. Nothing is released until they decide.</span>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            <span>The data room opens only when the developer accepts your request in full. They decide this separately.</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Q&A ─── */
type QAItem = {
  initials: string;
  name: string;
  org: string;
  date: string;
  question: string;
  answer: {
    initials: string;
    name: string;
    role: string;
    date: string;
    text: string;
  };
};

const QA_LIST: QAItem[] = [
  {
    initials: "MH",
    name: "M. Hansen",
    org: "Nordea Asset Management",
    date: "12 Mar 2025",
    question:
      "What is the sensitivity of the project IRR to a 50bps increase in EURIBOR, given that only 75% of the floating-rate tranche is hedged?",
    answer: {
      initials: "CP",
      name: "Copenhagen Energy Partners",
      role: "Developer",
      date: "14 Mar 2025",
      text: "A 50bps increase on the unhedged 25% (~€20.8M) reduces equity IRR by approximately 18bps. Full sensitivity table in the financial model in the data room.",
    },
  },
  {
    initials: "SR",
    name: "S. Rasmussen",
    org: "PensionDanmark",
    date: "5 Mar 2025",
    question:
      "Is there a minimum co-investment ticket for the remaining equity allocation, and what governance rights would a minority investor receive?",
    answer: {
      initials: "CP",
      name: "Copenhagen Energy Partners",
      role: "Developer",
      date: "7 Mar 2025",
      text: "Minimum ticket is €5M. Investors above €15M receive a board observer seat. All equity investors receive quarterly reports, annual audited accounts, and proportional voting rights on reserved matters.",
    },
  },
  {
    initials: "LB",
    name: "L. Bergström",
    org: "AP3",
    date: "18 Feb 2025",
    question:
      "Has the project completed the DNSH assessment for water and marine resources, given the depth of the geothermal extraction?",
    answer: {
      initials: "CP",
      name: "Copenhagen Energy Partners",
      role: "Developer",
      date: "20 Feb 2025",
      text: "Yes - the Bunter Sandstone aquifer is confined, saline, non-potable with no connection to surface or potable groundwater. Full DNSH assessment by Bureau Veritas is available in the data room.",
    },
  },
];

function QATab({ project: _project }: { project: ProjectDetail }) {
  const { toast } = useToast();
  const [question, setQuestion] = useState("");

  const handleSubmit = () => {
    const trimmed = question.trim();
    if (!trimmed) {
      toast({
        title: "Question required",
        description: "Please type your question before submitting.",
        variant: "destructive",
      });
      return;
    }
    if (trimmed.length > 1000) {
      toast({
        title: "Question too long",
        description: "Please keep your question under 1000 characters.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Question submitted",
      description: "The project developer will respond within 5 business days.",
    });
    setQuestion("");
  };

  return (
    <div>
      <h2 className="text-2xl font-serif font-bold text-foreground mb-3">Investor questions</h2>
      <div className="border-t border-border mb-6" />
      <div className="space-y-4">
        {QA_LIST.map((item, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-5">
            {/* Question */}
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">{item.initials}</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                  <span className="font-semibold text-foreground">{item.name}</span>
                  <span className="text-muted-foreground">· {item.org} · {item.date}</span>
                </div>
                <p className="text-sm text-foreground/90 mt-1.5 leading-relaxed">{item.question}</p>
              </div>
            </div>

            {/* Answer */}
            <div className="mt-4 ml-4 pl-5 border-l-2 border-primary/30">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">{item.answer.initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-semibold text-foreground">{item.answer.name}</span>
                    <span className="text-muted-foreground">· {item.answer.role} · {item.answer.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{item.answer.text}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit a question */}
      <div className="mt-6 bg-card border border-border rounded-xl p-5">
        <h3 className="text-base font-semibold text-foreground mb-3">Submit a question to the project developer</h3>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={1000}
          placeholder="Type your question here. Questions are answered publicly within 5 business days and visible to all registered investors…"
          className="min-h-[110px] resize-y bg-background"
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setQuestion("")}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            Submit question
          </Button>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
        <p>Q&A is available to approved investors who have expressed investment interest.</p>
      </div>
    </div>
  );
}

export default ProjectTabContent;
