import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { effectiveState, type ViewerAccess } from "@/lib/access";
import { countryName, readable } from "@/lib/projectDisclosure";
import { parseDocument } from "@/lib/submission/serializer";
import { useInvestorQualification } from "@/hooks/useInvestorQualification";
import { fundingAssumptionLines } from "@/lib/submission/disclosures";
import {parseProjectIdentity} from '@/lib/projectIdentity';

export interface ProjectListing {
  qualified?: boolean;
  exactFiguresAvailable?: boolean;
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
  baseCaseFundingAssumptions?: string[];
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
  equitySoughtBand?: string|null;
  equitySoughtSort?: number|null;
  targetCloseQuarter?: string|null;
  feasibilityComplete?: boolean;
  publicFundingAwarded?: boolean;
  newLoadContractedPct?: number|null;
}

export const useProjectListings = () => {
  const { user } = useAuth();
  const { qualified } = useInvestorQualification();
  const [projects, setProjects] = useState<ProjectListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: rows, error } = await supabase.from("project_discovery").select("*").order("created_at", { ascending: false });
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
    const investorRows = qualified ? await Promise.all(ids.map(id => supabase.rpc("investor_project",{_project_id:id}))) : [];
    const investorMap=new Map(investorRows.flatMap(result=>{const v=result.data;return v&&typeof v==='object'&&!Array.isArray(v)&&typeof v['id']==='string'?[[v['id'],{document:parseDocument(v['document']??null),exact:v['exact']===true}] as const]:[];}));
    const acceptedIds=ids.filter(id=>{const request=requestMap.get(id);return request&&['granted','granted_full'].includes(effectiveState(request));});
    const identities=await Promise.all(acceptedIds.map(async id=>{const result=await supabase.rpc('project_identity',{_project_id:id});return [id,parseProjectIdentity(result.data)] as const;}));
    const identityMap=new Map(identities);
    const grantedIds = qualified ? acceptedIds : [];
    const [exactProjects, financials, transactions, cases, ladders] = grantedIds.length ? await Promise.all([
      supabase.from("project").select("id,title,capacity_mw,financial_as_of,public_cofinancing_status,submission_published").in("id", grantedIds),
      supabase.from("financial_summary").select("project_id,capex").in("project_id", grantedIds),
      supabase.from("project_transaction").select("project_id,equity_sought,min_ticket").in("project_id", grantedIds),
      supabase.from("project_case").select("project_id,equity_irr_pct").eq("name", "base").in("project_id", grantedIds),
      supabase.from("offtake_ladder").select("project_id,contracted_load_pct,signed_connection_load_pct").in("project_id", grantedIds),
    ]) : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];
    const exactMap = new Map((exactProjects.data ?? []).map((row) => [row.id, row]));
    const financialMap = new Map((financials.data ?? []).map((row) => [row.project_id, row]));
    const transactionMap = new Map((transactions.data ?? []).map((row) => [row.project_id, row]));
    const caseMap = new Map((cases.data ?? []).map(row => [row.project_id, row]));
    const ladderMap = new Map((ladders.data ?? []).map(row => [row.project_id, row]));
    setProjects(validRows.map((row) => {
      const id = row.id ?? "";
      const country = countryName(row.country_code);
      const access = requestMap.get(id);
      const exact = exactMap.get(id);
      const safe=investorMap.get(id);
      const number=(key:string)=>safe?.exact&&safe.document?.answers[key]?.trim()?Number(safe.document.answers[key]):null;
      const financial = financialMap.get(id);
      const transaction = transactionMap.get(id);
      return {
        qualified, exactFiguresAvailable:Boolean(exact)||Boolean(safe?.exact && safe.document),
        id, slug: row.slug ?? "", title: identityMap.get(id)?.title ?? exact?.title ?? `${row.teaser_title ?? ""}, ${country}`,
        teaserTitle: row.teaser_title ?? "", city: "", region: country, country,
        category: readable(row.project_type), technology: readable(row.technology),
        stage: readable(row.lifecycle_stage), generation: "", publicSupport: exact?.public_cofinancing_status === "Committed" || exact?.public_cofinancing_status === "In progress",
        capacityMw: exact?.capacity_mw ?? number("capacity") ?? 0, capex: financial?.capex ?? number("capex"), targetIrr: caseMap.get(id)?.equity_irr_pct ?? null, equitySought: transaction?.equity_sought ?? number("equitySought"), minTicket: transaction?.min_ticket ?? number("minTicket"),
        baseCaseFundingAssumptions: fundingAssumptionLines(parseDocument(exact?.submission_published ?? null)),
        capacityBand: row.capacity_band, capexBand: row.capex_band,
        minTicketBand: row.min_ticket_band, minTicketSort: row.min_ticket_sort,
        transactionTermsPublished: row.transaction_terms_published ?? false,
        equitySoughtBand:row.equity_sought_band,equitySoughtSort:row.equity_sought_sort,targetCloseQuarter:row.target_close_quarter,feasibilityComplete:row.feasibility_complete??false,publicFundingAwarded:row.public_funding_awarded??false,newLoadContractedPct:row.new_load_contracted_pct,
        instrument: row.instrument, offtakeLoadPct: row.offtake_committed_load_pct,
        accessState: access ? effectiveState(access) : "teaser", watchlisted: watched.has(id),
        contractedPct: ladderMap.get(id)?.contracted_load_pct ?? null, signedPct: ladderMap.get(id)?.signed_connection_load_pct ?? null, financialAsOf: exact?.financial_as_of ?? safe?.document?.answers["asOf"] ?? null,
      };
    }));
    setLoading(false);
  }, [user, qualified]);

  useEffect(() => { void load(); }, [load]);
  return { projects, loading, error, reload: load };
};
