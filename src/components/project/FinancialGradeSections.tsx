import { AlertTriangle, Percent, TrendingUp } from "lucide-react";
import { CASE_LABEL, CASE_ORDER, asOfLine, pct, type CaseRecord, type MarginRecord } from "@/data/investorGrade";

const NOT_STATED = "Not stated";

/** Margin cards. First section of the Financial tab. */
export const MarginSection = ({ margin, asOf }: { margin: MarginRecord | null; asOf?: string | null }) => (
  <div>
    <div className="mb-3 flex items-center gap-2">
      <Percent className="h-5 w-5 text-accent" />
      <h2 className="font-serif text-2xl font-bold text-foreground">Margin</h2>
    </div>
    <div className="mb-2 border-t border-border" />
    <p className="mb-4 text-xs text-muted-foreground">{asOfLine("Financial information", asOf)}. All figures are developer-stated.</p>

    {!margin ? (
      <p className="rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
        The developer has not published heat purchase and tariff pricing for this project yet.
      </p>
    ) : (
      <>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Heat purchase price paid to host", value: margin.heat_purchase_price, index: margin.purchase_index },
            { label: "Customer tariff", value: margin.customer_tariff, index: margin.tariff_index },
            { label: "Gross spread", value: margin.gross_spread, index: margin.opex_per_kwh ? `Opex ${margin.opex_per_kwh} per kWh` : null },
          ].map((card) => (
            <div key={card.label} className="rounded-xl border border-border bg-muted/50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.label}</p>
              <p className="mt-1 font-serif text-2xl font-bold text-foreground">
                {card.value !== null && card.value !== undefined ? `${card.value} per kWh` : NOT_STATED}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{card.index ?? "Indexation not stated"}</p>
            </div>
          ))}
        </div>
        {margin.purchase_floor_cap && (
          <p className="mt-3 text-sm text-muted-foreground">Purchase floor and cap: {margin.purchase_floor_cap}</p>
        )}
        {margin.indexation_mismatch_note && (
          <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{margin.indexation_mismatch_note}</p>
          </div>
        )}
      </>
    )}
  </div>
);

interface CasesProps {
  cases: CaseRecord[];
  breakeven: { dscr1x: number | null; irrZero: number | null; contracted: number | null };
}

/** Cases and sensitivities table plus the break-even callout. */
export const CasesSection = ({ cases, breakeven }: CasesProps) => {
  const ordered = CASE_ORDER.map((name) => cases.find((c) => c.name === name)).filter(Boolean) as CaseRecord[];
  const tone: Record<CaseRecord["name"], string> = {
    base: "bg-card",
    downside: "bg-amber-50",
    stress: "bg-rose-50",
    upside: "bg-emerald-50",
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-2xl font-bold text-foreground">Cases and sensitivities</h2>
      </div>
      <div className="mb-4 border-t border-border" />

      {ordered.length === 0 ? (
        <p className="rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
          The developer has not published a case set for this project yet. Returns are only shown with their case label.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  {["Case", "Connections", "Power price", "Capex variance", "Equity IRR", "Min DSCR"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ordered.map((row) => (
                  <tr key={row.name} className={tone[row.name]}>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{CASE_LABEL[row.name]}</td>
                    <td className="px-4 py-3.5 text-foreground">{row.connections ?? NOT_STATED}</td>
                    <td className="px-4 py-3.5 text-foreground">{row.power_price ?? NOT_STATED}</td>
                    <td className="px-4 py-3.5 text-foreground">{pct(row.capex_variance_pct, 0)}</td>
                    <td className="px-4 py-3.5 text-foreground">{pct(row.equity_irr_pct)} ({CASE_LABEL[row.name].toLowerCase()})</td>
                    <td className="px-4 py-3.5 text-foreground">{row.min_dscr ?? NOT_STATED}x ({CASE_LABEL[row.name].toLowerCase()})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-5 text-sm">
        <p className="mb-1 font-semibold text-foreground">Break-even</p>
        <p className="text-muted-foreground">
          Debt service cover reaches 1.00x at{" "}
          <span className="font-semibold text-foreground">{breakeven.dscr1x ?? "an unstated number of"}</span> connections, and equity IRR
          reaches zero at <span className="font-semibold text-foreground">{breakeven.irrZero ?? "an unstated number of"}</span> connections,
          against {breakeven.contracted ?? "an unstated number of"} contracted connections today. Developer-stated.
        </p>
      </div>
    </div>
  );
};
