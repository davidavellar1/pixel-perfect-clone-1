import { stageName } from "./projectAbsence";
export const FORM_VERSION = "2026-11-question-evidence-1";
type FieldSpec = { keys: readonly string[]; stages?: readonly string[]; required?: boolean };
const late = ["development", "construction", "operational"];
export const SUBMISSION_FIELDS: Record<string, FieldSpec> = {
  "Lifecycle stage": { keys: ["project.lifecycle_stage"], required: true },
  "Project title": { keys: ["project.title"], required: true },
  "Project type": { keys: ["project.project_type"], required: true },
  "Primary technology": { keys: ["project.technology"], required: true },
  Country: { keys: ["project.country_code"], required: true },
  City: { keys: ["project.city"], required: true },
  "Anonymized summary": { keys: ["project.summary"], required: true },
  "Offtake commitment ladder": { keys: ["offtake_ladder.total_buildings", "offtake_ladder.contracted_count", "offtake_ladder.contracted_load_pct", "offtake_ladder.signed_connection_count", "offtake_ladder.signed_connection_load_pct", "offtake_ladder.in_negotiation_count", "offtake_ladder.in_negotiation_load_pct"] },
  "Public co-financing status": { keys: ["project.public_cofinancing_status"] },
  "Site / land status": { keys: ["operating_parameter.site_land_status"] },
  "Supply / return temperature": { keys: ["operating_parameter.supply_temperature", "operating_parameter.return_temperature", "operating_parameter.temperature_basis"] },
  "Installed capacity (exact MW)": { keys: ["project.capacity_mw"], required: true },
  "Annual heat output": { keys: ["operating_parameter.annual_heat_output"] },
  "Network length": { keys: ["project.network_length_km"] },
  "Households served": { keys: ["project.households_served"] },
  "Technology detail": { keys: ["technology_card.title", "technology_card.description"] },
  "Operating parameters": { keys: ["operating_parameter.parameter", "operating_parameter.value", "operating_parameter.benchmark"] },
  "Development timeline": { keys: ["milestone.label", "milestone.target_date", "milestone.status", "milestone.description"] },
  "Total project financing": { keys: ["financial_summary.capex"], stages: late, required: true },
  "Capital stack": { keys: ["capital_stack_item.label", "capital_stack_item.amount", "capital_stack_item.provider"], stages: late },
  "Purchase floor / cap": { keys: ["margin_profile.purchase_floor_cap"], stages: late },
  "Three named risks": { keys: ["risk.category", "risk.severity", "risk.description", "risk.mitigation"], stages: late },
  "Public funding": { keys: ["public_funding.programme_id", "public_funding.amount", "public_funding.funding_status"], stages: late },
  "DSCR 1x connections (base case)": { keys: ["financial_summary.dscr_1x_connections"], stages: late },
  "Zero IRR connections (base case)": { keys: ["financial_summary.irr_zero_connections"], stages: late },
  "Revenue model": { keys: ["revenue_stream.stream", "revenue_stream.pct_of_revenue", "revenue_stream.counterparty"], stages: late },
  Instrument: { keys: ["project_transaction.instrument"], stages: late, required: true },
  "Equity sought": { keys: ["project_transaction.equity_sought"], stages: late, required: true },
  "Stake offered": { keys: ["project_transaction.stake_offered_pct"], stages: late },
  "Minimum ticket": { keys: ["project_transaction.min_ticket", "listing_access_criteria.min_ticket"] },
  "Club deal": { keys: ["project_transaction.club_max_participants"], stages: late },
  "Target equity IRR (base case)": { keys: ["project_transaction.target_equity_irr_pct"], stages: late },
  "Downside equity IRR (downside case)": { keys: ["project_transaction.downside_equity_irr_pct"], stages: late },
  "Instruments accepted": { keys: ["listing_access_criteria.instruments_accepted"] },
  "Construction-risk appetite": { keys: ["listing_access_criteria.require_construction_risk_appetite"] },
  "Who receives request notifications": { keys: ["listing_access_criteria.notify_users"] },
  "Baseline / counterfactual": { keys: ["operating_parameter.baseline"] },
  "GHG avoidance": { keys: ["sustainability_profile.co2_tonnes_per_year", "operating_parameter.co2_basis"] },
  "Renewable / waste-heat share": { keys: ["sustainability_profile.renewable_share_pct"] },
  "EED Article 26 path": { keys: ["operating_parameter.eed_year", "operating_parameter.eed_path"] },
  "Energy source mix": { keys: ["energy_mix_item.source", "energy_mix_item.share_pct"] },
  "GHG intensity": { keys: ["operating_parameter.ghg_intensity"] },
  "Developer structure type": { keys: ["operating_parameter.developer_structure"] },
  "Regulatory regime type": { keys: ["operating_parameter.regulatory_regime"] },
  "Concession counterparty & term": { keys: ["financial_summary.concession_term_years", "operating_parameter.concession_counterparty"] },
};
export function fieldsForStage(stage: string) {
  return Object.entries(SUBMISSION_FIELDS).filter(([, field]) => !field.stages || field.stages.includes(stageName(stage)));
}
export function isFieldAsked(label: string, stage: string) {
  const spec = SUBMISSION_FIELDS[label];
  return !spec?.stages || spec.stages.includes(stageName(stage));
}
export function recordedQuestionKeys(labels: readonly string[], stage: string) {
  return [...new Set(fieldsForStage(stage).filter(([label]) => labels.includes(label)).flatMap(([, spec]) => spec.keys))];
}