import type { ReactNode } from "react";
import { money } from "@/lib/bands";
import { beforeClose, bodyLabel, contingentCapex, runningConditions, statusLabel, supportPerEquityEuro, type FundingRow } from "@/lib/publicFundingViews";

const date = (value: string | null) => value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC" }) : "Decision date not stated";
const amount = (value: number | null) => value === null ? "Amount not stated" : money(value);

function Panel({ title, note, children }: { title: string; note: string; children: ReactNode }) {
  return <section className="rounded-lg border border-border bg-card p-5">
    <h2 className="font-display text-sm font-semibold">{title}</h2>
    <p className="mb-4 mt-1 text-[11px] text-muted-foreground">{note}</p>
    {children}
  </section>;
}

/** Capex that depends on public funding not yet awarded, by the body that decides it. */
export function ContingentCapexPanel({ rows, capexByProject, scope }: { rows: FundingRow[]; capexByProject: Map<string, number | null>; scope: string }) {
  const result = contingentCapex(rows, capexByProject);
  return <Panel title="Capex contingent on public funding" note={`${scope}. Developer-stated amounts; the deciding body decides.`}>
    {!result ? <p className="text-sm text-muted-foreground">No stated capex is open to you for these projects.</p> : <>
      <p className="text-sm"><strong>{result.pct.toFixed(0)}%</strong> of {money(result.totalCapex)} stated capex across {result.projects} project{result.projects === 1 ? "" : "s"} depends on public funding not yet awarded ({money(result.contingent)}).</p>
      {(result.rowsWithoutAmount > 0 || result.rowsWithoutStatus > 0) && <p className="mt-1 text-xs text-muted-foreground">{[result.rowsWithoutAmount ? `${result.rowsWithoutAmount} pending line${result.rowsWithoutAmount === 1 ? " has" : "s have"} no stated amount` : "", result.rowsWithoutStatus ? `${result.rowsWithoutStatus} line${result.rowsWithoutStatus === 1 ? " has" : "s have"} no recorded status` : ""].filter(Boolean).join("; ")} and {result.rowsWithoutAmount + result.rowsWithoutStatus === 1 ? "is" : "are"} not counted.</p>}
      {result.byBody.length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-xs"><thead><tr className="text-left text-muted-foreground"><th scope="col" className="py-2 pr-3 font-semibold">Deciding body</th><th scope="col" className="py-2 pr-3 font-semibold">Project</th><th scope="col" className="py-2 pr-3 font-semibold">Amount sought</th><th scope="col" className="py-2 pr-3 font-semibold">Status</th><th scope="col" className="py-2 font-semibold">Decision date</th></tr></thead>
        <tbody>{result.byBody.flatMap((group) => group.rows.map((row, index) => <tr key={`${group.body}-${row.projectId}-${index}`} className="border-t border-border"><td className="py-2 pr-3 font-semibold">{index === 0 ? group.body : ""}</td><td className="py-2 pr-3">{row.projectLabel}</td><td className="py-2 pr-3">{amount(row.amount)}</td><td className="py-2 pr-3">{statusLabel(row.status)}</td><td className="py-2">{date(row.decisionDate)}</td></tr>))}</tbody></table></div>}
    </>}
  </Panel>;
}

/** Public support per euro of equity sought, awarded only and if everything sought is awarded. */
export function SupportPerEquityPanel({ rows, equityByProject }: { rows: FundingRow[]; equityByProject: Map<string, number | null> }) {
  const result = supportPerEquityEuro(rows, equityByProject);
  return <Panel title="Public support per euro of equity" note="Two readings of the same developer-stated figures. Neither is a forecast.">
    {!result ? <p className="text-sm text-muted-foreground">No stated equity sought is open to you for these projects.</p> : <dl className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="rounded-md bg-muted p-3"><dt className="text-xs text-muted-foreground">Awarded funding only</dt><dd className="mt-1 font-display text-lg font-semibold">EUR {result.awardedOnly.toFixed(2)}</dd><dd className="text-xs text-muted-foreground">{money(result.awarded)} awarded / {money(result.equity)} equity sought</dd></div>
      <div className="rounded-md bg-muted p-3"><dt className="text-xs text-muted-foreground">If everything sought is awarded</dt><dd className="mt-1 font-display text-lg font-semibold">EUR {result.ifAllAwarded.toFixed(2)}</dd><dd className="text-xs text-muted-foreground">{money(result.awarded + result.sought)} / {money(result.equity)} equity sought</dd></div>
      <p className="text-xs text-muted-foreground sm:col-span-2">Across {result.projects} project{result.projects === 1 ? "" : "s"} with stated equity sought.</p>
    </dl>}
  </Panel>;
}

/** Pipeline: what still has to be decided before close. */
export function BeforeClosePanel({ rows }: { rows: FundingRow[] }) {
  const pending = beforeClose(rows);
  return <Panel title="What has to land before close" note="Public funding still awaiting a decision on projects in your pipeline that are open to you.">
    {!pending.length ? <p className="text-sm text-muted-foreground">No pending public funding is recorded on these projects.</p> : <ul className="space-y-2 text-xs">{pending.map((row, index) => <li key={`${row.projectId}-${index}`} className="flex flex-wrap justify-between gap-2 border-t border-border pt-2 first:border-0 first:pt-0"><span><strong>{row.projectLabel}</strong>: {row.source}, {bodyLabel(row)}</span><span className="text-muted-foreground">{amount(row.amount)} | {statusLabel(row.status)} | {date(row.decisionDate)}</span></li>)}</ul>}
  </Panel>;
}

/** Realised: awarded grants whose stated conditions still run. */
export function RunningConditionsPanel({ rows }: { rows: FundingRow[] }) {
  const running = runningConditions(rows);
  return <Panel title="Grant conditions still running" note="Awarded public funding with conditions the developer has stated, on realised positions.">
    {!running.length ? <p className="text-sm text-muted-foreground">No awarded funding with stated conditions is recorded on these projects.</p> : <ul className="space-y-2 text-xs">{running.map((row, index) => <li key={`${row.projectId}-${index}`} className="border-t border-border pt-2 first:border-0 first:pt-0"><strong>{row.projectLabel}</strong>: {row.source}, {bodyLabel(row)}, {amount(row.amount)}<span className="mt-0.5 block text-muted-foreground">{row.conditions}</span></li>)}</ul>}
  </Panel>;
}
