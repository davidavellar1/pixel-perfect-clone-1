import { z } from "zod";
import type { AccessCriteriaRow } from "@/lib/access";

export const interestSchema = (criteria: AccessCriteriaRow | null) => z.object({
  entityName: z.string().trim().min(2, "Enter the investing entity."), entityType: z.enum(["", "infra_fund", "pension", "insurer", "family_office", "regional_fund", "municipal_utility", "esco", "corporate", "bank_or_debt_fund", "other"]).refine(v => Boolean(v), "Choose an entity type."),
  jurisdiction: z.string(), regulatedStatus: z.string(), website: z.string(), signatoryName: z.string().trim().min(2, "Enter the signatory name."), signatoryRole: z.string(),
  ticketBand: z.enum(["", "under_1m", "1m_3m", "3m_5m", "5m_10m", "10m_plus"]).refine(v => Boolean(v), "Choose a ticket band."),
  instrumentSought: z.enum(["", "equity", "debt", "either"]).refine(v => Boolean(v), "Choose an instrument."),
  constructionRisk: z.enum(["", "yes", "no", "only_fixed_price_date_certain"]).refine(v => !criteria?.require_construction_risk_appetite || Boolean(v), "Choose construction-risk appetite for this listing."),
  capitalSource: z.enum(["", "fund_with_dry_powder", "balance_sheet", "club_to_be_assembled", "advising_a_client"]).refine(v => Boolean(v), "Choose a capital source."),
  decisionProcess: z.enum(["", "discretionary", "ic_approval", "lp_consent"]).refine(v => Boolean(v), "Choose a decision process."),
  earliestDecisionDate: z.string(), interestDrivers: z.array(z.string()), diligenceFocus: z.string().max(300), wouldLeadClub: z.boolean(),
  conflictsDeclared: z.enum(["", "none", "declared"]).refine(v => Boolean(v), "Declare whether conflicts exist."), conflictsDetail: z.string(), advisersReceivingInfo: z.string(),
  signedName: z.string().trim().min(3, "Type your full legal name to sign."),
  authority: z.boolean().refine(Boolean, "Affirm your authority to bind the entity."), feeAcknowledged: z.boolean().refine(Boolean, "Acknowledge the fee sentence."),
  electronicConsent: z.boolean().refine(Boolean, "Agree to electronic signature."),
}).superRefine((value, context) => {
  if (value.conflictsDeclared !== "declared") return;
  if (value.conflictsDetail.trim().length < 3) context.addIssue({ code: "custom", path: ["conflictsDetail"], message: "Describe the conflict." });
  if (value.advisersReceivingInfo.trim().length < 3) context.addIssue({ code: "custom", path: ["advisersReceivingInfo"], message: "Name the advisers receiving information." });
});