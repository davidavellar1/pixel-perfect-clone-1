export type AbsenceReason = "not_asked" | "does_not_exist_yet" | "not_applicable" | "not_provided";
export type FieldResolution<T> = { kind: "value"; value: T } | { kind: "absence"; reason: AbsenceReason; expectedDate?: string };
export const BASIS_FLAGS = ["measured", "modelled", "estimated"] as const;
export function stageName(stage: string) {
  if (["concept", "pre_feasibility"].includes(stage)) return "concept";
  if (stage === "feasibility") return "feasibility";
  if (["development", "ready_to_build", "due_diligence"].includes(stage)) return "development";
  if (["construction", "commissioning"].includes(stage)) return "construction";
  return stage === "operational" ? "operational" : stage.replaceAll("_", " ");
}
export function resolveProjectField<T>(key: string, stage: string, value: T | null | undefined, askedFields?: readonly string[] | null, reason?: AbsenceReason, expectedDate?: string): FieldResolution<T> {
  if (value != null && value !== "" && !(Array.isArray(value) && value.length === 0)) return { kind: "value", value };
  if (!askedFields?.includes(key)) return { kind: "absence", reason: "not_asked" };
  return { kind: "absence", reason: reason ?? "not_provided", expectedDate };
}
export function absenceCopy(result: Extract<FieldResolution<unknown>, { kind: "absence" }>, stage: string) {
  if (result.reason === "not_asked") return `Not asked at ${stageName(stage)} stage`;
  if (result.reason === "not_applicable") return "Not applicable to this project";
  if (result.reason === "not_provided") return "Not provided";
  if (!result.expectedDate) return "Does not exist yet";
  const date = new Date(result.expectedDate);
  return Number.isNaN(date.valueOf()) ? "Does not exist yet" : `Does not exist yet. Expected Q${Math.floor(date.getUTCMonth() / 3) + 1} ${date.getUTCFullYear()}`;
}