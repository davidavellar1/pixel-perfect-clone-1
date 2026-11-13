import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { EnumSelect, Chips } from "@/components/settings/SettingsFields";
import { CONSTRUCTION_RISK, INSTRUMENTS_SOUGHT } from "@/lib/access";
import { INVESTOR_TYPES, REGIONS, TICKETS } from "@/lib/profileSettings";
import type { Tables } from "@/integrations/supabase/types";

type Mandate = Pick<Tables<"investor_profiles">, "investor_type" | "ticket_band" | "instrument_sought" | "regions_of_interest" | "construction_risk_appetite">;
const blank: Mandate = { investor_type: null, ticket_band: null, instrument_sought: null, regions_of_interest: [], construction_risk_appetite: null };
const options = <T extends string>(rows: { value: T; label: string }[]) => Object.fromEntries(rows.map(row => [row.value, row.label])) as Record<T, string>;

export default function MandateStep({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const [readyFor, setReadyFor] = useState<string | null>(null);
  const [needed, setNeeded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<Tables<"investor_profiles"> | null>(null);
  const [mandate, setMandate] = useState<Mandate>(blank);
  const load = async () => {
    if (!user) return;
    setFailed(false);
    const { data, error } = await supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle();
    if (error) { setFailed(true); return; }
    setExisting(data);
    setMandate(data ? { investor_type: data.investor_type, ticket_band: data.ticket_band, instrument_sought: data.instrument_sought,
      regions_of_interest: data.regions_of_interest ?? [], construction_risk_appetite: data.construction_risk_appetite } : blank);
    setNeeded(!data?.mandate_reviewed_at); setReadyFor(user.id);
  };
  useEffect(() => { void load(); }, [user?.id]);
  const finish = async (skip: boolean) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("investor_profiles").upsert({ user_id: user.id,
      full_name: existing?.full_name || String(user.user_metadata?.full_name || profile?.display_name || "Member"),
      ...(skip ? {} : mandate), mandate_reviewed_at: new Date().toISOString() }, { onConflict: "user_id" });
    setSaving(false);
    if (error) { toast.error("Your mandate was not saved. Please try again."); return; }
    setNeeded(false);
  };
  if (failed) return <div role="alert" className="space-y-3"><p>Could not load investing preferences.</p><Button onClick={() => void load()}>Try again</Button></div>;
  if (!user || readyFor !== user.id) return <p className="text-muted-foreground">Loading workspace...</p>;
  if (!needed) return <>{children}</>;
  const complete = Boolean(mandate.investor_type && mandate.ticket_band && mandate.instrument_sought && mandate.regions_of_interest?.length && mandate.construction_risk_appetite);
  return <section className="mx-auto max-w-2xl space-y-6">
    <div><h1 className="font-display text-2xl font-semibold">Your investment mandate</h1><p className="mt-2 text-sm text-muted-foreground">Your stated preferences. Confirm or change them for each project.</p></div>
    <div className="grid gap-5 sm:grid-cols-2">
      <EnumSelect id="mandate-type" label="Investor type" value={mandate.investor_type} options={INVESTOR_TYPES} onChange={v => setMandate(m => ({ ...m, investor_type: v }))} />
      <EnumSelect id="mandate-ticket" label="Ticket band" value={mandate.ticket_band} options={TICKETS} onChange={v => setMandate(m => ({ ...m, ticket_band: v }))} />
      <EnumSelect id="mandate-instrument" label="Instrument sought" value={mandate.instrument_sought} options={options(INSTRUMENTS_SOUGHT)} onChange={v => setMandate(m => ({ ...m, instrument_sought: v }))} />
      <EnumSelect id="mandate-risk" label="Construction-risk appetite" value={mandate.construction_risk_appetite} options={options(CONSTRUCTION_RISK)} onChange={v => setMandate(m => ({ ...m, construction_risk_appetite: v }))} />
    </div>
    <Chips id="mandate-regions" label="Geography" value={mandate.regions_of_interest ?? []} options={Object.fromEntries([...new Set([...REGIONS, ...(mandate.regions_of_interest ?? [])])].map(v => [v, v]))} onChange={v => setMandate(m => ({ ...m, regions_of_interest: v }))} />
    <div className="flex flex-wrap gap-3"><Button disabled={saving || !complete} onClick={() => void finish(false)}>{saving ? "Saving..." : "Save and continue"}</Button><Button variant="ghost" disabled={saving} onClick={() => void finish(true)}>Skip for now</Button></div>
  </section>;
}