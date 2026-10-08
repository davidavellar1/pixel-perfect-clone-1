import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { COUNTRY_NAMES } from "@/lib/funding";
import SponsorSummaryRows from "@/components/company/SponsorSummaryRows";
import {
  EMPLOYEE_BANDS,
  ORG_TYPE_LABEL,
  ROLE_LABEL,
  STATUS_LABEL,
  TECHNOLOGY_LABEL,
  countryName,
  formatMw,
  useMyCompany,
  type SponsorSummary,
  type TrackRecordEntry,
} from "@/lib/company";

const COUNTRIES = Object.keys(COUNTRY_NAMES).sort((a, b) =>
  COUNTRY_NAMES[a].localeCompare(COUNTRY_NAMES[b]),
);
const NONE = "__none";

type CompanyForm = {
  name: string;
  org_type: string;
  country_code: string;
  hq_city: string;
  founded_year: string;
  website: string;
  registry_number: string;
  employees_band: string;
  ownership: string;
  description: string;
  countries_of_operation: string[];
};

const EMPTY_COMPANY: CompanyForm = {
  name: "",
  org_type: "",
  country_code: "",
  hq_city: "",
  founded_year: "",
  website: "",
  registry_number: "",
  employees_band: "",
  ownership: "",
  description: "",
  countries_of_operation: [],
};

type EntryForm = {
  id?: string;
  project_name: string;
  country_code: string;
  technology: string;
  capacity_mw: string;
  cod_year: string;
  role: string;
  status: string;
  notes: string;
};

const EMPTY_ENTRY: EntryForm = {
  project_name: "",
  country_code: "",
  technology: "",
  capacity_mw: "",
  cod_year: "",
  role: "",
  status: "operational",
  notes: "",
};

const THIS_YEAR = new Date().getFullYear();

const Field = ({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-1.5">
    <Label htmlFor={id}>{label}</Label>
    {children}
    {hint && !error && (
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {hint}
      </p>
    )}
    {error && (
      <p id={`${id}-error`} className="text-xs text-destructive">
        {error}
      </p>
    )}
  </div>
);

const CompanyProfile = () => {
  const { user } = useAuth();
  const { organization, trackRecord, isDeveloper, loading, reload } = useMyCompany(user?.id);
  const [form, setForm] = useState<CompanyForm>(EMPTY_COMPANY);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyForm, string>>>({});
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState<EntryForm | null>(null);
  const [entryErrors, setEntryErrors] = useState<Partial<Record<keyof EntryForm, string>>>({});
  const [entrySaving, setEntrySaving] = useState(false);

  /** Bumped when saved values arrive, so the dropdowns remount showing them. */
  const [hydrated, setHydrated] = useState(0);

  useEffect(() => {
    if (!organization) return;
    setHydrated((n) => n + 1);
    setForm({
      name: organization.name,
      org_type: organization.org_type || "",
      country_code: organization.country_code || "",
      hq_city: organization.hq_city || "",
      founded_year: organization.founded_year ? String(organization.founded_year) : "",
      website: organization.website || "",
      registry_number: organization.registry_number || "",
      employees_band: organization.employees_band || "",
      ownership: organization.ownership || "",
      description: organization.description || "",
      countries_of_operation: organization.countries_of_operation || [],
    });
  }, [organization]);

  /** Live preview of the anonymous summary investors see before access. */
  const preview: SponsorSummary = useMemo(() => {
    const operational = trackRecord.filter((t) => t.status === "operational");
    return {
      has_profile: !!organization,
      org_type: form.org_type || null,
      country_code: form.country_code || null,
      countries_count: form.countries_of_operation.length,
      verified: !!organization?.verified,
      delivered_count: operational.length,
      delivered_verified_count: operational.filter((t) => t.verified).length,
      delivered_capacity_mw:
        operational.reduce((s, t) => s + Number(t.capacity_mw || 0), 0) || null,
      pipeline_count: trackRecord.length - operational.length,
      member_since: null,
    };
  }, [form, organization, trackRecord]);

  const set = <K extends keyof CompanyForm>(key: K, value: CompanyForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const saveCompany = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Enter the company name.";
    if (!form.org_type) next.org_type = "Choose the type of company.";
    if (!form.country_code) next.country_code = "Choose the country of the headquarters.";
    const year = Number(form.founded_year);
    if (form.founded_year && (!Number.isInteger(year) || year < 1800 || year > THIS_YEAR))
      next.founded_year = `Enter a year between 1800 and ${THIS_YEAR}.`;
    if (form.website && !/^https?:\/\/\S+\.\S+/.test(form.website.trim()))
      next.website = "Enter a full address starting with https://";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    const { error } = await supabase.rpc("save_my_organization", { p: form });
    setSaving(false);
    if (error) {
      toast.error("Company profile not saved. Please try again.");
      return;
    }
    toast.success("Company profile saved");
    void reload();
  };

  const saveEntry = async (event: FormEvent) => {
    event.preventDefault();
    if (!entry || !organization) return;
    const next: typeof entryErrors = {};
    if (entry.project_name.trim().length < 2) next.project_name = "Enter the project name.";
    if (!entry.country_code) next.country_code = "Choose a country.";
    if (!entry.role) next.role = "Choose your role.";
    const mw = Number(entry.capacity_mw);
    if (entry.capacity_mw && !(mw > 0)) next.capacity_mw = "Enter a capacity above 0.";
    const year = Number(entry.cod_year);
    if (entry.cod_year && (!Number.isInteger(year) || year < 1950 || year > THIS_YEAR + 10))
      next.cod_year = "Enter a valid year.";
    setEntryErrors(next);
    if (Object.keys(next).length) return;
    const row = {
      organization_id: organization.id,
      project_name: entry.project_name.trim(),
      country_code: entry.country_code,
      technology: entry.technology || null,
      capacity_mw: entry.capacity_mw ? mw : null,
      cod_year: entry.cod_year ? year : null,
      role: entry.role,
      status: entry.status,
      notes: entry.notes.trim() || null,
    };
    setEntrySaving(true);
    const { error } = entry.id
      ? await supabase.from("organization_track_record").update(row).eq("id", entry.id)
      : await supabase
          .from("organization_track_record")
          .insert({ ...row, sort_order: trackRecord.length });
    setEntrySaving(false);
    if (error) {
      toast.error("Project not saved. Please try again.");
      return;
    }
    toast.success(entry.id ? "Project updated" : "Project added");
    setEntry(null);
    void reload();
  };

  const removeEntry = async (row: TrackRecordEntry) => {
    const { error } = await supabase.from("organization_track_record").delete().eq("id", row.id);
    if (error) {
      toast.error("Project not removed. Please try again.");
      return;
    }
    toast.success("Project removed", {
      action: {
        label: "Undo",
        onClick: () => {
          const { id: _id, created_at: _c, updated_at: _u, verified: _v, ...rest } = row;
          void supabase
            .from("organization_track_record")
            .insert(rest)
            .then(() => reload());
        },
      },
    });
    void reload();
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[920px] space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (!isDeveloper) {
    return (
      <div className="mx-auto w-full max-w-[760px] rounded-lg border border-border bg-card px-6 py-14 text-center">
        <p className="font-display text-lg font-semibold text-foreground">
          Company profiles are for developers
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is available once your account is registered as a project developer.
        </p>
      </div>
    );
  }

  const describedBy = (id: string, err?: string, hint?: boolean) =>
    err ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="mx-auto w-full max-w-[920px] space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase text-accent">My workspace</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-foreground">
          Company profile
        </h1>
        <p className="mt-2 max-w-[68ch] text-sm text-muted-foreground">
          Investors assess the sponsor as closely as the project. Before access, they see only an
          anonymous summary. Your name and full profile are shared only with investors whose request
          you accept.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form
          key={hydrated}
          onSubmit={saveCompany}
          noValidate
          className="space-y-5 rounded-lg border border-border bg-card p-6 lg:col-span-2"
        >
          <h2 className="font-display text-lg font-semibold text-foreground">Company details</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="co-name" label="Company name *" error={errors.name}>
              <Input
                id="co-name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                maxLength={160}
                aria-invalid={!!errors.name}
                aria-describedby={describedBy("co-name", errors.name)}
              />
            </Field>
            <Field id="co-type" label="Type of company *" error={errors.org_type}>
              <Select value={form.org_type} onValueChange={(v) => set("org_type", v)}>
                <SelectTrigger
                  id="co-type"
                  aria-invalid={!!errors.org_type}
                  aria-describedby={describedBy("co-type", errors.org_type)}
                >
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ORG_TYPE_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="co-country" label="Headquarters country *" error={errors.country_code}>
              <Select value={form.country_code} onValueChange={(v) => set("country_code", v)}>
                <SelectTrigger
                  id="co-country"
                  aria-invalid={!!errors.country_code}
                  aria-describedby={describedBy("co-country", errors.country_code)}
                >
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {COUNTRY_NAMES[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="co-city" label="Headquarters city">
              <Input
                id="co-city"
                value={form.hq_city}
                onChange={(e) => set("hq_city", e.target.value)}
                maxLength={80}
              />
            </Field>
            <Field id="co-founded" label="Year founded" error={errors.founded_year}>
              <Input
                id="co-founded"
                inputMode="numeric"
                value={form.founded_year}
                onChange={(e) => set("founded_year", e.target.value.replace(/\D/g, "").slice(0, 4))}
                aria-invalid={!!errors.founded_year}
                aria-describedby={describedBy("co-founded", errors.founded_year)}
              />
            </Field>
            <Field id="co-employees" label="Employees">
              <Select
                value={form.employees_band || NONE}
                onValueChange={(v) => set("employees_band", v === NONE ? "" : v)}
              >
                <SelectTrigger id="co-employees">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not stated</SelectItem>
                  {EMPLOYEE_BANDS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field id="co-website" label="Website" error={errors.website}>
              <Input
                id="co-website"
                type="url"
                placeholder="https://"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                aria-invalid={!!errors.website}
                aria-describedby={describedBy("co-website", errors.website)}
              />
            </Field>
            <Field id="co-registry" label="Company registry number" hint="Used for verification.">
              <Input
                id="co-registry"
                value={form.registry_number}
                onChange={(e) => set("registry_number", e.target.value)}
                maxLength={60}
                aria-describedby={describedBy("co-registry", undefined, true)}
              />
            </Field>
          </div>

          <Field
            id="co-ownership"
            label="Ownership"
            hint="For example: 100% owned by the City of Tallinn."
          >
            <Input
              id="co-ownership"
              value={form.ownership}
              onChange={(e) => set("ownership", e.target.value)}
              maxLength={300}
              aria-describedby={describedBy("co-ownership", undefined, true)}
            />
          </Field>

          <fieldset>
            <legend className="text-sm font-medium text-foreground">
              Countries where you operate
            </legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {COUNTRIES.map((c) => {
                const on = form.countries_of_operation.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      set(
                        "countries_of_operation",
                        on
                          ? form.countries_of_operation.filter((x) => x !== c)
                          : [...form.countries_of_operation, c],
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                      on
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {COUNTRY_NAMES[c]}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Field
            id="co-description"
            label="About the company"
            hint="What you do, your strategy in heating and cooling, and what sets you apart. Shown after access is granted."
          >
            <Textarea
              id="co-description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              maxLength={1500}
              className="min-h-[120px]"
              aria-describedby={describedBy("co-description", undefined, true)}
            />
          </Field>

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {organization?.verified ? (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-primary" /> Verified by DHC Market
                </span>
              ) : (
                "Not yet verified. The DHC Market team verifies company details against registry records."
              )}
            </p>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : organization ? "Save changes" : "Create company profile"}
            </Button>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-sm font-semibold text-foreground">
              What investors see before access
            </h2>
            <p className="mb-3 mt-1 text-xs text-muted-foreground">
              Shown on each of your listings. No name, city or website.
            </p>
            <SponsorSummaryRows summary={preview} />
          </div>
        </aside>
      </div>

      <section className="rounded-lg border border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Track record</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              District heating and cooling projects you own, developed, operate or built. Editing a
              verified entry removes its verified badge until it is checked again.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setEntryErrors({});
              setEntry({ ...EMPTY_ENTRY });
            }}
            disabled={!organization || !!entry}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add project
          </Button>
        </div>
        {!organization && (
          <p className="mt-4 text-sm text-muted-foreground">
            Save your company details first to add projects.
          </p>
        )}

        {entry && (
          <form
            onSubmit={saveEntry}
            noValidate
            className="mt-5 space-y-4 rounded-lg border border-primary/30 bg-background p-5"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="tr-name" label="Project name *" error={entryErrors.project_name}>
                <Input
                  id="tr-name"
                  value={entry.project_name}
                  onChange={(e) => setEntry({ ...entry, project_name: e.target.value })}
                  maxLength={160}
                  aria-invalid={!!entryErrors.project_name}
                  aria-describedby={describedBy("tr-name", entryErrors.project_name)}
                />
              </Field>
              <Field id="tr-country" label="Country *" error={entryErrors.country_code}>
                <Select
                  value={entry.country_code}
                  onValueChange={(v) => setEntry({ ...entry, country_code: v })}
                >
                  <SelectTrigger
                    id="tr-country"
                    aria-invalid={!!entryErrors.country_code}
                    aria-describedby={describedBy("tr-country", entryErrors.country_code)}
                  >
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {COUNTRY_NAMES[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="tr-tech" label="Main technology">
                <Select
                  value={entry.technology || NONE}
                  onValueChange={(v) => setEntry({ ...entry, technology: v === NONE ? "" : v })}
                >
                  <SelectTrigger id="tr-tech">
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not stated</SelectItem>
                    {Object.entries(TECHNOLOGY_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="tr-role" label="Your role *" error={entryErrors.role}>
                <Select value={entry.role} onValueChange={(v) => setEntry({ ...entry, role: v })}>
                  <SelectTrigger
                    id="tr-role"
                    aria-invalid={!!entryErrors.role}
                    aria-describedby={describedBy("tr-role", entryErrors.role)}
                  >
                    <SelectValue placeholder="Choose" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ROLE_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="tr-status" label="Status">
                <Select
                  value={entry.status}
                  onValueChange={(v) => setEntry({ ...entry, status: v })}
                >
                  <SelectTrigger id="tr-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field id="tr-mw" label="Capacity (MW)" error={entryErrors.capacity_mw}>
                <Input
                  id="tr-mw"
                  inputMode="decimal"
                  value={entry.capacity_mw}
                  onChange={(e) =>
                    setEntry({ ...entry, capacity_mw: e.target.value.replace(/[^0-9.]/g, "") })
                  }
                  aria-invalid={!!entryErrors.capacity_mw}
                  aria-describedby={describedBy("tr-mw", entryErrors.capacity_mw)}
                />
              </Field>
              <Field
                id="tr-year"
                label={
                  entry.status === "operational"
                    ? "Year in operation"
                    : "Expected year in operation"
                }
                error={entryErrors.cod_year}
              >
                <Input
                  id="tr-year"
                  inputMode="numeric"
                  value={entry.cod_year}
                  onChange={(e) =>
                    setEntry({ ...entry, cod_year: e.target.value.replace(/\D/g, "").slice(0, 4) })
                  }
                  aria-invalid={!!entryErrors.cod_year}
                  aria-describedby={describedBy("tr-year", entryErrors.cod_year)}
                />
              </Field>
            </div>
            <Field
              id="tr-notes"
              label="Notes"
              hint="Optional, up to 300 characters. For example network length or households served."
            >
              <Input
                id="tr-notes"
                value={entry.notes}
                onChange={(e) => setEntry({ ...entry, notes: e.target.value })}
                maxLength={300}
                aria-describedby={describedBy("tr-notes", undefined, true)}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEntry(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={entrySaving}>
                {entrySaving ? "Saving…" : entry.id ? "Save project" : "Add project"}
              </Button>
            </div>
          </form>
        )}

        {organization && trackRecord.length === 0 && !entry && (
          <p className="mt-5 rounded-lg border border-dashed border-border px-5 py-6 text-sm text-muted-foreground">
            No projects yet. Investors weigh delivered projects heavily, so add the ones you can
            document.
          </p>
        )}

        {trackRecord.length > 0 && (
          <ul className="mt-5 divide-y divide-border">
            {trackRecord.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                    {row.project_name}
                    {row.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                        <CheckCircle className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[
                      countryName(row.country_code),
                      row.technology ? TECHNOLOGY_LABEL[row.technology] || row.technology : null,
                      formatMw(row.capacity_mw) || null,
                      ROLE_LABEL[row.role],
                      STATUS_LABEL[row.status],
                      row.cod_year ? String(row.cod_year) : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Edit ${row.project_name}`}
                    disabled={!!entry}
                    onClick={() => {
                      setEntryErrors({});
                      setEntry({
                        id: row.id,
                        project_name: row.project_name,
                        country_code: row.country_code,
                        technology: row.technology || "",
                        capacity_mw: row.capacity_mw != null ? String(row.capacity_mw) : "",
                        cod_year: row.cod_year != null ? String(row.cod_year) : "",
                        role: row.role,
                        status: row.status,
                        notes: row.notes || "",
                      });
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${row.project_name}`}
                    onClick={() => removeEntry(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default CompanyProfile;
