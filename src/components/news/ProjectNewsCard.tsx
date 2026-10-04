import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import NewsCategoryBadge from "./NewsCategoryBadge";
import { NEWS_ITEM_COLUMNS, relativeDate, type NewsCategory } from "@/lib/news/format";
import { countryName } from "@/lib/news/regions";

interface Row { id: string; url: string; title: string; title_en: string | null; publisher: string | null; published_at: string; category: NewsCategory }

const ProjectNewsCard = ({ projectId, countryCode }: { projectId: string; countryCode: string }) => {
  const [items, setItems] = useState<Row[] | null>(null);
  const cc = countryCode.trim().toUpperCase();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: related } = await supabase.from("news_item").select(NEWS_ITEM_COLUMNS)
        .eq("hidden", false).contains("related_project_ids", [projectId]).order("published_at", { ascending: false }).limit(3);
      let list: Row[] = (related ?? []) as Row[];
      if (list.length < 3 && /^[A-Z]{2}$/.test(cc)) {
        const { data: more } = await supabase.from("news_item").select(NEWS_ITEM_COLUMNS)
          .eq("hidden", false).contains("country_codes", [cc]).order("published_at", { ascending: false }).limit(6);
        const ids = new Set(list.map((r) => r.id));
        list = [...list, ...((more ?? []) as Row[]).filter((r) => !ids.has(r.id))].slice(0, 3);
      }
      if (active) setItems(list);
    })();
    return () => { active = false; };
  }, [projectId, cc]);

  if (items && items.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-6" style={{ boxShadow: "var(--card-shadow)" }}>
      <h3 className="mb-4 font-display text-base font-semibold text-foreground">Market news</h3>
      <ul className="space-y-4">
        {items === null
          ? [0, 1, 2].map((i) => <li key={i} className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-4 w-full" /><Skeleton className="h-3 w-32" /></li>)
          : items.map((item) => (
            <li key={item.id} className="space-y-1.5">
              <NewsCategoryBadge category={item.category} />
              <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="block text-sm font-semibold text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded">
                {item.title_en || item.title}
              </a>
              <p className="text-xs text-muted-foreground">{item.publisher ?? "Source"} · {relativeDate(item.published_at)}</p>
            </li>
          ))}
      </ul>
      {/^[A-Z]{2}$/.test(cc) && (
        <Link to="/app/news" search={{ country: cc }} className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
          More from {countryName(cc)} →
        </Link>
      )}
    </section>
  );
};

export default ProjectNewsCard;
