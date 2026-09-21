import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "@/lib/router-compat";
import {
  Building2, Check, CheckCheck, Clock, ExternalLink, FileText, Lock, ShieldAlert, ShieldCheck, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  CAPITAL_SOURCES, DECISION_PROCESSES, ENTITY_TYPES, INSTRUMENTS_SOUGHT, effectiveState, formatDate,
  optionLabel, ticketBandLabel, type AccessAnswersRow, type AccessRequestRow,
} from "@/lib/access";

type Project = Tables<"project">;
type Document = Tables<"document">;
type Grant = Tables<"document_access_grant">;

type Filter = "awaiting" | "open" | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "awaiting", label: "Awaiting your data room decision" },
  { key: "open", label: "Data room open" },
  { key: "all", label: "All accepted investors" },
];

const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-medium text-foreground">{value}</p>
  </div>
);

const DataRoomRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [requests, setRequests] = useState<AccessRequestRow[]>([]);
  const [answers, setAnswers] = useState<AccessAnswersRow[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("awaiting");
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [dialog, setDialog] = useState<"approve" | "revoke" | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedId = params.get("request");

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: profile } = await supabase
      .from("developer_profiles").select("id").eq("user_id", user.id).maybeSingle();
    if (!profile) {
      setProjects([]); setRequests([]); setAnswers([]); setDocuments([]); setGrants([]);
      setLoading(false);
      return;
    }
    const { data: owned } = await supabase.from("project").select("*").eq("developer_id", profile.id);
    const projectRows = owned || [];
    setProjects(projectRows);
    const ids = projectRows.map((project) => project.id);
    if (!ids.length) {
      setRequests([]); setAnswers([]); setDocuments([]); setGrants([]); setLoading(false);
      return;
    }
    const [{ data: requestRows }, { data: documentRows }] = await Promise.all([
      supabase.from("access_request").select("*").in("project_id", ids)
        .in("state", ["granted", "granted_full"]).order("decided_at", { ascending: false }),
      supabase.from("document").select("*").in("project_id", ids).order("name"),
    ]);
    setRequests(requestRows || []);
    setDocuments(documentRows || []);
    const requestIds = (requestRows || []).map((row) => row.id);
    const documentIds = (documentRows || []).map((row) => row.id);
    const [answerResult, grantResult] = await Promise.all([
      requestIds.length
        ? supabase.from("access_request_answers").select("*").in("access_request_id", requestIds)
        : Promise.resolve({ data: [] as AccessAnswersRow[] }),
      documentIds.length
        ? supabase.from("document_access_grant").select("*").in("document_id", documentIds)
        : Promise.resolve({ data: [] as Grant[] }),
    ]);
    setAnswers((answerResult.data as AccessAnswersRow[]) || []);
    setGrants((grantResult.data as Grant[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const answersByRequest = useMemo(() => new Map(answers.map((a) => [a.access_request_id, a])), [answers]);

  const withState = useMemo(
    () => requests.map((request) => ({ request, state: effectiveState(request) })),
    [requests],
  );

  const visible = useMemo(() => {
    if (filter === "all") return withState;
    if (filter === "open") return withState.filter((entry) => entry.state === "granted_full");
    return withState.filter((entry) => entry.state === "granted");
  }, [withState, filter]);

  const selected = useMemo(
    () => withState.find((entry) => entry.request.id === selectedId) || visible[0] || null,
    [withState, selectedId, visible],
  );

  const projectDocuments = useMemo(
    () => (selected ? documents.filter((doc) => doc.project_id === selected.request.project_id) : []),
    [documents, selected],
  );
  const gatedDocuments = useMemo(
    () => projectDocuments.filter((doc) => doc.access_level === "gated"),
    [projectDocuments],
  );
  const openDocuments = useMemo(
    () => projectDocuments.filter((doc) => doc.access_level === "public"),
    [projectDocuments],
  );

  const grantFor = (documentId: string) =>
    selected
      ? grants.find((row) => row.document_id === documentId && row.user_id === selected.request.investor_user_id) || null
      : null;

  const approvedCount = gatedDocuments.filter((doc) => grantFor(doc.id)?.status === "approved").length;

  /** Approving the data room is a second, separate decision from accepting the request. */
  const approveDataRoom = async () => {
    if (!selected || !user) return;
    setSaving(true);
    const request = selected.request;
    const now = new Date().toISOString();

    const { error } = await supabase
      .from("access_request")
      .update({
        state: "granted_full",
        scope_granted: "full_including_dataroom",
        decision_note: note.trim() || request.decision_note,
      })
      .eq("id", request.id);

    if (error) {
      setSaving(false);
      toast({ title: "The data room could not be opened", description: error.message, variant: "destructive" });
      return;
    }

    if (gatedDocuments.length) {
      const { error: grantError } = await supabase.from("document_access_grant").upsert(
        gatedDocuments.map((doc) => ({
          document_id: doc.id,
          user_id: request.investor_user_id,
          status: "approved" as const,
          granted_by: user.id,
          granted_at: now,
        })),
        { onConflict: "document_id,user_id" },
      );
      if (grantError) {
        setSaving(false);
        toast({ title: "Document access could not be recorded", description: grantError.message, variant: "destructive" });
        return;
      }
    }

    await supabase.from("project_interest").upsert(
      { project_id: request.project_id, investor_user_id: request.investor_user_id, stage: "data_room" },
      { onConflict: "project_id,investor_user_id" },
    );

    setSaving(false);
    setDialog(null); setNote(""); setConfirmed(false);
    toast({
      title: "Data room opened",
      description: `${gatedDocuments.length} confidential document${gatedDocuments.length === 1 ? "" : "s"} released to this investor.`,
    });
    await load();
  };

  const revokeDataRoom = async () => {
    if (!selected || !user) return;
    setSaving(true);
    const request = selected.request;
    const { error } = await supabase
      .from("access_request")
      .update({ state: "granted", scope_granted: "identity_and_data", decision_note: note.trim() || request.decision_note })
      .eq("id", request.id);
    if (error) {
      setSaving(false);
      toast({ title: "The data room could not be closed", description: error.message, variant: "destructive" });
      return;
    }
    if (gatedDocuments.length) {
      await supabase
        .from("document_access_grant")
        .update({ status: "withdrawn", granted_at: null })
        .eq("user_id", request.investor_user_id)
        .in("document_id", gatedDocuments.map((doc) => doc.id));
    }
    await supabase.from("project_interest").upsert(
      { project_id: request.project_id, investor_user_id: request.investor_user_id, stage: "access_granted" },
      { onConflict: "project_id,investor_user_id" },
    );
    setSaving(false);
    setDialog(null); setNote(""); setConfirmed(false);
    toast({ title: "Data room closed", description: "The investor keeps identity and data tab access only." });
    await load();
  };

  const answer = selected ? answersByRequest.get(selected.request.id) || null : null;
  const awaitingCount = withState.filter((entry) => entry.state === "granted").length;

  return (
    <div className="max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Data room approvals</h1>
        <p className="mt-1 max-w-[80ch] text-muted-foreground">
          Accepting a request opens identity and the data tabs. The confidential data room is a second decision that only
          you can make, document by document listing. {awaitingCount} accepted investor
          {awaitingCount === 1 ? "" : "s"} waiting on that decision.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((entry) => (
          <Button key={entry.key} size="sm" variant={filter === entry.key ? "default" : "outline"} onClick={() => setFilter(entry.key)}>
            {entry.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-2">
          {loading && <p className="rounded-md bg-muted p-5 text-sm text-muted-foreground">Loading investors...</p>}
          {!loading && !visible.length && (
            <p className="rounded-md bg-muted p-5 text-sm text-muted-foreground">
              No accepted investors in this view. Accept a request first on the access requests screen.
            </p>
          )}
          {visible.map(({ request, state }) => (
            <button
              key={request.id}
              onClick={() => { setParams({ request: request.id }); setNote(""); setConfirmed(false); }}
              className={cn(
                "w-full rounded-lg border p-4 text-left transition-colors",
                selected?.request.id === request.id ? "border-primary bg-card" : "border-border bg-background hover:border-primary/40",
              )}
            >
              <p className="truncate font-semibold text-foreground">
                {answersByRequest.get(request.id)?.entity_name || "Investor"}
              </p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {projectById.get(request.project_id)?.title || "Listing"}
              </p>
              <span
                className={cn(
                  "mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
                  state === "granted_full" ? "bg-success/15 text-success" : "bg-warning/15 text-warning",
                )}
              >
                {state === "granted_full" ? <CheckCheck className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {state === "granted_full" ? "Data room open" : "Data room held"}
              </span>
            </button>
          ))}
        </aside>

        <div className="space-y-4">
          {!selected && !loading && (
            <p className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
              Select an investor to review their data room access.
            </p>
          )}

          {selected && (
            <article className="space-y-5 rounded-lg border border-border bg-card p-6 shadow-card">
              <header className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{answer?.entity_name || "Investor"}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {projectById.get(selected.request.project_id)?.title} | accepted {formatDate(selected.request.decided_at)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/app/access-requests?request=${selected.request.id}`}>Full request</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to={`/app/projects/${projectById.get(selected.request.project_id)?.slug || ""}`}>
                      Listing <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </header>

              <section>
                <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-accent" /> Who you are releasing to
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Info label="Entity type" value={optionLabel(ENTITY_TYPES, answer?.entity_type ?? null)} />
                  <Info label="Jurisdiction" value={answer?.jurisdiction || "Not stated"} />
                  <Info label="Signatory" value={answer?.signatory_name || "Not stated"} />
                  <Info label="Ticket band" value={ticketBandLabel(answer?.ticket_band ?? null)} />
                  <Info label="Instrument" value={optionLabel(INSTRUMENTS_SOUGHT, answer?.instrument_sought ?? null)} />
                  <Info label="Capital source" value={optionLabel(CAPITAL_SOURCES, answer?.capital_source ?? null)} />
                  <Info label="Decision process" value={optionLabel(DECISION_PROCESSES, answer?.decision_process ?? null)} />
                  <Info label="Advisers receiving information" value={answer?.advisers_receiving_info || "None named"} />
                  <Info label="Diligence focus" value={answer?.diligence_focus || "Not stated"} />
                </div>
              </section>

              <section className={cn("rounded-lg border p-5", answer?.conflicts_declared ? "border-warning bg-warning/10" : "border-border bg-background")}>
                <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold text-foreground">
                  <ShieldAlert className={cn("h-4 w-4", answer?.conflicts_declared ? "text-warning" : "text-muted-foreground")} />
                  Conflicts declared
                </h3>
                <p className="text-sm text-foreground">
                  {answer?.conflicts_declared ? answer.conflicts_detail || "Declared, no detail given" : "No conflicts declared"}
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
                    : "Not yet in effect."}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{FEE_SENTENCE}</p>
              </section>

              <section>
                <h3 className="mb-3 font-display text-sm font-semibold text-foreground">
                  Confidential documents you would release ({approvedCount} of {gatedDocuments.length} already released)
                </h3>
                <ul className="space-y-2">
                  {gatedDocuments.map((doc) => {
                    const grant = grantFor(doc.id);
                    const released = grant?.status === "approved";
                    return (
                      <li key={doc.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={cn("flex h-9 w-9 flex-none items-center justify-center rounded-lg", released ? "bg-success/10" : "bg-muted")}>
                            {released ? <Check className="h-4 w-4 text-success" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">{doc.name}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {[doc.category, doc.file_type?.toUpperCase(), doc.page_count ? `${doc.page_count} pages` : null]
                                .filter(Boolean).join(" | ") || "Confidential document"}
                            </p>
                          </div>
                        </div>
                        <span className="flex-none text-xs font-medium text-muted-foreground">
                          {released ? `Released ${formatDate(grant?.granted_at ?? null)}` : "Held back"}
                        </span>
                      </li>
                    );
                  })}
                  {!gatedDocuments.length && (
                    <li className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      This listing has no confidential documents uploaded yet. Approving still opens the data room, and any
                      confidential document you upload later is released to this investor automatically.
                    </li>
                  )}
                </ul>
                {openDocuments.length > 0 && (
                  <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    {openDocuments.length} open document{openDocuments.length === 1 ? "" : "s"} are already visible to this investor.
                  </p>
                )}
              </section>

              <footer className="flex flex-wrap gap-2 border-t border-border pt-4">
                {selected.state === "granted" ? (
                  <Button onClick={() => { setDialog("approve"); setNote(""); setConfirmed(false); }}>
                    <CheckCheck className="h-4 w-4" /> Approve data room access
                  </Button>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm font-medium text-success">
                      <Check className="h-4 w-4" /> Data room open for this investor
                    </span>
                    <Button variant="outline" className="text-destructive" onClick={() => { setDialog("revoke"); setNote(""); setConfirmed(false); }}>
                      <X className="h-4 w-4" /> Close the data room
                    </Button>
                  </>
                )}
                <Button variant="outline" asChild>
                  <Link to="/app/access-requests"><Clock className="h-4 w-4" /> Back to access requests</Link>
                </Button>
              </footer>
            </article>
          )}
        </div>
      </div>

      <Dialog
        open={Boolean(dialog)}
        onOpenChange={(next) => { if (!next) { setDialog(null); setNote(""); setConfirmed(false); } }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">
              {dialog === "approve" ? "Approve data room access" : "Close the data room"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "approve"
                ? `Every confidential document on this listing is released to ${answer?.entity_name || "this investor"}, now and as you add more. The confidentiality agreement already in effect covers it.`
                : "Confidential documents are withdrawn from this investor. Identity and the data tabs stay open, and nothing already downloaded can be recalled."}
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note to the investor"
          />

          {dialog === "approve" && (
            <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-foreground">
              <Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} className="mt-0.5" />
              <span>
                I have reviewed this investor and release the confidential documents listed above to them.
              </span>
            </label>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button
              disabled={saving || (dialog === "approve" && !confirmed)}
              onClick={() => (dialog === "approve" ? approveDataRoom() : revokeDataRoom())}
            >
              {saving ? "Saving..." : dialog === "approve" ? "Open the data room" : "Close the data room"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataRoomRequests;
