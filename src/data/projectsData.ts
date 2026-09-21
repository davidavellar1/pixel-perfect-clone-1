export interface ProjectDetail {
  slug: string;
  badge: string;
  title: string;
  location: string;
  country: string;
  source: string;
  stage: string;
  type: string;
  technology: string;
  publicSupport?: boolean;
  targetIRR: string;
  capex: string;
  capacity: string;
  npv: string;
  paybackPeriod: string;
  summary: string;
  summaryExtended?: string;
  timeline: { title: string; status: "completed" | "in_progress" | "planned"; date: string; description: string }[];
  documents: string[];
  co2Reduction: string;
  householdsServed: string;
  timelineRange: string;
  // New fields
  equityRequired: string;
  minTicket: string;
  unleveragedIRR: string;
  concessionTerm: string;
  firstRevenue: string;
  fundingProgress: number; // percentage
  fundingRemaining: string;
  developer: {
    name: string;
    verified: boolean;
    hq: string;
    founded: string;
    dhcProjects: string;
    totalCapacity: string;
  };
  advisors: { name: string; role: string }[];
  publicFunding?: { source: string; amount: string; status: string }[];
  technologyCards: { title: string; description: string }[];
  capitalStack?: { label: string; percentage: number; amount: string; description: string; color: string }[];
  revenueStreams?: { stream: string; structure: string; percentRevenue: string; counterparty: string }[];
  risks?: { title: string; severity: "Low" | "Medium" | "High"; description: string }[];
  co2Detail?: { tonnes: number; equivalentCars: string; lifetimeReduction: string };
  euTaxonomy?: { objective: string; description: string };
  sdgs?: { number: number; title: string; description: string; color: string }[];
  sfdr?: { article: string; description: string };
  energyMix?: { source: string; percentage: number }[];
  operatingParameters?: { parameter: string; value: string; benchmark: string }[];
  sustainabilityMetrics?: { label: string; value: string; context: string }[];
  badges: string[];
}

export function slugify(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const projectsData: ProjectDetail[] = [
  {
    slug: "copenhagen-geothermal-network",
    badge: "Expansion",
    title: "Copenhagen Geothermal Network",
    location: "Copenhagen, Denmark",
    country: "Denmark",
    source: "Geothermal",
    stage: "Construction",
    type: "District Heating",
    technology: "Geothermal",
    publicSupport: true,
    targetIRR: "8.4%",
    capex: "€185M",
    equityRequired: "€55M",
    minTicket: "€5M",
    unleveragedIRR: "6.8%",
    concessionTerm: "30 years",
    firstRevenue: "Q4 2026",
    fundingProgress: 68,
    fundingRemaining: "€37.4M",
    capacity: "180 GWh/yr",
    npv: "€42M",
    paybackPeriod: "11.5 years",
    badges: ["Construction", "EU Taxonomy aligned", "Public co-investment", "Verified developer"],
    summary:
      "The Copenhagen South Geothermal District Network is a large-scale geothermal district heating project located in the Amager and Valby districts of Copenhagen. The project will tap into the Bunter Sandstone aquifer at a depth of 1,800 metres, extracting hot water at 72°C and distributing low-carbon heat across a dense urban network serving approximately 42,000 households and 380 commercial buildings.",
    summaryExtended:
      "The project is being developed by Copenhagen Energy Partners A/S in partnership with the City of Copenhagen, and holds a 30-year concession from the municipality. Construction began in Q1 2025, with the first 18,000 households connected by end-2026 and full network build-out targeted for Q4 2027.\n\nThe project benefits from existing district heating infrastructure in the area, significantly reducing civil works costs. The heat network will be integrated with Copenhagen's existing high-temperature grid, with the geothermal source expected to supply approximately 55% of annual heat demand, supplemented by large-scale heat pumps during peak demand periods.",
    timeline: [
      { title: "Feasibility study & site surveys", status: "completed", date: "Q3 2023", description: "Hydrogeological survey, seismic data review, and prefeasibility cost model completed by Rambøll." },
      { title: "Planning approvals & concession award", status: "completed", date: "Q2 2024", description: "30-year concession granted by Copenhagen Municipality. Environmental permit issued by the Danish Energy Agency." },
      { title: "Financial close & EIB loan agreement", status: "completed", date: "Q4 2024", description: "€45M senior loan from EIB signed. Equity raised from Copenhagen Energy Partners and Nordic Infrastructure Fund I." },
      { title: "Well drilling & plant construction", status: "in_progress", date: "Q1 2025 - Q2 2026", description: "Production and injection wells currently being drilled. Heat exchange plant groundworks underway in Amager." },
      { title: "Phase 1 network commissioning", status: "planned", date: "Q4 2026", description: "First 18,000 households connected. Revenue generation begins." },
      { title: "Full network completion", status: "planned", date: "Q4 2027", description: "All 42,000 households connected. Full operational capacity of 180 GWh/year." },
    ],
    documents: ["Teaser Deck.pdf", "Financial Model.xlsx", "Technical Feasibility.pdf", "Environmental Impact Assessment.pdf", "EIB Loan Summary.pdf"],
    co2Reduction: "38,000 tonnes/yr",
    householdsServed: "42,000",
    timelineRange: "2023-2027",
    developer: {
      name: "Copenhagen Energy Partners A/S",
      verified: true,
      hq: "Copenhagen, DK",
      founded: "2011",
      dhcProjects: "8 completed",
      totalCapacity: "940 GWh/yr",
    },
    advisors: [
      { name: "Rambøll Group", role: "Technical advisor" },
      { name: "Macfarlanes LLP", role: "Legal advisor" },
      { name: "Bureau Veritas", role: "Sustainability / EU Taxonomy" },
    ],
    publicFunding: [
      { source: "EIB loan", amount: "€33.3M", status: "Committed" },
      { source: "InvestEU grant", amount: "€27.7M", status: "Committed" },
    ],
    technologyCards: [
      { title: "Deep geothermal extraction", description: "Two doublet wells at 1,800m depth. Bunter Sandstone aquifer, 72°C production temperature. Expected flow rate 120 m³/hour." },
      { title: "Peak load heat pumps", description: "3 × 8 MW electric heat pumps for periods of peak demand. Sourced on renewable electricity PPA from Danish offshore wind." },
      { title: "Distribution network", description: "42 km of pre-insulated twin pipes. Pressure class PN16, operating temperature 75/35°C. Direct connection to city backbone." },
      { title: "Smart metering & control", description: "IoT-connected heat meters on all substations. Real-time demand balancing and remote fault detection across the network." },
    ],
    capitalStack: [
      { label: "Equity", percentage: 22, amount: "€40.7M", description: "Copenhagen Energy Partners + Nordic Infrastructure Fund I", color: "hsl(var(--primary))" },
      { label: "Senior debt", percentage: 45, amount: "€83.3M", description: "Commercial bank syndicate, 20yr tenor, EURIBOR +185bps", color: "hsl(152 69% 40%)" },
      { label: "EIB grant", percentage: 18, amount: "€33.3M", description: "European Investment Bank, 25yr tenor, fixed 2.1%", color: "hsl(271 60% 60%)" },
      { label: "Concess.", percentage: 15, amount: "€27.7M", description: "EU climate infrastructure grant, non-repayable", color: "hsl(271 40% 75%)" },
    ],
    revenueStreams: [
      { stream: "Regulated heat tariff", structure: "CPI-indexed, regulated by Danish Utility Regulator (Forsyningstilsynet). Annual adjustment.", percentRevenue: "74%", counterparty: "42,000 end consumers via municipality" },
      { stream: "Commercial building contracts", structure: "15-year take-or-pay agreements with 380 commercial buildings. Floor volume 85% of contracted capacity.", percentRevenue: "18%", counterparty: "380 commercial counterparties" },
      { stream: "Flexibility & grid services", structure: "Demand response services sold into Danish TSO (Energinet) market for heat pump load balancing.", percentRevenue: "8%", counterparty: "Energinet (Danish TSO)" },
    ],
    risks: [
      { title: "Construction risk", severity: "Medium", description: "Well drilling carries geological uncertainty. Mitigated by comprehensive seismic survey and drilling insurance policy covering cost overrun up to 15%. Fixed-price EPC contract with Vinci Energies." },
      { title: "Regulatory risk", severity: "Low", description: "30-year concession granted. Danish heat supply regulation is stable and politically supported. Tariff methodology locked for first 10 years under concession agreement." },
      { title: "Offtake risk", severity: "Low", description: "74% of revenue from regulated municipal tariff. Commercial take-or-pay contracts cover 18%. Demand risk is low given dense urban coverage area with limited alternative heat sources." },
      { title: "Interest rate risk", severity: "Medium", description: "Senior commercial tranche is floating rate (EURIBOR +185bps). 75% hedged via 10-year interest rate swap. EIB tranche is fixed rate. Residual exposure is manageable given CPI-linked revenue." },
    ],
    sustainabilityMetrics: [
      { label: "GHG avoidance", value: "38,000 tCO₂e / yr", context: "Scope 1 + 2 avoided vs. counterfactual gas boilers" },
      { label: "GHG intensity", value: "0.04 tCO₂e / MWh", context: "Well below EU average of 0.20 tCO₂e / MWh for DHC" },
      { label: "Primary energy factor (PEF)", value: "0.75", context: "National energy-performance figure reported for the network" },
      { label: "Network efficiency", value: "92%", context: "Heat delivered vs. heat produced (8% distribution loss)" },
    ],
    co2Detail: { tonnes: 38000, equivalentCars: "8,200", lifetimeReduction: "1.1 million tonnes" },
    euTaxonomy: {
      objective: "Climate Mitigation Objective - Substantial Contribution",
      description: "This project has been assessed as making a substantial contribution to climate change mitigation under the EU Taxonomy for Sustainable Finance (Regulation 2020/852). Assessment conducted by Bureau Veritas, report dated January 2025.",
    },
    sdgs: [
      { number: 7, title: "Affordable & Clean Energy", description: "Low-carbon heat supply", color: "hsl(45 93% 47%)" },
      { number: 11, title: "Sustainable Cities", description: "Urban heat decarbonisation", color: "hsl(33 90% 50%)" },
      { number: 13, title: "Climate Action", description: "38,000 tCO₂e/yr avoided", color: "hsl(152 69% 35%)" },
    ],
    sfdr: {
      article: "Article 9 - Sustainable investment objective",
      description: "The lead investor (Nordic Infrastructure Fund I) classifies this investment as an Article 9 sustainable investment under SFDR, with climate change mitigation as the designated sustainable investment objective. Ongoing impact reporting will be provided annually.",
    },
    energyMix: [
      { source: "Geothermal extraction", percentage: 55 },
      { source: "Large-scale heat pump (renewable electricity)", percentage: 30 },
      { source: "Gas backup boiler (peak/emergency only)", percentage: 15 },
    ],
  },
  {
    slug: "lyon-waste-heat-recovery",
    badge: "Modernization",
    title: "Lyon Waste Heat Recovery",
    location: "Lyon, France",
    country: "France",
    source: "Waste Heat",
    stage: "Development",
    type: "District Heating",
    technology: "Waste Heat",
    publicSupport: true,
    targetIRR: "12.0%",
    capex: "€12M",
    equityRequired: "€4M",
    minTicket: "€1M",
    unleveragedIRR: "9.5%",
    concessionTerm: "25 years",
    firstRevenue: "Q2 2027",
    fundingProgress: 35,
    fundingRemaining: "€2.6M",
    capacity: "8 MW",
    npv: "€4.5M",
    paybackPeriod: "8 Years",
    badges: ["Development", "EU Taxonomy aligned", "Public co-investment"],
    summary:
      "A large-scale project to capture excess heat from local industrial parks and distribute it to 15,000 residential units. This project utilizes existing infrastructure to minimize CAPEX and has signed connection agreements in place with the municipality.",
    timeline: [
      { title: "Feasibility & offtake agreements", status: "completed", date: "2024", description: "Feasibility study completed and connection agreements signed with the municipality." },
      { title: "Engineering & procurement", status: "in_progress", date: "2025", description: "Detailed engineering design and equipment procurement underway." },
      { title: "Construction phase", status: "planned", date: "2026", description: "Civil works and system installation." },
      { title: "Commissioning", status: "planned", date: "2027", description: "System testing and commercial operations begin." },
    ],
    documents: ["Teaser Deck.pdf", "Technical Feasibility.pdf"],
    co2Reduction: "12,500 tonnes/yr",
    householdsServed: "15,000",
    timelineRange: "2024-2027",
    developer: {
      name: "Lyon Énergie Verte SAS",
      verified: true,
      hq: "Lyon, FR",
      founded: "2015",
      dhcProjects: "3 completed",
      totalCapacity: "120 GWh/yr",
    },
    advisors: [
      { name: "Artelia Group", role: "Technical advisor" },
      { name: "EY", role: "Financial advisor" },
    ],
    publicFunding: [
      { source: "ADEME grant", amount: "€1.8M", status: "Committed" },
    ],
    technologyCards: [
      { title: "Industrial waste heat capture", description: "Heat exchangers installed at 3 industrial sites recovering waste heat at 60-80°C." },
      { title: "Heat pump boosting", description: "Central heat pump station to boost temperatures for distribution network compatibility." },
      { title: "Distribution network", description: "12 km of new pre-insulated pipes connecting industrial zones to residential areas." },
      { title: "Thermal storage", description: "2,000 m³ seasonal thermal storage tank for demand smoothing." },
    ],
    risks: [
      { title: "Construction risk", severity: "Low", description: "Standard infrastructure project with proven technology." },
      { title: "Regulatory risk", severity: "Low", description: "French heat network regulations are well-established." },
      { title: "Offtake risk", severity: "Medium", description: "Dependent on municipal commitment and residential connections." },
    ],
    sustainabilityMetrics: [
      { label: "GHG avoidance", value: "12,500 tCO₂e / yr", context: "Scope 1 + 2 avoided vs. counterfactual gas boilers" },
      { label: "GHG intensity", value: "0.06 tCO₂e / MWh", context: "Below EU average of 0.20 tCO₂e / MWh for DHC" },
      { label: "Primary energy factor (PEF)", value: "0.82", context: "National energy-performance figure reported for the network" },
      { label: "Network efficiency", value: "90%", context: "Heat delivered vs. heat produced (10% distribution loss)" },
    ],
    co2Detail: { tonnes: 12500, equivalentCars: "2,700", lifetimeReduction: "312,500 tonnes" },
    euTaxonomy: {
      objective: "Climate Mitigation Objective - Substantial Contribution",
      description: "Waste heat recovery qualifies under EU Taxonomy criteria for district heating systems.",
    },
    sdgs: [
      { number: 7, title: "Affordable & Clean Energy", description: "Industrial waste heat utilization", color: "hsl(45 93% 47%)" },
      { number: 12, title: "Responsible Consumption", description: "Industrial symbiosis", color: "hsl(33 90% 50%)" },
      { number: 13, title: "Climate Action", description: "12,500 tCO₂e/yr avoided", color: "hsl(152 69% 35%)" },
    ],
    capitalStack: [
      { label: "Equity", percentage: 33, amount: "€4M", description: "Lyon Énergie Verte + local investors", color: "hsl(var(--primary))" },
      { label: "Senior debt", percentage: 52, amount: "€6.2M", description: "BPI France, 15yr tenor", color: "hsl(152 69% 40%)" },
      { label: "ADEME grant", percentage: 15, amount: "€1.8M", description: "Non-repayable public grant", color: "hsl(271 60% 60%)" },
    ],
    revenueStreams: [
      { stream: "Regulated heat tariff", structure: "CPI-indexed, regulated by French Energy Regulator (CRE). Annual adjustment.", percentRevenue: "72%", counterparty: "15,000 households via municipality" },
      { stream: "Commercial building contracts", structure: "12-year take-or-pay agreements with 45 commercial buildings. Floor volume 80% of contracted capacity.", percentRevenue: "20%", counterparty: "45 commercial counterparties" },
      { stream: "Flexibility & grid services", structure: "Demand response services for heat pump load balancing via French TSO (RTE).", percentRevenue: "8%", counterparty: "RTE (French TSO)" },
    ],
    energyMix: [
      { source: "Industrial waste heat", percentage: 70 },
      { source: "Heat pump boosting", percentage: 20 },
      { source: "Peak gas boiler", percentage: 10 },
    ],
    operatingParameters: [
      { parameter: "Supply temperature (flow)", value: "75°C", benchmark: "Standard for 3rd-gen DHC; compatible with 4GDH retrofit" },
      { parameter: "Return temperature", value: "35°C", benchmark: "Low return temp = high system efficiency" },
      { parameter: "Temperature delta (ΔT)", value: "40°C", benchmark: "European best practice ≥35°C" },
      { parameter: "Network heat loss", value: "8.4%", benchmark: "EU benchmark 8-15%; this project is at the efficient end" },
      { parameter: "Network length", value: "42 km", benchmark: "Pre-insulated twin pipe, direct buried" },
      { parameter: "Heat density of service area", value: "58 MWh/km²", benchmark: "Viability threshold ~30 MWh/km²; dense urban area" },
      { parameter: "Installed geothermal capacity", value: "24 MW thermal", benchmark: "Covers ~96% of annual heat demand as base load" },
      { parameter: "Peak load capacity", value: "24 MW", benchmark: "3 × 8 MW electric heat pumps; peak only" },
      { parameter: "Annual heat output", value: "180 GWh/yr", benchmark: "At full network build-out (Q4 2027)" },
      { parameter: "Contracted connections", value: "87%", benchmark: "Share of projected customers under signed agreements" },
    ],
  },
  {
    slug: "munich-deep-geothermal",
    badge: "New Construction",
    title: "Munich Deep Geothermal",
    location: "Munich, Germany",
    country: "Germany",
    source: "Geothermal",
    stage: "Concept",
    type: "District Heating",
    technology: "Geothermal",
    targetIRR: "10.5%",
    capex: "€85M",
    equityRequired: "€30M",
    minTicket: "€5M",
    unleveragedIRR: "8.2%",
    concessionTerm: "30 years",
    firstRevenue: "Q1 2029",
    fundingProgress: 12,
    fundingRemaining: "€26.4M",
    capacity: "50 MW",
    npv: "€18.3M",
    paybackPeriod: "12 Years",
    badges: ["Concept", "Verified developer"],
    summary:
      "A greenfield deep geothermal project targeting the Malm aquifer beneath Munich. Designed to supply carbon-free heat to a new urban development district, this project represents one of the largest geothermal initiatives in Central Europe.",
    timeline: [
      { title: "Concept & resource assessment", status: "in_progress", date: "2024", description: "Geological surveys and resource modelling underway." },
      { title: "Exploration drilling", status: "planned", date: "2025", description: "Two exploration wells to confirm reservoir characteristics." },
      { title: "Construction", status: "planned", date: "2027", description: "Production wells, heat exchange plant, and network construction." },
      { title: "Full operations", status: "planned", date: "2029", description: "Full-scale heat supply to 35,000 households." },
    ],
    documents: ["Teaser Deck.pdf", "Resource Assessment.pdf", "Technical Feasibility.pdf"],
    co2Reduction: "25,000 tonnes/yr",
    householdsServed: "35,000",
    timelineRange: "2024-2029",
    developer: {
      name: "Stadtwerke München GmbH",
      verified: true,
      hq: "Munich, DE",
      founded: "1998",
      dhcProjects: "12 completed",
      totalCapacity: "1,200 GWh/yr",
    },
    advisors: [
      { name: "GeoWatt Consulting", role: "Technical advisor" },
    ],
    technologyCards: [
      { title: "Deep geothermal wells", description: "Targeting the Malm aquifer at 3,000m depth. Expected temperature 100°C." },
      { title: "Heat exchange plant", description: "Centralised ORC-assisted heat exchange facility." },
      { title: "District network", description: "55 km of new distribution pipes to a new urban district." },
      { title: "Monitoring systems", description: "Real-time reservoir monitoring and seismic detection." },
    ],
    co2Detail: { tonnes: 25000, equivalentCars: "5,400", lifetimeReduction: "750,000 tonnes" },
    sdgs: [
      { number: 7, title: "Affordable & Clean Energy", description: "Geothermal baseload", color: "hsl(45 93% 47%)" },
      { number: 13, title: "Climate Action", description: "25,000 tCO₂e/yr avoided", color: "hsl(152 69% 35%)" },
    ],
    capitalStack: [
      { label: "Equity", percentage: 35, amount: "€30M", description: "Stadtwerke München + institutional co-investors", color: "hsl(var(--primary))" },
      { label: "Senior debt", percentage: 50, amount: "€42.5M", description: "KfW development loan, 20yr tenor", color: "hsl(152 69% 40%)" },
      { label: "EU grant", percentage: 15, amount: "€12.5M", description: "Innovation Fund grant (pending)", color: "hsl(271 60% 60%)" },
    ],
    energyMix: [
      { source: "Deep geothermal", percentage: 80 },
      { source: "Heat pumps", percentage: 15 },
      { source: "Peak gas backup", percentage: 5 },
    ],
  },
  {
    slug: "stockholm-biomass-chp",
    badge: "Expansion",
    title: "Stockholm Biomass CHP",
    location: "Stockholm, Sweden",
    country: "Sweden",
    source: "Biomass",
    stage: "Construction",
    type: "Combined Heat & Power",
    technology: "Biomass",
    publicSupport: true,
    targetIRR: "9.2%",
    capex: "€32M",
    equityRequired: "€12M",
    minTicket: "€2M",
    unleveragedIRR: "7.5%",
    concessionTerm: "25 years",
    firstRevenue: "Q3 2025",
    fundingProgress: 82,
    fundingRemaining: "€2.2M",
    capacity: "25 MW",
    npv: "€6.8M",
    paybackPeriod: "9 Years",
    badges: ["Construction", "Public co-investment", "Verified developer"],
    summary:
      "Expansion of Stockholm's biomass combined heat and power plant to increase capacity and serve additional neighborhoods. The project uses sustainably sourced forest residues and benefits from Swedish green certificate support.",
    timeline: [
      { title: "Expansion approved", status: "completed", date: "2023", description: "Board approval granted and environmental permits obtained." },
      { title: "Equipment procurement", status: "completed", date: "2024", description: "Boiler and turbine equipment ordered and delivered." },
      { title: "Construction & commissioning", status: "in_progress", date: "2025", description: "Installation and system integration in progress." },
    ],
    documents: ["Teaser Deck.pdf", "Environmental Impact Assessment.pdf", "Technical Feasibility.pdf"],
    co2Reduction: "18,000 tonnes/yr",
    householdsServed: "12,000",
    timelineRange: "2023-2025",
    developer: {
      name: "Stockholm Exergi AB",
      verified: true,
      hq: "Stockholm, SE",
      founded: "2003",
      dhcProjects: "15 completed",
      totalCapacity: "2,100 GWh/yr",
    },
    advisors: [
      { name: "ÅF Pöyry", role: "Technical advisor" },
      { name: "Mannheimer Swartling", role: "Legal advisor" },
    ],
    technologyCards: [
      { title: "Biomass CHP boiler", description: "New 25 MW biomass boiler using sustainably sourced forest residues." },
      { title: "Steam turbine", description: "Combined heat and power turbine for electricity co-generation." },
      { title: "Fuel handling", description: "Automated fuel storage and feeding system with quality control." },
      { title: "Flue gas treatment", description: "Advanced emissions filtering meeting EU BREF standards." },
    ],
    co2Detail: { tonnes: 18000, equivalentCars: "3,900", lifetimeReduction: "450,000 tonnes" },
    sdgs: [
      { number: 7, title: "Affordable & Clean Energy", description: "Biomass CHP", color: "hsl(45 93% 47%)" },
      { number: 13, title: "Climate Action", description: "18,000 tCO₂e/yr avoided", color: "hsl(152 69% 35%)" },
    ],
    capitalStack: [
      { label: "Equity", percentage: 38, amount: "€12M", description: "Stockholm Exergi + pension fund co-investors", color: "hsl(var(--primary))" },
      { label: "Senior debt", percentage: 50, amount: "€16M", description: "Green bond, 15yr", color: "hsl(152 69% 40%)" },
      { label: "Green certificates", percentage: 12, amount: "€4M", description: "Swedish elcertifikat revenue", color: "hsl(271 60% 60%)" },
    ],
    energyMix: [
      { source: "Biomass", percentage: 85 },
      { source: "Solar thermal", percentage: 8 },
      { source: "Peak gas", percentage: 7 },
    ],
  },
  {
    slug: "warsaw-heat-pump-integration",
    badge: "Modernization",
    title: "Warsaw Heat Pump Integration",
    location: "Warsaw, Poland",
    country: "Poland",
    source: "Heat Pump",
    stage: "Development",
    type: "District Heating",
    technology: "Heat Pump",
    targetIRR: "11.0%",
    capex: "€28M",
    equityRequired: "€10M",
    minTicket: "€2M",
    unleveragedIRR: "8.8%",
    concessionTerm: "20 years",
    firstRevenue: "Q1 2026",
    fundingProgress: 45,
    fundingRemaining: "€5.5M",
    capacity: "15 MW",
    npv: "€5.1M",
    paybackPeriod: "7 Years",
    badges: ["Development", "Verified developer"],
    summary:
      "Modernization of Warsaw's legacy district heating system through integration of large-scale heat pumps. The project replaces aging coal-fired boilers with efficient heat pump technology sourced from the Vistula River.",
    timeline: [
      { title: "Design & engineering", status: "completed", date: "2024", description: "System design and engineering studies completed." },
      { title: "Heat pump installation", status: "in_progress", date: "2025", description: "Large-scale heat pump units being installed." },
      { title: "Network integration & testing", status: "planned", date: "2026", description: "Integration with existing DH network and performance testing." },
    ],
    documents: ["Teaser Deck.pdf", "Technical Feasibility.pdf"],
    co2Reduction: "10,000 tonnes/yr",
    householdsServed: "9,500",
    timelineRange: "2024-2026",
    developer: {
      name: "Veolia Energia Warszawa",
      verified: true,
      hq: "Warsaw, PL",
      founded: "2000",
      dhcProjects: "6 completed",
      totalCapacity: "580 GWh/yr",
    },
    advisors: [
      { name: "Tractebel Engineering", role: "Technical advisor" },
    ],
    technologyCards: [
      { title: "River-source heat pumps", description: "4 × 3.75 MW heat pumps extracting heat from the Vistula River." },
      { title: "Coal boiler decommission", description: "Replacement of 3 aging coal-fired boilers reducing emissions." },
      { title: "Network modernisation", description: "Upgrading 8 km of legacy pipes to pre-insulated standards." },
      { title: "Control systems", description: "SCADA integration for optimised heat pump dispatch." },
    ],
    co2Detail: { tonnes: 10000, equivalentCars: "2,170", lifetimeReduction: "200,000 tonnes" },
    sdgs: [
      { number: 7, title: "Affordable & Clean Energy", description: "Heat pump modernisation", color: "hsl(45 93% 47%)" },
      { number: 13, title: "Climate Action", description: "10,000 tCO₂e/yr avoided", color: "hsl(152 69% 35%)" },
    ],
    capitalStack: [
      { label: "Equity", percentage: 36, amount: "€10M", description: "Veolia + Polish Infrastructure Fund", color: "hsl(var(--primary))" },
      { label: "Senior debt", percentage: 50, amount: "€14M", description: "EBRD loan, 15yr tenor", color: "hsl(152 69% 40%)" },
      { label: "EU Cohesion", percentage: 14, amount: "€4M", description: "EU Cohesion Fund grant", color: "hsl(271 60% 60%)" },
    ],
    energyMix: [
      { source: "River-source heat pumps", percentage: 85 },
      { source: "Geothermal supplement", percentage: 10 },
      { source: "Peak gas", percentage: 5 },
    ],
  },
  {
    slug: "helsinki-solar-thermal-grid",
    badge: "New Construction",
    title: "Helsinki Solar Thermal Grid",
    location: "Helsinki, Finland",
    country: "Finland",
    source: "Solar Thermal",
    stage: "Concept",
    type: "District Cooling",
    technology: "Solar Thermal",
    publicSupport: true,
    targetIRR: "9.8%",
    capex: "€55M",
    equityRequired: "€20M",
    minTicket: "€3M",
    unleveragedIRR: "7.8%",
    concessionTerm: "25 years",
    firstRevenue: "Q2 2030",
    fundingProgress: 8,
    fundingRemaining: "€18.4M",
    capacity: "40 MW",
    npv: "€10.2M",
    paybackPeriod: "11 Years",
    badges: ["Concept", "Public co-investment"],
    summary:
      "A pioneering solar thermal district energy project in Helsinki combining seasonal thermal storage with large-scale solar collector fields. The project targets year-round clean heating and cooling for a new sustainable district.",
    timeline: [
      { title: "Concept & feasibility", status: "in_progress", date: "2025", description: "Feasibility studies and solar resource assessment." },
      { title: "Pilot installation", status: "planned", date: "2026", description: "Small-scale pilot to validate seasonal storage concept." },
      { title: "Full-scale construction", status: "planned", date: "2028", description: "Full collector field and storage construction." },
      { title: "Operations begin", status: "planned", date: "2030", description: "Full commercial operations and heat supply." },
    ],
    documents: ["Teaser Deck.pdf", "Feasibility Study.pdf", "Technical Feasibility.pdf"],
    co2Reduction: "20,000 tonnes/yr",
    householdsServed: "22,000",
    timelineRange: "2025-2030",
    developer: {
      name: "Helen Oy",
      verified: true,
      hq: "Helsinki, FI",
      founded: "1909",
      dhcProjects: "20+ completed",
      totalCapacity: "3,500 GWh/yr",
    },
    advisors: [
      { name: "Sweco", role: "Technical advisor" },
      { name: "White & Case", role: "Legal advisor" },
    ],
    technologyCards: [
      { title: "Solar collector field", description: "Large-scale flat plate collectors optimised for Nordic conditions." },
      { title: "Seasonal thermal storage", description: "Borehole thermal energy storage (BTES) for inter-seasonal heat shifting." },
      { title: "Absorption cooling", description: "Solar-driven absorption chillers for summer district cooling." },
      { title: "Smart grid integration", description: "AI-optimised dispatch between solar, storage, and backup sources." },
    ],
    co2Detail: { tonnes: 20000, equivalentCars: "4,350", lifetimeReduction: "500,000 tonnes" },
    sdgs: [
      { number: 7, title: "Affordable & Clean Energy", description: "Solar thermal district energy", color: "hsl(45 93% 47%)" },
      { number: 11, title: "Sustainable Cities", description: "Clean urban heating and cooling", color: "hsl(33 90% 50%)" },
      { number: 13, title: "Climate Action", description: "20,000 tCO₂e/yr avoided", color: "hsl(152 69% 35%)" },
    ],
    capitalStack: [
      { label: "Equity", percentage: 36, amount: "€20M", description: "Helen Oy + Finnish pension funds", color: "hsl(var(--primary))" },
      { label: "Senior debt", percentage: 45, amount: "€25M", description: "NIB loan, 20yr tenor", color: "hsl(152 69% 40%)" },
      { label: "Public grants", percentage: 19, amount: "€10M", description: "Finnish Energy Authority + EU Innovation Fund", color: "hsl(271 60% 60%)" },
    ],
    energyMix: [
      { source: "Solar thermal", percentage: 65 },
      { source: "Heat pumps", percentage: 25 },
      { source: "Peak gas", percentage: 10 },
    ],
  },
  {
    slug: "amsterdam-aquathermal-network",
    badge: "Expansion",
    title: "Amsterdam Aquathermal Network",
    location: "Amsterdam, Netherlands",
    country: "Netherlands",
    source: "Aquathermal",
    stage: "Development",
    type: "District Heating",
    technology: "Aquathermal",
    targetIRR: "10.2%",
    capex: "€38M",
    equityRequired: "€14M",
    minTicket: "€2M",
    unleveragedIRR: "8.0%",
    concessionTerm: "25 years",
    firstRevenue: "Q3 2027",
    fundingProgress: 40,
    fundingRemaining: "€8.4M",
    capacity: "20 MW",
    npv: "€7.4M",
    paybackPeriod: "9 Years",
    badges: ["Development", "EU Taxonomy aligned", "Verified developer"],
    summary:
      "Expansion of Amsterdam's aquathermal network utilizing surface water from canals and lakes as a heat source. The project integrates with existing infrastructure to decarbonize heating for dense urban neighborhoods.",
    timeline: [
      { title: "Detailed design", status: "completed", date: "2024", description: "System design and environmental impact assessment completed." },
      { title: "Permitting & procurement", status: "in_progress", date: "2025", description: "Permits being finalised and equipment procurement." },
      { title: "Construction", status: "planned", date: "2026", description: "Network construction and heat pump installation." },
      { title: "Commissioning", status: "planned", date: "2027", description: "System testing and commercial operations." },
    ],
    documents: ["Teaser Deck.pdf", "Technical Feasibility.pdf"],
    co2Reduction: "11,000 tonnes/yr",
    householdsServed: "14,000",
    timelineRange: "2024-2027",
    developer: {
      name: "Vattenfall Warmte NL",
      verified: true,
      hq: "Amsterdam, NL",
      founded: "2005",
      dhcProjects: "10 completed",
      totalCapacity: "800 GWh/yr",
    },
    advisors: [
      { name: "Royal HaskoningDHV", role: "Technical advisor" },
    ],
    technologyCards: [
      { title: "Canal water extraction", description: "Surface water heat exchangers in Amsterdam's canal system." },
      { title: "Large-scale heat pumps", description: "2 × 10 MW heat pumps boosting canal water temperatures." },
      { title: "Distribution network", description: "18 km of pre-insulated pipes connecting to existing infrastructure." },
      { title: "Water quality management", description: "Ecological monitoring to ensure no impact on canal ecosystems." },
    ],
    co2Detail: { tonnes: 11000, equivalentCars: "2,400", lifetimeReduction: "275,000 tonnes" },
    sdgs: [
      { number: 7, title: "Affordable & Clean Energy", description: "Aquathermal heating", color: "hsl(45 93% 47%)" },
      { number: 13, title: "Climate Action", description: "11,000 tCO₂e/yr avoided", color: "hsl(152 69% 35%)" },
    ],
    capitalStack: [
      { label: "Equity", percentage: 37, amount: "€14M", description: "Vattenfall + Dutch pension fund", color: "hsl(var(--primary))" },
      { label: "Senior debt", percentage: 50, amount: "€19M", description: "ING Bank green loan, 18yr", color: "hsl(152 69% 40%)" },
      { label: "SDE++ subsidy", percentage: 13, amount: "€5M", description: "Dutch renewable heat subsidy", color: "hsl(271 60% 60%)" },
    ],
    energyMix: [
      { source: "Aquathermal", percentage: 72 },
      { source: "Heat pumps", percentage: 18 },
      { source: "Peak gas", percentage: 10 },
    ],
  },
  {
    slug: "vienna-district-cooling-expansion",
    badge: "Modernization",
    title: "Vienna District Cooling Expansion",
    location: "Vienna, Austria",
    country: "Austria",
    source: "Absorption Cooling",
    stage: "Construction",
    type: "District Cooling",
    technology: "Absorption Cooling",
    publicSupport: true,
    targetIRR: "7.8%",
    capex: "€22M",
    equityRequired: "€8M",
    minTicket: "€1M",
    unleveragedIRR: "6.2%",
    concessionTerm: "20 years",
    firstRevenue: "Q2 2026",
    fundingProgress: 75,
    fundingRemaining: "€2M",
    capacity: "12 MW",
    npv: "€3.6M",
    paybackPeriod: "10 Years",
    badges: ["Construction", "Public co-investment", "EU Taxonomy aligned"],
    summary:
      "Modernization and expansion of Vienna's district cooling network using absorption cooling technology powered by waste heat from existing CHP plants. The project reduces peak electricity demand in the city center.",
    timeline: [
      { title: "Engineering complete", status: "completed", date: "2024", description: "Detailed engineering and procurement completed." },
      { title: "Construction underway", status: "in_progress", date: "2025", description: "Absorption chillers and pipe installation." },
      { title: "Commissioning", status: "planned", date: "2026", description: "System commissioning and commercial operations." },
    ],
    documents: ["Teaser Deck.pdf", "Technical Specification.pdf", "Technical Feasibility.pdf"],
    co2Reduction: "8,500 tonnes/yr",
    householdsServed: "7,000",
    timelineRange: "2024-2026",
    developer: {
      name: "Wien Energie GmbH",
      verified: true,
      hq: "Vienna, AT",
      founded: "1999",
      dhcProjects: "18 completed",
      totalCapacity: "1,600 GWh/yr",
    },
    advisors: [
      { name: "ILF Consulting Engineers", role: "Technical advisor" },
    ],
    technologyCards: [
      { title: "Absorption chillers", description: "Waste heat-driven absorption cooling units replacing electric chillers." },
      { title: "Cooling network", description: "Expansion of existing chilled water distribution network." },
      { title: "CHP integration", description: "Waste heat sourced from existing combined heat and power plants." },
      { title: "Building substations", description: "New cooling substations in commercial and public buildings." },
    ],
    co2Detail: { tonnes: 8500, equivalentCars: "1,850", lifetimeReduction: "170,000 tonnes" },
    sdgs: [
      { number: 7, title: "Affordable & Clean Energy", description: "Waste heat cooling", color: "hsl(45 93% 47%)" },
      { number: 13, title: "Climate Action", description: "8,500 tCO₂e/yr avoided", color: "hsl(152 69% 35%)" },
    ],
    capitalStack: [
      { label: "Equity", percentage: 36, amount: "€8M", description: "Wien Energie", color: "hsl(var(--primary))" },
      { label: "Senior debt", percentage: 50, amount: "€11M", description: "Erste Bank green loan", color: "hsl(152 69% 40%)" },
      { label: "City grant", percentage: 14, amount: "€3M", description: "Vienna Climate Fund", color: "hsl(271 60% 60%)" },
    ],
    energyMix: [
      { source: "Absorption cooling", percentage: 68 },
      { source: "Electric chillers", percentage: 22 },
      { source: "Peak gas", percentage: 10 },
    ],
  },
  {
    slug: "tallinn-biomass-chp-plant",
    badge: "New Construction",
    title: "Tallinn Biomass CHP Plant",
    location: "Tallinn, Estonia",
    country: "Estonia",
    source: "Biomass",
    stage: "Concept",
    type: "Combined Heat & Power",
    technology: "Biomass",
    targetIRR: "11.5%",
    capex: "€18M",
    equityRequired: "€7M",
    minTicket: "€1M",
    unleveragedIRR: "9.0%",
    concessionTerm: "25 years",
    firstRevenue: "Q1 2028",
    fundingProgress: 5,
    fundingRemaining: "€6.65M",
    capacity: "18 MW",
    npv: "€4.8M",
    paybackPeriod: "7 Years",
    badges: ["Concept"],
    summary:
      "A new biomass combined heat and power plant in Tallinn to replace outdated fossil fuel capacity. The project leverages Estonia's abundant forest biomass resources and benefits from EU Cohesion Fund support.",
    timeline: [
      { title: "Concept finalization", status: "in_progress", date: "2025", description: "Business plan and concept development." },
      { title: "Permitting & financing", status: "planned", date: "2026", description: "Environmental permits and financing arrangements." },
      { title: "Construction", status: "planned", date: "2027", description: "Plant construction and equipment installation." },
      { title: "Operations", status: "planned", date: "2028", description: "Commercial operations begin." },
    ],
    documents: ["Teaser Deck.pdf", "Technical Feasibility.pdf"],
    co2Reduction: "14,000 tonnes/yr",
    householdsServed: "10,500",
    timelineRange: "2025-2028",
    developer: {
      name: "Utilitas AS",
      verified: false,
      hq: "Tallinn, EE",
      founded: "2012",
      dhcProjects: "4 completed",
      totalCapacity: "280 GWh/yr",
    },
    advisors: [
      { name: "Ramboll Estonia", role: "Technical advisor" },
    ],
    technologyCards: [
      { title: "Biomass CHP plant", description: "18 MW biomass boiler with CHP turbine using local forest residues." },
      { title: "Fuel supply chain", description: "Long-term contracts with Estonian forestry companies." },
      { title: "Heat distribution", description: "Connection to Tallinn's existing district heating backbone." },
      { title: "Emissions control", description: "EU BAT-compliant flue gas cleaning system." },
    ],
    co2Detail: { tonnes: 14000, equivalentCars: "3,040", lifetimeReduction: "350,000 tonnes" },
    sdgs: [
      { number: 7, title: "Affordable & Clean Energy", description: "Biomass CHP", color: "hsl(45 93% 47%)" },
      { number: 13, title: "Climate Action", description: "14,000 tCO₂e/yr avoided", color: "hsl(152 69% 35%)" },
    ],
    capitalStack: [
      { label: "Equity", percentage: 39, amount: "€7M", description: "Utilitas + Baltic investor syndicate", color: "hsl(var(--primary))" },
      { label: "Senior debt", percentage: 44, amount: "€8M", description: "SEB Bank, 12yr tenor", color: "hsl(152 69% 40%)" },
      { label: "EU Cohesion", percentage: 17, amount: "€3M", description: "EU Cohesion Fund grant", color: "hsl(271 60% 60%)" },
    ],
    energyMix: [
      { source: "Biomass", percentage: 82 },
      { source: "Solar thermal", percentage: 10 },
      { source: "Peak gas", percentage: 8 },
    ],
  },
];

export const badgeColorMap: Record<string, string> = {
  Expansion: "bg-blue-100 text-blue-700",
  Modernization: "bg-amber-100 text-amber-700",
  "New Construction": "bg-emerald-100 text-emerald-700",
};

export const stageBadgeMap: Record<string, string> = {
  Construction: "bg-amber-600 text-white",
  Development: "bg-blue-600 text-white",
  Concept: "bg-muted text-muted-foreground",
  Operational: "bg-emerald-600 text-white",
};
