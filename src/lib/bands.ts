// Shared confidentiality bands: locked projects only ever show ranges, never exact figures.
export const money = (value: number) => `EUR ${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;

export type Band = { label: string; min: number; max: number | null };

export const capacityBandRange = (mw: number): Band =>
  mw < 10 ? { label: "Under 10 MW", min: 0, max: 10 }
  : mw < 25 ? { label: "10-25 MW", min: 10, max: 25 }
  : mw < 50 ? { label: "25-50 MW", min: 25, max: 50 }
  : { label: "50+ MW", min: 50, max: null };

export const capexBandRange = (value: number | null): Band | null =>
  value == null ? null
  : value < 15_000_000 ? { label: "Under EUR 15M", min: 0, max: 15_000_000 }
  : value < 30_000_000 ? { label: "EUR 15-30M", min: 15_000_000, max: 30_000_000 }
  : value < 50_000_000 ? { label: "EUR 30-50M", min: 30_000_000, max: 50_000_000 }
  : { label: "EUR 50M+", min: 50_000_000, max: null };

export const capacityBand = (mw: number) => capacityBandRange(mw).label;
export const capexBand = (value: number | null) => capexBandRange(value)?.label ?? null;
