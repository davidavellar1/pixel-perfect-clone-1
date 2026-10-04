import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database } from "@/integrations/supabase/types";
import { matchesDistrictEnergy } from "./keywords";
import { canonicalUrl, normaliseTitle, parseFeed, parseGdelt, type ParsedItem } from "./parse";
import { enrich, fallbackEnrichment, type Enrichment } from "./enrich.server";

type SourceRow = Database["public"]["Tables"]["news_source"]["Row"];
type NewsInsert = Database["public"]["Tables"]["news_item"]["Insert"];
type ProjectLite = { id: string; city: string; country_code: string; technology: string };

const USER_AGENT = "DHCMarketNewsBot/1.0 (+https://dhc-deal-space.lovable.app)";
const MAX_SOURCES = 5; // keeps one run well inside hosting request limits; hourly runs cover all sources
const ENRICH_BUDGET = 12;
const MAX_AGE_MS = 30 * 86_400_000;
const PRUNE_DAYS = 180;
const GDELT_GAP_MS = 6_000;

export interface SourceResult {
  slug: string;
  fetched: number;
  kept: number;
  inserted: number;
  error?: string;
}

export interface IngestResult {
  success: boolean;
  sources: SourceResult[];
  enriched: number;
  pruned: number;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(url, { signal: controller.signal, headers: { "User-Agent": USER_AGENT, Accept: "*/*" } });
  } finally {
    clearTimeout(timer);
  }
}

const shortError = (e: unknown): string => {
  const msg = e instanceof Error ? (e.name === "AbortError" ? "Timed out after 15 s" : e.message) : String(e);
  return msg.split("\n")[0].slice(0, 200);
};

export function relatedProjects(
  item: { title: string; title_en: string | null; summary: string | null; country_codes: string[]; technologies: string[] },
  projects: ProjectLite[],
): string[] {
  const text = `${item.title} ${item.title_en ?? ""} ${item.summary ?? ""}`.toLowerCase();
  return projects
    .filter((p) => item.country_codes.includes(p.country_code.trim().toUpperCase()))
    .filter((p) => (p.city && text.includes(p.city.toLowerCase())) || item.technologies.includes(p.technology))
    .map((p) => p.id);
}

const toRow = (
  item: ParsedItem & { url: string },
  source: SourceRow,
  e: Enrichment,
  projects: ProjectLite[],
): NewsInsert => {
  const country_codes = e.country_codes.length ? e.country_codes : source.country_code ? [source.country_code.trim().toUpperCase()] : [];
  return {
    source_id: source.id,
    url: item.url,
    title: item.title,
    title_en: e.title_en,
    summary: e.summary,
    why_it_matters: e.why_it_matters,
    language: item.language ?? source.language,
    publisher: item.publisher ?? source.name,
    image_url: item.imageUrl,
    published_at: (item.publishedAt ?? new Date()).toISOString(),
    category: e.category,
    country_codes,
    technologies: e.technologies,
    deal_value_eur: e.deal_value_eur,
    counterparties: e.counterparties,
    related_project_ids: relatedProjects({ title: item.title, title_en: e.title_en, summary: e.summary, country_codes, technologies: e.technologies }, projects),
    relevance: e.relevance,
    enriched: e.enriched,
    hidden: e.relevance < 30,
  };
};

export async function runIngest(opts: { source?: string; force?: boolean } = {}): Promise<IngestResult> {
  const aiKey = process.env["LOVABLE_API_KEY"];
  const now = Date.now();

  let query = supabaseAdmin.from("news_source").select("*").eq("active", true).in("kind", ["rss", "gdelt"]);
  if (opts.source) query = query.eq("slug", opts.source);
  const { data: allSources, error: srcErr } = await query.order("last_polled_at", { ascending: true, nullsFirst: true });
  if (srcErr) throw new Error(`news_source query failed: ${srcErr.message}`);

  const due = (allSources ?? [])
    .filter((s) => opts.force || !s.last_polled_at || new Date(s.last_polled_at).getTime() < now - s.poll_interval_minutes * 60_000)
    .slice(0, MAX_SOURCES);

  const { data: projectRows } = await supabaseAdmin
    .from("project")
    .select("id, slug, title, city, country_code, technology")
    .eq("visibility", "listed");
  const projects: ProjectLite[] = (projectRows ?? []).map((p) => ({ id: p.id, city: p.city, country_code: p.country_code, technology: p.technology }));

  const since7 = new Date(now - 7 * 86_400_000).toISOString();
  const { data: recent } = await supabaseAdmin.from("news_item").select("title, title_en").gte("created_at", since7);
  const recentTitles = new Set<string>();
  for (const r of recent ?? []) {
    recentTitles.add(normaliseTitle(r.title));
    if (r.title_en) recentTitles.add(normaliseTitle(r.title_en));
  }

  let budget = ENRICH_BUDGET;
  let enrichedCount = 0;
  const results: SourceResult[] = [];
  let lastGdelt = 0;

  for (const source of due) {
    const result: SourceResult = { slug: source.slug, fetched: 0, kept: 0, inserted: 0 };
    try {
      if (source.kind === "gdelt") {
        const wait = lastGdelt + GDELT_GAP_MS - Date.now();
        if (lastGdelt && wait > 0) await sleep(wait);
        lastGdelt = Date.now();
      }
      const res = await fetchWithTimeout(source.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const body = await res.text();
      let parsed: ParsedItem[];
      if (source.kind === "gdelt") {
        let json: unknown;
        try { json = JSON.parse(body); } catch { throw new Error("GDELT returned a non-JSON response"); }
        parsed = parseGdelt(json);
      } else {
        parsed = parseFeed(body);
      }
      result.fetched = parsed.length;

      const needKeywords = source.keyword_filter || source.kind === "gdelt";
      const seen = new Set<string>();
      const candidates: (ParsedItem & { url: string })[] = [];
      for (const item of parsed) {
        const url = item.url ? canonicalUrl(item.url) : null;
        if (!url || !item.title) continue;
        if (item.publishedAt && now - item.publishedAt.getTime() > MAX_AGE_MS) continue;
        if (seen.has(url)) continue;
        if (recentTitles.has(normaliseTitle(item.title))) continue;
        if (needKeywords && !matchesDistrictEnergy(`${item.title} ${item.excerpt ?? ""}`)) continue;
        seen.add(url);
        candidates.push({ ...item, url });
      }

      let fresh = candidates;
      if (candidates.length) {
        const { data: existing, error } = await supabaseAdmin.from("news_item").select("url").in("url", candidates.map((c) => c.url));
        if (error) throw new Error(`Duplicate check failed: ${error.message}`);
        const known = new Set((existing ?? []).map((e) => e.url));
        fresh = candidates.filter((c) => !known.has(c.url));
      }
      result.kept = fresh.length;

      const rows: NewsInsert[] = [];
      for (const item of fresh) {
        const input = {
          title: item.title,
          excerpt: item.excerpt,
          publisher: item.publisher ?? source.name,
          language: item.language ?? source.language,
          sourceCountry: item.sourceCountry ?? source.country_code,
          fallbackCountry: source.country_code ? source.country_code.trim().toUpperCase() : null,
        };
        let e: Enrichment;
        if (budget > 0) {
          budget -= 1;
          e = await enrich(input, aiKey);
          if (e.enriched) enrichedCount += 1;
        } else {
          e = { ...fallbackEnrichment(input, !!aiKey), enriched: false };
        }
        rows.push(toRow(item, source, e, projects));
        recentTitles.add(normaliseTitle(item.title));
      }

      if (rows.length) {
        const { data: inserted, error } = await supabaseAdmin
          .from("news_item")
          .upsert(rows, { onConflict: "url", ignoreDuplicates: true })
          .select("id");
        if (error) throw new Error(`Insert failed: ${error.message}`);
        result.inserted = inserted?.length ?? 0;
      }

      await supabaseAdmin.from("news_source").update({
        last_polled_at: new Date().toISOString(),
        last_success_at: new Date().toISOString(),
        last_error: null,
        consecutive_failures: 0,
        items_ingested: source.items_ingested + result.inserted,
      }).eq("id", source.id);
    } catch (e) {
      result.error = shortError(e);
      console.error(`[ingest-news] source ${source.slug} failed: ${result.error}`);
      await supabaseAdmin.from("news_source").update({
        last_polled_at: new Date().toISOString(),
        last_error: result.error,
        consecutive_failures: source.consecutive_failures + 1,
      }).eq("id", source.id);
    }
    results.push(result);
  }

  // Back-fill earlier items that were stored without enrichment.
  if (budget > 0 && aiKey) {
    const { data: pending } = await supabaseAdmin
      .from("news_item")
      .select("id, title, summary, publisher, language, country_codes, source:source_id(country_code)")
      .eq("enriched", false)
      .order("published_at", { ascending: false })
      .limit(budget);
    for (const row of pending ?? []) {
      const src = row.source as unknown as { country_code: string | null } | null;
      const fallbackCountry = src?.country_code ? src.country_code.trim().toUpperCase() : row.country_codes[0] ?? null;
      const e = await enrich({
        title: row.title,
        excerpt: row.summary,
        publisher: row.publisher,
        language: row.language,
        sourceCountry: fallbackCountry,
        fallbackCountry,
      }, aiKey);
      if (!e.enriched) continue;
      enrichedCount += 1;
      const country_codes = e.country_codes.length ? e.country_codes : fallbackCountry ? [fallbackCountry] : [];
      const { error } = await supabaseAdmin.from("news_item").update({
        title_en: e.title_en,
        summary: e.summary,
        why_it_matters: e.why_it_matters,
        category: e.category,
        country_codes,
        technologies: e.technologies,
        deal_value_eur: e.deal_value_eur,
        counterparties: e.counterparties,
        relevance: e.relevance,
        enriched: true,
        hidden: e.relevance < 30,
        related_project_ids: relatedProjects({ title: row.title, title_en: e.title_en, summary: e.summary, country_codes, technologies: e.technologies }, projects),
      }).eq("id", row.id);
      if (error) console.error(`[ingest-news] back-fill update failed: ${error.message}`);
    }
  }

  const cutoff = new Date(now - PRUNE_DAYS * 86_400_000).toISOString();
  const { data: prunedRows, error: pruneErr } = await supabaseAdmin.from("news_item").delete().lt("published_at", cutoff).select("id");
  if (pruneErr) console.error(`[ingest-news] prune failed: ${pruneErr.message}`);

  return { success: true, sources: results, enriched: enrichedCount, pruned: prunedRows?.length ?? 0 };
}
