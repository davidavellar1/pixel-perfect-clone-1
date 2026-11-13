import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { asOfLine, eur } from "@/data/investorGrade";
interface Props { capexNum: number; granted: boolean; energyMix: { source: string; percentage: number }[]; asOf?: string | null }
const ProjectCharts = ({ capexNum, granted, energyMix, asOf }: Props) => {
  if (!granted || !energyMix.length) return null;
  return <section><h2 className="mb-3 font-display text-2xl font-semibold">Energy mix</h2>
    <p className="text-xs text-muted-foreground">Developer-stated. {asOf ? asOfLine("Project information", asOf) : "As-of date not provided"}. Total capex: {eur(capexNum)}.</p>
    <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={energyMix} dataKey="percentage" nameKey="source" innerRadius={65} outerRadius={100}>{energyMix.map((source, index) => <Cell key={source.source} fill={index % 2 ? "var(--accent)" : "var(--primary)"} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
    <div className="flex flex-wrap gap-4 text-sm">{energyMix.map((source) => <span key={source.source}>{source.source}: {source.percentage}%</span>)}</div>
  </section>;
};
export default ProjectCharts;
