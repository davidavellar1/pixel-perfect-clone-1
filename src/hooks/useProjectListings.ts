import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { effectiveState, type ViewerAccess } from "@/lib/access";
import type { Tables } from "@/integrations/supabase/types";

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
}

type Project = Tables<"project">;
type Transaction = Tables<"project_transaction">;
type Ladder = Tables<"offtake_ladder">;

const COUNTRY: Record<string, string> = { AT: "Austria", BE: "Belgium", CZ: "Czech Republic", DE: "Germany", DK: "Denmark", EE: "Estonia", ES: "Spain", FI: "Finland", FR: "France", GB: "United Kingdom", HR: "Croatia", HU: "Hungary", IT: "Italy", LT: "Lithuania", LV: "Latvia", NL: "Netherlands", NO: "Norway", PL: "Poland", RO: "Romania", SE: "Sweden", SI: "Slovenia", SK: "Slovakia", CH: "Switzerland" };
const titleCase = (value: string) => value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const regionFor = (project: Project) => {
  const summary = `${project.summary || ""} ${project.description || ""}`;
  const match = summary.match(/(?:region|district)[: ]+([A-Z][A-Za-zÀ-ž -]{2,30})/);
  return match?.[1]?.trim() || COUNTRY[project.country_code] || project.country_code;
};

export const useProjectListings = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectListing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows, error } = await supabase.from("project").select("*").eq("visibility", "listed").order("created_at", { ascending: false });
    if (error || !rows) {
      if (error) console.error("Project listing query failed", error);
      setProjects([]); setLoading(false); return;
    }
    const ids = rows.map((row) => row.id);
    if (!ids.length) { setProjects([]); setLoading(false); return; }
    const [transactionsResult, laddersResult, requestsResult, watchResult] = await Promise.all([
      supabase.from("project_transaction").select("*").in("project_id", ids),
      supabase.from("offtake_ladder").select("*").in("project_id", ids),
      user ? supabase.from("access_request").select("*").eq("investor_user_id", user.id).in("project_id", ids) : Promise.resolve({ data: [] }),
      user ? supabase.from("watchlist_item").select("*").eq("user_id", user.id).in("project_id", ids) : Promise.resolve({ data: [] }),
    ]);
    const transactionMap = new Map(((transactionsResult.data || []) as Transaction[]).map((row) => [row.project_id, row]));
    const ladderMap = new Map(((laddersResult.data || []) as Ladder[]).map((row) => [row.project_id, row]));
    const requestMap = new Map((requestsResult.data || []).map((row) => [row.project_id, row]));
    const watched = new Set((watchResult.data || []).map((row) => row.project_id));
    setProjects(rows.map((project) => {
      const transaction = transactionMap.get(project.id);
      const ladder = ladderMap.get(project.id);
      const technology = titleCase(project.technology);
      const category = titleCase(project.project_type);
      const access = requestMap.get(project.id);
      return {
        id: project.id, slug: project.slug, title: project.title,
        teaserTitle: `${technology} ${category.toLowerCase()}`,
        city: project.city, region: regionFor(project), country: COUNTRY[project.country_code] || project.country_code,
        category, technology, stage: titleCase(project.lifecycle_stage), generation: "DHC",
        publicSupport: false, capacityMw: Number(project.capacity_mw),
        capex: project.headline_investment == null ? null : Number(project.headline_investment),
        targetIrr: transaction?.target_equity_irr_pct == null ? (project.headline_irr_pct == null ? null : Number(project.headline_irr_pct)) : Number(transaction.target_equity_irr_pct),
        equitySought: transaction?.equity_sought == null ? null : Number(transaction.equity_sought),
        minTicket: transaction?.min_ticket == null ? null : Number(transaction.min_ticket),
        instrument: transaction?.instrument || null,
        offtakeLoadPct: ladder ? Number(ladder.contracted_load_pct || 0) + Number(ladder.signed_connection_load_pct || 0) : null,
        accessState: access ? effectiveState(access) : "teaser", watchlisted: watched.has(project.id),
      };
    }));
    setLoading(false);
  }, [user]);

  useEffect(() => { void load(); }, [load]);
  return { projects, loading, reload: load };
};
