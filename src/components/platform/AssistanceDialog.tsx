import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { projectsData } from "@/data/projectsData";
import { cn } from "@/lib/utils";
import { FlowHeading, FlowSteps } from "./FlowSteps";

export type AssistanceAdvisor = {
  name: string;
  category: "Financial" | "Legal" | "Technical";
  description: string;
};

const CATEGORIES = ["Financial", "Legal", "Technical"] as const;
const LABELS = ["Find a match", "Send request", "Send request"];

const AssistanceDialog = ({
  advisors,
  preselected,
  onClose,
}: {
  advisors: AssistanceAdvisor[];
  preselected: AssistanceAdvisor | null;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("Financial");
  const [slug, setSlug] = useState("general");
  const [need, setNeed] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setStep(0);
    setCategory(preselected?.category ?? "Financial");
    setSlug("general");
    setNeed("");
    setSelected(preselected?.name ?? null);
  }, [preselected]);

  const suggestions = advisors.filter((advisor) => advisor.category === category);
  const chosen = advisors.find((advisor) => advisor.name === selected) ?? suggestions[0];
  const projectLabel = slug === "general"
    ? "a general request"
    : projectsData.find((item) => item.slug === slug)?.title ?? "your project";

  const advance = () => {
    if (step === 0) {
      if (!selected || !suggestions.some((advisor) => advisor.name === selected)) {
        setSelected(suggestions[0]?.name ?? null);
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    toast({
      title: "Assistance request sent",
      description: `We will introduce you to ${chosen?.name ?? "a vetted advisor"} for ${projectLabel}.`,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-w-xl gap-0 p-0">
        <div className="flex items-center gap-3.5 border-b border-border px-6 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f2ecfa]">
            <Users className="h-5 w-5 text-[#6b3fa0]" />
          </div>
          <div>
            <DialogTitle className="font-display text-lg font-semibold">Request assistance</DialogTitle>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Match with a vetted advisor</p>
          </div>
        </div>

        <div className="px-6 pt-4"><FlowSteps step={step} /></div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step === 0 && (
            <>
              <FlowHeading
                title="What do you need help with?"
                lede="Tell us where you are stuck and we will match you to the right partner."
              />
              <div className="space-y-4">
                <div>
                  <Label>Type of help</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {CATEGORIES.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => { setCategory(item); setSelected(null); }}
                        className={cn(
                          "rounded-lg border px-3.5 py-2 font-display text-[13.5px] font-medium transition-colors",
                          category === item
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-card text-foreground/80 hover:bg-muted",
                        )}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>For which project?</Label>
                  <Select value={slug} onValueChange={setSlug}>
                    <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General / not project specific</SelectItem>
                      {projectsData.map((item) => (
                        <SelectItem key={item.slug} value={item.slug}>{item.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eco-need">Briefly, what do you need?</Label>
                  <Textarea
                    id="eco-need"
                    rows={3}
                    className="mt-1.5"
                    placeholder="e.g. Help structuring the capital stack and a bankability review for an investor pack."
                    value={need}
                    onChange={(event) => setNeed(event.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <FlowHeading
                title="Suggested partners"
                lede={`Based on ${category.toLowerCase()} support for ${projectLabel}.`}
              />
              <div className="space-y-2.5">
                {suggestions.map((advisor) => {
                  const isSelected = (selected ?? suggestions[0]?.name) === advisor.name;
                  return (
                    <button
                      key={advisor.name}
                      type="button"
                      onClick={() => setSelected(advisor.name)}
                      className={cn(
                        "w-full rounded-xl border p-4 text-left transition-colors",
                        isSelected ? "border-accent bg-accent/5" : "border-border bg-card hover:bg-muted/60",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-display text-sm font-semibold text-foreground">{advisor.name}</p>
                        {isSelected && (
                          <span className="rounded-full bg-accent/10 px-2.5 py-1 font-display text-[11.5px] font-semibold text-accent">
                            Selected
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-[12.5px] leading-5 text-muted-foreground">{advisor.description}</p>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <FlowHeading
                title={`Send request to ${chosen?.name ?? "the advisor"}`}
                lede="We introduce you and share your note. You are free to engage any advisor; using ours is optional."
              />
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-[12.5px] leading-6 text-muted-foreground">
                <b className="text-foreground">Disclosure.</b> Advisory partners may pay DHC Market a referral fee for a qualified introduction. This does not affect the fees you pay your advisor, and never influences how we connect investors and developers to each other.
              </div>
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

export default AssistanceDialog;
