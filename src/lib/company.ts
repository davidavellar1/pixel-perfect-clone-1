import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { COUNTRY_NAMES } from "@/lib/funding";

export type Organization = Tables<"organization">;
export type TrackRecordEntry = Tables<"organization_track_record">;

export const ORG_TYPE_LABEL: Record<string, string> = {
  utility: "Utility",
  municipality: "Municipality",
  private_developer: "Private developer",
  energy_company: "Energy company",
  esco: "Energy service company (ESCO)",
  other: "Other",
};

export const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  developer: "Developer",
  operator: "Operator",
  epc: "EPC contractor",
  co_investor: "Co-investor",
};

export const STATUS_LABEL: Record<string, string> = {
  operational: "Operational",
  construction: "Under construction",
  development: "In development",
};

export const TECHNOLOGY_LABEL: Record<string, string> = {
  geothermal: "Geothermal",
  biomass_chp: "Biomass CHP",
  waste_heat_recovery: "Waste heat recovery",
  solar_thermal: "Solar thermal",
  large_heat_pump: "Large heat pump",
  river_water_cooling: "River water cooling",
  seawater_cooling: "Seawater cooling",
  thermal_storage: "Thermal storage",
  hybrid: "Hybrid",
  network: "Heat / cooling network",
};

export const EMPLOYEE_BANDS = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

export const STAGE_LABEL = (value: string) =>
  value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

export const countryName = (code?: string | null) => (code ? COUNTRY_NAMES[code] || code : "");

export const formatMw = (mw: number | null | undefined) =>
  mw == null ? "" : `${Number(mw).toLocaleString("en-GB", { maximumFractionDigits: 1 })} MW`;

/** Anonymous ranges, so a precise figure cannot identify the developer. */
export const capacityBand = (mw: number | null | undefined) => {
  if (!mw || mw <= 0) return null;
  if (mw < 50) return "under 50 MW";
  if (mw < 200) return "50–200 MW";
  if (mw < 500) return "200–500 MW";
  if (mw < 1000) return "500–1,000 MW";
  return "over 1,000 MW";
};

/** What every viewer of a listed project may see: no name, city, website or founding year. */
export interface SponsorSummary {
  has_profile: boolean;
  org_type: string | null;
  country_code: string | null;
  countries_count: number;
  verified: boolean;
  delivered_count: number;
  delivered_verified_count: number;
  delivered_capacity_mw: number | null;
  pipeline_count: number;
  member_since: number | null;
}

/** Full profile: only for the owner, investors with accepted access, and admins. */
export interface DeveloperProfile {
  organization:
    (Omit<Organization, "id" | "created_at" | "total_capacity_mw"> & { updated_at: string }) | null;
  developer_type: string | null;
  member_since: number | null;
  track_record: Omit<
    TrackRecordEntry,
    "id" | "organization_id" | "created_at" | "updated_at" | "sort_order"
  >[];
  other_listings: {
    slug: string;
    title: string | null;
    country_code: string;
    technology: string;
    capacity_mw: number | null;
    stage: string;
  }[];
}

export const useDeveloperProfile = (projectId: string | undefined, granted: boolean) => {
  const [summary, setSummary] = useState<SponsorSummary | null>(null);
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setSummary(null);
      setProfile(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      const [summaryRes, profileRes] = await Promise.all([
        supabase.rpc("project_sponsor_summary", { _project_id: projectId }),
        granted
          ? supabase.rpc("project_developer_profile", { _project_id: projectId })
          : Promise.resolve({ data: null }),
      ]);
      if (cancelled) return;
      setSummary((summaryRes.data as unknown as SponsorSummary | null) ?? null);
      setProfile((profileRes.data as unknown as DeveloperProfile | null) ?? null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, granted]);

  return { summary, profile, loading };
};

/** The signed-in developer's own company and track record. */
export const useMyCompany = (userId: string | undefined) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [trackRecord, setTrackRecord] = useState<TrackRecordEntry[]>([]);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: dp } = await supabase
      .from("developer_profiles")
      .select("id, organization_id")
      .eq("user_id", userId)
      .maybeSingle();
    setIsDeveloper(!!dp);
    if (!dp?.organization_id) {
      setOrganization(null);
      setTrackRecord([]);
      setLoading(false);
      return;
    }
    const [orgRes, trRes] = await Promise.all([
      supabase.from("organization").select("*").eq("id", dp.organization_id).maybeSingle(),
      supabase
        .from("organization_track_record")
        .select("*")
        .eq("organization_id", dp.organization_id)
        .order("sort_order")
        .order("cod_year", { ascending: false }),
    ]);
    setOrganization(orgRes.data ?? null);
    setTrackRecord(trRes.data ?? []);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { organization, trackRecord, isDeveloper, loading, reload: load };
};
