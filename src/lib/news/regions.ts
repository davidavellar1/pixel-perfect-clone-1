export interface NewsCountry {
  code: string;
  name: string;
}

export interface NewsRegion {
  key: string;
  name: string;
  countries: NewsCountry[];
}

export const NEWS_REGIONS: NewsRegion[] = [
  { key: "nordics_baltics", name: "Nordics & Baltics", countries: [
    { code: "DK", name: "Denmark" }, { code: "SE", name: "Sweden" }, { code: "FI", name: "Finland" },
    { code: "NO", name: "Norway" }, { code: "EE", name: "Estonia" }, { code: "LV", name: "Latvia" },
    { code: "LT", name: "Lithuania" },
  ] },
  { key: "dach", name: "DACH", countries: [
    { code: "DE", name: "Germany" }, { code: "AT", name: "Austria" }, { code: "CH", name: "Switzerland" },
  ] },
  { key: "benelux", name: "Benelux", countries: [
    { code: "NL", name: "Netherlands" }, { code: "BE", name: "Belgium" }, { code: "LU", name: "Luxembourg" },
  ] },
  { key: "france", name: "France", countries: [{ code: "FR", name: "France" }] },
  { key: "uk_ireland", name: "UK & Ireland", countries: [
    { code: "GB", name: "United Kingdom" }, { code: "IE", name: "Ireland" },
  ] },
  { key: "cee", name: "Central & Eastern Europe", countries: [
    { code: "PL", name: "Poland" }, { code: "CZ", name: "Czechia" }, { code: "SK", name: "Slovakia" },
    { code: "HU", name: "Hungary" }, { code: "RO", name: "Romania" }, { code: "BG", name: "Bulgaria" },
    { code: "SI", name: "Slovenia" }, { code: "HR", name: "Croatia" },
  ] },
  { key: "southern", name: "Southern Europe", countries: [
    { code: "IT", name: "Italy" }, { code: "ES", name: "Spain" }, { code: "PT", name: "Portugal" },
    { code: "GR", name: "Greece" },
  ] },
];

export const EU_WIDE_LABEL = "EU-wide & international";

export const ALL_COUNTRY_CODES: string[] = NEWS_REGIONS.flatMap((r) => r.countries.map((c) => c.code));

const COUNTRY_NAME = new Map(NEWS_REGIONS.flatMap((r) => r.countries.map((c) => [c.code, c.name] as const)));

export const countryName = (code: string): string => COUNTRY_NAME.get(code.toUpperCase()) ?? code.toUpperCase();

export const isKnownCountry = (code: string): boolean => COUNTRY_NAME.has(code.toUpperCase());

export const regionOf = (code: string): NewsRegion | undefined =>
  NEWS_REGIONS.find((r) => r.countries.some((c) => c.code === code.toUpperCase()));

/** Regions whose every country is in the selection. */
export const fullRegions = (codes: string[]): string[] => {
  const set = new Set(codes);
  return NEWS_REGIONS.filter((r) => r.countries.every((c) => set.has(c.code))).map((r) => r.key);
};

/** Short human summary, e.g. "Nordics & Baltics, Germany, EU-wide". */
export const summariseSelection = (codes: string[], includeEu: boolean): string => {
  const set = new Set(codes);
  const parts: string[] = [];
  if (ALL_COUNTRY_CODES.every((c) => set.has(c))) {
    parts.push("All European markets");
  } else {
    for (const region of NEWS_REGIONS) {
      const picked = region.countries.filter((c) => set.has(c.code));
      if (!picked.length) continue;
      if (picked.length === region.countries.length && region.countries.length > 1) parts.push(region.name);
      else parts.push(...picked.map((c) => c.name));
    }
  }
  if (includeEu) parts.push("EU-wide");
  return parts.length ? parts.join(", ") : "No markets selected";
};
