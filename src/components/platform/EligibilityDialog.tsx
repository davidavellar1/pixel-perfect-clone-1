import { useEffect, useMemo, useState } from "react";
import { Check, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { projectsData } from "@/data/projectsData";
import { FlowCallout, FlowHeading, FlowSteps } from "./FlowSteps";

export type EligibilityInstrument = {
  name: string;
  type: string;
  eligibility: string[];
};

const LABELS = ["Check eligibility", "Request introduction", "Send introduction"];

const EligibilityDialog = ({
  instrument,
  onClose,
}: {
  instrument: EligibilityInstrument | null;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [slug, setSlug] = useState(projectsData[0]?.slug ?? "");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (instrument) {
      setStep(0);
      setSlug(projectsData[0]?.slug ?? "");
      setNote("");
    }
  }, [instrument]);

  const project = useMemo(() => projectsData.find((item) => item.slug === slug), [slug]);

  const facts = project
    ? [project.country, project.stage, project.source, project.capex]
    : [];

  if (!instrument) return null;

  const advance = () => {
    if (step < 2) {
      setStep(step + 1);
      return;
    }
    toast({
      title: "Introduction requested",
      description: `We will introduce ${project?.title ?? "your project"} to ${instrument.name}. No platform fee applies.`,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-w-xl gap-0 p-0">
        <div className="flex items-center gap-3.5 border-b border-border px-6 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Landmark className="h-5 w-5 text-accent" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="font-display text-lg font-semibold">{instrument.name}</DialogTitle>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Check eligibility · {instrument.type}</p>
          </div>
          <span className="ml-auto rounded-full bg-[#e6f5ec] px-3 py-1 font-display text-[11.5px] font-semibold text-[#1c6e48]">
            Free
          </span>
        </div>

        <div className="px-6 pt-4">
          <FlowSteps step={step} />
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step === 0 && (
            <>
              <FlowHeading
                title="Which project?"
                lede="We check the instrument's criteria against your project. We never share your identity with the institution without your go-ahead."
              />
              <div className="space-y-4">
                <div>
                  <Label>Project</Label>
                  <Select value={slug} onValueChange={setSlug}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {projectsData.map((item) => (
                        <SelectItem key={item.slug} value={item.slug}>
                          {item.title} ({item.stage})
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
          )}

          {step === 1 && (
            <>
              <FlowHeading title="Eligibility result" />
              <FlowCallout tone="ok" title="Likely eligible">
                This project appears to meet the published criteria for {instrument.name}. The final assessment is the institution's.
              </FlowCallout>
              <div className="mt-4 space-y-1">
                {instrument.eligibility.map((criterion) => (
                  <div key={criterion} className="flex items-center gap-2.5 py-1.5 text-[13px] text-foreground/80">
                    <Check className="h-4 w-4 shrink-0 text-[#1f9d63]" />
                    {criterion}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Checked against {project?.title}: {facts.join(" · ")}.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <FlowHeading
                title="Request a warm introduction"
                lede={`We pass your standardized project pack to the relevant contact at ${instrument.name} and introduce you. This is free; there is no platform fee on public funding.`}
              />
              <div className="mb-4">
                <Label htmlFor="pf-note">Note to the institution (optional)</Label>
                <Textarea
                  id="pf-note"
                  className="mt-1.5"
                  rows={3}
                  placeholder="Anything you would like to add..."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>
              <FlowCallout tone="ok" title="Free introduction">
                No success fee, no charge. Public co-financing is our de-risking layer, not a revenue line.
              </FlowCallout>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-6 py-4">
          <Button variant="ghost" onClick={() => setStep(step - 1)} className={step === 0 ? "invisible" : ""}>
            Back
          </Button>
          <Button onClick={advance} className="bg-accent text-accent-foreground hover:bg-accent/90">
            {LABELS[step]}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EligibilityDialog;
