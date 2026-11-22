import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDialogParam } from "@/hooks/useDialogParam";
import ContactRequestDialog from "@/components/platform/ContactRequestDialog";
import { Link } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";

type AdvisorCategory = "Financial" | "Legal" | "Technical";

type Advisor = {
  id: string;
  slug: string;
  initials: string;
  name: string;
  category: AdvisorCategory;
  label: string;
  description: string;
  tags: string[];
};

const CATEGORY_LABEL: Record<string, AdvisorCategory> = {
  financial: "Financial",
  legal: "Legal",
  technical: "Technical",
};

const FILTERS = ["All advisors", "Financial", "Legal", "Technical"] as const;
type Filter = (typeof FILTERS)[number];

const Ecosystem = () => {
  const [filter, setFilter] = useState<Filter>("All advisors");
  const [all, setAll] = useState<Advisor[] | null>(null);
  const [target,setTarget]=useState<Advisor|null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase
        .from("advisor")
        .select("id, slug, name, initials, category, label, description, tags")
        .eq("active", true).not("listing_consent_at","is",null).not("contact_route","is",null).not("referral_position","is",null)
        .order("sort_order", { ascending: true });
      if (!active) return;
      setAll(
        (data ?? []).map((row) => ({
          id: row.id, slug: row.slug,
          name: row.name,
          initials: row.initials,
          category: CATEGORY_LABEL[row.category] ?? "Technical",
          label: row.label,
          description: row.description,
          tags: row.tags ?? [],
        })),
      );
    })();
    return () => {
      active = false;
    };
  }, []);

  const advisorsAll = all ?? [];

  const advisors = useMemo(
    () => (filter === "All advisors" ? advisorsAll : advisorsAll.filter((advisor) => advisor.category === filter)),
    [advisorsAll, filter],
  );

  return (
    <div className="max-w-workspace space-y-6">
      <header>
        <h1 className="font-display text-3xl font-semibold text-foreground">Ecosystem</h1>
        <p className="mt-1 text-[15px] text-muted-foreground">
          Financial, legal, and technical advisors listed on DHC Market.
        </p>
      </header>

      <div className="flex flex-wrap gap-2.5" role="group" aria-label="Filter advisors by category">
        {FILTERS.map((item) => (
          <Button
            key={item}
            type="button"
            variant={filter === item ? "default" : "outline"}
            aria-pressed={filter === item}
            onClick={() => setFilter(item)}
            className={cn(
              "h-10 px-4 font-display",
              filter === item
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-card text-foreground/80 hover:bg-muted hover:text-foreground",
            )}
          >
            {item}
          </Button>
        ))}
      </div>

      {all === null ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading advisors…
        </div>
      ) : advisors.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
          No advisors listed in this category yet.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {advisors.map((advisor) => (
            <article
              key={advisor.name}
              className="flex min-h-[290px] flex-col rounded-lg border border-border bg-card p-6 transition-[border-color,box-shadow] hover:border-foreground/15 hover:shadow-md"
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted font-display text-base font-bold text-foreground/75">
                  {advisor.initials}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold text-foreground"><Link to={`/app/advisors/${advisor.slug}`} className="text-primary underline">{advisor.name}</Link></h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{advisor.label}</p>
                </div>
              </div>

              <p className="mt-4 text-[13.5px] leading-6 text-foreground/70">{advisor.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {advisor.tags.map((tag) => (
                  <span key={tag} className="rounded-md border border-border bg-background px-2.5 py-1 text-xs text-foreground/75">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-auto border-t border-border pt-4">
                <Button variant="outline" className="w-full bg-card" onClick={() => setTarget(advisor)}>
                  Request contact
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">Only firms with recorded listing consent, a contact route and a referral disclosure appear. No introduction is made automatically.</p>
      {target&&<ContactRequestDialog target={{id:target.id,name:target.name,kind:'advisor'}} close={()=>setTarget(null)}/>}
    </div>
  );
};

export default Ecosystem;
