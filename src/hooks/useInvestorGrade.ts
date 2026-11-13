import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { emptyInvestorGrade, type InvestorGradeBundle } from "@/data/investorGrade";
import type { ViewerAccess } from "@/lib/access";
import { canReadProjectDetail } from "@/lib/projectDisclosure";

/** Loads every investor-grade record attached to a database project. */
export const useInvestorGrade = (projectId: string | null | undefined, accessState: ViewerAccess, isOwner = false) => {
  const allowed = canReadProjectDetail(accessState, isOwner);
  const [result, setResult] = useState<{ id: string; grade: InvestorGradeBundle } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setResult(null);
    if (!projectId || !allowed) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [transaction, process, construction, margin, cases, ladder] = await Promise.all([
        supabase.from("project_transaction").select("*").eq("project_id", projectId).maybeSingle(),
        supabase.from("project_process").select("*").eq("project_id", projectId).maybeSingle(),
        supabase.from("construction_package").select("*").eq("project_id", projectId).maybeSingle(),
        supabase.from("margin_profile").select("*").eq("project_id", projectId).maybeSingle(),
        supabase.from("project_case").select("*").eq("project_id", projectId),
        supabase.from("offtake_ladder").select("*").eq("project_id", projectId).maybeSingle(),
      ]);
      if (cancelled) return;
      setResult({ id: projectId, grade: {
        transaction: transaction.data ?? null,
        process: process.data ?? null,
        construction: construction.data ?? null,
        margin: margin.data ?? null,
        cases: cases.data ?? [],
        ladder: ladder.data ?? null,
      } });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [projectId, allowed]);

  return { grade: allowed && result && result.id === projectId ? result.grade : emptyInvestorGrade, loading: allowed && loading };
};
