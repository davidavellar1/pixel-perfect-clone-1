import { useEffect, useMemo, useState } from "react";
import { Check, FileSignature, Info, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FEE_SENTENCE, FEE_BASE_NOTE, NDA_DOCUMENT_VERSION } from "@/lib/fee";
import {
  CAPITAL_SOURCES, CONSTRUCTION_RISK, DECISION_PROCESSES, ENTITY_TYPES, INSTRUMENTS_SOUGHT,
  INTEREST_DRIVERS, NDA_TERMS, TICKET_BANDS, eurCompact,
  type AccessCriteriaRow, type CapitalSource, type ConstructionRiskAppetite, type DecisionProcess,
  type EntityType, type InstrumentSought, type TicketBand,
} from "@/lib/access";

export interface InterestFormDraft {
  entityName: string;
  entityType: EntityType | "";
  jurisdiction: string;
  regulatedStatus: string;
  website: string;
  signatoryName: string;
  signatoryRole: string;
  ticketBand: TicketBand | "";
  instrumentSought: InstrumentSought | "";
  constructionRisk: ConstructionRiskAppetite | "";
  capitalSource: CapitalSource | "";
  decisionProcess: DecisionProcess | "";
  earliestDecisionDate: string;
  interestDrivers: string[];
  diligenceFocus: string;
  wouldLeadClub: boolean;
  conflictsDeclared: "none" | "declared" | "";
  conflictsDetail: string;
  advisersReceivingInfo: string;
  signedName: string;
  authority: boolean;
  feeAcknowledged: boolean;
}

const emptyDraft: InterestFormDraft = {
  entityName: "", entityType: "", jurisdiction: "", regulatedStatus: "", website: "",
  signatoryName: "", signatoryRole: "", ticketBand: "", instrumentSought: "", constructionRisk: "",
  capitalSource: "", decisionProcess: "", earliestDecisionDate: "", interestDrivers: [],
  diligenceFocus: "", wouldLeadClub: false, conflictsDeclared: "", conflictsDetail: "",
  advisersReceivingInfo: "", signedName: "", authority: false, feeAcknowledged: false,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
  criteria: AccessCriteriaRow | null;
  prefill?: Partial<InterestFormDraft>;
  submitting?: boolean;
  submitted?: boolean;
  onSubmit: (draft: InterestFormDraft) => void;
  onClose?: () => void;
}

const SCREENS = ["Who you are", "Capacity and intent", "Confidentiality and fee"];

const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => (
  <div className="space-y-1.5">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    {children}
    {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  </div>
);

const ExpressInterestDialog = ({
  open, onOpenChange, projectId, projectTitle, criteria, prefill, submitting, submitted, onSubmit, onClose,
}: Props) => {
  const storageKey = `dhc-interest-draft-${projectId}`;
  const [screen, setScreen] = useState(0);
  const [draft, setDraft] = useState<InterestFormDraft>(emptyDraft);

  // Progress is saved so the investor can leave and return.
  useEffect(() => {
    if (!open) return;
    let restored = emptyDraft;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) restored = { ...emptyDraft, ...JSON.parse(raw) };
    } catch {
      restored = emptyDraft;
    }
    const existing = restored as unknown as Record<string, unknown>;
    const fill = Object.entries(prefill || {}).filter(([key, value]) => value && !existing[key]);
    setDraft({ ...restored, ...Object.fromEntries(fill) } as InterestFormDraft);
  }, [open, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || submitted) return;
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* storage unavailable */ }
  }, [draft, open, storageKey, submitted]);

  const set = <K extends keyof InterestFormDraft>(key: K, value: InterestFormDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const minTicket = criteria?.min_ticket ? Number(criteria.min_ticket) : null;
  const belowMinimum = useMemo(() => {
    if (!minTicket || !draft.ticketBand) return false;
    const floor = TICKET_BANDS.find((band) => band.value === draft.ticketBand)?.floor ?? 0;
    return floor < minTicket;
  }, [minTicket, draft.ticketBand]);

  const screenOneReady = draft.entityName.trim().length > 1 && Boolean(draft.entityType) && draft.signatoryName.trim().length > 1;
  const screenTwoReady = Boolean(draft.ticketBand) && Boolean(draft.instrumentSought);
  const canSubmit =
    draft.signedName.trim().length > 2 &&
    draft.authority &&
    draft.feeAcknowledged &&
    Boolean(draft.conflictsDeclared) &&
    (draft.conflictsDeclared === "none" || draft.conflictsDetail.trim().length > 2) &&
    !submitting;

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next) {
      setScreen(0);
      onClose?.();
    }
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={close}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-serif text-xl">
              <Check className="h-5 w-5 text-success" /> Request sent
            </DialogTitle>
            <DialogDescription>
              Your expression of interest and signed confidentiality agreement are with the developer of {projectTitle}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-5 text-sm text-muted-foreground">
            <p>The listing stays anonymized until the developer accepts. Requests are typically answered in 3 working days.</p>
            <p>The agreement you signed takes effect only on acceptance. No introduction is logged and no fee clock starts before then.</p>
            <p>The request appears in your pipeline at stage "Interest submitted". You can withdraw it at any time before a decision.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => close(false)}>Back to the listing</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">Express interest in {projectTitle}</DialogTitle>
          <DialogDescription>
            Nothing is revealed until the developer accepts your request. Your progress is saved if you leave and return.
          </DialogDescription>
        </DialogHeader>

        <ol className="flex items-center gap-2">
          {SCREENS.map((title, index) => (
            <li key={title} className="flex flex-1 items-center gap-2">
              <span
                className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border text-[11px] font-semibold ${
                  index < screen
                    ? "border-primary bg-primary text-primary-foreground"
                    : index === screen
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {index < screen ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className={`text-xs font-medium ${index <= screen ? "text-foreground" : "text-muted-foreground"}`}>{title}</span>
              {index < SCREENS.length - 1 && <span className="h-px flex-1 bg-border" />}
            </li>
          ))}
        </ol>

        {screen === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Entity name">
              <Input value={draft.entityName} onChange={(event) => set("entityName", event.target.value)} placeholder="Investing entity" />
            </Field>
            <Field label="Entity type">
              <Select value={draft.entityType} onValueChange={(value) => set("entityType", value as EntityType)}>
                <SelectTrigger><SelectValue placeholder="Select a type" /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Jurisdiction">
              <Input value={draft.jurisdiction} onChange={(event) => set("jurisdiction", event.target.value)} placeholder="Country of incorporation" />
            </Field>
            <Field label="Regulated status">
              <Input value={draft.regulatedStatus} onChange={(event) => set("regulatedStatus", event.target.value)} placeholder="Regulator and reference, or none" />
            </Field>
            <Field label="Website">
              <Input value={draft.website} onChange={(event) => set("website", event.target.value)} placeholder="https://" />
            </Field>
            <Field label="Signatory name">
              <Input value={draft.signatoryName} onChange={(event) => set("signatoryName", event.target.value)} placeholder="Full legal name" />
            </Field>
            <Field label="Signatory role">
              <Input value={draft.signatoryRole} onChange={(event) => set("signatoryRole", event.target.value)} placeholder="Title or position" />
            </Field>
          </div>
        )}

        {screen === 1 && (
          <div className="space-y-5">
            <Field label="Ticket band" hint="Required. This drives the fit line the developer sees.">
              <RadioGroup value={draft.ticketBand} onValueChange={(value) => set("ticketBand", value as TicketBand)} className="grid gap-2 sm:grid-cols-2">
                {TICKET_BANDS.map((band) => (
                  <label key={band.value} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                    <RadioGroupItem value={band.value} id={`ticket-${band.value}`} />
                    {band.label}
                  </label>
                ))}
              </RadioGroup>
            </Field>
            {belowMinimum && minTicket && (
              <p className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
                This listing seeks a minimum of {eurCompact(minTicket)}. You can still send the request.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Instrument sought">
                <Select value={draft.instrumentSought} onValueChange={(value) => set("instrumentSought", value as InstrumentSought)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS_SOUGHT.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Construction-risk appetite">
                <Select value={draft.constructionRisk} onValueChange={(value) => set("constructionRisk", value as ConstructionRiskAppetite)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CONSTRUCTION_RISK.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Capital source">
                <Select value={draft.capitalSource} onValueChange={(value) => set("capitalSource", value as CapitalSource)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CAPITAL_SOURCES.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Decision process">
                <Select value={draft.decisionProcess} onValueChange={(value) => set("decisionProcess", value as DecisionProcess)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {DECISION_PROCESSES.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Earliest decision date">
                <Input type="date" value={draft.earliestDecisionDate} onChange={(event) => set("earliestDecisionDate", event.target.value)} />
              </Field>
            </div>
            <Field label="What draws you to this listing">
              <div className="grid gap-2 sm:grid-cols-2">
                {INTEREST_DRIVERS.map((driver) => (
                  <label key={driver} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                    <Checkbox
                      checked={draft.interestDrivers.includes(driver)}
                      onCheckedChange={(checked) =>
                        set("interestDrivers", checked === true
                          ? [...draft.interestDrivers, driver]
                          : draft.interestDrivers.filter((entry) => entry !== driver))
                      }
                    />
                    {driver}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Diligence focus" hint={`${draft.diligenceFocus.length} of 300 characters`}>
              <Textarea
                value={draft.diligenceFocus}
                maxLength={300}
                onChange={(event) => set("diligenceFocus", event.target.value)}
                placeholder="What you would want to test first"
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox checked={draft.wouldLeadClub} onCheckedChange={(checked) => set("wouldLeadClub", checked === true)} />
              I would consider leading a club on this project
            </label>
          </div>
        )}

        {screen === 2 && (
          <div className="space-y-5">
            <Field label="Conflicts">
              <RadioGroup value={draft.conflictsDeclared} onValueChange={(value) => set("conflictsDeclared", value as "none" | "declared")} className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <RadioGroupItem value="none" id="conflicts-none" /> None
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <RadioGroupItem value="declared" id="conflicts-declared" /> Declared
                </label>
              </RadioGroup>
            </Field>
            {draft.conflictsDeclared === "declared" && (
              <Field label="Describe the conflict">
                <Textarea value={draft.conflictsDetail} onChange={(event) => set("conflictsDetail", event.target.value)} placeholder="Competing holdings, roles or mandates" />
              </Field>
            )}
            <Field label="Advisers who would receive information">
              <Textarea value={draft.advisersReceivingInfo} onChange={(event) => set("advisersReceivingInfo", event.target.value)} placeholder="Named advisers, bound on the same terms" />
            </Field>

            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-5">
              <p className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <FileSignature className="h-4 w-4 text-accent" /> Confidentiality agreement
              </p>
              {NDA_TERMS.map((term) => (
                <div key={term.title}>
                  <p className="text-sm font-semibold text-foreground">{term.title}</p>
                  <p className="text-sm text-muted-foreground">{term.body}</p>
                </div>
              ))}
              <div>
                <p className="text-sm font-semibold text-foreground">Fee clause</p>
                <p className="text-sm text-muted-foreground">{FEE_SENTENCE}</p>
                <p className="mt-1 text-xs text-muted-foreground">{FEE_BASE_NOTE}</p>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">Document version {NDA_DOCUMENT_VERSION}</p>
            </div>

            <Field label="Type your full name to sign">
              <Input value={draft.signedName} onChange={(event) => set("signedName", event.target.value)} placeholder="Full legal name" />
            </Field>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <Checkbox checked={draft.authority} onCheckedChange={(checked) => set("authority", checked === true)} />
              I have authority to bind the entity named in this request and I accept the terms above.
            </label>
            <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-muted-foreground">
              <Checkbox checked={draft.feeAcknowledged} onCheckedChange={(checked) => set("feeAcknowledged", checked === true)} />
              I acknowledge the success fee. The introduction is logged only if the developer accepts this request.
            </label>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 flex-none" />
              Your name, role, IP address, timestamp and document version are recorded with the signature. The agreement remains inoperative while the request is pending.
            </p>
            {draft.conflictsDeclared === "declared" && (
              <p className="flex items-start gap-2 text-xs text-warning">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
                Declared conflicts are shown prominently to the developer.
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          <Button variant="outline" onClick={() => (screen === 0 ? close(false) : setScreen(screen - 1))}>
            {screen === 0 ? "Save and close" : "Back"}
          </Button>
          {screen < 2 ? (
            <Button disabled={screen === 0 ? !screenOneReady : !screenTwoReady} onClick={() => setScreen(screen + 1)}>
              Continue
            </Button>
          ) : (
            <Button disabled={!canSubmit} onClick={() => onSubmit(draft)}>
              {submitting ? "Sending request..." : "Send request and signed agreement"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExpressInterestDialog;
