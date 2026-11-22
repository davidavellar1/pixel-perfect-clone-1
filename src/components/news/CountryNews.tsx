import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import NewsCategoryBadge from "@/components/news/NewsCategoryBadge";
import { NEWS_ITEM_COLUMNS, relativeDate, type NewsCategory } from "@/lib/news/format";
import { MIN_NEWS_RELEVANCE } from "@/lib/news/policy";
import { effectiveState, isGranted } from "@/lib/access";

const PAGE = 20;
interface NewsRow {
  id: string; url: string; title: string; title_en: string | null; summary: string | null; why_it_matters: string | null;
  language: string | null; publisher: string | null; published_at: string; category: NewsCategory; related_project_ids: string[];
}

/**
 * News for one country. Related-project tags appear only for projects the viewer owns or has
 * accepted access to, and are labelled with the anonymized teaser title, never the project name.
 */
export default function CountryNews({ code }: { code: string }) {
  const { user, roles } = useAuth();
  const isAdmin = roles.includes("admin");
  const cc = code.trim().toUpperCase();
  const [items, setItems] = useState<NewsRow[]>([]);
  const [related, setRelated] = useState<Map<string, { ref: string; title: string }>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (offset: number) => {
    setLoading(true); setError(null);
    const { data, error: failed } = await supabase.from("news_item").select(NEWS_ITEM_COLUMNS).eq("hidden", false)
      .gte("relevance", MIN_NEWS_RELEVANCE).overlaps("country_codes", [cc]).order("published_at", { ascending: false }).range(offset, offset + PAGE - 1);
    if (failed) { setError(failed.message); setLoading(false); return; }
    const [requests, developer] = user ? await Promise.all([
      supabase.from("access_request").select("*").eq("investor_user_id", user.id),
      supabase.from("developer_profiles").select("id").eq("user_id", user.id).maybeSingle(),
    ]) : [{ data: [] }, { data: null }];
    const owned = developer.data ? await supabase.from("project").select("id").eq("developer_id", developer.data.id) : { data: [] };
    const disclosed = new Set([...(requests.data ?? []).filter((row) => isGranted(effectiveState(row))).map((row) => row.project_id), ...(owned.data ?? []).map((row) => row.id)]);
    const rows = ((data ?? []) as NewsRow[]).map((row) => ({ ...row, related_project_ids: row.related_project_ids.filter((id) => disclosed.has(id)) }));
    setItems((previous) => offset === 0 ? rows : [...previous, ...rows]);
    setHasMore(rows.length === PAGE);
    const ids = [...new Set(rows.flatMap((row) => row.related_project_ids))];
    if (ids.length) {
      const { data: teasers } = await supabase.from("project_teaser").select("id, public_ref, teaser_title").in("id", ids);
      setRelated((previous) => { const next = new Map(previous); (teasers ?? []).forEach((t) => { if (t.id && t.public_ref && t.teaser_title) next.set(t.id, { ref: t.public_ref, title: t.teaser_title }); }); return next; });
    }
    setLoading(false);
  }, [cc, user]);

  useEffect(() => { void load(0); }, [load]);

  const hide = async (id: string) => {
    const { error: failed } = await supabase.from("news_item").update({ hidden: true }).eq("id", id);
    if (failed) { toast.error("Could not hide this item", { description: failed.message }); return; }
    setItems((previous) => previous.filter((item) => item.id !== id));
    toast.success("Hidden from all members");
  };

  return <section aria-labelledby="country-news" className="space-y-4">
    <h2 id="country-news" className="font-display text-lg font-semibold">Market news</h2>
    {error ? <div className="rounded-lg border border-dashed border-border bg-card py-10 text-center"><p className="font-semibold">News could not be loaded</p><Button variant="outline" className="mt-4" onClick={() => void load(0)}>Try again</Button></div>
      : loading && !items.length ? <div className="grid gap-4 lg:grid-cols-2">{[0, 1].map((i) => <div key={i} className="space-y-3 rounded-lg border border-border bg-card p-5"><Skeleton className="h-4 w-40" /><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-2/3" /></div>)}</div>
      : !items.length ? <p className="rounded-lg border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">No news recorded for this country yet.</p>
      : <>
        <div className="grid gap-4 lg:grid-cols-2">{items.map((item) => {
          const tags = item.related_project_ids.map((id) => related.get(id)).filter((tag): tag is { ref: string; title: string } => Boolean(tag));
          const publisher = item.publisher ?? "Source";
          return <article key={item.id} className="flex min-w-0 flex-col rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><NewsCategoryBadge category={item.category} /><span className="truncate">{publisher}</span><span aria-hidden>|</span><time dateTime={item.published_at}>{relativeDate(item.published_at)}</time></div>
            <h3 className="mt-3 font-display text-base font-semibold leading-snug"><a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="break-words hover:text-primary">{item.title_en || item.title}</a></h3>
            {item.summary && <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.summary}</p>}
            {item.why_it_matters && <p className="mt-2 text-sm"><span className="mr-1.5 text-xs font-semibold uppercase tracking-wide text-accent">Why it matters</span>{item.why_it_matters}</p>}
            {tags.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2 text-xs"><span className="text-muted-foreground">Related:</span>{tags.map((tag) => <Link key={tag.ref} to="/app/projects/$ref" params={{ ref: tag.ref }} className="rounded-full border border-border bg-muted px-2.5 py-1 font-semibold text-primary hover:bg-secondary">{tag.title}</Link>)}</div>}
            <div className="mt-auto flex items-center justify-between gap-3 pt-4"><a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Read at {publisher} <ExternalLink className="h-3.5 w-3.5" /></a>{isAdmin && <Button variant="ghost" size="sm" onClick={() => void hide(item.id)}>Hide</Button>}</div>
          </article>;
        })}</div>
        {hasMore && <div className="text-center"><Button variant="outline" disabled={loading} onClick={() => void load(items.length)}>{loading ? "Loading..." : "Load more"}</Button></div>}
      </>}
    <p className="text-xs text-muted-foreground">Headlines link to the original publisher. Summaries are generated automatically and may contain errors.</p>
  </section>;
}
