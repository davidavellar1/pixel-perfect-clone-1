import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, Zap, PieChart as PieChartIcon } from "lucide-react";

interface ProjectChartsProps {
  projectTitle: string;
  capexNum: number; // in millions
  technology: string;
}

const tabs = ["Financial Projections", "Energy Output", "Energy Mix"] as const;
type Tab = (typeof tabs)[number];

function generateFinancialData(capex: number) {
  const annualReturn = capex * 0.08;
  return Array.from({ length: 10 }, (_, i) => {
    const year = `Y${i + 1}`;
    const cumulative = -capex + annualReturn * (i + 1);
    return {
      year,
      annualReturn: parseFloat(annualReturn.toFixed(1)),
      cumulativeCashFlow: parseFloat(cumulative.toFixed(1)),
    };
  });
}

const energyOutputData = [
  { month: "Jan", peakCapacity: 42, energyOutput: 30 },
  { month: "Feb", peakCapacity: 40, energyOutput: 28 },
  { month: "Mar", peakCapacity: 35, energyOutput: 24 },
  { month: "Apr", peakCapacity: 28, energyOutput: 18 },
  { month: "May", peakCapacity: 22, energyOutput: 14 },
  { month: "Jun", peakCapacity: 16, energyOutput: 10 },
  { month: "Jul", peakCapacity: 14, energyOutput: 9 },
  { month: "Aug", peakCapacity: 15, energyOutput: 10 },
  { month: "Sep", peakCapacity: 20, energyOutput: 13 },
  { month: "Oct", peakCapacity: 28, energyOutput: 20 },
  { month: "Nov", peakCapacity: 36, energyOutput: 27 },
  { month: "Dec", peakCapacity: 40, energyOutput: 30 },
];

function getEnergyMixData(technology: string) {
  const mixes: Record<string, { name: string; value: number; color: string }[]> = {
    Geothermal: [
      { name: "Geothermal", value: 78, color: "hsl(var(--primary))" },
      { name: "Heat Pumps", value: 15, color: "hsl(217 91% 60%)" },
      { name: "Peak Gas", value: 7, color: "hsl(var(--muted-foreground))" },
    ],
    "Waste Heat": [
      { name: "Waste Heat", value: 70, color: "hsl(var(--primary))" },
      { name: "Heat Pumps", value: 20, color: "hsl(217 91% 60%)" },
      { name: "Peak Gas", value: 10, color: "hsl(var(--muted-foreground))" },
    ],
    Biomass: [
      { name: "Biomass", value: 82, color: "hsl(var(--primary))" },
      { name: "Solar Thermal", value: 10, color: "hsl(217 91% 60%)" },
      { name: "Peak Gas", value: 8, color: "hsl(var(--muted-foreground))" },
    ],
    "Heat Pump": [
      { name: "Heat Pumps", value: 85, color: "hsl(var(--primary))" },
      { name: "Geothermal", value: 10, color: "hsl(217 91% 60%)" },
      { name: "Peak Gas", value: 5, color: "hsl(var(--muted-foreground))" },
    ],
    "Solar Thermal": [
      { name: "Solar Thermal", value: 65, color: "hsl(var(--primary))" },
      { name: "Heat Pumps", value: 25, color: "hsl(217 91% 60%)" },
      { name: "Peak Gas", value: 10, color: "hsl(var(--muted-foreground))" },
    ],
    Aquathermal: [
      { name: "Aquathermal", value: 72, color: "hsl(var(--primary))" },
      { name: "Heat Pumps", value: 18, color: "hsl(217 91% 60%)" },
      { name: "Peak Gas", value: 10, color: "hsl(var(--muted-foreground))" },
    ],
    "Absorption Cooling": [
      { name: "Absorption Cooling", value: 68, color: "hsl(var(--primary))" },
      { name: "Electric Chillers", value: 22, color: "hsl(217 91% 60%)" },
      { name: "Peak Gas", value: 10, color: "hsl(var(--muted-foreground))" },
    ],
  };
  return mixes[technology] || mixes["Geothermal"];
}

const ProjectCharts = ({ projectTitle, capexNum, technology }: ProjectChartsProps) => {
  const [activeTab, setActiveTab] = useState<Tab>("Financial Projections");
  const financialData = generateFinancialData(capexNum);
  const energyMixData = getEnergyMixData(technology);

  return (
    <div className="mb-10">
      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div className="bg-card border border-border rounded-xl p-6">
        {activeTab === "Financial Projections" && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-serif font-bold text-foreground">
                10-Year Financial Projection
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Annual returns and cumulative cash flow (€M)
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={financialData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Bar dataKey="annualReturn" name="Annual Return" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                <Bar dataKey="cumulativeCashFlow" name="Cumulative Cash Flow" fill="hsl(217 91% 60%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}

        {activeTab === "Energy Output" && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-serif font-bold text-foreground">
                Monthly Energy Output Profile
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Projected output and peak capacity (GWh)
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={energyOutputData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px" }} />
                <Area
                  type="monotone"
                  dataKey="peakCapacity"
                  name="Peak Capacity"
                  stroke="hsl(217 91% 60%)"
                  fill="hsl(217 91% 60% / 0.15)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="energyOutput"
                  name="Energy Output"
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground) / 0.2)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}

        {activeTab === "Energy Mix" && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <PieChartIcon className="w-5 h-5 text-muted-foreground" />
              <h3 className="text-lg font-serif font-bold text-foreground">
                Energy Source Mix
              </h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Breakdown of energy sources for {projectTitle}
            </p>
            <div className="flex justify-center">
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={energyMixData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name} ${value}%`}
                    labelLine={true}
                  >
                    {energyMixData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => `${value}%`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProjectCharts;
