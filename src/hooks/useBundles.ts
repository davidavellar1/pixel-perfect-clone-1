import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SavedBundle { id: string; name: string; notes: string | null; updated_at: string; projectIds: string[]; }
export type Result<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

export const useBundles = () => {
  const { user } = useAuth();
  const [bundles, setBundles] = useState<SavedBundle[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setBundles([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase.from("bundle").select("id, name, notes, updated_at, bundle_item(project_id)").order("updated_at", { ascending: false });
    if (error) console.error("Bundle query failed", error);
    setBundles((data || []).map((b) => ({ id: b.id, name: b.name, notes: b.notes, updated_at: b.updated_at, projectIds: (b.bundle_item || []).map((i) => i.project_id) })));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  const saveBundle = async ({ id, name, notes, projectIds }: { id?: string; name: string; notes?: string | null; projectIds: string[] }): Promise<Result<{ id: string; name: string }>> => {
    let bundleId = id;
    if (bundleId) {
      const { error } = await supabase.from("bundle").update({ name, notes: notes || null }).eq("id", bundleId);
      if (error) return { ok: false, error: error.message };
      const { data: existing, error: readError } = await supabase.from("bundle_item").select("project_id").eq("bundle_id", bundleId);
      if (readError) return { ok: false, error: readError.message };
      const current = new Set((existing || []).map((r) => r.project_id));
      const removed = [...current].filter((p) => !projectIds.includes(p));
      if (removed.length) {
        const { error: delError } = await supabase.from("bundle_item").delete().eq("bundle_id", bundleId).in("project_id", removed);
        if (delError) return { ok: false, error: delError.message };
      }
      const added = projectIds.filter((p) => !current.has(p));
      if (added.length) {
        const { error: insError } = await supabase.from("bundle_item").insert(added.map((project_id) => ({ bundle_id: bundleId!, project_id })));
        if (insError) return { ok: false, error: insError.message };
      }
    } else {
      const { data, error } = await supabase.from("bundle").insert({ name, notes: notes || null }).select("id").single();
      if (error || !data) return { ok: false, error: error?.message || "Could not save bundle" };
      bundleId = data.id;
      if (projectIds.length) {
        const { error: insError } = await supabase.from("bundle_item").insert(projectIds.map((project_id) => ({ bundle_id: bundleId!, project_id })));
        if (insError) { await supabase.from("bundle").delete().eq("id", bundleId); return { ok: false, error: insError.message }; }
      }
    }
    await load();
    return { ok: true, data: { id: bundleId!, name } };
  };

  const renameBundle = async (id: string, name: string): Promise<Result> => {
    const { error } = await supabase.from("bundle").update({ name }).eq("id", id);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true, data: undefined };
  };

  const deleteBundle = async (id: string): Promise<Result> => {
    const { error } = await supabase.from("bundle").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    await load();
    return { ok: true, data: undefined };
  };

  return { bundles, loading, saveBundle, renameBundle, deleteBundle, reload: load };
};
