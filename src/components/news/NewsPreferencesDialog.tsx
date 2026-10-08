import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NEWS_REGIONS, fullRegions } from "@/lib/news/regions";
import { CATEGORY_LABEL, PREFERENCE_CATEGORIES, type NewsCategory } from "@/lib/news/format";

export interface NewsPrefs {
  countryCodes: string[];
  includeEu: boolean;
  categories: NewsCategory[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initial: NewsPrefs;
  onSaved: (prefs: NewsPrefs) => void;
}

const NewsPreferencesDialog = ({ open, onOpenChange, userId, initial, onSaved }: Props) => {
  const { toast } = useToast();
  const [countries, setCountries] = useState<Set<string>>(new Set(initial.countryCodes));
  const [includeEu, setIncludeEu] = useState(initial.includeEu);
  const [categories, setCategories] = useState<Set<NewsCategory>>(new Set(initial.categories));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCountries(new Set(initial.countryCodes));
    setIncludeEu(initial.includeEu);
    setCategories(new Set(initial.categories));
  }, [open, initial]);

  const toggle = <T,>(set: Set<T>, value: T, on: boolean) => {
    const next = new Set(set);
    if (on) next.add(value); else next.delete(value);
    return next;
  };

  const save = async () => {
    setSaving(true);
    const codes = [...countries];
    const cats = [...categories];
    const { error } = await supabase.from("user_news_preference").upsert({
      user_id: userId,
      regions: fullRegions(codes),
      country_codes: codes,
      categories: cats,
      include_eu: includeEu,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });
    setSaving(false);
    if (error) {
      toast({ title: "Could not save your markets", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Your markets are saved" });
    onSaved({ countryCodes: codes, includeEu, categories: cats });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Choose your markets</DialogTitle>
          <DialogDescription>Pick the countries you want news from. You can change this at any time.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          {NEWS_REGIONS.map((region) => {
            const all = region.countries.every((c) => countries.has(c.code));
            const some = region.countries.some((c) => countries.has(c.code));
            return (
              <fieldset key={region.key} className="rounded-lg border border-border p-4">
                <legend className="px-1 font-display text-sm font-semibold text-foreground">{region.name}</legend>
                <label className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <Checkbox
                    checked={all ? true : some ? "indeterminate" : false}
                    onCheckedChange={(v) => {
                      const next = new Set(countries);
                      region.countries.forEach((c) => (v === true ? next.add(c.code) : next.delete(c.code)));
                      setCountries(next);
                    }}
                  />
                  Select all
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {region.countries.map((c) => (
                    <label key={c.code} className="flex items-center gap-2 text-sm text-foreground">
                      <Checkbox checked={countries.has(c.code)} onCheckedChange={(v) => setCountries(toggle(countries, c.code, v === true))} />
                      {c.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          })}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-4">
            <Label htmlFor="news-eu" className="text-sm">Include EU-wide and international news</Label>
            <Switch id="news-eu" checked={includeEu} onCheckedChange={setIncludeEu} />
          </div>
          <fieldset className="rounded-lg border border-border p-4">
            <legend className="px-1 font-display text-sm font-semibold text-foreground">Topics (optional — none selected means all)</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {PREFERENCE_CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox checked={categories.has(c)} onCheckedChange={(v) => setCategories(toggle(categories, c, v === true))} />
                  {CATEGORY_LABEL[c]}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save markets"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewsPreferencesDialog;
