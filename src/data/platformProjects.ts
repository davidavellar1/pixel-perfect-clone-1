export type MilestoneStatus = "completed" | "in-progress" | "upcoming";

export interface Milestone {
  label: string;
  date: string;
  status: MilestoneStatus;
  description?: string;
}

export interface PlatformProject {
  id: number;
  title: string;
  location: string;
  country: string;
  lifecycle: string;
  type: string;
  technology: string;
  capacity: string; // e.g. "45 MW"
  investment: string; // e.g. "€32M"
  irr: string; // e.g. "8.2%"
  description: string;
  co2: string;
  timeline: string;
  developer: string;
  households: string;
  payback: string;
  milestones: Milestone[];
}

const defaultMilestones = (start: number, end: number): Milestone[] => [
  { label: "Concept & Feasibility", date: `Q1 ${start}`, status: "completed", description: "Initial scoping and feasibility analysis completed." },
  { label: "Permitting & Approvals", date: `Q3 ${start}`, status: "completed", description: "Environmental and municipal permits obtained." },
  { label: "Financial Close", date: `Q1 ${start + 1}`, status: "in-progress", description: "Securing debt and equity financing." },
  { label: "Construction Start", date: `Q3 ${start + 1}`, status: "upcoming", description: "Mobilization and groundbreaking." },
  { label: "Commissioning", date: `Q2 ${end}`, status: "upcoming", description: "Network commissioning and testing." },
  { label: "Commercial Operation", date: `Q4 ${end}`, status: "upcoming", description: "Full commercial heat/cooling delivery." },
];

export const platformProjects: PlatformProject[] = [
  {
    id: 1, title: "Helsinki North District Network", location: "Helsinki, Finland", country: "Finland",
    lifecycle: "Development / Ready to Build", type: "Greenfield", technology: "Geothermal",
    capacity: "45 MW", investment: "€32M", irr: "8.2%",
    description: "Large-scale geothermal district heating network serving northern Helsinki suburbs.",
    co2: "12,500 tonnes/yr", timeline: "2025-2028", developer: "Nordic Heat Solutions",
    households: "8,200", payback: "9.5 years", milestones: defaultMilestones(2024, 2028),
  },
  {
    id: 2, title: "Warsaw Modernization Phase II", location: "Warsaw, Poland", country: "Poland",
    lifecycle: "Construction", type: "Brownfield", technology: "Biomass CHP",
    capacity: "120 MW", investment: "€78M", irr: "7.5%",
    description: "Modernization of existing coal-fired DH network to biomass combined heat and power.",
    co2: "45,000 tonnes/yr", timeline: "2024-2027", developer: "PolHeat Sp. z o.o.",
    households: "22,000", payback: "11 years", milestones: defaultMilestones(2023, 2027),
  },
  {
    id: 3, title: "Lyon Smart Cooling Grid", location: "Lyon, France", country: "France",
    lifecycle: "Concept / Pre-Feasibility", type: "Greenfield", technology: "River Water Cooling",
    capacity: "25 MW", investment: "€18M", irr: "9.1%",
    description: "Innovative district cooling using river water source heat pumps for commercial district.",
    co2: "6,800 tonnes/yr", timeline: "2026-2029", developer: "Rhône Énergie",
    households: "3,500", payback: "7.5 years", milestones: defaultMilestones(2025, 2029),
  },
  {
    id: 4, title: "Munich District Expansion", location: "Munich, Germany", country: "Germany",
    lifecycle: "Operational", type: "Expansion", technology: "Waste Heat Recovery",
    capacity: "60 MW", investment: "€45M", irr: "6.8%",
    description: "Expansion of existing DH network utilizing industrial waste heat from nearby data center.",
    co2: "18,200 tonnes/yr", timeline: "2023-2026", developer: "Stadtwerke München",
    households: "12,000", payback: "12 years", milestones: defaultMilestones(2022, 2026),
  },
  {
    id: 5, title: "Copenhagen Carbon-Neutral DH", location: "Copenhagen, Denmark", country: "Denmark",
    lifecycle: "Due Diligence", type: "Expansion", technology: "Solar Thermal",
    capacity: "80 MW", investment: "€55M", irr: "7.9%",
    description: "Integrating large-scale solar thermal with seasonal storage into existing DH network.",
    co2: "22,000 tonnes/yr", timeline: "2025-2028", developer: "HOFOR A/S",
    households: "15,000", payback: "10 years", milestones: defaultMilestones(2024, 2028),
  },
  {
    id: 6, title: "Tallinn New District Network", location: "Tallinn, Estonia", country: "Estonia",
    lifecycle: "Development / Ready to Build", type: "Greenfield", technology: "Heat Pumps",
    capacity: "35 MW", investment: "€22M", irr: "8.5%",
    description: "New district heating network powered by large-scale air and ground source heat pumps.",
    co2: "9,500 tonnes/yr", timeline: "2025-2027", developer: "Eesti Energia",
    households: "6,800", payback: "8 years", milestones: defaultMilestones(2024, 2027),
  },
  {
    id: 7, title: "Milan Brownfield Conversion", location: "Milan, Italy", country: "Italy",
    lifecycle: "Concept / Pre-Feasibility", type: "Brownfield", technology: "Waste Heat Recovery",
    capacity: "50 MW", investment: "€38M", irr: "7.2%",
    description: "Converting legacy gas-fired heating to waste heat recovery from metro infrastructure.",
    co2: "14,000 tonnes/yr", timeline: "2026-2030", developer: "A2A Calore",
    households: "10,500", payback: "10.5 years", milestones: defaultMilestones(2025, 2030),
  },
  {
    id: 8, title: "Stockholm Seawater Cooling", location: "Stockholm, Sweden", country: "Sweden",
    lifecycle: "Operational", type: "Greenfield", technology: "Seawater Cooling",
    capacity: "40 MW", investment: "€28M", irr: "8.8%",
    description: "Free cooling from deep seawater for Stockholm's growing commercial districts.",
    co2: "8,000 tonnes/yr", timeline: "2022-2025", developer: "Stockholm Exergi",
    households: "5,200", payback: "7 years", milestones: defaultMilestones(2021, 2025),
  },
  {
    id: 9, title: "Vilnius DH Upgrade", location: "Vilnius, Lithuania", country: "Lithuania",
    lifecycle: "Construction", type: "Brownfield", technology: "Biomass CHP",
    capacity: "90 MW", investment: "€52M", irr: "7.8%",
    description: "Comprehensive upgrade of Soviet-era district heating with modern biomass CHP plants.",
    co2: "32,000 tonnes/yr", timeline: "2024-2027", developer: "Vilniaus Šilumos Tinklai",
    households: "18,000", payback: "9 years", milestones: defaultMilestones(2023, 2027),
  },
];

export const parseNumber = (s: string): number => {
  const m = s.match(/[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
};

export const getProjectById = (id: number | string): PlatformProject | undefined => {
  const n = typeof id === "string" ? parseInt(id, 10) : id;
  return platformProjects.find((p) => p.id === n);
};
