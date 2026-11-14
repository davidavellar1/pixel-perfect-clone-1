import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import PublicShell from "@/components/public/PublicShell";
import ProjectHero from "@/components/project/ProjectHero";
import ProjectSidebar from "@/components/project/ProjectSidebar";
import ProjectNewsCard from "@/components/news/ProjectNewsCard";
import ProjectTabContent from "@/components/project/ProjectTabContent";
import LockedTabOverlay from "@/components/project/LockedTabOverlay";
import type { DataRoomStatus } from "@/components/project/ProjectTabContent";
import AccessStateBar from "@/components/project/AccessStateBar";
import ExpressInterestDialog, { type InterestFormDraft } from "@/components/project/ExpressInterestDialog";
import { Button } from "@/components/ui/button";
import { Heart, Lock, CheckCircle2, Clock, ShieldX, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toast as sonnerToast } from "sonner";
import { useWatchlist } from "@/hooks/useWatchlist";
import type { ProjectDetail as ProjectDetailData } from "@/lib/blankProject";
import type { Tables } from "@/integrations/supabase/types";
import { useInvestorGrade } from "@/hooks/useInvestorGrade";
import { useProjectRecord } from "@/hooks/useProjectRecord";
import { blankProjectDetail } from "@/lib/blankProject";
import { loadDisclosedProject, teaserProjectDetail, type ProjectTeaser } from "@/lib/projectDisclosure";

import {
  addDays, addMonths, declineReasonLabel, effectiveState, formatDate, isDataRoomOpen, isGranted,
  slaStatus, REOPEN_BLOCK_DAYS, FEE_TAIL_MONTHS, type AccessCriteriaRow, type AccessRequestRow, type ViewerAccess,
} from "@/lib/access";
import { mandatePrefill, signatureEvidence, signatureReady, type Agreement } from "@/lib/gateWorkflow";
import MandateFit from "@/components/project/MandateFit";
import { Textarea } from "@/components/ui/textarea";

const tabs = [
  "Overview",
  "Transaction",
  "Technical",
  "Financial",
  "Sustainability",
  "Structure & market",
  "Documents",
  "Q&A",
] as const;

/** Everything except Overview unlocks only once the developer accepts the request. */
const GATED_TABS: string[] = [
  "Transaction",
  "Technical",
  "Financial",
  "Sustainability",
  "Structure & market",
  "Documents",
  "Q&A",
];

const LOCK_COPY: Record<string, string> = {
  Transaction: "The offer, capitalisation, governance terms and the process timetable reveal once the developer accepts your request.",
  Technical: "Technical detail, including the construction package and the named heat-source host, reveals once the developer accepts your request.",
  Financial: "Margin, the capital stack, named counterparties, debt terms and the case set reveal once the developer accepts your request.",
  Sustainability: "Emissions, the counterfactual and EU framework status reveal once the developer accepts your request.",
  "Structure & market": "Ownership, the regulatory regime and local-authority backing reveal once the developer accepts your request.",
  Documents: "Open documents reveal once the developer accepts your request. The data room is opened only when the developer accepts in full.",
  "Q&A": "Questions and the developer's answers reveal once the developer accepts your request. You can then ask your own.",
};

const HELPER_TEXT =
  "Sends a short request and a confidentiality agreement to the developer. Typically answered in 3 working days. Nothing is revealed until they accept.";

const ProjectDetail = ({ context = "public" }: { context?: "public" | "app" }) => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [teaser, setTeaser] = useState<ProjectTeaser | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [databaseProject, setDatabaseProject] = useState<Tables<"project"> | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const watchlist = useWatchlist();
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const [showInterest, setShowInterest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [isOwner, setIsOwner] = useState(false);
  const [request, setRequest] = useState<AccessRequestRow | null>(null);
  const [criteria, setCriteria] = useState<AccessCriteriaRow | null>(null);
  const [investorProfile, setInvestorProfile] = useState<Tables<"investor_profiles"> | null>(null);
  const [agreement, setAgreement] = useState<Agreement | null>(null);
  const [agreementError, setAgreementError] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  useEffect(() => {
    void supabase.from("nda_document_version").select("*").is("retired_at", null).lte("effective_from", new Date().toISOString()).order("effective_from", { ascending: false }).limit(1).maybeSingle()
      .then(({ data, error }) => { setAgreement(data); setAgreementError(error?.message || (!data ? "The agreement is unavailable. Please try again later." : null)); });
  }, []);
  const sendReply = async () => {
    if (!request || !user || !reply.trim()) return;
    setReplyBusy(true);
    const { data, error } = await supabase.from("access_request").update({ investor_reply: reply.trim(), investor_reply_at: new Date().toISOString() })
      .eq("id", request.id).eq("investor_user_id", user.id).eq("state", "pending").select("*").single();
    setReplyBusy(false);
    if (error) { sonnerToast.error("Reply was not saved. Please try again."); return; }
    setRequest(data); setReply(""); sonnerToast.success("Reply sent. The developer has been notified.");
  };



  const accessState: ViewerAccess = request ? effectiveState(request) : "teaser";
  /** The developer always sees their own listing in full. */
  const granted = isOwner || isGranted(accessState);
  const dataRoomStatus: DataRoomStatus = isDataRoomOpen(accessState)
    ? "approved"
    : accessState === "pending"
    ? "pending"
    : "none";

  const projectId = databaseProject?.id ?? teaser?.id ?? undefined;
  const { grade } = useInvestorGrade(granted ? databaseProject?.id : null, accessState, isOwner);
  const { overrides, numericCapex } = useProjectRecord(granted ? databaseProject?.id : undefined);
  const baseProject = granted && databaseProject ? blankProjectDetail(databaseProject) : undefined;
  const project: ProjectDetailData | undefined = baseProject
    ? { ...baseProject, ...overrides }
    : teaser ? teaserProjectDetail(teaser) : undefined;

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setDatabaseProject(null);
    setTeaser(null);
    setRequest(null);
    setIsOwner(false);
    setProjectError(null);
    setLoadingProject(true);
    if (!slug || loadingAuth) return;
    let cancelled = false;
    loadDisclosedProject(supabase, slug, user?.id ?? null).then((result) => {
      if (cancelled) return;
      setTeaser(result.teaser);
      setDatabaseProject(result.project);
      setRequest(result.request);
      setIsOwner(result.owner);
      setLoadingProject(false);
    }).catch((error: { message?: string }) => {
      if (cancelled) return;
      setProjectError(error.message ?? "Project could not be loaded. Please try again.");
      setLoadingProject(false);
    });
    return () => { cancelled = true; };
  }, [slug, user?.id, loadingAuth]);

  /** Notification links open a tab directly, e.g. ?tab=qa. */
  useEffect(() => {
    const wanted = new URLSearchParams(window.location.search).get("tab")?.toLowerCase();
    if (!wanted) return;
    const match = tabs.find((t) => t.toLowerCase().replace(/[^a-z]/g, "") === wanted.replace(/[^a-z]/g, ""));
    if (match) setActiveTab(match);
  }, [slug]);

  useEffect(() => {
    setCriteria(null);
    setInvestorProfile(null);
    if (!projectId) return;
    let cancelled = false;
    if (user) supabase.from("investor_profiles").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setInvestorProfile(data); });
    supabase.from("listing_access_criteria").select("id,project_id,min_ticket,instruments_accepted,require_construction_risk_appetite,notify_users,created_at,updated_at,electronic_execution_consent,electronic_execution_consent_at").eq("project_id", projectId).maybeSingle()
      .then(({ data }) => { if (!cancelled) setCriteria(data as AccessCriteriaRow | null); });
    return () => { cancelled = true; };
  }, [projectId, user?.id]);

  const toggleWatchlist = async () => {
    if (!projectId) return;
    if (!user) {
      navigate(`/sign-in?redirect=${encodeURIComponent(context === "app" ? `/app/projects/${slug}` : `/projects/${slug}`)}`);
      return;
    }
    setWatchlistBusy(true);
    const saved = watchlist.has(projectId);
    const result = saved ? await watchlist.remove(projectId) : await watchlist.add(projectId);
    setWatchlistBusy(false);
    if (!result.ok) { sonnerToast.error(result.error); return; }
    if (saved) sonnerToast.success("Removed from watchlist", { action: { label: "Undo", onClick: () => { void watchlist.add(projectId); } } });
    else sonnerToast.success("Saved to watchlist");
  };

  const openInterest = () => {
    if (!user) {
      toast.error("Sign in required", { description: "Please sign in to send an expression of interest." });
      navigate(`/sign-in?redirect=${encodeURIComponent(context === "app" ? `/app/projects/${slug}` : `/projects/${slug}`)}`);
      return;
    }
    if (granted) {
      toast.success("Access already granted", { description: "The project detail is unlocked for you." });
      return;
    }
    if (accessState === "pending") {
      toast.success("Request pending", { description: "The developer has your request and the signed agreement." });
      return;
    }
    if (accessState === "declined") {
      const reopen = request?.reopen_allowed_at;
      if (!reopen || new Date(reopen) > new Date()) {
        toast.error("Resubmission not available", { description: `This developer declined the request. You may resubmit after ${formatDate(reopen)} unless the developer invites you.` });
        return;
      }
    }
    setJustSubmitted(false);
    setShowInterest(true);
  };

  const handleSubmitInterest = async (draft: InterestFormDraft) => {
    if (!user || !projectId) {
      toast.error("This listing is not connected yet", { description: "Please choose a live marketplace listing." });
      return;
    }
    if (!agreement || !signatureReady(draft, criteria, agreement)) {
      sonnerToast.error("Complete the required answers and signing affirmations before sending."); return;
    }
    setSubmitting(true);
    const now = new Date().toISOString();
    const { data: saved, error } = await supabase
      .from("access_request")
      .upsert(
        {
          project_id: projectId,
          investor_user_id: user.id,
          status: "requested",
          state: "pending",
          submitted_at: now,
          decided_at: null,
          decided_by: null,
          decision_note: null,
          decline_reason: null,
          scope_granted: null,
          ...signatureEvidence(draft, agreement, now),
          nda_signed_name: draft.signedName,
          nda_signed_role: draft.signatoryRole || null,
          nda_signed_at: now,
          // Signed at submission, operative only on acceptance.
          nda_effective_at: null,
          introduction_logged_at: null,
          fee_tail_expires_at: null,
          developer_question: null,
          developer_question_at: null,
          investor_reply: null,
          investor_reply_at: null,
        },
        { onConflict: "project_id,investor_user_id" },
      )
      .select("*")
      .single();

    if (error || !saved) {
      setSubmitting(false);
      toast.error("Request could not be sent", { description: error?.message || "Please try again." });
      return;
    }

    const { error: answersError } = await supabase.from("access_request_answers").upsert(
      {
        access_request_id: saved.id,
        entity_name: draft.entityName,
        entity_type: draft.entityType || null,
        jurisdiction: draft.jurisdiction || null,
        regulated_status: draft.regulatedStatus || null,
        website: draft.website || null,
        signatory_name: draft.signatoryName,
        signatory_role: draft.signatoryRole || null,
        ticket_band: draft.ticketBand || "under_1m",
        instrument_sought: draft.instrumentSought || "either",
        construction_risk_appetite: draft.constructionRisk || null,
        capital_source: draft.capitalSource || null,
        decision_process: draft.decisionProcess || null,
        earliest_decision_date: draft.earliestDecisionDate || null,
        interest_drivers: draft.interestDrivers,
        diligence_focus: draft.diligenceFocus || null,
        would_lead_club: draft.wouldLeadClub,
        conflicts_declared: draft.conflictsDeclared === "declared",
        conflicts_detail: draft.conflictsDeclared === "declared" ? draft.conflictsDetail : null,
        advisers_receiving_info: draft.advisersReceivingInfo || null,
      },
      { onConflict: "access_request_id" },
    );
    setSubmitting(false);

    if (answersError) {
      toast.error("Request sent without the full answers", { description: answersError.message });
    }

    setRequest(saved);
    setJustSubmitted(true);
    try { localStorage.removeItem(`dhc-interest-draft-${projectId}`); } catch { /* storage unavailable */ }

    await supabase.from("project_interest").upsert(
      { project_id: projectId, investor_user_id: user.id, stage: "interest_submitted" },
      { onConflict: "project_id,investor_user_id" },
    );
  };

  const handleWithdraw = async () => {
    if (!request) return;
    const { data, error } = await supabase
      .from("access_request")
      .update({ state: "withdrawn", status: "withdrawn", decided_at: new Date().toISOString() })
      .eq("id", request.id)
      .select("*")
      .single();
    if (error) {
      toast.error("Withdrawal failed", { description: error.message });
      return;
    }
    setRequest(data);
    toast.success("Request withdrawn", { description: "The developer has been notified that you withdrew before a decision." });
  };

  if (loadingProject || loadingAuth) return <div className="mx-auto max-w-workspace px-5 py-20 text-muted-foreground">Loading project...</div>;
  if (projectError) return <div role="alert" className="mx-auto max-w-workspace px-5 py-20 text-destructive">{projectError}</div>;

  if (!project) {
    const notFound = <div className="mx-auto max-w-workspace px-5 py-20 text-center"><h1 className="mb-4 font-display text-2xl font-semibold text-foreground">Project not found</h1><Button variant="outline" asChild><Link to={context === "app" ? "/app/opportunities" : "/sign-in?redirect=/app/opportunities"}>Back to opportunities</Link></Button></div>;
    return context === "public" ? <PublicShell>{notFound}</PublicShell> : notFound;
  }

  const isLocked = (tab: string) => GATED_TABS.includes(tab) && !granted;
  const sla = request ? slaStatus(request) : null;

  const asOf = {
    financial: databaseProject?.financial_as_of ?? null,
    technical: databaseProject?.technical_as_of ?? null,
    regulatory: databaseProject?.regulatory_as_of ?? null,
  };

  const breakeven = { dscr1x: null as number | null, irrZero: null as number | null };

  const ctaLabel = granted
    ? "Access granted"
    : accessState === "pending"
    ? "Request pending"
    : "Express interest";

  const body = (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-workspace flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <Link to={context === "app" ? "/app/opportunities" : "/sign-in?redirect=/app/opportunities"} className="text-sm font-medium text-muted-foreground hover:text-foreground">Back to opportunities</Link>
        <div className="flex items-center gap-2">
          {isOwner ? (
            <Button size="sm" variant="outline" asChild>
              <Link to="/app/my-deals/listing">Manage listing</Link>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleWatchlist}
                disabled={watchlistBusy || !projectId}
                aria-pressed={!!projectId && watchlist.has(projectId)}
              >
                <Heart className={`h-4 w-4 ${projectId && watchlist.has(projectId) ? "fill-current" : ""}`} />
                {projectId && watchlist.has(projectId) ? "Saved" : "Save"}
              </Button>

            </>
          )}
        </div>
      </div>
      {!isOwner && <AccessStateBar state={accessState} />}

      {/* Hero */}
      <ProjectHero
        project={project}
        onRequestAccess={openInterest}
        loadingAuth={loadingAuth}
        grade={grade}
        granted={granted}
        asOf={asOf}
        ctaLabel={granted ? "Access granted" : accessState === "pending" ? "Request pending" : undefined}
        projectId={projectId}
        watchlisted={projectId ? watchlist.has(projectId) : false}
        watchlistBusy={watchlistBusy || loadingAuth}
        onToggleWatchlist={toggleWatchlist}
      />

      <div className="mx-auto mt-6 max-w-workspace px-5">
        {!granted && <MandateFit draft={mandatePrefill(investorProfile)} criteria={criteria} />}
        {granted && !isOwner && (
          <div className="flex items-start gap-2.5 rounded-xl border border-success-border bg-success-soft px-5 py-4 text-sm text-success">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-success" />
            <p>
              The developer accepted your request on {formatDate(request?.decided_at)}. The confidentiality agreement signed by{" "}
              {request?.nda_signed_name} took effect on {formatDate(request?.nda_effective_at)}, version {request?.nda_version}.
              {isDataRoomOpen(accessState)
                ? " The data room is open."
                : " The data room remains closed until the developer accepts in full."}
            </p>
          </div>
        )}

        {accessState === "pending" && (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-warning/15">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-foreground">Request pending with the developer</h3>
              <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
                Submitted {formatDate(request?.submitted_at)}, {sla?.workingDays ?? 0} working days pending. {sla?.label}.
                The agreement you signed is not yet operative and no introduction has been logged.
              </p>
              {request?.developer_question && (
                <p className="mt-2 rounded-lg bg-muted px-4 py-3 text-sm text-foreground">
                  Question from the developer: {request.developer_question}
                </p>
              )}
              {request?.developer_question && (request.investor_reply_at ?
                <p className="mt-2 text-sm text-muted-foreground">Your reply: {request.investor_reply}</p> :
                <div className="mt-3 space-y-2">
                  <Textarea aria-label="Reply to the developer" value={reply} onChange={event => setReply(event.target.value)} maxLength={3000} />
                  <Button disabled={replyBusy || !reply.trim()} onClick={sendReply}>{replyBusy ? "Sending..." : "Send reply"}</Button>
                </div>)}
            </div>
            <Button variant="outline" onClick={handleWithdraw}>Withdraw request</Button>
          </div>
        )}

        {accessState === "lapsed" && (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-foreground">No decision within 10 working days</h3>
              <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
                Your request has lapsed for want of a decision. Silence is never treated as acceptance, so nothing has been
                revealed and no introduction has been logged. You may withdraw it.
              </p>
            </div>
            <Button variant="outline" onClick={handleWithdraw}>Withdraw request</Button>
          </div>
        )}

        {accessState === "declined" && (
          <div className="flex flex-col gap-4 rounded-xl border border-border bg-card px-6 py-5 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-destructive/10">
              <ShieldX className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold text-foreground">Request declined</h3>
              <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">
                Reason given: {declineReasonLabel(request?.decline_reason ?? null)}.
                {request?.decision_note ? ` Note: ${request.decision_note}` : ""} The listing stays anonymized and no identity was
                revealed. You may resubmit after {formatDate(request?.reopen_allowed_at)} unless the developer invites you sooner.
              </p>
            </div>
          </div>
        )}


      </div>

      {/* Tab bar */}
      <div className={`sticky ${context === "app" ? "top-0" : "top-14"} z-10 mt-6 border-b border-border bg-background`}>
        <div className="mx-auto max-w-workspace px-5">
          <div className="-ml-5 flex flex-nowrap overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex items-center gap-1.5 whitespace-nowrap px-5 py-3.5 text-sm font-medium transition-colors ${
                  activeTab === tab ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
                {isLocked(tab) && <Lock className="h-3 w-3 text-muted-foreground" />}
                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-workspace px-5 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LockedTabOverlay
              locked={isLocked(activeTab)}
              tabName={activeTab}
              mode={user ? "interest" : "signin"}
              pending={accessState === "pending"}
              description={LOCK_COPY[activeTab]}
              onExpressInterest={openInterest}
            >
              <ProjectTabContent
                project={project} numericCapex={granted ? numericCapex : null} granted={granted} projectId={granted ? projectId : undefined}
                activeTab={activeTab} dataRoomStatus={dataRoomStatus}
                isOwner={isOwner} userId={user?.id ?? null}
                grade={grade} asOf={asOf} breakeven={breakeven}
              />
            </LockedTabOverlay>
          </div>
          <div className="lg:col-span-1">
            <ProjectSidebar project={project} onRequestAccess={openInterest} loadingAuth={loadingAuth} isOwner={isOwner} granted={granted} context={context} />
            {context === "app" && databaseProject && (
              <div className="mt-6"><ProjectNewsCard projectId={databaseProject.id} countryCode={databaseProject.country_code} /></div>
            )}
          </div>
        </div>
      </div>

      <ExpressInterestDialog
        open={showInterest}
        onOpenChange={setShowInterest}
        projectId={projectId || slug || "listing"}
        projectTitle={project.title}
        criteria={criteria}
        submitting={submitting}
        submitted={justSubmitted}
        agreement={agreement}
        agreementError={agreementError}
        prefill={mandatePrefill(investorProfile)}
        onSubmit={handleSubmitInterest}
        onClose={() => setJustSubmitted(false)}
      />

    </div>
  );
  return context === "public" ? <PublicShell>{body}</PublicShell> : body;
};

export default ProjectDetail;
