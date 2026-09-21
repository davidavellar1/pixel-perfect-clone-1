import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "@/lib/router-compat";
import PublicShell from "@/components/public/PublicShell";
import ProjectHero from "@/components/project/ProjectHero";
import ProjectSidebar from "@/components/project/ProjectSidebar";
import ProjectTabContent from "@/components/project/ProjectTabContent";
import LockedTabOverlay from "@/components/project/LockedTabOverlay";
import type { DataRoomStatus } from "@/components/project/ProjectTabContent";
import AccessStateBar from "@/components/project/AccessStateBar";
import ExpressInterestDialog, { type InterestFormDraft } from "@/components/project/ExpressInterestDialog";
import { Button } from "@/components/ui/button";
import { Heart, Lock, CheckCircle2, Clock, ShieldX, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { projectsData, slugify, type ProjectDetail as ProjectDetailData } from "@/data/projectsData";
import type { Tables } from "@/integrations/supabase/types";
import { useInvestorGrade } from "@/hooks/useInvestorGrade";
import {
  addDays, addMonths, declineReasonLabel, effectiveState, formatDate, isDataRoomOpen, isGranted,
  slaStatus, REOPEN_BLOCK_DAYS, FEE_TAIL_MONTHS, type AccessCriteriaRow, type AccessRequestRow, type ViewerAccess,
} from "@/lib/access";
import { NDA_DOCUMENT_VERSION } from "@/lib/fee";

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
  const { toast } = useToast();
  const staticProject = projectsData.find((p) => p.slug === slug || slugify(p.title) === slug);
  const [databaseProject, setDatabaseProject] = useState<Tables<"project"> | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [showInterest, setShowInterest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [request, setRequest] = useState<AccessRequestRow | null>(null);
  const [criteria, setCriteria] = useState<AccessCriteriaRow | null>(null);
  const [investorProfile, setInvestorProfile] = useState<Tables<"investor_profiles"> | null>(null);
  const { grade } = useInvestorGrade(databaseProject?.id);

  const accessState: ViewerAccess = request ? effectiveState(request) : "teaser";
  const granted = isGranted(accessState);
  const dataRoomStatus: DataRoomStatus = isDataRoomOpen(accessState)
    ? "approved"
    : accessState === "pending"
    ? "pending"
    : "none";

  const baseProject: ProjectDetailData | undefined = staticProject || (databaseProject ? {
    ...projectsData[0], slug: databaseProject.slug, title: databaseProject.title,
    summary: databaseProject.summary || databaseProject.description || "Project details supplied by the developer.",
    summaryExtended: databaseProject.description || undefined,
    location: `${databaseProject.city}, ${databaseProject.country_code}`,
    country: databaseProject.country_code, source: databaseProject.technology.replace(/_/g, " "),
    technology: databaseProject.technology.replace(/_/g, " "), stage: databaseProject.lifecycle_stage.replace(/_/g, " "),
    badge: databaseProject.project_type.replace(/_/g, " "), capacity: `${databaseProject.capacity_mw} MW`,
    capex: databaseProject.headline_investment ? `EUR ${(databaseProject.headline_investment / 1_000_000).toFixed(1)}M` : "Not stated",
    targetIRR: "See the Transaction tab",
    co2Reduction: databaseProject.headline_co2_tonnes ? `${databaseProject.headline_co2_tonnes.toLocaleString()} tonnes/yr` : "Not stated",
    householdsServed: databaseProject.households_served?.toLocaleString() || "Not stated",
    timelineRange: [databaseProject.timeline_start?.slice(0, 4), databaseProject.timeline_end?.slice(0, 4)].filter(Boolean).join(" to ") || "To be confirmed",
    developer: { ...projectsData[0].developer, name: "Project developer", verified: databaseProject.verified },
  } : undefined);

  /** Teaser and every non-granted state stay anonymized: no identity, no city. */
  const capacityValue = Number(databaseProject?.capacity_mw || parseFloat(baseProject?.capacity || "0"));
  const capexValue = Number(databaseProject?.headline_investment || parseFloat((baseProject?.capex || "0").replace(/[^0-9.]/g, "")) * 1_000_000);
  const capacityBand = capacityValue < 10 ? "Under 10 MW" : capacityValue < 25 ? "10-25 MW" : capacityValue < 50 ? "25-50 MW" : "50+ MW";
  const capexBand = capexValue < 15_000_000 ? "Under EUR 15M" : capexValue < 30_000_000 ? "EUR 15-30M" : capexValue < 50_000_000 ? "EUR 30-50M" : "EUR 50M+";
  const project: ProjectDetailData | undefined = baseProject && !granted
    ? {
        ...baseProject,
        title: `${baseProject.technology} ${baseProject.badge.toLowerCase()}, ${baseProject.country}`,
        location: baseProject.country,
        capacity: capacityBand,
        capex: capexBand,
        targetIRR: "",
        equityRequired: "",
        minTicket: "",
        co2Reduction: "",
        householdsServed: "",
        developer: { ...baseProject.developer, name: "Developer identity withheld until access is granted", verified: baseProject.developer.verified },
      }
    : baseProject;

  const loadEngagement = useCallback(async (authUserId: string | null, projectId: string) => {
    if (!authUserId) {
      setRequest(null);
      return;
    }
    const [{ data: requestRow }, { data: profileRow }] = await Promise.all([
      supabase.from("access_request").select("*").eq("project_id", projectId).eq("investor_user_id", authUserId).maybeSingle(),
      supabase.from("investor_profiles").select("*").eq("user_id", authUserId).maybeSingle(),
    ]);
    setRequest(requestRow ?? null);
    setInvestorProfile(profileRow ?? null);
  }, []);

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
    if (!slug) return;
    supabase.from("project").select("*").eq("slug", slug).maybeSingle().then(({ data }) => setDatabaseProject(data));
  }, [slug]);

  useEffect(() => {
    if (!databaseProject) return;
    loadEngagement(user?.id ?? null, databaseProject.id);
    supabase.from("listing_access_criteria").select("*").eq("project_id", databaseProject.id).maybeSingle()
      .then(({ data }) => setCriteria(data ?? null));
  }, [databaseProject, loadEngagement, user]);

  const openInterest = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to send an expression of interest.",
        variant: "destructive",
      });
      navigate(`/sign-in?redirect=${encodeURIComponent(context === "app" ? `/app/projects/${slug}` : `/projects/${slug}`)}`);
      return;
    }
    if (granted) {
      toast({ title: "Access already granted", description: "The project detail is unlocked for you." });
      return;
    }
    if (accessState === "pending") {
      toast({ title: "Request pending", description: "The developer has your request and the signed agreement." });
      return;
    }
    if (accessState === "declined") {
      const reopen = request?.reopen_allowed_at;
      if (!reopen || new Date(reopen) > new Date()) {
        toast({
          title: "Resubmission not available",
          description: `This developer declined the request. You may resubmit after ${formatDate(reopen)} unless the developer invites you.`,
          variant: "destructive",
        });
        return;
      }
    }
    setJustSubmitted(false);
    setShowInterest(true);
  };

  const handleSubmitInterest = async (draft: InterestFormDraft) => {
    if (!user || !databaseProject) {
      toast({ title: "This listing is not connected yet", description: "Please choose a live marketplace listing.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    let ip: string | null = null;
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      ip = (await response.json())?.ip ?? null;
    } catch {
      ip = null;
    }
    const now = new Date().toISOString();
    const { data: saved, error } = await supabase
      .from("access_request")
      .upsert(
        {
          project_id: databaseProject.id,
          investor_user_id: user.id,
          status: "requested",
          state: "pending",
          submitted_at: now,
          decided_at: null,
          decided_by: null,
          decision_note: null,
          decline_reason: null,
          scope_granted: null,
          nda_version: NDA_DOCUMENT_VERSION,
          nda_signed_name: draft.signedName,
          nda_signed_role: draft.signatoryRole || null,
          nda_signed_at: now,
          nda_ip: ip,
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
      toast({ title: "Request could not be sent", description: error?.message || "Please try again.", variant: "destructive" });
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
      toast({ title: "Request sent without the full answers", description: answersError.message, variant: "destructive" });
    }

    setRequest(saved);
    setJustSubmitted(true);
    try { localStorage.removeItem(`dhc-interest-draft-${databaseProject.id}`); } catch { /* storage unavailable */ }

    await supabase.from("project_interest").upsert(
      { project_id: databaseProject.id, investor_user_id: user.id, stage: "interest_submitted" },
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
      toast({ title: "Withdrawal failed", description: error.message, variant: "destructive" });
      return;
    }
    setRequest(data);
    toast({ title: "Request withdrawn", description: "The developer has been notified that you withdrew before a decision." });
  };

  if (!project) {
    const notFound = <div className="mx-auto max-w-[980px] px-5 py-20 text-center"><h1 className="mb-4 font-display text-2xl font-semibold text-foreground">Project not found</h1><Button variant="outline" asChild><Link to={context === "app" ? "/app/opportunities" : "/sign-in?redirect=/app/opportunities"}>Back to opportunities</Link></Button></div>;
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
      <div className="mx-auto flex max-w-[980px] items-center justify-between gap-3 border-b border-border px-5 py-3">
        <Link to={context === "app" ? "/app/opportunities" : "/sign-in?redirect=/app/opportunities"} className="text-sm font-medium text-muted-foreground hover:text-foreground">Back to opportunities</Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><Heart className="h-4 w-4" />Save</Button>
          <Button size="sm" onClick={openInterest} disabled={loadingAuth}>{ctaLabel}</Button>
        </div>
      </div>
      <AccessStateBar state={accessState} />

      {/* Hero */}
      <ProjectHero
        project={project}
        onRequestAccess={openInterest}
        loadingAuth={loadingAuth}
        grade={grade}
        asOf={asOf}
        ctaLabel={granted ? "Access granted" : accessState === "pending" ? "Request pending" : undefined}
      />

      <div className="mx-auto mt-6 max-w-[980px] px-5">
        {granted && (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-600" />
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

        {(accessState === "teaser" || accessState === "withdrawn") && (
          <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-6 py-5 text-primary-foreground sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-primary-foreground/10">
              <Lock className="h-5 w-5 text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-base font-semibold">Nothing is revealed until the developer accepts your request</h3>
              <p className="mt-1 max-w-[62ch] text-sm text-primary-foreground/70">{HELPER_TEXT}</p>
            </div>
            <Button
              onClick={openInterest}
              disabled={loadingAuth}
              className="bg-accent font-semibold text-accent-foreground hover:bg-accent/90"
            >
              <Send className="mr-2 h-4 w-4" />
              Express interest
            </Button>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="sticky top-14 z-10 mt-6 border-b border-border bg-background">
        <div className="mx-auto max-w-[980px] px-5">
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
      <div className="mx-auto max-w-[980px] px-5 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {isLocked(activeTab) ? (
              <LockedTabOverlay
                tabName={activeTab}
                mode={user ? "interest" : "signin"}
                pending={accessState === "pending"}
                description={LOCK_COPY[activeTab]}
                onExpressInterest={openInterest}
              >
                <ProjectTabContent project={project} activeTab={activeTab} grade={grade} asOf={asOf} breakeven={breakeven} />
              </LockedTabOverlay>
            ) : (
              <ProjectTabContent
                project={project}
                activeTab={activeTab}
                dataRoomStatus={dataRoomStatus}
                grade={grade}
                asOf={asOf}
                breakeven={breakeven}
              />
            )}
          </div>
          <div className="lg:col-span-1">
            <ProjectSidebar project={project} onRequestAccess={openInterest} loadingAuth={loadingAuth} />
          </div>
        </div>
      </div>

      <ExpressInterestDialog
        open={showInterest}
        onOpenChange={setShowInterest}
        projectId={databaseProject?.id || slug || "listing"}
        projectTitle={project.title}
        criteria={criteria}
        submitting={submitting}
        submitted={justSubmitted}
        prefill={{
          entityName: investorProfile?.company_name || "",
          signatoryName: investorProfile?.full_name || "",
        }}
        onSubmit={handleSubmitInterest}
        onClose={() => setJustSubmitted(false)}
      />

    </div>
  );
  return context === "public" ? <PublicShell>{body}</PublicShell> : body;
};

export default ProjectDetail;
