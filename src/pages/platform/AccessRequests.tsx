import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "@/lib/router-compat";
import {
  Building2, Check, CheckCheck, Clock, ExternalLink, Globe2, MessageSquare, ShieldAlert,
  ShieldCheck, User, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { FEE_SENTENCE } from "@/lib/fee";
import {
  ACCESS_STATE_LABEL, CAPITAL_SOURCES, CONSTRUCTION_RISK, DECISION_PROCESSES, DECLINE_REASONS,
  ENTITY_TYPES, INSTRUMENTS_SOUGHT, addDays, addMonths, computeFit, declineReasonLabel, effectiveState,
  fitPassesEverything, formatDate, optionLabel, slaStatus, ticketBandLabel, FEE_TAIL_MONTHS,
  REOPEN_BLOCK_DAYS, type AccessAnswersRow, type AccessCriteriaRow, type AccessRequestRow,
  type AccessState, type DeclineReason,
} from "@/lib/access";

type Project = Tables<"project">;

type Filter = "pending" | "granted" | "declined" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Awaiting your decision" },
  { key: "granted", label: "Granted" },
  { key: "declined", label: "Declined" },
  { key: "all", label: "All" },
];

type Action = "granted_full" | "granted" | "question" | "declined";

const StatePill = ({ state }: { state: AccessState }) => {
  const map: Record<AccessState, string> = {
    pending: "bg-warning/15 text-warning",
    granted: "bg-success/15 text-success",
    granted_full: "bg-success/15 text-success",
    declined: "bg-destructive/15 text-destructive",
    withdrawn: "bg-muted text-muted-foreground",
    lapsed: "bg-muted text-muted-foreground",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", map[state])}>
      {state === "pending" ? <Clock className="h-3.5 w-3.5" /> : state === "granted_full" ? <CheckCheck className="h-3.5 w-3.5" /> : state === "granted" ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      {ACCESS_STATE_LABEL[state]}
    </span>
  );
};

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

const AccessRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<AccessRequestRow[]>([]);
  const [answers, setAnswers] = useState<AccessAnswersRow[]>([]);
  const [criteria, setCriteria] = useState<AccessCriteriaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("pending");
  const [action, setAction] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [question, setQuestion] = useState("");
  const [reason, setReason] = useState<DeclineReason | "">("");
  const [saving, setSaving] = useState(false);

  const selectedId = params.get("request");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: profile } = await supabase.from("developer_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!profile) {
      setProjects([]); setRequests([]); setLoading(false);
      return;
    }
    const { data: owned } = await supabase.from("project").select("*").eq("developer_id", profile.id);
    const projectRows = owned || [];
    setProjects(projectRows);
    const ids = projectRows.map((project) => project.id);
    if (!ids.length) {
      setRequests([]); setAnswers([]); setCriteria([]); setLoading(false);
      return;
    }
    const [{ data: requestRows }, { data: criteriaRows }] = await Promise.all([
      supabase.from("access_request").select("*").in("project_id", ids).order("submitted_at", { ascending: false }),
      supabase.from("listing_access_criteria").select("*").in("project_id", ids),
    ]);
    setRequests(requestRows || []);
    setCriteria(criteriaRows || []);
    const requestIds = (requestRows || []).map((row) => row.id);
    if (requestIds.length) {
      const { data: answerRows } = await supabase.from("access_request_answers").select("*").in("access_request_id", requestIds);
      setAnswers(answerRows || []);
    } else {
      setAnswers([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project])), [projects]);
  const answersByRequest = useMemo(() => new Map(answers.map((row) => [row.access_request_id, row])), [answers]);
  const criteriaByProject = useMemo(() => new Map(criteria.map((row) => [row.project_id, row])), [criteria]);

  const withState = useMemo(
    () => requests.map((request) => ({ request, state: effectiveState(request) })),
    [requests],
  );

  const visible = useMemo(() => {
    if (filter === "all") return withState;
    if (filter === "pending") return withState.filter((entry) => entry.state === "pending" || entry.state === "lapsed");
    if (filter === "granted") return withState.filter((entry) => entry.state === "granted" || entry.state === "granted_full");
    return withState.filter((entry) => entry.state === "declined");
  }, [withState, filter]);

  const selected = useMemo(
    () => withState.find((entry) => entry.request.id === selectedId) || visible[0] || null,
    [withState, selectedId, visible],
  );

  /** Acceptance is the only event that logs an introduction and starts the fee tail. */
  const decide = async (choice: Action) => {
    if (!selected || !user) return;
    const request = selected.request;
    if (choice === "declined" && !reason) {
      toast({ title: "A reason is required", description: "Choose a decline reason before sending.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const now = new Date().toISOString();

    let patch: Partial<AccessRequestRow> = {};
    if (choice === "question") {
      patch = { developer_question: question.trim(), developer_question_at: now, investor_reply: null, investor_reply_at: null };
    } else if (choice === "declined") {
      patch = {
        state: "declined", status: "denied", decided_at: now, decided_by: user.id,
        decision_note: note.trim() || null, decline_reason: reason as DeclineReason,
        scope_granted: null, nda_effective_at: null, introduction_logged_at: null, fee_tail_expires_at: null,
        reopen_allowed_at: addDays(now, REOPEN_BLOCK_DAYS),
      };
    } else {
      patch = {
        state: choice, status: "approved", decided_at: now, decided_by: user.id,
        decision_note: note.trim() || null, decline_reason: null,
        scope_granted: choice === "granted_full" ? "full_including_dataroom" : "identity_and_data",
        nda_effective_at: now,
        introduction_logged_at: now,
        fee_tail_expires_at: addMonths(now, FEE_TAIL_MONTHS),
      };
    }

    const { error } = await supabase.from("access_request").update(patch).eq("id", request.id);
    if (!error && (choice === "granted" || choice === "granted_full")) {
      await supabase.from("project_interest").upsert(
        { project_id: request.project_id, investor_user_id: request.investor_user_id, stage: choice === "granted_full" ? "data_room" : "access_granted" },
        { onConflict: "project_id,investor_user_id" },
      );
    }
    // Accepting in full releases every confidential document on the listing to this investor.
    if (!error && choice === "granted_full") {
      const { data: gated } = await supabase
        .from("document").select("id").eq("project_id", request.project_id).eq("access_level", "gated");
      if (gated?.length) {
        await supabase.from("document_access_grant").upsert(
          gated.map((doc) => ({
            document_id: doc.id, user_id: request.investor_user_id,
            status: "approved" as const, granted_by: user.id, granted_at: now,
          })),
          { onConflict: "document_id,user_id" },
        );
      }
    }
    setSaving(false);
    if (error) {
      toast({ title: "Decision could not be saved", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title:
        choice === "granted_full" ? "Accepted in full, data room opened"
        : choice === "granted" ? "Accepted, data room held back"
        : choice === "question" ? "Question sent, the request stays pending"
        : "Request declined",
      description:
        choice === "granted" || choice === "granted_full"
          ? "The agreement is now operative and the introduction has been logged."
          : choice === "question"
          ? "The SLA clock is paused until the investor replies."
          : "No identity was revealed to this investor.",
    });
    setAction(null); setNote(""); setQuestion(""); setReason("");
    await load();
  };

  const analytics = useMemo(() => {
    const decided = withState.filter((entry) => ["granted", "granted_full", "declined"].includes(entry.state));
    const accepted = decided.filter((entry) => entry.state !== "declined");
    const times = decided
      .map((entry) => entry.request.decided_at && new Date(entry.request.decided_at).getTime() - new Date(entry.request.submitted_at).getTime())
      .filter((value): value is number => Boolean(value))
      .sort((a, b) => a - b);
    const median = times.length ? times[Math.floor(times.length / 2)] / 86_400_000 : null;
    const belowMin = withState.filter((entry) => {
      const answer = answersByRequest.get(entry.request.id);
      const rules = criteriaByProject.get(entry.request.project_id) || null;
      const fit = computeFit(answer || null, rules);
      return fit.length > 0 && !fit[0].ok;
    }).length;
    const reasons = new Map<string, number>();
    withState.filter((entry) => entry.state === "declined").forEach((entry) => {
      const key = declineReasonLabel(entry.request.decline_reason);
      reasons.set(key, (reasons.get(key) || 0) + 1);
    });
    return {
      total: withState.length,
      acceptanceRate: decided.length ? Math.round((accepted.length / decided.length) * 100) : null,
      medianDays: median,
      belowMin,
      lapsed: withState.filter((entry) => entry.state === "lapsed").length,
      reasons: Array.from(reasons.entries()),
    };
  }, [withState, answersByRequest, criteriaByProject]);

  const answer = selected ? answersByRequest.get(selected.request.id) || null : null;
  const rules = selected ? criteriaByProject.get(selected.request.project_id) || null : null;
  const fit = computeFit(answer, rules);
  const sla = selected ? slaStatus(selected.request) : null;
  const pendingCount = withState.filter((entry) => entry.state === "pending").length;

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Access requests</h1>
        <p className="mt-1 max-w-[80ch] text-muted-foreground">
          Nothing on your listing is revealed until you accept a request. The investor has already signed the confidentiality
          agreement; it takes effect only when you accept. {pendingCount} awaiting your decision.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Requests received", value: String(analytics.total) },
          { label: "Acceptance rate", value: analytics.acceptanceRate === null ? "No decisions yet" : `${analytics.acceptanceRate}%` },
          { label: "Median time to decision", value: analytics.medianDays === null ? "No decisions yet" : `${analytics.medianDays.toFixed(1)} days` },
          { label: "Below your minimum ticket", value: String(analytics.belowMin) },
          { label: "Lapsed without a decision", value: String(analytics.lapsed) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-display text-xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => (
          <Button key={entry.key} size="sm" variant={filter === entry.key ? "default" : "outline"} onClick={() => setFilter(entry.key)}>
            {entry.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-2">
          {loading && <p className="rounded-md bg-muted p-5 text-sm text-muted-foreground">Loading requests...</p>}
          {!loading && !visible.length && (
            <p className="rounded-md bg-muted p-5 text-sm text-muted-foreground">No requests in this view.</p>
          )}
          {visible.map(({ request, state }) => {
            const project = projectById.get(request.project_id);
            const entity = answersByRequest.get(request.id)?.entity_name || "Investor";
            const status = slaStatus(request);
            return (
              <button
                key={request.id}
                onClick={() => setParams({ request: request.id })}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-colors",
                  selected?.request.id === request.id ? "border-primary bg-card" : "border-border bg-background hover:border-primary/40",
                )}
              >
                <p className="truncate font-semibold text-foreground">{entity}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{project?.title || "Listing"}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatePill state={state} />
                  {state === "pending" && (
                    <span className="text-xs text-muted-foreground">{status.workingDays} working days pending</span>
                  )}
                </div>
              </button>
            );
          })}
        </aside>

        <div className="space-y-4">
          {!selected && !loading && (
            <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Select a request to review it.
            </p>
          )}

          {selected && (
            <article className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-card">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{answer?.entity_name || "Investor"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {projectById.get(selected.request.project_id)?.title} | submitted {formatDate(selected.request.submitted_at)}
                    {sla ? ` | ${sla.workingDays} working days pending` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatePill state={selected.state} />
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/app/projects/${projectById.get(selected.request.project_id)?.slug || ""}`}>
                      Listing <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </header>

              {sla && selected.state === "pending" && (
                <p className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground">{sla.label}</p>
              )}

              <section>
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-accent" /> Who they are
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Info label="Entity type" value={optionLabel(ENTITY_TYPES, answer?.entity_type ?? null)} />
                  <Info label="Jurisdiction" value={answer?.jurisdiction || "Not stated"} />
                  <Info label="Regulated status" value={answer?.regulated_status || "Not stated"} />
                  <Info label="Signatory" value={answer?.signatory_name || "Not stated"} />
                  <Info label="Signatory role" value={answer?.signatory_role || "Not stated"} />
                  <Info label="Website" value={answer?.website || "Not stated"} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <User className="h-4 w-4 text-accent" /> Capacity and intent
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Info label="Ticket band" value={ticketBandLabel(answer?.ticket_band ?? null)} />
                  <Info label="Instrument" value={optionLabel(INSTRUMENTS_SOUGHT, answer?.instrument_sought ?? null)} />
                  <Info label="Construction-risk appetite" value={optionLabel(CONSTRUCTION_RISK, answer?.construction_risk_appetite ?? null)} />
                  <Info label="Capital source" value={optionLabel(CAPITAL_SOURCES, answer?.capital_source ?? null)} />
                  <Info label="Decision process" value={optionLabel(DECISION_PROCESSES, answer?.decision_process ?? null)} />
                  <Info label="Earliest decision date" value={formatDate(answer?.earliest_decision_date ?? null)} />
                  <Info label="Interest drivers" value={answer?.interest_drivers?.length ? answer.interest_drivers.join(", ") : "Not stated"} />
                  <Info label="Would lead a club" value={answer?.would_lead_club ? "Yes" : "No"} />
                </div>
                {answer?.diligence_focus && (
                  <p className="mt-3 rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                    Diligence focus: {answer.diligence_focus}
                  </p>
                )}
              </section>

              <section className={cn("rounded-lg border p-5", answer?.conflicts_declared ? "border-warning bg-warning/10" : "border-border bg-background")}>
                <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <ShieldAlert className={cn("h-4 w-4", answer?.conflicts_declared ? "text-warning" : "text-muted-foreground")} />
                  Conflicts and advisers
                </h3>
                <p className="text-sm text-foreground">
                  {answer?.conflicts_declared ? `Declared: ${answer.conflicts_detail || "no detail given"}` : "No conflicts declared"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Advisers receiving information: {answer?.advisers_receiving_info || "None named"}
                </p>
              </section>

              <section>
                <h3 className="mb-3 font-display text-sm font-semibold text-foreground">Fit against your access criteria</h3>
                <ul className="space-y-2">
                  {fit.map((item) => (
                    <li key={item.label} className="flex items-start gap-2.5 text-sm">
                      {item.ok ? <Check className="mt-0.5 h-4 w-4 flex-none text-success" /> : <X className="mt-0.5 h-4 w-4 flex-none text-destructive" />}
                      <span className="text-foreground">{item.label}</span>
                      <span className="text-muted-foreground">{item.detail}</span>
                    </li>
                  ))}
                  {!fit.length && <li className="text-sm text-muted-foreground">No answers recorded for this request.</li>}
                </ul>
                <p className="mt-3 text-xs text-muted-foreground">
                  The fit line is informational. It never blocks a request and never decides one for you.
                  {rules?.auto_accept_qualified && fitPassesEverything(fit)
                    ? " Auto-accept is switched on for this listing and this request passes every check."
                    : ""}
                </p>
              </section>

              <section className="rounded-lg border border-border bg-muted/40 p-5">
                <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <ShieldCheck className="h-4 w-4 text-accent" /> Confidentiality agreement
                </h3>
                <p className="text-sm text-muted-foreground">
                  Signed by {selected.request.nda_signed_name || "Not recorded"}
                  {selected.request.nda_signed_role ? `, ${selected.request.nda_signed_role}` : ""} on{" "}
                  {formatDate(selected.request.nda_signed_at)}, version {selected.request.nda_version || "Not recorded"}.
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {selected.request.nda_effective_at
                    ? `In effect since ${formatDate(selected.request.nda_effective_at)}.`
                    : "Awaiting your acceptance to take effect."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {selected.request.introduction_logged_at
                    ? `Introduction logged ${formatDate(selected.request.introduction_logged_at)}. Fee tail runs to ${formatDate(selected.request.fee_tail_expires_at)}.`
                    : "No introduction has been logged. Submitting or declining a request logs nothing and starts no clock."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{FEE_SENTENCE}</p>
              </section>

              {selected.request.developer_question && (
                <section className="rounded-lg border border-border bg-background p-5">
                  <h3 className="mb-1 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                    <MessageSquare className="h-4 w-4 text-accent" /> Your question
                  </h3>
                  <p className="text-sm text-muted-foreground">{selected.request.developer_question}</p>
                  <p className="mt-2 text-sm text-foreground">
                    {selected.request.investor_reply
                      ? `Reply: ${selected.request.investor_reply}`
                      : "Awaiting the investor's reply. The clock is paused."}
                  </p>
                </section>
              )}

              {(selected.state === "pending" || selected.state === "lapsed") && (
                <footer className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button onClick={() => setAction("granted_full")}><CheckCheck className="h-4 w-4" /> Accept in full</Button>
                  <Button variant="outline" onClick={() => setAction("granted")}><Check className="h-4 w-4" /> Accept, hold data room</Button>
                  <Button variant="outline" onClick={() => setAction("question")}><MessageSquare className="h-4 w-4" /> Ask a question</Button>
                  <Button variant="outline" className="text-destructive" onClick={() => setAction("declined")}><X className="h-4 w-4" /> Decline</Button>
                </footer>
              )}

              {(selected.state === "granted" || selected.state === "granted_full") && (
                <footer className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <p className="text-sm text-muted-foreground">
                    {selected.state === "granted_full"
                      ? "The data room is open for this investor."
                      : "The data room is still held back. Review it as a separate decision."}
                  </p>
                  <Button size="sm" variant={selected.state === "granted" ? "default" : "outline"} asChild>
                    <Link to={`/app/data-room-requests?request=${selected.request.id}`}>
                      {selected.state === "granted" ? "Review data room access" : "Manage data room access"}
                    </Link>
                  </Button>
                </footer>
              )}

              {selected.state === "declined" && (
                <p className="rounded-lg border border-border bg-background p-4 text-sm text-muted-foreground">
                  Declined {formatDate(selected.request.decided_at)}. Reason: {declineReasonLabel(selected.request.decline_reason)}.
                  This investor may not resubmit before {formatDate(selected.request.reopen_allowed_at)} unless you invite them.
                </p>
              )}
            </article>
          )}
        </div>
      </div>

      <Dialog open={Boolean(action)} onOpenChange={(next) => { if (!next) { setAction(null); setNote(""); setQuestion(""); setReason(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {action === "granted_full" ? "Accept in full" : action === "granted" ? "Accept and hold the data room" : action === "question" ? "Ask a question" : "Decline this request"}
            </DialogTitle>
            <DialogDescription>
              {action === "granted_full"
                ? "Identity, counterparties, every data tab and the data room open for this investor. The agreement takes effect now and the introduction is logged."
                : action === "granted"
                ? "Identity, counterparties and the data tabs open. The data room stays locked until you accept in full. The agreement takes effect now and the introduction is logged."
                : action === "question"
                ? "One message goes to the investor. The request stays pending and the SLA clock pauses until they reply."
                : "The investor is told the reason. No identity is revealed and no introduction is logged."}
            </DialogDescription>
          </DialogHeader>

          {action === "declined" && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Reason (required)</p>
              <Select value={reason} onValueChange={(value) => setReason(value as DeclineReason)}>
                <SelectTrigger><SelectValue placeholder="Choose a reason" /></SelectTrigger>
                <SelectContent>
                  {DECLINE_REASONS.map((entry) => <SelectItem key={entry.value} value={entry.value}>{entry.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          {action === "question" ? (
            <Textarea value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Your question to the investor" />
          ) : (
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional note to the investor" />
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button
              disabled={saving || (action === "question" && question.trim().length < 3) || (action === "declined" && !reason)}
              onClick={() => action && decide(action)}
            >
              {saving ? "Saving..." : action === "question" ? "Send question" : action === "declined" ? "Send decline" : "Confirm acceptance"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccessRequests;
