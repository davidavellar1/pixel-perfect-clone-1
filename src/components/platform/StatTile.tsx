import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A count with an icon, used on the My Deals pages. */
const StatTile = ({ icon: Icon, label, value, tone }: { icon: LucideIcon; label: string; value: string; tone?: "success" }) => (
  <div className="rounded-lg border border-border bg-background p-4">
    <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", tone === "success" ? "bg-success-soft text-success" : "bg-muted text-foreground")}><Icon className="h-[18px] w-[18px]" aria-hidden="true" /></span>
    <p className="mt-3 font-display text-2xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

export default StatTile;
