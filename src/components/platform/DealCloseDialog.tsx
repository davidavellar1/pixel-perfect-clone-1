import { useEffect, useState } from "react";
import { AlertTriangle, Check, Clock, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { FlowCallout, FlowHeading, FlowSteps } from "./FlowSteps";
import { FEE_PAYER_LINE, FEE_SENTENCE, calculateSuccessFee } from "@/lib/fee";

export type DealForClose = {
  name: string;
  counterparty: string;
  origination: string;
  value: string;
  valueNumber: number;
};

const formatEur = (value: number) => `${value.toLocaleString("en-GB")} EUR`;

const DealCloseDialog = ({ deal, onClose }: { deal: DealForClose | null; onClose: () => void }) => {
  const { toast } = useToast();
  const { roles } = useAuth();
  const isDeveloper = roles.includes("developer");
  const [step, setStep] = useState(0);
  const [date, setDate] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (deal) {
      setStep(0);
      setDate("");
      setValue(deal.value);
    }
  }, [deal]);

  if (!deal) return null;

  const numeric = Number(value.replace(/[^0-9.]/g, "")) || deal.valueNumber;
  const fee = calculateSuccessFee(numeric);

  const advance = () => {
    if (step === 0) {
      if (!date.trim() || !value.trim()) {
        toast({ title: "Add the close date and realized value", variant: "destructive" });
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    toast({
      title: "Fee invoice issued",
      description: `1% of ${formatEur(numeric)} is payable by the investor. Visible to both parties in Deals.`,
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl gap-0 p-0">
        <div className="flex items-center gap-3.5 border-b border-border px-6 py-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fdf3e2]">
            <Handshake className="h-5 w-5 text-[#b7791f]" />
          </div>
          <div className="min-w-0">
            <DialogTitle className="font-display text-lg font-semibold">{deal.name}</DialogTitle>
            <p className="mt-0.5 text-[13px] text-muted-foreground">Report close and success fee</p>
          </div>
        </div>

        <div className="px-6 pt-4"><FlowSteps step={step} tone="amber" /></div>

        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {step === 0 && (
            <>
              <FlowHeading
                title="Report the close"
                lede={`Either you or ${deal.counterparty} can report a financial close. The other party confirms before any fee is invoiced.`}
              />
              <div className="space-y-4">
                <div>
                  <Label htmlFor="close-date">Financial close date</Label>
                  <Input
                    id="close-date"
                    className="mt-1.5"
                    placeholder="e.g. 14 May 2026"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="close-value">Realized transaction value</Label>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    The basis for the 1% success fee. Confirmed by the counterparty.
                  </p>
                  <Input
                    id="close-value"
                    className="mt-2"
                    placeholder="e.g. 8,000,000 EUR equity"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <FlowHeading title="Awaiting confirmation" />
              {isDeveloper ? (
                <div className="flex items-start gap-3 rounded-xl border border-[#f0dcb4] bg-[#fdf3e2] p-4">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-[#b7791f]" />
                  <div>
                    <p className="font-display text-sm font-semibold text-[#8a5b12]">
                      Pending {deal.counterparty}'s confirmation
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-foreground/75">
                      We have notified the investor to confirm the close and the value. The fee is only invoiced once they confirm.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start gap-3 rounded-xl border border-[#f0dcb4] bg-[#fdf3e2] p-4">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#b7791f]" />
                    <div>
                      <p className="font-display text-sm font-semibold text-[#8a5b12]">Confirmation requested</p>
                      <p className="mt-1 text-[13px] leading-6 text-foreground/75">
                        {deal.counterparty} reported a financial close of {value || deal.value}
                        {date ? ` on ${date}` : ""}. Please confirm or dispute.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2.5">
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setStep(2)}>
                      Confirm close
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Dispute logged",
                          description: "The deal moves to an evidence-based review. No fee is invoiced.",
                        });
                        onClose();
                      }}
                    >
                      Dispute
                    </Button>
                  </div>
                </>
              )}
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                If the counterparty disputes the figure or does not respond within 14 days, the deal moves to an evidence-based review rather than auto invoicing. Both parties retain audit rights on the introduction record.
              </p>
            </>
          )}

          {step === 2 && (
            <>
              <FlowHeading title="Close confirmed, fee invoiced" />
              <div className="rounded-xl bg-[#0f2740] px-6 py-5 text-primary-foreground">
                {[
                  ["Realized transaction value", formatEur(numeric)],
                  ["Success fee rate", "1.0%"],
                  [FEE_PAYER_LINE.split(":")[0].trim(), FEE_PAYER_LINE.split(":")[1].trim()],
                ].map(([label, amount]) => (
                  <div key={label} className="flex justify-between py-1.5 text-sm text-primary-foreground/75">
                    <span>{label}</span>
                    <span>{amount}</span>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-primary-foreground/15 pt-3.5 text-sm text-primary-foreground/75">
                  <span>Fee due</span>
                  <span className="font-display text-[22px] font-semibold text-primary-foreground">{formatEur(Math.round(fee))}</span>
                </div>
              </div>
              <div className="mt-4">
                <FlowCallout tone="ok" title="Both parties confirmed">
                  <span className="inline-flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#1f9d63]" />
                    The introduction record, close date, and value are logged. An invoice has been issued and is visible to both parties.
                  </span>
                </FlowCallout>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">{FEE_SENTENCE}</p>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Origination reads from the logged introduction: {deal.origination}. Both parties were notified at every step.
              </p>
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-muted/40 px-6 py-4">
          <Button variant="ghost" onClick={() => setStep(step - 1)} className={step === 0 ? "invisible" : ""}>
            Back
          </Button>
          {!(step === 1 && !isDeveloper) && (
            <Button onClick={advance} className="bg-[#b7791f] text-white hover:bg-[#a06b18]">
              {step === 0 ? "Report close" : step === 1 ? "Notify counterparty" : "Done"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DealCloseDialog;
