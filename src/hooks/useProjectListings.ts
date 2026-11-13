import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { effectiveState, type ViewerAccess } from "@/lib/access";
import { countryName, readable } from "@/lib/projectDisclosure";

export interface ProjectListing {
  id: string;
  slug: string;
  title: string;
  teaserTitle: string;
  city: string;
  region: string;
  country: string;
  category: string;
  technology: string;
  stage: string;
  generation: string;
  publicSupport: boolean;
  capacityMw: number;
  capex: number | null;
  targetIrr: number | null;
  equitySought: number | null;
  minTicket: number | null;
  instrument: string | null;
  offtakeLoadPct: number | null;
  accessState: ViewerAccess;
  watchlisted: boolean;
  contractedPct?: number | null;
  signedPct?: number | null;
  financialAsOf?: string | null;
  capacityBand?: string | null;
  capexBand?: string | null;
  minTicketBand?: string | null;
  minTicketSort?: number | null;
  transactionTermsPublished?: boolean;
}

export const useProjectListings = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error } = await supabase.from("project_teaser").select("*").order("created_at", { ascending: false });
    if (error || !rows) {
      if (error) { console.error("Project listing query failed", error); setError(error.message); }
      setProjects([]); setLoading(false); return;
    }
    const validRows = rows.filter((row) => row.id && row.slug);
    const ids = validRows.flatMap((row) => row.id ? [row.id] : []);
    if (!ids.length) { setProjects([]); setLoading(false); return; }
    const [requestsResult, watchResult] = await Promise.all([
      user ? supabase.from("access_request").select("*").eq("investor_user_id", user.id).in("project_id", ids) : Promise.resolve({ data: [] }),
      user ? supabase.from("watchlist_item").select("*").eq("user_id", user.id).in("project_id", ids) : Promise.resolve({ data: [] }),
    ]);
    const requestMap = new Map((requestsResult.data || []).map((row) => [row.project_id, row]));
    const watched = new Set((watchResult.data || []).map((row) => row.project_id));
    setProjects(validRows.map((row) => {
      const id = row.id ?? "";
      const country = countryName(row.country_code);
      const access = requestMap.get(id);
      return {
        id, slug: row.slug ?? "", title: `${row.teaser_title ?? ""}, ${country}`,
        teaserTitle: row.teaser_title ?? "", city: "", region: country, country,
        category: readable(row.project_type), technology: readable(row.technology),
        stage: readable(row.lifecycle_stage), generation: "DHC", publicSupport: false,
        capacityMw: 0, capex: null, targetIrr: null, equitySought: null, minTicket: null,
        capacityBand: row.capacity_band, capexBand: row.capex_band,
        minTicketBand: row.min_ticket_band, minTicketSort: row.min_ticket_sort,
        transactionTermsPublished: row.transaction_terms_published ?? false,
        instrument: row.instrument, offtakeLoadPct: row.offtake_committed_load_pct,
        accessState: access ? effectiveState(access) : "teaser", watchlisted: watched.has(id),
        contractedPct: null, signedPct: null, financialAsOf: null,
      };
    }));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  return { projects, loading, error, reload: load };
};
