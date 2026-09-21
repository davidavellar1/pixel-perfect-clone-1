import { Check, Clock, Lock, ShieldX } from "lucide-react";
import { ACCESS_STATE_LABEL, type ViewerAccess } from "@/lib/access";

const STEPS = [
  { title: "Anonymized listing", sub: "Open to signed-in investors" },
  { title: "Interest submitted", sub: "Agreement signed, awaiting the developer" },
  { title: "Access granted", sub: "Developer accepted" },
  { title: "Data room", sub: "Accepted in full" },
];

const stepFor = (state: ViewerAccess) => {
  if (state === "granted_full") return 4;
  if (state === "granted") return 3;
  if (state === "pending") return 2;
  return 1;
};

const AccessStateBar = ({ state }: { state: ViewerAccess }) => {
  const current = stepFor(state);
  const halted = state === "declined" || state === "withdrawn" || state === "lapsed";

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto max-w-[980px] px-5 py-4">
        <div className="flex max-w-3xl items-center gap-3 overflow-x-auto">
          {STEPS.map((step, index) => {
            const number = index + 1;
            const done = number < current;
            const active = number === current && !halted;
            return (
              <div key={step.title} className="flex min-w-[180px] flex-1 items-center gap-2.5 last:flex-none">
                <div
                  className={`flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 font-display text-[11px] font-semibold ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : active
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : number === 2 && state === "pending" ? <Clock className="h-3.5 w-3.5" /> : number}
                </div>
                <div className="leading-tight">
                  <p className={`font-display text-[13px] font-semibold ${done || active ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.title}
                  </p>
                  <p className="text-[11.5px] text-muted-foreground">{step.sub}</p>
                </div>
                {index < STEPS.length - 1 && <div className={`mx-2 h-0.5 flex-1 ${done ? "bg-primary" : "bg-border"}`} />}
              </div>
            );
          })}
        </div>
        {halted && (
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {state === "declined" ? <ShieldX className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
            {ACCESS_STATE_LABEL[state]}
          </p>
        )}
      </div>
    </div>
  );
};

export default AccessStateBar;
