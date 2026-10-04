import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NewsPreferencesDialog, { type NewsPrefs } from "@/components/news/NewsPreferencesDialog";
import NewsCategoryBadge from "@/components/news/NewsCategoryBadge";
import { ALL_COUNTRY_CODES, NEWS_REGIONS, countryName, isKnownCountry, summariseSelection } from "@/lib/news/regions";
import { CATEGORY_CHIPS, NEWS_ITEM_COLUMNS, NEWS_SOURCE_COLUMNS, formatDealSize, relativeDate, type NewsCategory } from "@/lib/news/format";

const PAGE = 20;

interface NewsRow {
  id: string; source_id: string | null; url: string; title: string; title_en: string | null; summary: string | null;
  why_it_matters: string | null; language: string | null; publisher: string | null; published_at: string;
  category: NewsCategory; country_codes: string[]; deal_value_eur: number | null; related_project_ids: string[];
}
interface SourceRow { id: string; name: string; country_code: string | null }

async function defaultCountries(userId: string): Promise<string[]> {
  const ids = new Set<string>();
  const { data: dev } = await supabase.from("developer_profiles").select("id").eq("user_id", userId);
  const devIds = (dev ?? []).map((d) => d.id);
  const codes = new Set<string>();
  if (devIds.length) {
    const { data } = await supabase.from("project").select("country_code").in("developer_id", devIds);
    (data ?? []).forEach((p) => codes.add(p.country_code.trim().toUpperCase()));
  }
  const [{ data: wl }, { data: ar }] = await Promise.all([
    supabase.from("watchlist_item").select("project_id").eq("user_id", userId),
    supabase.from("access_request").select("project_id").eq("investor_user_id", userId),
  ]);
  [...(wl ?? []), ...(ar ?? [])].forEach((r) => ids.add(r.project_id));
  if (ids.size) {
    const { data } = await supabase.from("project").select("country_code").in("id", [...ids]);
    (data ?? []).forEach((p) => codes.add(p.country_code.trim().toUpperCase()));
  }
  const known = [...codes].filter(isKnownCountry);
  return known.length ? known : ALL_COUNTRY_CODES;
}

const MarketNews = ({ initialCountry }: { initialCountry?: string }) => {
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const isAdmin = roles.includes("admin");
  const initialCc = initialCountry && isKnownCountry(initialCountry) ? initialCountry.toUpperCase() : "all";

  const [prefs, setPrefs] = useState<NewsPrefs | null>(null);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("all");
  const [country, setCountry] = useState(initialCc);
  const [category, setCategory] = useState<NewsCategory | "all">("all");
  const [items, setItems] = useState<NewsRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [sources, setSources] = useState<SourceRow[]>([]);
  const [projects, setProjects] = useState<Map<string, { slug: string; title: string }>>(new Map());

  // Preferences
  useEffect(() => {
    if (!user) return;
    let active = true;
    (async () => {
      const { data } = await supabase.from("user_news_preference").select("country_codes, include_eu, categories").eq("user_id", user.id).maybeSingle();
      if (!active) return;
      if (data) {
        setPrefs({ countryCodes: data.country_codes.map((c) => c.trim()), includeEu: data.include_eu, categories: data.categories });
      } else {
        const codes = await defaultCountries(user.id);
        if (!active) return;
        setPrefs({ countryCodes: codes, includeEu: true, categories: [] });
        setPrefsOpen(true);
      }
    })();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    supabase.from("news_source").select(NEWS_SOURCE_COLUMNS).eq("active", true).then(({ data }) =>
      setSources((data ?? []).map((s) => ({ id: s.id, name: s.name, country_code: s.country_code }))));
  }, []);

  const countryFilter = useMemo<string[]>(() => {
    if (country !== "all") return [country];
    if (region !== "all") return NEWS_REGIONS.find((r) => r.key === region)?.countries.map((c) => c.code) ?? [];
    return prefs?.countryCodes ?? [];
  }, [country, region, prefs]);
  const includeEu = country === "all" && region === "all" ? prefs?.includeEu ?? true : false;

  const load = useCallback(async (offset: number) => {
    if (!prefs) return;
    setLoading(true);
    setError(null);
    let q = supabase.from("news_item").select(NEWS_ITEM_COLUMNS).eq("hidden", false);
    const list = countryFilter.join(",");
    if (includeEu) q = list ? q.or(`country_codes.ov.{${list}},country_codes.eq.{}`) : q.filter("country_codes", "eq", "{}");
    else q = q.overlaps("country_codes", countryFilter.length ? countryFilter : ["--"]);
    if (category !== "all") q = q.eq("category", category);
    else if (prefs.categories.length) q = q.in("category", prefs.categories);
    const { data, error: err } = await q.order("published_at", { ascending: false }).range(offset, offset + PAGE - 1);
    if (err) { setError(err.message); setLoading(false); return; }
    const rows = (data ?? []) as NewsRow[];
    setItems((prev) => (offset === 0 ? rows : [...prev, ...rows]));
    setHasMore(rows.length === PAGE);
    const ids = [...new Set(rows.flatMap((r) => r.related_project_ids))];
    if (ids.length) {
      const { data: ps } = await supabase.from("project").select("id, slug, title").in("id", ids);
      setProjects((prev) => { const next = new Map(prev); (ps ?? []).forEach((p) => next.set(p.id, { slug: p.slug, title: p.title })); return next; });
    }
    setLoading(false);
  }, [prefs, countryFilter, includeEu, category]);

  useEffect(() => { void load(0); }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((i) => [i.title_en, i.title, i.summary].some((v) => v?.toLowerCase().includes(needle)));
  }, [items, query]);

  const sourceName = useMemo(() => new Map(sources.map((s) => [s.id, s.name])), [sources]);
  const sourcesByCountry = useMemo(() => {
    const groups = new Map<string, string[]>();
    sources.forEach((s) => { const k = s.country_code ? countryName(s.country_code.trim()) : "EU-wide"; groups.set(k, [...(groups.get(k) ?? []), s.name]); });
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [sources]);

  const countryOptions = region === "all" ? NEWS_REGIONS.flatMap((r) => r.countries) : NEWS_REGIONS.find((r) => r.key === region)?.countries ?? [];

  const clear = () => { setQuery(""); setRegion("all"); setCountry("all"); setCategory("all"); };

  const hide = async (id: string) => {
    const { error: err } = await supabase.from("news_item").update({ hidden: true }).eq("id", id);
    if (err) { toast({ title: "Could not hide this item", description: err.message, variant: "destructive" }); return; }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast({ title: "Hidden from all members" });
  };

  return (
    <div className="max-w-7xl space-y-6 overflow-x-hidden">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground">Market news</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          District heating and cooling news from the markets you follow — deals, policy, funding calls and project milestones, summarised in English.
        </p>
        {prefs && (
          <p className="mt-2 text-xs text-muted-foreground">
            Following: {summariseSelection(prefs.countryCodes, prefs.includeEu)} ·{" "}
            <button type="button" onClick={() => setPrefsOpen(true)} className="font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">Edit</button>
          </p>
        )}
      </header>

      <div className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input aria-label="Search news" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search headlines and summaries…" className="h-11 bg-card pl-10" />
        </div>
        <Select value={region} onValueChange={(v) => { setRegion(v); setCountry("all"); }}>
          <SelectTrigger aria-label="Region" className="h-11 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All my regions</SelectItem>
            {NEWS_REGIONS.map((r) => <SelectItem key={r.key} value={r.key}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger aria-label="Country" className="h-11 bg-card"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {countryOptions.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
        {CATEGORY_CHIPS.map((chip) => (
          <button key={chip.value} type="button" aria-pressed={category === chip.value} onClick={() => setCategory(chip.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${category === chip.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-muted"}`}>
            {chip.label}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-lg border border-dashed border-border bg-card py-12 text-center">
          <p className="font-display font-semibold text-foreground">News could not be loaded</p>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => void load(0)}>Try again</Button>
        </div>
      ) : (loading || !prefs) && items.length === 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-5">
              <Skeleton className="h-4 w-40" /><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-4 py-16 text-center">
          <p className="font-display font-semibold text-foreground">No news yet for these markets</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Coverage grows as new sources are added. Try another region or include EU-wide news.</p>
          <Button variant="outline" className="mt-4" onClick={clear}>Clear filters</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {visible.map((item) => {
              const publisher = item.publisher ?? (item.source_id ? sourceName.get(item.source_id) : null) ?? "Source";
              const headline = item.title_en || item.title;
              const related = item.related_project_ids.map((id) => projects.get(id)).filter((p): p is { slug: string; title: string } => !!p);
              return (
                <article key={item.id} className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-5 transition-shadow hover:shadow-md">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <NewsCategoryBadge category={item.category} />
                    {(item.country_codes.length ? item.country_codes : ["EU"]).map((c) => (
                      <span key={c} className="rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-foreground/75">{c.trim()}</span>
                    ))}
                    <span className="truncate">{publisher}</span>
                    <span aria-hidden>·</span>
                    <time dateTime={item.published_at}>{relativeDate(item.published_at)}</time>
                  </div>
                  <h3 className="mt-3 font-display text-base font-semibold leading-snug text-foreground">
                    <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="break-words hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">{headline}</a>
                  </h3>
                  {item.title_en && item.title_en !== item.title && (
                    <p className="mt-1 break-words text-xs text-muted-foreground">{item.title}{item.language ? ` (${item.language.toUpperCase()})` : ""}</p>
                  )}
                  {item.summary && <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>}
                  {item.why_it_matters && (
                    <p className="mt-2 text-sm text-foreground"><span className="mr-1.5 text-xs font-semibold uppercase tracking-wide text-accent">Why it matters</span>{item.why_it_matters}</p>
                  )}
                  {item.deal_value_eur != null && <p className="mt-2 text-sm font-semibold text-foreground">Deal size ≈ {formatDealSize(item.deal_value_eur)}</p>}
                  {related.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="text-muted-foreground">Related:</span>
                      {related.map((p) => (
                        <Link key={p.slug} to="/app/projects/$slug" params={{ slug: p.slug }} className="rounded-full border border-border bg-muted px-2.5 py-1 font-semibold text-primary hover:bg-secondary">{p.title}</Link>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Read at {publisher} <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    {isAdmin && <Button variant="ghost" size="sm" onClick={() => void hide(item.id)}>Hide</Button>}
                  </div>
                </article>
              );
            })}
          </div>
          {hasMore && (
            <div className="text-center">
              <Button variant="outline" disabled={loading} onClick={() => void load(items.length)}>{loading ? "Loading…" : "Load more"}</Button>
            </div>
          )}
        </>
      )}

      <footer className="border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        {sourcesByCountry.length > 0 && (
          <p>Sources: {sourcesByCountry.map(([c, names]) => `${c}: ${names.join(", ")}`).join(" · ")}</p>
        )}
        <p className="mt-1">Headlines link to the original publisher. Summaries are generated automatically and may contain errors.</p>
      </footer>

      {user && prefs && (
        <NewsPreferencesDialog open={prefsOpen} onOpenChange={setPrefsOpen} userId={user.id} initial={prefs} onSaved={setPrefs} />
      )}
    </div>
  );
};

export default MarketNews;
