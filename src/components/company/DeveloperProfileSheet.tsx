import { CheckCircle, ExternalLink } from "lucide-react";
import { Link } from "@/lib/router-compat";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ORG_TYPE_LABEL,
  ROLE_LABEL,
  STAGE_LABEL,
  STATUS_LABEL,
  TECHNOLOGY_LABEL,
  countryName,
  formatMw,
  type DeveloperProfile,
} from "@/lib/company";

interface DeveloperProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: DeveloperProfile;
  linkBase: "/app/projects" | "/projects";
  isOwner?: boolean;
}

const Badge = ({ verified }: { verified: boolean }) =>
  verified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
      <CheckCircle className="h-3 w-3" /> Verified
    </span>
  ) : (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      Stated by developer
    </span>
  );

const DeveloperProfileSheet = ({
  open,
  onOpenChange,
  profile,
  linkBase,
  isOwner = false,
}: DeveloperProfileSheetProps) => {
  const org = profile.organization;
  if (!org) return null;
  const facts = [
    { label: "Type", value: ORG_TYPE_LABEL[org.org_type] || org.org_type },
    {
      label: "Headquarters",
      value: [org.hq_city, countryName(org.country_code)].filter(Boolean).join(", "),
    },
    { label: "Founded", value: org.founded_year ? String(org.founded_year) : "" },
    { label: "Employees", value: org.employees_band || "" },
    { label: "Registry number", value: org.registry_number || "" },
    { label: "Ownership", value: org.ownership || "" },
    {
      label: "Active in",
      value: org.countries_of_operation.map((c) => countryName(c)).join(", "),
    },
    {
      label: "On DHC Market since",
      value: profile.member_since ? String(profile.member_since) : "",
    },
  ].filter((f) => f.value);

  const operational = profile.track_record.filter((t) => t.status === "operational");
  const totalMw = operational.reduce((sum, t) => sum + Number(t.capacity_mw || 0), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="text-left">
          <div className="flex flex-wrap items-center gap-2">
            <SheetTitle className="font-display text-2xl">{org.name}</SheetTitle>
            <Badge verified={org.verified} />
          </div>
          <SheetDescription>
            {isOwner
              ? "This is how investors whose request you accept see your company."
              : "Developer profile. Shared with you because the developer accepted your access request."}
          </SheetDescription>
        </SheetHeader>

        {org.description && (
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {org.description}
          </p>
        )}
        {org.website && (
          <a
            href={org.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {org.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <dl className="mt-6 grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="text-sm font-semibold text-foreground">{f.value}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-display text-lg font-semibold text-foreground">Track record</h3>
            {operational.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {operational.length} operational{totalMw > 0 ? ` · ${formatMw(totalMw)}` : ""}
              </p>
            )}
          </div>
          {profile.track_record.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No projects listed yet.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {profile.track_record.map((t, i) => (
                <li
                  key={`${t.project_name}-${i}`}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{t.project_name}</p>
                    <Badge verified={t.verified} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[
                      countryName(t.country_code),
                      t.technology ? TECHNOLOGY_LABEL[t.technology] || t.technology : null,
                      formatMw(t.capacity_mw) || null,
                      ROLE_LABEL[t.role] || t.role,
                      t.status === "operational"
                        ? t.cod_year
                          ? `In operation since ${t.cod_year}`
                          : "Operational"
                        : STATUS_LABEL[t.status],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {t.notes && <p className="mt-2 text-xs text-foreground/80">{t.notes}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {profile.other_listings.length > 0 && (
          <section className="mt-8">
            <h3 className="font-display text-lg font-semibold text-foreground">
              Other listings on DHC Market
            </h3>
            <ul className="mt-3 space-y-2">
              {profile.other_listings.map((l) => (
                <li key={l.slug}>
                  <Link
                    to={`${linkBase}/${l.slug}`}
                    className="block rounded-lg border border-border bg-card p-3 text-sm hover:border-primary/40"
                  >
                    <span className="font-semibold text-foreground">
                      {l.title ||
                        `${TECHNOLOGY_LABEL[l.technology] || STAGE_LABEL(l.technology)} project, ${countryName(l.country_code)}`}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {[STAGE_LABEL(l.stage), formatMw(l.capacity_mw) || null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-8 text-xs text-muted-foreground">
          &quot;Verified&quot; means the DHC Market team checked the entry against registry records
          or project documentation. Everything else is stated by the developer and should be
          confirmed in due diligence.
        </p>
      </SheetContent>
    </Sheet>
  );
};

export default DeveloperProfileSheet;
