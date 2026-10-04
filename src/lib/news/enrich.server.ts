import type { Database } from "@/integrations/supabase/types";
import { categoriseByKeywords, type NewsCategoryValue } from "./keywords";
import { truncateAtWord } from "./parse";

type Technology = Database["public"]["Enums"]["technology"];

export const TECHNOLOGIES: Technology[] = [
  "geothermal", "biomass_chp", "waste_heat_recovery", "solar_thermal", "large_heat_pump",
  "river_water_cooling", "seawater_cooling", "thermal_storage", "hybrid",
];
const CATEGORIES: NewsCategoryValue[] = ["deal", "policy", "funding", "project", "market", "technology", "other"];

export interface EnrichInput {
  title: string;
  excerpt: string | null;
  publisher: string | null;
  language: string | null;
  sourceCountry: string | null;
  fallbackCountry: string | null;
}

export interface Enrichment {
  title_en: string;
  summary: string | null;
  why_it_matters: string | null;
  category: NewsCategoryValue;
  country_codes: string[];
  technologies: Technology[];
  deal_value_eur: number | null;
  counterparties: string[];
  relevance: number;
  enriched: boolean;
}

export const fallbackEnrichment = (input: EnrichInput, aiAvailable: boolean): Enrichment => ({
  title_en: input.title,
  summary: input.excerpt ? truncateAtWord(input.excerpt, 220) : null,
  why_it_matters: null,
  category: categoriseByKeywords(`${input.title} ${input.excerpt ?? ""}`),
  country_codes: input.fallbackCountry ? [input.fallbackCountry] : [],
  technologies: [],
  deal_value_eur: null,
  counterparties: [],
  relevance: 50,
  // Retry later if AI simply wasn't there; otherwise this is final.
  enriched: !aiAvailable ? false : true,
});

const TOOL = {
  type: "function",
  function: {
    name: "classify_news",
    description: "Return a structured, original English digest of a district energy news headline.",
    parameters: {
      type: "object",
      properties: {
        title_en: { type: "string", description: "English headline" },
        summary: { type: "string", description: "Max 2 sentences in your own words, English, no quotation marks, never copied from the source" },
        why_it_matters: { type: "string", description: "1 sentence for infrastructure investors and DHC project developers" },
        category: { type: "string", enum: CATEGORIES },
        country_codes: { type: "array", items: { type: "string" }, description: "ISO-3166 alpha-2, GB for UK" },
        technologies: { type: "array", items: { type: "string", enum: TECHNOLOGIES } },
        deal_value_eur: { type: ["number", "null"] },
        counterparties: { type: "array", items: { type: "string" }, maxItems: 5 },
        relevance: { type: "integer", minimum: 0, maximum: 100 },
      },
      required: ["title_en", "summary", "why_it_matters", "category", "country_codes", "technologies", "deal_value_eur", "counterparties", "relevance"],
      additionalProperties: false,
    },
  },
} as const;

const SYSTEM = `You classify European district heating and cooling (DHC) news for an investment marketplace.
Categories: deal = M&A, stake sales, financing rounds, fund raises; funding = grants, public calls, subsidy schemes; policy = laws, regulation, tariffs, heat planning; project = construction, commissioning, contracts for specific networks or plants; market = prices, statistics, market reports; technology = tech/innovation; other = anything else.
relevance (0-100) = how relevant the item is to someone investing in or developing district heating/cooling networks in Europe.
Write the summary in your own words; never copy sentences and never use quotation marks.`;

/** Returns null when the AI call fails (caller falls back and retries later). */
export async function enrichWithAi(input: EnrichInput, apiKey: string): Promise<Enrichment | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: JSON.stringify({
              title: input.title,
              excerpt: (input.excerpt ?? "").slice(0, 600),
              publisher: input.publisher,
              language: input.language,
              source_country: input.sourceCountry,
            }),
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "classify_news" } },
      }),
    });
    if (!res.ok) {
      console.error(`[ingest-news] AI request failed ${res.status}`);
      return null;
    }
    const data = (await res.json()) as {
      choices?: { message?: { tool_calls?: { function?: { arguments?: string } }[] } }[];
    };
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) return null;
    const raw = JSON.parse(args) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().replace(/["“”„«»]/g, "") : null);
    const category = CATEGORIES.includes(raw.category as NewsCategoryValue) ? (raw.category as NewsCategoryValue) : "other";
    const codes = Array.isArray(raw.country_codes)
      ? [...new Set(raw.country_codes.filter((c): c is string => typeof c === "string").map((c) => c.toUpperCase().replace("UK", "GB")).filter((c) => /^[A-Z]{2}$/.test(c)))]
      : [];
    const techs = Array.isArray(raw.technologies)
      ? [...new Set(raw.technologies.filter((t): t is Technology => TECHNOLOGIES.includes(t as Technology)))]
      : [];
    const deal = typeof raw.deal_value_eur === "number" && Number.isFinite(raw.deal_value_eur) && raw.deal_value_eur > 0 ? raw.deal_value_eur : null;
    const parties = Array.isArray(raw.counterparties)
      ? raw.counterparties.filter((c): c is string => typeof c === "string" && !!c.trim()).slice(0, 5)
      : [];
    const relevance = Math.max(0, Math.min(100, Math.round(Number(raw.relevance) || 0)));
    return {
      title_en: str(raw.title_en) ?? input.title,
      summary: str(raw.summary),
      why_it_matters: str(raw.why_it_matters),
      category,
      country_codes: codes.length ? codes : input.fallbackCountry ? [input.fallbackCountry] : [],
      technologies: techs,
      deal_value_eur: deal,
      counterparties: parties,
      relevance,
      enriched: true,
    };
  } catch (e) {
    console.error("[ingest-news] AI error", e instanceof Error ? e.message : "unknown");
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function enrich(input: EnrichInput, apiKey: string | undefined): Promise<Enrichment> {
  if (!apiKey) return fallbackEnrichment(input, false);
  const ai = await enrichWithAi(input, apiKey);
  if (ai) return ai;
  // AI error is transient: keep enriched=false so a later run retries.
  return { ...fallbackEnrichment(input, true), enriched: false };
}
