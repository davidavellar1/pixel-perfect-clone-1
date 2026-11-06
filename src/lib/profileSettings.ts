import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type Enums = Database["public"]["Enums"];
export const REGIONS = ["Northern Europe", "Western Europe", "Central Europe", "Southern Europe", "Eastern Europe"];
export const COUNTRIES = ["Denmark", "Sweden", "Finland", "Germany", "France", "Poland", "Netherlands", "Austria"];
export const TECHNOLOGIES: Record<Enums["technology"], string> = {
  geothermal: "Geothermal", biomass_chp: "Biomass CHP", waste_heat_recovery: "Waste heat recovery", solar_thermal: "Solar thermal", large_heat_pump: "Large heat pump", river_water_cooling: "River water cooling", seawater_cooling: "Seawater cooling", thermal_storage: "Thermal storage", hybrid: "Hybrid",
};
export const STAGES: Record<Enums["project_stage"], string> = { concept: "Concept", feasibility: "Feasibility", development: "Development", construction: "Construction", operational: "Operational" };
export const INVESTOR_TYPES: Record<Enums["investor_type"], string> = { fund: "Fund", family_office: "Family office", corporate: "Corporate", individual: "Individual", other: "Other" };
export const TICKETS: Record<Enums["investment_range"], string> = { under_1m: "Under €1m", "1m_5m": "€1–5m", "5m_25m": "€5–25m", "25m_100m": "€25–100m", over_100m: "Over €100m" };
export const DEVELOPER_TYPES: Record<Enums["developer_type"], string> = { utility: "Utility", municipality: "Municipality", private_developer: "Private developer", energy_company: "Energy company", esco: "ESCO", other: "Other" };
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export function avatarError(file: { type: string; size: number }) {
  if (!AVATAR_TYPES.includes(file.type)) return "Choose a JPEG, PNG, WebP or GIF image.";
  if (file.size > MAX_AVATAR_BYTES) return "Your photo must be 2 MB or smaller.";
  return null;
}
export const profileSchema = z.object({
  first_name: z.string().trim().max(100, "Use at most 100 characters."),
  last_name: z.string().trim().max(100, "Use at most 100 characters."),
  job_title: z.string().trim().max(160, "Use at most 160 characters."),
  phone: z.string().trim().refine(v => !v || /^\+[0-9][0-9 ()-]{5,24}$/.test(v), "Use an international number starting with +."),
  linkedin_url: z.string().trim().refine(v => !v || /^https:\/\/([a-z]{2,3}\.)?(www\.)?linkedin\.com\/(in|pub)\/[^\s]+$/.test(v), "Enter a valid LinkedIn profile URL starting with https://."),
  bio: z.string().max(600, "Your bio must be 600 characters or fewer."),
});
export const passwordSchema = z.object({ password: z.string().min(8, "Use at least 8 characters."), confirm: z.string() }).refine(v => v.password === v.confirm, { message: "Passwords don't match.", path: ["confirm"] });
export const investorSchema = z.object({ company_name: z.string().trim().max(200), investor_type: z.enum(["fund", "family_office", "corporate", "individual", "other"]).nullable(), investment_range: z.enum(["under_1m", "1m_5m", "5m_25m", "25m_100m", "over_100m"]).nullable(), regions_of_interest: z.array(z.string().max(100)).max(30), technologies_of_interest: z.array(z.enum(["geothermal", "biomass_chp", "waste_heat_recovery", "solar_thermal", "large_heat_pump", "river_water_cooling", "seawater_cooling", "thermal_storage", "hybrid"])).max(9) });
export const developerSchema = z.object({ company_name: z.string().trim().max(200), position: z.string().trim().max(160), developer_type: z.enum(["utility", "municipality", "private_developer", "energy_company", "esco", "other"]).nullable(), project_stages: z.array(z.enum(["concept", "feasibility", "development", "construction", "operational"])).max(5), countries_of_operation: z.array(z.string().max(100)).max(250) });
export function legalDocument(document: string) {
  const key = document.toLowerCase().replace(/[_ -]/g, "");
  if (["terms", "termsofservice", "termsandconditions"].includes(key)) return { slug: "terms", label: "Terms & conditions" };
  if (["privacy", "privacypolicy"].includes(key)) return { slug: "privacy", label: "Privacy policy" };
  if (["cookies", "cookiepolicy"].includes(key)) return { slug: "cookies", label: "Cookie policy" };
  if (["disclaimer", "investmentdisclaimer"].includes(key)) return { slug: "disclaimer", label: "Disclaimer" };
  return { slug: "unavailable", label: "Legal document" };
}