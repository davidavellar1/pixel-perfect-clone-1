import { CheckCircle } from "lucide-react";
import { ORG_TYPE_LABEL, capacityBand, countryName, type SponsorSummary } from "@/lib/company";

/** The anonymous sponsor facts shown on a listing before access is granted. */
const SponsorSummaryRows = ({ summary }: { summary: SponsorSummary | null }) => {
  if (!summary || !summary.has_profile) {
    return (
      <p className="text-sm text-muted-foreground">
        The developer has not published a company profile yet. Their identity is shared once they
        accept your request.
      </p>
    );
  }
  const delivered =
    summary.delivered_count > 0
      ? `${summary.delivered_count} operational${
          capacityBand(summary.delivered_capacity_mw)
            ? ` · ${capacityBand(summary.delivered_capacity_mw)}`
            : ""
        }`
      : "None listed";
  const rows = [
    {
      label: "Type",
      value: summary.org_type ? ORG_TYPE_LABEL[summary.org_type] || summary.org_type : null,
    },
    { label: "Based in", value: countryName(summary.country_code) || null },
    {
      label: "Active in",
      value:
        summary.countries_count > 0
          ? `${summary.countries_count} ${summary.countries_count === 1 ? "country" : "countries"}`
          : null,
    },
    { label: "DHC projects delivered", value: delivered },
    {
      label: "In construction or development",
      value: summary.pipeline_count > 0 ? String(summary.pipeline_count) : null,
    },
    {
      label: "On DHC Market since",
      value: summary.member_since ? String(summary.member_since) : null,
    },
  ].filter((row) => row.value);

  return (
    <div>
      {rows.map((item, i) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className="text-right text-sm font-bold text-foreground">{item.value}</span>
          </div>
          {i < rows.length - 1 && <div className="border-t border-border" />}
        </div>
      ))}
      <p className="mt-3 flex items-start gap-1.5 text-xs text-muted-foreground">
        {summary.verified && <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />}
        <span>
          {summary.verified
            ? "Company verified by DHC Market. "
            : "Company details are stated by the developer. "}
          {summary.delivered_count > 0 &&
            `${summary.delivered_verified_count} of ${summary.delivered_count} delivered projects verified.`}
        </span>
      </p>
    </div>
  );
};

export default SponsorSummaryRows;
