import { LADDER_TIERS, asOfLine, committedBuildingCount, committedBuildingPct, committedLoadPct, type LadderRecord } from "@/data/investorGrade";

import { designLoadSegments } from "@/lib/figureDisclosure";

interface Props {
  ladder: LadderRecord | null;
}

/**
 * Offtake commitment ladder. Three tiers, never described using absolute commitment language.
 * Shows count and load share per tier plus both committed bases.
 */
const OfftakeLadderBar = ({ ladder }: Props) => {
  if (!ladder) {
    return (
      <div>
        <h2 className="mb-3 font-serif text-2xl font-bold text-foreground">Offtake commitment ladder</h2>
        <div className="mb-4 border-t border-border" />
        <p className="rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
          The developer has not stated a commitment ladder for this project yet. Counts and load shares appear here once entered.
        </p>
      </div>
    );
  }

  const tiers = [
    { ...LADDER_TIERS[0], count: ladder.contracted_count, load: Number(ladder.contracted_load_pct || 0) },
    { ...LADDER_TIERS[1], count: ladder.signed_connection_count, load: Number(ladder.signed_connection_load_pct || 0) },
    { ...LADDER_TIERS[2], count: ladder.in_negotiation_count, load: Number(ladder.in_negotiation_load_pct || 0) },
  ];
  const { shares, remainder } = designLoadSegments(tiers.map((tier) => tier.load));
  const buildingPct = committedBuildingPct(ladder);

  return (
    <div>
      <h2 className="mb-3 font-serif text-2xl font-bold text-foreground">Offtake commitment ladder</h2>
      <div className="mb-2 border-t border-border" />
      <p className="mb-4 text-xs text-muted-foreground">
        {asOfLine("Ladder", ladder.as_of)}. All counts and shares are developer-stated. The platform does not restate or verify them.
      </p>

      <div className="rounded-xl border border-border bg-muted/50 p-5">
        <div className="mb-4 flex h-9 overflow-hidden rounded-lg">
          {tiers.map((tier, index) => (
            <div
              key={tier.key}
              className={`flex items-center justify-center shrink-0 text-xs font-semibold ${index === 2 ? "bg-ladder-negotiation text-foreground" : index === 1 ? "bg-accent text-accent-foreground" : "bg-success text-primary-foreground"}`}
              style={{ width: `${shares[index]}%` }}
              aria-label={`${tier.label}: ${tier.load}% of design load`}
              title={`${tier.label}: ${tier.load}% of design load`}
            >{tier.load >= 6 ? `${tier.load}%` : null}</div>
          ))}
          {remainder > 0 && <div className="bg-border shrink-0" style={{ width: `${remainder}%` }} aria-label={`Uncommitted: ${remainder}% of design load`} title={`Uncommitted: ${remainder}% of design load`} />}
        </div>
        <p className="mb-4 text-sm text-muted-foreground">Uncommitted: {remainder}% of design load</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {tiers.map((tier, index) => (
            <div key={tier.key} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className={`h-3 w-3 rounded-full ${index === 2 ? "bg-ladder-negotiation" : index === 1 ? "bg-accent" : "bg-success"}`} />
                <p className="text-sm font-semibold text-foreground">{tier.label}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {tier.count ?? 0} buildings, {tier.load}% of design load
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-foreground">
          <span className="font-semibold">Offtake committed:</span>{" "}
          {committedBuildingCount(ladder)} of {ladder.total_buildings ?? "an unstated number of"} buildings
          {buildingPct !== null ? ` (${buildingPct.toFixed(0)}% of buildings)` : ""},{" "}
          {committedLoadPct(ladder)}% of design load. Committed means contracted plus signed connection agreements.
        </p>
      </div>
    </div>
  );
};

export default OfftakeLadderBar;
