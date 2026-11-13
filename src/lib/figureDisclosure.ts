import type { ViewerAccess } from "./access";
import { isGranted } from "./access";

export function baseCaseReturn(state: ViewerAccess, cases: { name: string; equity_irr_pct: number | null }[]) {
  if (!isGranted(state)) return null;
  return cases.find((row) => row.name === "base")?.equity_irr_pct ?? null;
}

export function designLoadSegments(loads: number[]) {
  const shares = loads.map((load) => Number.isFinite(load) ? Math.max(0, Math.min(100, load)) : 0);
  return { shares, remainder: Math.max(0, 100 - shares.reduce((sum, share) => sum + share, 0)) };
}

export function ownershipRows(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry: unknown) => {
    if (!entry || typeof entry !== "object") return [];
    const row = entry as Record<string, unknown>;
    return typeof row.holder === "string" && typeof row.pct === "number"
      ? [{ name: row.holder, share: row.pct }] : [];
  });
}
