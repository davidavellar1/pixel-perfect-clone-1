import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardSelect, WizardOption } from "./wizardFields";
import { AskedQuestions } from "./QuestionEvidence";
import { fundingQuestionKeys } from "@/lib/submissionFields";
export const FUNDING_STATUSES = ["intending", "applied", "decision_pending", "awarded", "declined"] as const;
export type FundingLine = { programme_id: string; programme: string; administering_body: string; instrument_type: string; amount: string; funding_status: string; expected_decision_date: string; clawback_treatment: string };
const blank = (): FundingLine => ({ programme_id: "", programme: "", administering_body: "", instrument_type: "", amount: "", funding_status: "intending", expected_decision_date: "", clawback_treatment: "" });
const instruments = ["blended", "equity", "grant", "guarantee", "loan", "risk_cover", "tax_incentive", "technical_assistance"];
export function PublicFundingEditor({ rows, onChange }: { rows: FundingLine[]; onChange: (rows: FundingLine[]) => void }) {
  const [programmes, setProgrammes] = useState<{ id: string; name: string; administering_body: string; instrument_types: string[] }[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => { void supabase.from("funding_programme").select("id,name,administering_body,instrument_types").order("name").then(({ data, error }) => { setProgrammes(data ?? []); setError(Boolean(error)); }); }, []);
  const update = (index: number, values: Partial<FundingLine>) => onChange(rows.map((row, i) => i === index ? { ...row, ...values } : row));
  return <div className="space-y-4">
    {error && <p role="alert" className="text-sm text-destructive">Funding catalogue unavailable. Custom programmes remain available.</p>}
    {rows.map((row, i) => {
      const matched = programmes.find(p => p.id === row.programme_id);
      return <fieldset key={i} className="space-y-3 border-b border-border pb-4"><legend className="mb-2 text-sm font-semibold">Public funding {i + 1}</legend>
        <AskedQuestions keys={fundingQuestionKeys(row.funding_status, row.instrument_type, !matched)} />
        <Label>Programme<WizardSelect value={row.programme_id || "custom"} onChange={e => { const p = programmes.find(p => p.id === e.target.value); update(i, { programme_id: p?.id ?? "", programme: p?.name ?? "", administering_body: p?.administering_body ?? "", instrument_type: p?.instrument_types.length === 1 ? p.instrument_types[0] ?? "" : "" }); }}><WizardOption value="custom">Programme outside the catalogue</WizardOption>{programmes.map(p => <WizardOption key={p.id} value={p.id}>{p.name}</WizardOption>)}</WizardSelect></Label>
        {!matched && <><Input aria-label={`Custom programme ${i + 1}`} placeholder="Programme" value={row.programme} onChange={e => update(i, { programme: e.target.value })} /><Input aria-label={`Administering body ${i + 1}`} placeholder="Administering body" value={row.administering_body} onChange={e => update(i, { administering_body: e.target.value })} /></>}
        {matched && <p className="text-xs text-muted-foreground">{matched.administering_body}</p>}
        {matched?.instrument_types.length === 1 ? <p className="text-sm">{row.instrument_type}</p> : <Label>Instrument<WizardSelect value={row.instrument_type} onChange={e => update(i, { instrument_type: e.target.value })}>{(matched?.instrument_types ?? instruments).map(value => <WizardOption key={value} value={value}>{value.replaceAll("_", " ")}</WizardOption>)}</WizardSelect></Label>}
        <Input aria-label={`Funding amount EUR ${i + 1}`} type="number" min="0" placeholder="Amount EUR" value={row.amount} onChange={e => update(i, { amount: e.target.value })} />
        <Label>Status<WizardSelect value={row.funding_status} onChange={e => update(i, { funding_status: e.target.value })}>{FUNDING_STATUSES.map(value => <WizardOption key={value} value={value}>{value.replaceAll("_", " ")}</WizardOption>)}</WizardSelect></Label>
        {["applied", "decision_pending"].includes(row.funding_status) && <Label>Expected decision date<Input type="date" value={row.expected_decision_date} onChange={e => update(i, { expected_decision_date: e.target.value })} /></Label>}
        {row.funding_status === "awarded" && row.instrument_type === "grant" && <Label>Grant treatment<WizardSelect value={row.clawback_treatment} onChange={e => update(i, { clawback_treatment: e.target.value })}><WizardOption>Non-repayable</WizardOption><WizardOption>Clawback-conditional</WizardOption><WizardOption>Milestone-conditional</WizardOption></WizardSelect></Label>}
        <Button variant="outline" onClick={() => onChange(rows.filter((_, index) => index !== i))}>Remove</Button>
      </fieldset>;
    })}
    <Button variant="outline" onClick={() => onChange([...rows, blank()])}>Add public funding</Button>
  </div>;
}