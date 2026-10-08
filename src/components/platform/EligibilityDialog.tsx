import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Landmark, Minus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "@/lib/router-compat";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  APPLICANT_LABEL,
  COUNTRY_NAMES,
  INSTRUMENT_LABEL,
  callLabel,
  callState,
  fitCriteria,
  humanize,
  type FundingEntry,
  type OwnProject,
} from "@/lib/funding";
import { FlowCallout, FlowHeading, FlowSteps } from "./FlowSteps";

const LABELS = ["Check fit", "Done"];

const EligibilityDialog = ({
  entry,
  projects,
  onClose,
}: {
  entry: FundingEntry | null;
  projects: OwnProject[];
  onClose: () => void;
}) => {
  const { view } = useAuth();
  const [step, setStep] = useState(0);
  const [projectId, setProjectId] = useState("");

  useEffect(() => {
    if (entry) {
      setStep(0);
      setProjectId(projects[0]?.id ?? "");
    }
  }, [entry, projects]);

  const project = useMemo(
    () => projects.find((p) => p.id === projectId) ?? null,
    [projects, projectId],
  );
  const criteria = useMemo(
    () => (entry && project ? fitCriteria(entry, project) : []),
    [entry, project],
  );

  if (!entry) return null;

  const fails = criteria.filter((c) => c.state === "fails").length;
  const headline =
    fails === 0
      ? "Indicative fit"
      : fails === 1
        ? "Partial fit"
        : "Not a fit on published criteria";
  const call = callState(entry);
  const types = entry.instrument_types.map((t) => INSTRUMENT_LABEL[t] || humanize(t)).join(", ");
  const applicants = entry.applicant_types.map((a) => APPLICANT_LABEL[a] || humanize(a));
  const facts = project
    ? [
        COUNTRY_NAMES[project.country_code] || project.country_code,
        humanize(project.lifecycle_stage),
        humanize(project.technology),
        humanize(project.project_type),
      ]
    : [];

  const advance = () => {
    if (step === 0 && project) {
      setStep(1);
      return;
    }
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="max-w-xl gap-0 p-0">
        <div className="flex items-center gap-3.5 border-b border-border px-5 py-5 sm:px-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Landmark className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="font-display text-lg font-semibold">
              {entry.name_en || entry.name}
            </DialogTitle>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Check eligibility · {types}</p>
          </div>
          <span className="ml-auto rounded-full bg-[#e6f5ec] px-3 py-1 font-display text-[11.5px] font-semibold text-[#1c6e48]">
            Free
          </span>
        </div>

        <div className="px-5 pt-4 sm:px-6">
          <FlowSteps step={step} total={2} />
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-5 py-5 sm:px-6">
          {!projects.length ? (
            <>
              <FlowHeading
                title="Published criteria"
                lede="Add a listing to check the fit against your own project."
              />
              <ul className="space-y-1.5 text-[13px] text-foreground/80">
                <li>
                  Countries:{" "}
                  {entry.country_codes.map((c) => COUNTRY_NAMES[c] || c).join(", ") || "Not stated"}
                </li>
                <li>
                  Stages:{" "}
                  {entry.stages.length ? entry.stages.map(humanize).join(", ") : "Not restricted"}
                </li>
                <li>
                  Technologies:{" "}
                  {entry.technologies.length
                    ? entry.technologies.map(humanize).join(", ")
                    : "Not restricted"}
                </li>
                <li>
                  Project types:{" "}
                  {entry.project_types.length
                    ? entry.project_types.map(humanize).join(", ")
                    : "Not restricted"}
                </li>
                <li>
                  Applicants:{" "}
                  {applicants.length ? applicants.join(", ") : "Check on the official page"}
                </li>
              </ul>
              {view !== "investor" && (
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/app/submit-project">Add a listing</Link>
                </Button>
              )}
            </>
          ) : step === 0 ? (
            <>
              <FlowHeading
                title="Which project?"
                lede="We compare your listing with the programme's published criteria. Nothing is sent to the funding body."
              />
              <div className="space-y-4">
                <div>
                  <Label>Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.title} ({humanize(item.lifecycle_stage)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Key facts</Label>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    Read from your listing. Update the listing to change them.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {facts.map((fact) => (
                      <span
                        key={fact}
                        className="rounded-lg border border-accent bg-accent/10 px-3 py-2 font-display text-[13px] font-medium text-accent"
                      >
                        {fact}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <FlowHeading title="Indicative result" />
              <FlowCallout tone={fails === 0 ? "ok" : "maybe"} title={headline}>
                This is an indicative check against published criteria; the funding body decides
                eligibility.
              </FlowCallout>
              <div className="mt-4 space-y-1">
                {criteria.map((c) => (
                  <div
                    key={c.label}
                    className="flex items-start gap-2.5 py-1.5 text-[13px] text-foreground/80"
                  >
                    {c.state === "meets" && (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1f9d63]" />
                    )}
                    {c.state === "fails" && (
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    )}
                    {c.state === "open" && (
                      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span>
                      <span className="font-semibold">{c.label}:</span> {c.detail}
                    </span>
                  </div>
                ))}
                <div className="flex items-start gap-2.5 py-1.5 text-[13px] text-foreground/80">
                  <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="font-semibold">Applicant:</span> check on the official page
                    {applicants.length ? ` (accepted: ${applicants.join(", ")})` : ""}
                  </span>
                </div>
              </div>
              <p
                className={cn(
                  "mt-4 text-[13px] font-medium",
                  call.kind === "open" && call.urgent ? "text-warning" : "text-foreground/80",
                )}
              >
                {callLabel(call)}
                {"call" in call ? ` – ${call.call.title}` : ""}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-muted/40 px-5 py-4 sm:px-6">
          <Button
            variant="ghost"
            onClick={() => setStep(0)}
            className={step === 0 || !projects.length ? "invisible" : ""}
          >
            Back
          </Button>
          <div className="flex flex-wrap gap-2">
            {(step === 1 || !projects.length) && (
              <Button asChild variant="outline">
                <a
                  href={"call" in call ? call.call.call_url : entry.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open official page <ExternalLink className="ml-1 h-3.5 w-3.5" />
                </a>
              </Button>
            )}
            <Button
              onClick={projects.length ? advance : onClose}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {projects.length ? LABELS[step] : "Close"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EligibilityDialog;
