import { cn } from "@/lib/utils";

export const FlowSteps = ({
  step,
  total = 3,
  tone = "accent",
}: {
  step: number;
  total?: number;
  tone?: "accent" | "amber";
}) => (
  <div className="flex gap-1.5 pb-1">
    {Array.from({ length: total }).map((_, index) => (
      <div
        key={index}
        className={cn(
          "h-1 flex-1 rounded-full bg-muted",
          index <= step && (tone === "amber" ? "bg-[#b7791f]" : "bg-accent"),
        )}
      />
    ))}
  </div>
);

export const FlowHeading = ({ title, lede }: { title: string; lede?: string }) => (
  <div className="mb-4">
    <h4 className="font-display text-base font-semibold text-foreground">{title}</h4>
    {lede && <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{lede}</p>}
  </div>
);

export const FlowCallout = ({
  tone,
  title,
  children,
}: {
  tone: "ok" | "maybe";
  title: string;
  children?: React.ReactNode;
}) => (
  <div
    className={cn(
      "rounded-xl border p-4",
      tone === "ok"
        ? "border-[#c9e8d5] bg-[#e6f5ec]"
        : "border-[#f0dcb4] bg-[#fdf3e2]",
    )}
  >
    <p className={cn("font-display text-sm font-semibold", tone === "ok" ? "text-[#1c6e48]" : "text-[#8a5b12]")}>
      {title}
    </p>
    {children && <div className="mt-1 text-[13px] leading-6 text-foreground/75">{children}</div>}
  </div>
);
