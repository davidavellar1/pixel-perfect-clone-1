import { useState } from "react";
import { Building2, CheckCircle, Lock } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProjectDetail } from "@/data/projectsData";
import SponsorSummaryRows from "@/components/company/SponsorSummaryRows";
import DeveloperProfileSheet from "@/components/company/DeveloperProfileSheet";
import { countryName, formatMw, useDeveloperProfile } from "@/lib/company";

interface DeveloperCardProps {
  project: ProjectDetail;
  projectId?: string;
  granted: boolean;
  isOwner: boolean;
  context: "public" | "app";
}

const Rows = ({ rows }: { rows: { label: string; value: string }[] }) => (
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
  </div>
);

/**
 * Sidebar card for the project developer.
 * Before access: the anonymous sponsor summary. After access (or for the owner): the company
 * from the developer's profile, with the full profile in a side panel.
 */
const DeveloperCard = ({ project, projectId, granted, isOwner, context }: DeveloperCardProps) => {
  const { summary, profile, loading } = useDeveloperProfile(projectId, granted);
  const [open, setOpen] = useState(false);
  const org = profile?.organization ?? null;

  const header = (name: string, verified: boolean, sub?: string) => (
    <div className="mb-4 flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
        {granted ? (
          <Building2 className="h-5 w-5 text-muted-foreground" />
        ) : (
          <Lock className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold text-foreground">{name}</p>
        {verified ? (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            Verified developer <CheckCircle className="h-3 w-3 text-primary" />
          </p>
        ) : (
          sub && <p className="text-xs text-muted-foreground">{sub}</p>
        )}
      </div>
    </div>
  );

  let body: React.ReactNode;
  if (loading && projectId) {
    body = (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  } else if (!granted && projectId) {
    body = (
      <>
        {header("Identity withheld", false, "Shared once the developer accepts your request")}
        <SponsorSummaryRows summary={summary} />
      </>
    );
  } else if (org) {
    const operational = profile!.track_record.filter((t) => t.status === "operational");
    const mw = operational.reduce((s, t) => s + Number(t.capacity_mw || 0), 0);
    const rows = [
      {
        label: "HQ",
        value: [org.hq_city, countryName(org.country_code)].filter(Boolean).join(", "),
      },
      { label: "Founded", value: org.founded_year ? String(org.founded_year) : "" },
      {
        label: "DHC projects",
        value: operational.length ? `${operational.length} operational` : "",
      },
      { label: "Delivered capacity", value: mw > 0 ? formatMw(mw) : "" },
    ].filter((r) => r.value);
    body = (
      <>
        {header(org.name, org.verified, "Company details stated by the developer")}
        <Rows rows={rows} />
        <Button
          variant="outline"
          className="mt-4 w-full rounded-full"
          onClick={() => setOpen(true)}
        >
          View developer profile
        </Button>
        <DeveloperProfileSheet
          open={open}
          onOpenChange={setOpen}
          profile={profile!}
          linkBase={context === "app" ? "/app/projects" : "/projects"}
          isOwner={isOwner}
        />
      </>
    );
  } else if (isOwner) {
    body = (
      <>
        <p className="text-sm text-muted-foreground">
          Investors see an anonymous summary of your company on this listing, and your full profile
          once you accept their request. You haven&apos;t added a company profile yet.
        </p>
        <Button variant="outline" className="mt-4 w-full rounded-full" asChild>
          <Link to="/app/company-profile">Add company profile</Link>
        </Button>
      </>
    );
  } else {
    // Listings without a company profile: whatever the listing itself states about its developer.
    const rows = [
      { label: "HQ", value: project.developer.hq },
      { label: "Founded", value: project.developer.founded },
      { label: "DHC projects", value: project.developer.dhcProjects },
      { label: "Total capacity", value: project.developer.totalCapacity },
    ].filter((row) => row.value && row.value !== "Not stated");
    body = (
      <>
        {header(project.developer.name, project.developer.verified)}
        {rows.length ? (
          <Rows rows={rows} />
        ) : (
          <p className="text-sm text-muted-foreground">
            The developer has not published a company profile yet.
          </p>
        )}
      </>
    );
  }

  return (
    <div
      className="rounded-xl border border-border bg-card p-6"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <h3 className="mb-4 font-serif text-base font-bold text-foreground">Project developer</h3>
      {body}
    </div>
  );
};

export default DeveloperCard;
