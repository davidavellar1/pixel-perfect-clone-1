import { requestFit } from "@/lib/gateWorkflow";
import type { InterestFormDraft } from "@/components/project/ExpressInterestDialog";
import type { AccessCriteriaRow } from "@/lib/access";

export default function MandateFit({ draft, criteria }: { draft: Partial<InterestFormDraft>; criteria: AccessCriteriaRow | null }) {
  const fit = requestFit(draft, criteria);
  if (!fit.length) return null;
  return <section className="space-y-2 border-l-2 border-accent py-2 pl-4 text-sm">
    <h3 className="font-semibold text-foreground">Fit against listing criteria</h3>
    {fit.map(item => <p key={item.label} className="text-muted-foreground">{item.ok ? "Matches" : "Does not match"}: {item.label}. {item.detail}</p>)}
    <p className="text-foreground">You can still send the request. The developer decides.</p>
  </section>;
}