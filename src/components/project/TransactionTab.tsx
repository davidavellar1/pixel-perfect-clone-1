import { Handshake } from "lucide-react";
import { FEE_SENTENCE } from "@/lib/fee";
import type { ProjectDetail } from "@/lib/blankProject";
import { ProjectFieldValue } from "./ProjectFieldValue";
import { fundingAssumptionLines } from "@/lib/submission/disclosures";
import {
  DEVELOPER_STATED,
  INSTRUMENT_LABEL,
  asOfLine,
  eur,
  pct,
  type InvestorGradeBundle,
} from "@/data/investorGrade";

const Section = ({ title, icon, children, note }: { title: string; icon: React.ReactNode; children: React.ReactNode; note?: string }) => (
  <div>
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h2 className="font-serif text-2xl font-bold text-foreground">{title}</h2>
    </div>
    <div className="mb-2 border-t border-border" />
    {note && <p className="mb-4 text-xs text-muted-foreground">{note}</p>}
    {children}
  </div>
);

/** The offer, capitalisation, governance and process. Placed second, after Overview. */
const TransactionTab = ({ grade, project, asOf }: { grade: InvestorGradeBundle; project: ProjectDetail; asOf?: string | null }) => {
  const t = grade.transaction;
  const baseCase = grade.cases.find((c) => c.name === "base");
  const downCase = grade.cases.find((c) => c.name === "downside");

  return (
    <div className="space-y-10">
      {!t && (
        <p className="rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
          <ProjectFieldValue fieldKey="project_transaction.instrument" stage={project.stage} askedFields={project.askedFields} />
        </p>
      )}

      {/* Offer */}
      {t && <><Section
        title="The offer"
        icon={<Handshake className="h-5 w-5 text-accent" />}
        note={`Every figure below is ${DEVELOPER_STATED}. ${asOfLine("Transaction terms", asOf)}.`}
      >
        <div className="rounded-xl border border-border bg-primary p-6 text-primary-foreground">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Instrument</p>
              <p className="mt-1 text-lg font-semibold">{t?.instrument ? INSTRUMENT_LABEL[t.instrument] ?? t.instrument : null}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Equity sought</p>
              <p className="mt-1 text-lg font-semibold">
                {/* No zero tile: a missing or zero equity figure renders the typed absence. */}
                <ProjectFieldValue fieldKey="project_transaction.equity_sought" stage={project.stage} askedFields={project.askedFields} value={t?.equity_sought ? `${eur(t.equity_sought)}${t.stake_offered_pct ? ` for ${pct(t.stake_offered_pct, 0)}` : ""}` : null} />
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Minimum ticket</p>
              <p className="mt-1 text-lg font-semibold"><ProjectFieldValue fieldKey="project_transaction.min_ticket" stage={project.stage} askedFields={project.askedFields} value={eur(t?.min_ticket)} /></p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Target equity IRR at underwriting (base case)</p>
              <p className="mt-1 text-lg font-semibold"><ProjectFieldValue fieldKey={baseCase?.equity_irr_pct != null ? "project_case.base.equity_irr_pct" : "project_transaction.target_equity_irr_pct"} stage={project.stage} askedFields={project.askedFields} value={pct(baseCase?.equity_irr_pct ?? t.target_equity_irr_pct)} /></p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Equity IRR at underwriting (downside case)</p>
              <p className="mt-1 text-lg font-semibold"><ProjectFieldValue fieldKey={downCase?.equity_irr_pct != null ? "project_case.downside.equity_irr_pct" : "project_transaction.downside_equity_irr_pct"} stage={project.stage} askedFields={project.askedFields} value={pct(downCase?.equity_irr_pct ?? t.downside_equity_irr_pct)} /></p>
            </div>
          </div>
          <p className="mt-6 text-xs text-primary-foreground/70">
            All returns are developer-stated and carry their case label. The platform does not restate or verify them.
          </p>
        </div>
        {fundingAssumptionLines(project.submission ?? null).map(line => <p key={line} className="mt-3 text-sm text-muted-foreground">{line}</p>)}

        {t.club_max_participants != null && <div className="mt-4 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground"><p className="mb-2 font-semibold text-foreground">Sizing</p><p>Developer-stated club size: up to {t.club_max_participants} participants.</p></div>}

        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-5 text-sm text-foreground">
          <p className="mb-1 font-semibold">Platform fee</p>
          <p className="text-muted-foreground">{FEE_SENTENCE}</p>
        </div>
      </Section>

      </>}
    </div>
  );
};

export default TransactionTab;
