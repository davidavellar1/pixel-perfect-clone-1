import type { Database } from "@/integrations/supabase/types";

export type NewsCategory = Database["public"]["Enums"]["news_category"];

export const CATEGORY_LABEL: Record<NewsCategory, string> = {
  deal: "Deal",
  policy: "Policy",
  funding: "Funding call",
  project: "Project",
  market: "Market",
  technology: "Technology",
  other: "Other",
};

export const CATEGORY_CHIPS: { value: NewsCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "deal", label: "Deals" },
  { value: "policy", label: "Policy" },
  { value: "funding", label: "Funding calls" },
  { value: "project", label: "Projects" },
  { value: "market", label: "Market" },
  { value: "technology", label: "Technology" },
];

export const PREFERENCE_CATEGORIES: NewsCategory[] = ["deal", "policy", "funding", "project", "market", "technology", "other"];

export const relativeDate = (iso: string, now = Date.now()): string => {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60_000);
  if (min < 60) return min <= 1 ? "just now" : `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }) });
};

export const formatDealSize = (eur: number): string =>
  eur >= 1_000_000_000 ? `€${(eur / 1_000_000_000).toFixed(1)} B` : `€${Math.round(eur / 1_000_000).toLocaleString("en-GB")} M`;

export const NEWS_ITEM_COLUMNS =
  "id, source_id, url, title, title_en, summary, why_it_matters, language, publisher, published_at, category, country_codes, deal_value_eur, related_project_ids";

export const NEWS_SOURCE_COLUMNS = "id, slug, name, kind, homepage_url, country_code, language, active";
