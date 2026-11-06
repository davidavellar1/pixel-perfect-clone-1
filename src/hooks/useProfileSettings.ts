import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/integrations/supabase/types";

type Tables = Database["public"]["Tables"];
export interface SettingsData {
  personal: Tables["user_profile"]["Row"] | null;
  investor: Tables["investor_profiles"]["Row"] | null;
  developer: Tables["developer_profiles"]["Row"] | null;
  legal: Tables["legal_acceptance"]["Row"][];
}
export const useProfileSettings = () => {
  const { user, roles } = useAuth();
  const [data, setData] = useState<SettingsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const [personal, investor, developer, legal] = await Promise.all([
        supabase.from("user_profile").select("*").eq("user_id", user.id).maybeSingle(),
        roles.includes("investor") ? supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        roles.includes("developer") ? supabase.from("developer_profiles").select("*").eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
        supabase.from("legal_acceptance").select("*").eq("user_id", user.id).order("accepted_at", { ascending: false }),
      ]);
      for (const result of [personal, investor, developer, legal]) if (result.error) throw result.error;
      setData({ personal: personal.data, investor: investor.data, developer: developer.data, legal: legal.data ?? [] });
    } catch (err) { setError(err instanceof Error ? err.message : (err as { message?: string }).message ?? "Couldn't load your profile."); }
    finally { setLoading(false); }
  }, [user?.id, roles.join(",")]);
  useEffect(() => { void load(); }, [load]);
  return { data, setData, loading, error, retry: load };
};