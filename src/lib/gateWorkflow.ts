import type { Tables } from "@/integrations/supabase/types";
import { computeFit, type AccessCriteriaRow } from "@/lib/access";
import type { InterestFormDraft } from "@/components/project/ExpressInterestDialog";

export const AUTHORITY_TEXT = "I have authority to bind the entity named in this request and I accept the terms above.";
export type Agreement = Tables<"nda_document_version">;
export function mandatePrefill(profile: Tables<"investor_profiles"> | null): Partial<InterestFormDraft> {
  if (!profile) return {};
  const entityTypes = { fund: "infra_fund", family_office: "family_office", corporate: "corporate", individual: "other", other: "other" } as const;
  return {
    entityName: profile.company_name ?? "", signatoryName: profile.full_name,
    entityType: profile.investor_type ? entityTypes[profile.investor_type] : "",
    ticketBand: profile.ticket_band ?? "", instrumentSought: profile.instrument_sought ?? "",
    constructionRisk: profile.construction_risk_appetite ?? "", capitalSource: profile.capital_source ?? "",
    decisionProcess: profile.decision_process ?? "",
  };
}
export function requestFit(draft: Partial<InterestFormDraft>, criteria: AccessCriteriaRow | null) {
  if (!draft.ticketBand || !draft.instrumentSought) return [];
  return computeFit({ ticket_band: draft.ticketBand, instrument_sought: draft.instrumentSought,
    construction_risk_appetite: draft.constructionRisk || null, conflicts_declared: draft.conflictsDeclared === "declared" }, criteria);
}
export function qualificationReady(draft: InterestFormDraft, criteria: AccessCriteriaRow | null) {
  return Boolean(draft.ticketBand && draft.instrumentSought && draft.capitalSource && draft.decisionProcess &&
    (!criteria?.require_construction_risk_appetite || draft.constructionRisk));
}
export function signatureReady(draft: InterestFormDraft, criteria: AccessCriteriaRow | null, agreement: Agreement | null) {
  return Boolean(agreement && qualificationReady(draft, criteria) && draft.entityName.trim().length > 1 && draft.entityType &&
    draft.signatoryName.trim().length > 1 && draft.signedName.trim().length > 2 && draft.authority && draft.feeAcknowledged &&
    draft.electronicConsent && draft.conflictsDeclared && (draft.conflictsDeclared === "none" ||
    (draft.conflictsDetail.trim().length > 2 && draft.advisersReceivingInfo.trim().length > 2)));
}
export function signatureEvidence(draft: InterestFormDraft, agreement: Agreement, now: string) {
  return { authority_affirmed: draft.authority, authority_text: AUTHORITY_TEXT, fee_acknowledged: draft.feeAcknowledged,
    fee_text: agreement.fee_text, fee_version: agreement.version, nda_version: agreement.version,
    nda_document_sha256: agreement.sha256, electronic_signature_consent: draft.electronicConsent, client_signed_at: now };
}