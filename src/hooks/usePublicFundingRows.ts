import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FundingRow } from "@/lib/publicFundingViews";

/**
 * Public-funding rows and stated capex for the given projects. Both tables are readable only by
 * the owner or an accepted, qualified investor, so projects the viewer is not entitled to simply
 * return no rows. `visibleProjects` says how many of the requested projects had records.
 */
export function usePublicFundingRows(projectIds: string[], labels: Map<string, string>) {
  const key = [...new Set(projectIds)].sort().join(",");
  const [state, setState] = useState<{ key: string; rows: FundingRow[]; capex: Map<string, number | null>; loading: boolean; failed: boolean }>({ key: "", rows: [], capex: new Map(), loading: false, failed: false });
  useEffect(() => {
    const ids = key ? key.split(",") : [];
    if (!ids.length) { setState({ key, rows: [], capex: new Map(), loading: false, failed: false }); return; }
    let active = true;
    setState((previous) => ({ ...previous, key, loading: true, failed: false }));
    void (async () => {
      const summaries = await supabase.from("financial_summary").select("id,project_id,capex").in("project_id", ids);
      if (summaries.error) { if (active) setState({ key, rows: [], capex: new Map(), loading: false, failed: true }); return; }
      const byId = new Map((summaries.data ?? []).map((summary) => [summary.id, summary.project_id]));
      const funding = byId.size ? await supabase.from("public_funding").select("financial_summary_id,source,administering_body,amount,funding_status,expected_decision_date,clawback_treatment").in("financial_summary_id", [...byId.keys()]) : { data: [], error: null };
      if (!active) return;
      if (funding.error) { setState({ key, rows: [], capex: new Map(), loading: false, failed: true }); return; }
      const rows: FundingRow[] = (funding.data ?? []).flatMap((item) => {
        const projectId = byId.get(item.financial_summary_id);
        return projectId ? [{ projectId, projectLabel: "", body: item.administering_body, source: item.source, amount: item.amount, status: item.funding_status, decisionDate: item.expected_decision_date, conditions: item.clawback_treatment }] : [];
      });
      setState({ key, rows, capex: new Map((summaries.data ?? []).map((summary) => [summary.project_id, summary.capex])), loading: false, failed: false });
    })();
    return () => { active = false; };
  }, [key]);
  const rows = useMemo(() => state.rows.map((row) => ({ ...row, projectLabel: labels.get(row.projectId) ?? "Listing" })), [state.rows, labels]);
  return { rows, capexByProject: state.capex, visibleProjects: state.capex.size, loading: state.loading || state.key !== key, failed: state.failed };
}
