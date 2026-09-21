import { HardHat } from "lucide-react";
import { asOfLine, eur, pct, type ConstructionRecord } from "@/data/investorGrade";

const NOT_STATED = "Not stated";

/** First section of the Technical tab: the construction package. */
const ConstructionPackageSection = ({ construction, asOf }: { construction: ConstructionRecord | null; asOf?: string | null }) => {
  const c = construction;
  const cells = [
    { label: "EPC contractor", value: c?.epc_contractor ? `${c.epc_contractor}${c.epc_named_in_dataroom ? " (contract named in the data room)" : ""}` : NOT_STATED },
    { label: "Contract type and value", value: c?.contract_type ? `${c.contract_type}, ${eur(c.contract_value)}` : NOT_STATED },
    { label: "Liquidated damages", value: c?.ld_rate ? `${c.ld_rate}, cap ${pct(c.ld_cap_pct, 0)}` : NOT_STATED },
    { label: "Security", value: c?.security ?? NOT_STATED },
    { label: "Contingency", value: c?.contingency_amount ? `${eur(c.contingency_amount)} (${pct(c.contingency_pct, 1)})` : NOT_STATED },
    { label: "Schedule float", value: c?.schedule_float_months ? `${c.schedule_float_months} months` : NOT_STATED },
  ];

  const rows = [
    { label: "Permits status", value: c?.permits_status ?? NOT_STATED },
    { label: "Interface risk", value: c?.interface_risk ?? NOT_STATED },
    { label: "Operations and maintenance", value: c?.om_contract ?? NOT_STATED },
  ];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <HardHat className="h-5 w-5 text-accent" />
        <h2 className="font-serif text-2xl font-bold text-foreground">Construction package</h2>
      </div>
      <div className="mb-2 border-t border-border" />
      <p className="mb-4 text-xs text-muted-foreground">
        {asOfLine("Technical information", asOf)}. All items are developer-stated.
      </p>

      {!c ? (
        <p className="rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
          The developer has not published a construction package for this project yet. This is expected at concept and feasibility stage.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cells.map((cell) => (
              <div key={cell.label} className="rounded-xl border border-border bg-muted/50 p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{cell.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{cell.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border bg-card px-6 py-2">
            {rows.map((row) => (
              <div key={row.label} className="flex items-start justify-between gap-6 border-b border-border py-3 last:border-0">
                <p className="text-sm text-muted-foreground">{row.label}</p>
                <p className="text-right text-sm font-semibold text-foreground">{row.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ConstructionPackageSection;
