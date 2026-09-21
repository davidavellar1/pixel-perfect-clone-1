export type DealRecord = {
  slug: string;
  name: string;
  sub: string;
  ticket: string;
  step: number;
  counterparty: string;
  investor: string;
  origination: string;
  value: string;
  valueNumber: number;
};

export const dealsData: DealRecord[] = [
  {
    slug: "lyon-waste-heat-recovery",
    name: "Lyon Waste Heat Recovery",
    sub: "Lyon Énergie Verte SAS · introduced 12 Mar 2025 · fee tail to Mar 2028",
    ticket: "€8M equity",
    step: 2,
    counterparty: "Lyon Énergie Verte SAS",
    investor: "Nordea Infrastructure Fund",
    origination: "introduction logged 12 Mar 2025 on acceptance, within the 36 month fee tail",
    value: "8,000,000 EUR equity",
    valueNumber: 8000000,
  },
  {
    slug: "copenhagen-geothermal-network",
    name: "Aarhus Geothermal Phase II",
    sub: "Aarhus Varme A/S · introduced 28 Feb 2025 · fee tail to Feb 2028",
    ticket: "€20M equity",
    step: 1,
    counterparty: "Aarhus Varme A/S",
    investor: "Nordea Infrastructure Fund",
    origination: "introduction logged 28 Feb 2025 on acceptance, within the 36 month fee tail",
    value: "20,000,000 EUR equity",
    valueNumber: 20000000,
  },
];
