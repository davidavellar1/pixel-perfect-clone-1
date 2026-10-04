export const DISTRICT_ENERGY_KEYWORDS: string[] = [
  "district heating", "district cooling", "district energy", "heat network", "heat networks", "heating network",
  "fjernvarme", "fjernkøling", "overskudsvarme", "fernwärme", "fernkälte", "wärmenetz", "wärmenetze", "nahwärme",
  "abwärme", "fjärrvärme", "fjärrkyla", "spillvärme", "kaukolämpö", "kaukolämmön", "kaukolämmitys", "kaukojäähdytys",
  "hukkalämpö", "kaugküte", "kaugkütte", "ciepłownictw", "ciepłowni", "ciepło systemowe", "sieć ciepłownicza",
  "warmtenet", "warmtenetten", "stadsverwarming", "restwarmte", "réseau de chaleur", "réseaux de chaleur",
  "réseau de froid", "chauffage urbain", "chaleur fatale", "teleriscaldamento", "calefacción urbana", "waste heat",
  "excess heat", "large heat pump", "heat pump", "thermal storage", "geothermal",
];

export const matchesDistrictEnergy = (text: string): boolean => {
  const haystack = text.toLowerCase();
  return DISTRICT_ENERGY_KEYWORDS.some((k) => haystack.includes(k));
};

export type NewsCategoryValue = "deal" | "policy" | "funding" | "project" | "market" | "technology" | "other";

const RULES: { category: NewsCategoryValue; words: string[] }[] = [
  { category: "deal", words: ["acquisition", "acquire", "stake", "financing", "fund", "investment", "übernahme", "rachat", "förvärv", "opkøb"] },
  { category: "funding", words: ["grant", "subsidy", "funding call", "förderung", "subvention", "tilskud"] },
  { category: "policy", words: ["law", "regulation", "directive", "consultation", "gesetz", "loi", "tariff"] },
];

export const categoriseByKeywords = (text: string): NewsCategoryValue => {
  const haystack = text.toLowerCase();
  // funding before deal so "funding call" is not swallowed by "fund"
  const ordered = [RULES[1], RULES[0], RULES[2]];
  for (const rule of ordered) {
    if (rule.words.some((w) => new RegExp(`\\b${w}`, "i").test(haystack))) return rule.category;
  }
  return "other";
};
