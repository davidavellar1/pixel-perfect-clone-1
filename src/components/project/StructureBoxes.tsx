import { BadgeEuro, Building2, FileCheck2, Landmark, Scale, Wallet, type LucideIcon } from "lucide-react";
import type { SubmissionDocument } from "@/lib/submission/stageSchema";
import { absenceCopy, resolveProjectField } from "@/lib/projectAbsence";
import { cn } from "@/lib/utils";

/** Six structure facts from the developer's form answers. */
export const STRUCTURE_BOXES: { key: string; altKey?: string; label: string; icon: LucideIcon; answers: Record<string, string> }[] = [
  { key: "regulated", label: "Price regulated or capped", icon: Scale, answers: { yes: "Yes", no: "No" } },
  { key: "fundingPlan", label: "Public funding in the plan", icon: Landmark, answers: { none: "Not pursuing public funding", pursuing: "Pursuing public funding" } },
  { key: "sponsorAccounts", label: "Audited accounts, sponsor", icon: FileCheck2, answers: {} },
  { key: "vehicleAccounts", label: "Audited accounts, project vehicle", icon: Building2, answers: {} },
  { key: "sponsorDebt", label: "Existing debt, sponsor", icon: Wallet, answers: { yes: "Yes", no: "No" } },
  { key: "vehicleDebtDisclosure", altKey: "vehicleDebt", label: "Existing debt, project vehicle", icon: BadgeEuro, answers: { yes: "Yes", no: "No" } },
];

/** Negative answers are answers: they render muted, never hidden. */
export const NEGATIVE_ANSWERS = new Set(["no", "none", "Not available", "Vehicle not incorporated"]);

export function structureBoxValues(document: SubmissionDocument | null | undefined, stage: string) {
  return STRUCTURE_BOXES.map((box) => {
    const key = document?.answers[box.key]?.trim() ? box.key : box.altKey && document?.answers[box.altKey]?.trim() ? box.altKey : box.key;
    const raw = document?.answers[key]?.trim() || null;
    const resolved = resolveProjectField(`stage.${key}`, stage, raw, document?.askedFields);
    if (resolved.kind === "absence") return { ...box, text: absenceCopy(resolved, stage), muted: true, answered: false };
    return { ...box, text: box.answers[resolved.value] ?? resolved.value, muted: NEGATIVE_ANSWERS.has(resolved.value), answered: true };
  });
}

export default function StructureBoxes({ document, stage }: { document: SubmissionDocument | null | undefined; stage: string }) {
  const boxes = structureBoxValues(document, stage);
  return <section>
    <h2 className="mb-3 font-display text-2xl font-semibold">Structure at a glance</h2>
    <p className="mb-5 text-xs text-muted-foreground">Developer-stated answers. A negative answer is shown as an answer.</p>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{boxes.map((box) => <div key={box.key} className={cn("rounded-md border border-border p-4", box.muted ? "bg-muted/40" : "bg-card")}>
      <box.icon className={cn("h-5 w-5", box.muted ? "text-muted-foreground" : "text-primary")} aria-hidden="true" />
      <p className="mt-2 text-xs text-muted-foreground">{box.label}</p>
      <p className={cn("mt-1 text-sm font-semibold", box.muted ? "text-muted-foreground" : "text-foreground")}>{box.text}</p>
    </div>)}</div>
  </section>;
}
