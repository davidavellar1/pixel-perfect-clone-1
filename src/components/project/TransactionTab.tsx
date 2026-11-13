import { CalendarClock, Handshake, ScrollText, ShieldCheck, Users } from "lucide-react";
import { FEE_SENTENCE } from "@/lib/fee";
import {
  DEVELOPER_STATED,
  INSTRUMENT_LABEL,
  asOfLine,
  eur,
  pct,
  type InvestorGradeBundle,
} from "@/data/investorGrade";

const Row = ({ label, value }: { label: string; value: string | null | undefined }) => value == null || value === "" ? null : (
  <div className="flex items-start justify-between gap-6 border-b border-border py-3 last:border-0">
    <p className="text-sm text-muted-foreground">{label}</p>
    <p className="text-right text-sm font-semibold text-foreground">{value}</p>
  </div>
);

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

const list = (values: unknown) => {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values.map((value) => String(value)).join(", ");
};

/** The offer, capitalisation, governance and process. Placed second, after Overview. */
const TransactionTab = ({ grade, asOf }: { grade: InvestorGradeBundle; asOf?: string | null }) => {
  const t = grade.transaction;
  const p = grade.process;
  const baseCase = grade.cases.find((c) => c.name === "base");
  const downCase = grade.cases.find((c) => c.name === "downside");

  const postMoney = t && Array.isArray(t.post_money_ownership) ? (t.post_money_ownership as unknown[]) : [];
  const proceeds = t && Array.isArray(t.use_of_proceeds) ? (t.use_of_proceeds as unknown[]) : [];
  const tranches = t && Array.isArray(t.drawdown_tranches) ? (t.drawdown_tranches as unknown[]) : [];
  const breakdown = p && Array.isArray(p.parties_under_nda_breakdown)
    ? (p.parties_under_nda_breakdown as unknown[]).map((entry) => String(entry))
    : [];

  const timeline = [
    { label: "Confidentiality agreement", value: "On execution by the investor" },
    { label: "Indications of interest due", value: p?.ioi_deadline ?? null },
    { label: "Management meetings", value: p?.management_meetings_window ?? null },
    { label: "Letter of intent due", value: p?.loi_deadline ?? null },
    { label: "Exclusivity", value: p?.exclusivity_days ? `${p.exclusivity_days} days from letter of intent` : null },
    { label: "Signing and close", value: p?.target_close ?? null },
  ];

  return (
    <div className="space-y-10">
      {!t && (
        <p className="rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground">
          The developer has not published transaction terms for this project yet. Offer, governance and process details appear here once entered.
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
                {eur(t?.equity_sought)}{t?.stake_offered_pct ? ` for ${pct(t.stake_offered_pct, 0)}` : ""}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Minimum ticket</p>
              <p className="mt-1 text-lg font-semibold">{eur(t?.min_ticket)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Target equity IRR (base case)</p>
              <p className="mt-1 text-lg font-semibold">{pct(baseCase?.equity_irr_pct)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Equity IRR (downside case)</p>
              <p className="mt-1 text-lg font-semibold">{pct(downCase?.equity_irr_pct)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary-foreground/70">Hold to exit</p>
              <p className="mt-1 text-lg font-semibold">{t?.expected_hold_years ? `${t.expected_hold_years} years` : null}</p>
            </div>
          </div>
          <p className="mt-6 text-xs text-primary-foreground/70">
            All returns are developer-stated and carry their case label. The platform does not restate or verify them.
          </p>
        </div>

        {t.club_max_participants != null && <div className="mt-4 rounded-xl border border-border bg-muted/50 p-5 text-sm text-muted-foreground"><p className="mb-2 font-semibold text-foreground">Sizing</p><p>Developer-stated club size: up to {t.club_max_participants} participants.</p></div>}

        <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-5 text-sm text-foreground">
          <p className="mb-1 font-semibold">Platform fee</p>
          <p className="text-muted-foreground">{FEE_SENTENCE}</p>
        </div>
      </Section>

      {/* Capitalisation */}
      <Section title="Capitalisation and dilution" icon={<ScrollText className="h-5 w-5 text-accent" />}>
        <div className="rounded-xl border border-border bg-card px-6 py-2">
          <Row label="Pre-money equity value" value={eur(t?.pre_money_equity)} />
          <Row label="Sponsor cash already at risk" value={eur(t?.sponsor_cash_funded)} />
          <Row label="Equity sought" value={eur(t?.equity_sought)} />
          <Row label="Stake offered" value={pct(t?.stake_offered_pct, 0)} />
          <Row label="Post-money ownership" value={list(postMoney)} />
          <Row label="Use of proceeds" value={list(proceeds)} />
          <Row label="Drawdown tranches" value={list(tranches)} />
        </div>
      </Section>

      {/* Governance */}
      <Section title="Governance and minority protections" icon={<ShieldCheck className="h-5 w-5 text-accent" />}>
        <div className="rounded-xl border border-border bg-card px-6 py-2">
          <Row label="Board seat threshold" value={t?.board_seat_threshold ? pct(t.board_seat_threshold, 0) : null} />
          <Row label="Observer threshold" value={t?.observer_threshold ? pct(t.observer_threshold, 0) : null} />
          <Row label="Reserved matters" value={list(t?.reserved_matters)} />
          <Row label="Pre-emption rights" value={t?.pre_emption == null ? null : t.pre_emption ? "Yes" : "No"} />
          <Row label="Right of first refusal" value={t?.rofr == null ? null : t.rofr ? "Yes" : "No"} />
          <Row label="Tag along" value={t?.tag_along == null ? null : t.tag_along ? "Yes" : "No"} />
          <Row label="Drag along threshold" value={t?.drag_along_threshold ? pct(t.drag_along_threshold, 0) : null} />
          <Row label="Distribution policy" value={t?.distribution_policy ?? null} />
          <Row label="First distribution" value={t?.first_distribution_year ? String(t.first_distribution_year) : null} />
          <Row label="Exit routes" value={list(t?.exit_routes)} />
        </div>
      </Section>

      </>}
      {/* Process */}
      {p && <Section title="Process and timetable" icon={<CalendarClock className="h-5 w-5 text-accent" />}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {p?.process_type === "competitive" ? "Competitive process" : p?.process_type === "bilateral" ? "Bilateral process" : "Process type not stated"}
            </p>
            <ol className="relative space-y-5 border-l border-border pl-6">
              {timeline.filter(item => item.value != null).map((item) => (
                <li key={item.label} className="relative">
                  <span className="absolute -left-[1.6rem] top-1 h-3 w-3 rounded-full border-2 border-accent bg-background" />
                  <p className="text-sm font-semibold text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.value}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card px-6 py-2">
              <Row label="Conditions precedent" value={list(p?.conditions_precedent)} />
              <Row label="Adviser disclosed" value={p?.adviser_disclosed == null ? null : p.adviser_disclosed ? "Yes" : "No"} />
            </div>
            {p.parties_under_nda != null && <div className="rounded-xl border border-border bg-muted/50 p-5">
              <div className="mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <p className="text-sm font-semibold text-foreground">Parties with access</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {p?.parties_under_nda} parties with access to date
                {breakdown.length > 0 ? `. ${breakdown.join(", ")}` : "."}
              </p>
            </div>}
          </div>
        </div>
      </Section>}
    </div>
  );
};

export default TransactionTab;
