import { useEffect, useState, useRef, Children, cloneElement, isValidElement, type ReactElement } from "react";
import { Check, FileSignature, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, useFormContext } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { interestSchema } from "@/lib/interestValidation";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AUTHORITY_TEXT, qualificationReady, signatureReady, type Agreement } from "@/lib/gateWorkflow";
import MandateFit from "@/components/project/MandateFit";
import {
  CAPITAL_SOURCES, CONSTRUCTION_RISK, DECISION_PROCESSES, ENTITY_TYPES, INSTRUMENTS_SOUGHT,
  INTEREST_DRIVERS, TICKET_BANDS,
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
  electronicConsent: boolean;
}

const emptyDraft: InterestFormDraft = {
  entityName: "", entityType: "", jurisdiction: "", regulatedStatus: "", website: "",
  signatoryName: "", signatoryRole: "", ticketBand: "", instrumentSought: "", constructionRisk: "",
  capitalSource: "", decisionProcess: "", earliestDecisionDate: "", interestDrivers: [],
  diligenceFocus: "", wouldLeadClub: false, conflictsDeclared: "", conflictsDetail: "",
  advisersReceivingInfo: "", signedName: "", authority: false, feeAcknowledged: false, electronicConsent: false,
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectTitle: string;
  criteria: AccessCriteriaRow | null;
  agreement: Agreement | null;
  agreementError?: string | null;
  prefill?: Partial<InterestFormDraft>;
  submitting?: boolean;
  submitted?: boolean;
  onSubmit: (draft: InterestFormDraft) => void;
  onClose?: () => void;
}

const SCREENS = ["Who you are", "Capacity and intent", "Confidentiality and fee"];

const FIELD_NAMES: Record<string, keyof InterestFormDraft> = { "Entity name": "entityName", "Entity type": "entityType", "Jurisdiction": "jurisdiction", "Regulated status": "regulatedStatus", "Website": "website", "Signatory name": "signatoryName", "Signatory role": "signatoryRole", "Ticket band": "ticketBand", "Instrument sought": "instrumentSought", "Construction-risk appetite": "constructionRisk", "Capital source": "capitalSource", "Decision process": "decisionProcess", "Earliest decision date": "earliestDecisionDate", "What draws you to this listing": "interestDrivers", "Diligence focus": "diligenceFocus", "Conflicts": "conflictsDeclared", "Describe the conflict": "conflictsDetail", "Advisers who would receive information": "advisersReceivingInfo", "Type your full name to sign": "signedName" };
const Field = ({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) => {
  const form = useFormContext<InterestFormDraft>();
  const name = FIELD_NAMES[label];
  if (!name) return null;
  return <FormField control={form.control} name={name} render={({ field }) => {
    const controls = Children.map(children, child => {
      if (!isValidElement(child)) return child;
      const element = child as ReactElement<Record<string, unknown>>;
      if (element.type === Select) return cloneElement(element, {}, Children.map(element.props.children as React.ReactNode, nested => isValidElement(nested) && nested.type === SelectTrigger ? <FormControl>{cloneElement(nested as ReactElement<Record<string, unknown>>, { ref: field.ref })}</FormControl> : nested));
      if ([Input, Textarea, RadioGroup].includes(element.type as typeof Input)) return <FormControl>{cloneElement(element, { ref: field.ref, onBlur: field.onBlur })}</FormControl>;
      return child;
    });
    return <FormItem><FormLabel id={`interest-${name}-label`}>{label}</FormLabel>{controls}{hint && <p className="text-xs text-muted-foreground">{hint}</p>}<FormMessage /></FormItem>;
  }} />;
};

function Attestation({ name, text }: { name: "authority" | "feeAcknowledged" | "electronicConsent"; text: string }) {
  const form = useFormContext<InterestFormDraft>();
  return <FormField control={form.control} name={name} render={({ field }) => <FormItem><div className="flex items-start gap-3"><FormControl><Checkbox checked={field.value} onCheckedChange={checked => field.onChange(checked === true)} ref={field.ref} onBlur={field.onBlur} aria-label={text} /></FormControl><FormLabel className="cursor-pointer text-sm font-normal leading-relaxed text-muted-foreground">{text}</FormLabel></div><FormMessage /></FormItem>} />;
}

const ExpressInterestDialog = ({
  open, onOpenChange, projectId, projectTitle, criteria, agreement, agreementError, prefill, submitting, submitted, onSubmit, onClose,
}: Props) => {
  const storageKey = `dhc-interest-draft-${projectId}`;
  const [screen, setScreen] = useState(0);
  const form = useForm<InterestFormDraft>({ resolver: zodResolver(interestSchema(criteria)), defaultValues: emptyDraft, mode: "onTouched" });
  const draft = form.watch();
  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) requestAnimationFrame(() => screenRef.current?.querySelector<HTMLElement>("input,textarea,[role=combobox],[role=radio]")?.focus()); }, [screen, open]);

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
    form.reset({ ...restored, ...Object.fromEntries(fill), authority: false, feeAcknowledged: false, electronicConsent: false } as InterestFormDraft);
  }, [open, storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || submitted) return;
    try { localStorage.setItem(storageKey, JSON.stringify(draft)); } catch { /* storage unavailable */ }
  }, [draft, open, storageKey, submitted]);

  const set = (key: keyof InterestFormDraft, value: InterestFormDraft[keyof InterestFormDraft]) =>
    form.setValue(key, value, { shouldValidate: true, shouldDirty: true });

  const canSubmit = !submitting && Boolean(agreement);
  const stepFields: (keyof InterestFormDraft)[][] = [["entityName", "entityType", "signatoryName"], ["ticketBand", "instrumentSought", "constructionRisk", "capitalSource", "decisionProcess"], ["signedName", "authority", "feeAcknowledged", "electronicConsent", "conflictsDeclared", "conflictsDetail", "advisersReceivingInfo"]];
  const nextStep = async () => { if (await form.trigger(stepFields[screen], { shouldFocus: true })) setScreen(screen + 1); };
  const submit = form.handleSubmit(values => onSubmit(values), errors => {
    const firstScreen = stepFields.findIndex(fields => fields.some(field => errors[field]));
    if (firstScreen >= 0 && firstScreen !== screen) setScreen(firstScreen);
  });

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
      <DialogContent className="max-h-[90dvh] w-[calc(100%-1rem)] max-w-2xl overflow-x-hidden overflow-y-auto [&>*]:min-w-0">
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

        <Form {...form}><form onSubmit={submit} noValidate><div ref={screenRef} className="space-y-5">
        <p role="status" aria-live="polite" className="sr-only">Step {screen + 1} of 3: {SCREENS[screen]}</p>
        {screen === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Entity name">
              <Input id="interest-entityName" aria-labelledby="interest-entityName-label" value={draft.entityName} onChange={(event) => set("entityName", event.target.value)} placeholder="Investing entity" />
            </Field>
            <Field label="Entity type">
              <Select value={draft.entityType} onValueChange={(value) => set("entityType", value as EntityType)}>
                <SelectTrigger id="interest-entityType" aria-labelledby="interest-entityType-label"><SelectValue placeholder="Select a type" /></SelectTrigger>
                <SelectContent>
                  {ENTITY_TYPES.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Jurisdiction">
              <Input id="interest-jurisdiction" aria-labelledby="interest-jurisdiction-label" value={draft.jurisdiction} onChange={(event) => set("jurisdiction", event.target.value)} placeholder="Country of incorporation" />
            </Field>
            <Field label="Regulated status">
              <Input id="interest-regulatedStatus" aria-labelledby="interest-regulatedStatus-label" value={draft.regulatedStatus} onChange={(event) => set("regulatedStatus", event.target.value)} placeholder="Regulator and reference, or none" />
            </Field>
            <Field label="Website">
              <Input id="interest-website" aria-labelledby="interest-website-label" value={draft.website} onChange={(event) => set("website", event.target.value)} placeholder="https://" />
            </Field>
            <Field label="Signatory name">
              <Input id="interest-signatoryName" aria-labelledby="interest-signatoryName-label" value={draft.signatoryName} onChange={(event) => set("signatoryName", event.target.value)} placeholder="Full legal name" />
            </Field>
            <Field label="Signatory role">
              <Input id="interest-signatoryRole" aria-labelledby="interest-signatoryRole-label" value={draft.signatoryRole} onChange={(event) => set("signatoryRole", event.target.value)} placeholder="Title or position" />
            </Field>
          </div>
        )}

        {screen === 1 && (
          <div className="space-y-5">
            <Field label="Ticket band" hint="Required. This drives the fit line the developer sees.">
              <RadioGroup value={draft.ticketBand} onValueChange={(value) => set("ticketBand", value as TicketBand)} className="grid gap-2 sm:grid-cols-2">
                {TICKET_BANDS.map((band) => (
                  <label key={band.value} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                    <RadioGroupItem aria-label={band.label} value={band.value} id={`ticket-${band.value}`} />
                    {band.label}
                  </label>
                ))}
              </RadioGroup>
            </Field>
            <MandateFit draft={draft} criteria={criteria} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Instrument sought">
                <Select value={draft.instrumentSought} onValueChange={(value) => set("instrumentSought", value as InstrumentSought)}>
                  <SelectTrigger id="interest-instrumentSought" aria-labelledby="interest-instrumentSought-label"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {INSTRUMENTS_SOUGHT.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Construction-risk appetite" hint={criteria?.require_construction_risk_appetite ? "Required for this listing." : "Optional for this listing."}>
                <Select value={draft.constructionRisk} onValueChange={(value) => set("constructionRisk", value as ConstructionRiskAppetite)}>
                  <SelectTrigger id="interest-constructionRisk" aria-labelledby="interest-constructionRisk-label"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CONSTRUCTION_RISK.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Capital source" hint="Required.">
                <Select value={draft.capitalSource} onValueChange={(value) => set("capitalSource", value as CapitalSource)}>
                  <SelectTrigger id="interest-capitalSource" aria-labelledby="interest-capitalSource-label"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {CAPITAL_SOURCES.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Decision process" hint="Required.">
                <Select value={draft.decisionProcess} onValueChange={(value) => set("decisionProcess", value as DecisionProcess)}>
                  <SelectTrigger id="interest-decisionProcess" aria-labelledby="interest-decisionProcess-label"><SelectValue placeholder="Select" /></SelectTrigger>
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
                      aria-label={driver}
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
                id="interest-diligenceFocus" aria-labelledby="interest-diligenceFocus-label"
                value={draft.diligenceFocus}
                maxLength={300}
                onChange={(event) => set("diligenceFocus", event.target.value)}
                placeholder="What you would want to test first"
              />
            </Field>
            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
              <Checkbox aria-label="I would consider leading a club on this project" checked={draft.wouldLeadClub} onCheckedChange={(checked) => set("wouldLeadClub", checked === true)} />
              I would consider leading a club on this project
            </label>
          </div>
        )}

        {screen === 2 && (
          <div className="space-y-5">
            <Field label="Conflicts">
              <RadioGroup value={draft.conflictsDeclared} onValueChange={(value) => set("conflictsDeclared", value as "none" | "declared")} className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <RadioGroupItem aria-label="None" value="none" id="conflicts-none" /> None
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm">
                  <RadioGroupItem aria-label="Declared" value="declared" id="conflicts-declared" /> Declared
                </label>
              </RadioGroup>
            </Field>
            {draft.conflictsDeclared === "declared" && (
              <Field label="Describe the conflict">
                <Textarea id="interest-conflictsDetail" aria-labelledby="interest-conflictsDetail-label" value={draft.conflictsDetail} onChange={(event) => set("conflictsDetail", event.target.value)} placeholder="Competing holdings, roles or mandates" />
              </Field>
            )}
            <Field label="Advisers who would receive information" hint={draft.conflictsDeclared === "declared" ? "Required when a conflict is declared. Only named advisers may receive information." : "Only named advisers may receive information."}>
              <Textarea id="interest-advisersReceivingInfo" aria-labelledby="interest-advisersReceivingInfo-label" value={draft.advisersReceivingInfo} onChange={(event) => set("advisersReceivingInfo", event.target.value)} placeholder="Named advisers, bound on the same terms" />
            </Field>

            <div className="space-y-3 rounded-xl border border-border bg-muted/40 p-5">
              <p className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                <FileSignature className="h-4 w-4 text-accent" /> Confidentiality agreement
              </p>
              {agreement ? <>
                <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{agreement.body}</p>
                <p className="text-sm text-muted-foreground">{agreement.fee_text}</p>
                <p className="text-xs text-muted-foreground">Document version {agreement.version}</p>
              </> : <p role="alert" className="text-sm text-destructive">{agreementError || "Loading agreement. Signing is unavailable until it loads."}</p>}
            </div>

            <Field label="Type your full name to sign">
              <Input id="interest-signedName" aria-labelledby="interest-signedName-label" value={draft.signedName} onChange={(event) => set("signedName", event.target.value)} placeholder="Full legal name" />
            </Field>
            <Attestation name="authority" text={AUTHORITY_TEXT} />
            <Attestation name="feeAcknowledged" text={agreement?.fee_text || "Fee acknowledgement"} />
            <Attestation name="electronicConsent" text="I agree to sign this agreement electronically" />
            <p className="text-xs text-muted-foreground">This expression of interest is non-binding, is not an offer and creates no obligation to transact.</p>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Lock className="mt-0.5 h-3.5 w-3.5 flex-none" />
              Your typed name, role if provided, timestamp, document version and hash, authority and fee acknowledgements, and electronic-signature consent are recorded. The agreement remains inoperative while the request is pending.
            </p>
            {draft.conflictsDeclared === "declared" && (
              <p className="flex items-start gap-2 text-xs text-warning">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
                Declared conflicts are shown prominently to the developer.
              </p>
            )}
          </div>
        )}

        </div>
        {Object.keys(form.formState.errors).length > 0 && <div role="alert" className="my-3 text-sm text-destructive">Please complete the highlighted fields. {Object.entries(form.formState.errors).filter(([key]) => ["authority", "feeAcknowledged", "electronicConsent"].includes(key)).map(([key, error]) => <p key={key}>{error.message}</p>)}</div>}
        <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" onClick={() => (screen === 0 ? close(false) : setScreen(screen - 1))}>
            {screen === 0 ? "Save and close" : "Back"}
          </Button>
          {screen < 2 ? (
            <Button type="button" onClick={nextStep}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? "Sending request..." : "Send request and signed agreement"}
            </Button>
          )}
        </div>
        </form></Form>
      </DialogContent>
    </Dialog>
  );
};

export default ExpressInterestDialog;
