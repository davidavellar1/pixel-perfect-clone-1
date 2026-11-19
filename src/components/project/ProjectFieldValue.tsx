import { absenceCopy, resolveProjectField, type AbsenceReason } from "@/lib/projectAbsence";
export function ProjectFieldValue({ fieldKey, stage, value, askedFields, reason, expectedDate }: { fieldKey: string; stage: string; value?: string | number | null; askedFields?: readonly string[] | null; reason?: AbsenceReason; expectedDate?: string }) {
  const resolved = resolveProjectField(fieldKey, stage, value, askedFields, reason, expectedDate);
  return <span>{resolved.kind === "value" ? resolved.value : absenceCopy(resolved, stage)}</span>;
}