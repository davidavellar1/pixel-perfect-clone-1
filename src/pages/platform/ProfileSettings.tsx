import { useEffect, useRef, useState, type ReactNode } from "react";
import { useBlocker } from "@tanstack/react-router";
import { Camera, LogOut, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Chips, EnumSelect, Field } from "@/components/settings/SettingsFields";
import { avatarError, COUNTRIES, DEVELOPER_TYPES, developerSchema, INVESTOR_TYPES, investorSchema, legalDocument, passwordSchema, profileSchema, REGIONS, STAGES, TECHNOLOGIES, TICKETS } from "@/lib/profileSettings";
import { cn } from "@/lib/utils";

const emptyPersonal = { first_name: "", last_name: "", job_title: "", phone: "", linkedin_url: "", bio: "" };
const emptyInvestor = { company_name: "", investor_type: null, investment_range: null, regions_of_interest: [], technologies_of_interest: [] } as import("zod").z.infer<typeof investorSchema>;
const emptyDeveloper = { company_name: "", position: "", developer_type: null, project_stages: [], countries_of_operation: [] } as import("zod").z.infer<typeof developerSchema>;
const message = (err: unknown) => err instanceof Error ? err.message : (err as { message?: string })?.message ?? "Your changes weren't saved. Please try again.";
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const listOptions = (values: string[]) => Object.fromEntries(values.map(v => [v, v]));

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return <section id={id} className="min-w-0 scroll-mt-24 rounded-lg border border-border bg-card p-4 sm:p-6"><h2 className="mb-6 font-display text-xl font-semibold">{title}</h2>{children}</section>;
}

export default function ProfileSettings() {
  const { user, profile, roles, refreshProfile, signOut } = useAuth();
  const { data, setData, loading, error, retry } = useProfileSettings();
  const navigate = useNavigate();
  const [personal, setPersonal] = useState(emptyPersonal);
  const [investor, setInvestor] = useState(emptyInvestor);
  const [developer, setDeveloper] = useState(emptyDeveloper);
  const [baseline, setBaseline] = useState({ personal: emptyPersonal, investor: emptyInvestor, developer: emptyDeveloper });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [passwords, setPasswords] = useState({ password: "", confirm: "" });
  const [active, setActive] = useState("profile");
  const fileInput = useRef<HTMLInputElement>(null);
  const personalDirty = !same(personal, baseline.personal) || !!file || removeAvatar;
  const investorDirty = !same(investor, baseline.investor);
  const developerDirty = !same(developer, baseline.developer);
  const dirty = personalDirty || investorDirty || developerDirty || !!passwords.password || !!passwords.confirm;
  const blocker = useBlocker({ shouldBlockFn: () => dirty, enableBeforeUnload: dirty, withResolver: true });
  const hasInvestor = roles.includes("investor");
  const hasDeveloper = roles.includes("developer");
  const sections = [{ id: "profile", label: "Profile" }, ...(hasInvestor ? [{ id: "investor", label: "Investor profile" }] : []), ...(hasDeveloper ? [{ id: "developer", label: "Developer profile" }] : []), { id: "account", label: "Account" }];
  const identityProviders = user?.identities?.map(i => i.provider) ?? [];
  const emailAccount = identityProviders.includes("email");
  const googleAccount = identityProviders.includes("google");

  useEffect(() => {
    if (!data) return;
    const fallbackName = String(user?.user_metadata?.full_name ?? "").trim().split(/\s+/);
    const p = data.personal ? Object.fromEntries(Object.keys(emptyPersonal).map(key => [key, data.personal?.[key as keyof typeof emptyPersonal] ?? ""])) as typeof emptyPersonal : { ...emptyPersonal, first_name: fallbackName[0] ?? "", last_name: fallbackName.slice(1).join(" ") };
    const i = data.investor ? { company_name: data.investor.company_name ?? "", investor_type: data.investor.investor_type, investment_range: data.investor.investment_range, regions_of_interest: data.investor.regions_of_interest ?? [], technologies_of_interest: data.investor.technologies_of_interest } : emptyInvestor;
    const d = data.developer ? { company_name: data.developer.company_name ?? "", position: data.developer.position ?? "", developer_type: data.developer.developer_type, project_stages: (data.developer.project_stages ?? []).filter((s): s is keyof typeof STAGES => Object.hasOwn(STAGES, s)), countries_of_operation: data.developer.countries_of_operation ?? [] } : emptyDeveloper;
    setPersonal(p); setInvestor(i); setDeveloper(d); setBaseline({ personal: p, investor: i, developer: d });
  }, [loading]);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const fieldError = (key: string) => errors[key];
  const aria = (key: string, hint = false) => ({ "aria-invalid": !!errors[key], "aria-describedby": [hint ? `${key}-hint` : "", errors[key] ? `${key}-error` : ""].filter(Boolean).join(" ") || undefined });
  const updatePersonal = (key: keyof typeof personal, value: string) => { setPersonal(p => ({ ...p, [key]: value })); setErrors(e => ({ ...e, [key]: "" })); };
  const chooseFile = (candidate?: File) => {
    if (!candidate) return;
    const err = avatarError(candidate);
    setErrors(e => ({ ...e, avatar: err ?? "" }));
    if (!err) { setFile(candidate); setRemoveAvatar(false); }
    if (fileInput.current) fileInput.current.value = "";
  };
  const fullName = [baseline.personal.first_name, baseline.personal.last_name].filter(Boolean).join(" ");
  const validate = (result: { success: boolean; error?: { issues: { path: (string | number)[]; message: string }[] } }) => {
    if (result.success) { setErrors({}); return true; }
    setErrors(Object.fromEntries(result.error?.issues.map(i => [String(i.path[0]), i.message]) ?? [])); return false;
  };
  const savePersonal = async () => {
    const parsed = profileSchema.safeParse(personal);
    if (!validate(parsed) || !parsed.success || !user) return;
    setSaving("profile");
    let uploaded: string | null = null;
    try {
      let avatarPath = removeAvatar ? null : data?.personal?.avatar_url ?? null;
      if (file) {
        const suffix = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[file.type];
        uploaded = `${user.id}/${crypto.randomUUID()}.${suffix}`;
        const result = await supabase.storage.from("avatars").upload(uploaded, file, { contentType: file.type });
        if (result.error) throw result.error;
        avatarPath = uploaded;
      }
      const result = await supabase.from("user_profile").upsert({ user_id: user.id, ...parsed.data, avatar_url: avatarPath }, { onConflict: "user_id" }).select().single();
      if (result.error) throw result.error;
      const oldPath = data?.personal?.avatar_url;
      if (oldPath && oldPath !== avatarPath) {
        const removed = await supabase.storage.from("avatars").remove([oldPath]);
        if (removed.error) toast.error("Profile saved, but the old photo couldn't be removed.");
      }
      setData(d => d ? { ...d, personal: result.data } : d);
      setPersonal(parsed.data); setBaseline(b => ({ ...b, personal: parsed.data })); setFile(null); setRemoveAvatar(false);
      await refreshProfile(); toast.success("Profile updated");
    } catch (err) {
      if (uploaded) await supabase.storage.from("avatars").remove([uploaded]);
      toast.error(message(err));
    } finally { setSaving(null); }
  };
  const saveInvestor = async () => {
    const parsed = investorSchema.safeParse(investor);
    if (!validate(parsed) || !parsed.success || !user) return;
    setSaving("investor");
    try {
      const result = await supabase.from("investor_profiles").upsert({ user_id: user.id, full_name: fullName, ...parsed.data }, { onConflict: "user_id" }).select().single();
      if (result.error) throw result.error;
      setData(d => d ? { ...d, investor: result.data } : d); setInvestor(parsed.data); setBaseline(b => ({ ...b, investor: parsed.data })); toast.success("Investor profile updated");
    } catch (err) { toast.error(message(err)); } finally { setSaving(null); }
  };
  const saveDeveloper = async () => {
    const parsed = developerSchema.safeParse(developer);
    if (!validate(parsed) || !parsed.success || !user) return;
    setSaving("developer");
    try {
      const result = await supabase.from("developer_profiles").upsert({ user_id: user.id, full_name: fullName, ...parsed.data }, { onConflict: "user_id" }).select().single();
      if (result.error) throw result.error;
      setData(d => d ? { ...d, developer: result.data } : d); setDeveloper(parsed.data); setBaseline(b => ({ ...b, developer: parsed.data })); toast.success("Developer profile updated");
    } catch (err) { toast.error(message(err)); } finally { setSaving(null); }
  };
  const changePassword = async () => {
    const parsed = passwordSchema.safeParse(passwords);
    if (!validate(parsed) || !parsed.success) return;
    setSaving("account");
    try { const { error: err } = await supabase.auth.updateUser({ password: parsed.data.password }); if (err) throw err; setPasswords({ password: "", confirm: "" }); toast.success("Password updated"); }
    catch (err) { toast.error(message(err)); } finally { setSaving(null); }
  };
  const saveButton = (section: string, changed: boolean) => <Button type="submit" disabled={!changed || !!saving} className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">{saving === section ? "Saving…" : "Save changes"}</Button>;
  const jump = (id: string) => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); };
  if (loading) return <div className="mx-auto max-w-[880px] space-y-6" aria-label="Loading profile settings"><Skeleton className="h-10 w-52" />{[0, 1, 2].map(n => <Skeleton key={n} className="h-64 w-full" />)}</div>;
  if (error || !data) return <div role="alert" className="mx-auto max-w-[880px] space-y-4"><h1 className="font-display text-2xl font-semibold">Profile settings</h1><p className="break-words text-destructive">{error ?? "Couldn't load your profile."}</p><Button variant="outline" onClick={() => void retry()}>Retry</Button></div>;

  return <div className="mx-auto w-full max-w-[880px] space-y-6 text-foreground">
    <header><h1 className="font-display text-3xl font-semibold">Profile settings</h1></header>
    <div className="grid min-w-0 gap-6 lg:grid-cols-[145px_minmax(0,1fr)]">
      <nav aria-label="Settings sections" className="hidden lg:block"><div className="sticky top-8 flex flex-col gap-1">{sections.map(s => <Button key={s.id} variant="ghost" onClick={() => jump(s.id)} className={cn("justify-start whitespace-normal text-left", active === s.id && "bg-accent/10 text-accent")}>{s.label}</Button>)}</div></nav>
      <div className="min-w-0 space-y-6">
        <Tabs value={active} onValueChange={jump} className="sticky top-0 z-10 bg-background py-2 lg:hidden"><TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1">{sections.map(s => <TabsTrigger key={s.id} value={s.id} className="min-h-11 whitespace-normal text-xs">{s.label}</TabsTrigger>)}</TabsList></Tabs>
        <Section id="profile" title="Profile"><form noValidate onSubmit={e => { e.preventDefault(); void savePersonal(); }} className="space-y-5">
          <div className="space-y-2"><span id="avatar-label" className="text-sm font-medium">Avatar photo</span><div onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); chooseFile(e.dataTransfer.files[0]); }} className="flex flex-wrap items-center gap-4 rounded-md border border-dashed border-border p-4" aria-labelledby="avatar-label">
            <Avatar className="h-16 w-16"><AvatarImage src={preview ?? (removeAvatar ? undefined : profile?.avatar_url ?? undefined)} alt="Your avatar preview" className="object-cover" /><AvatarFallback className="bg-accent/10 text-accent"><Camera /></AvatarFallback></Avatar>
            <div className="min-w-0 space-y-2"><Button type="button" variant="outline" size="sm" className="h-auto min-h-11 max-w-full whitespace-normal" onClick={() => fileInput.current?.click()} aria-describedby={cn('avatar-hint', errors.avatar && 'avatar-error')}><Upload />Upload photo</Button><p id="avatar-hint" className="text-xs text-muted-foreground">Drop an image here. JPEG, PNG, WebP or GIF, up to 2 MB.</p>{(file || (!removeAvatar && data.personal?.avatar_url)) && <Button type="button" variant="ghost" size="sm" onClick={() => { setFile(null); setRemoveAvatar(!!data.personal?.avatar_url); }}><X />Remove photo</Button>}</div>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" aria-label="Avatar photo file" onChange={e => chooseFile(e.target.files?.[0])} />
          </div>{errors.avatar && <p id="avatar-error" role="alert" className="text-xs text-destructive">{errors.avatar}</p>}</div>
          <div className="grid min-w-0 gap-5 sm:grid-cols-2">{([['first_name', 'First name'], ['last_name', 'Last name'], ['job_title', 'Job title'], ['phone', 'Phone']] as const).map(([key, label]) => <Field key={key} id={key} label={label} error={fieldError(key)} hint={key === 'phone' ? 'Optional. International format, e.g. +45 12 34 56 78.' : undefined}><Input id={key} value={personal[key]} onChange={e => updatePersonal(key, e.target.value)} maxLength={key === 'job_title' ? 160 : key === 'phone' ? 26 : 100} placeholder={key === 'job_title' ? 'e.g. Investment Director' : undefined} type={key === 'phone' ? 'tel' : 'text'} autoComplete={key === 'first_name' ? 'given-name' : key === 'last_name' ? 'family-name' : key === 'phone' ? 'tel' : 'organization-title'} className="h-11" {...aria(key, key === 'phone')} /></Field>)}</div>
          <Field id="linkedin_url" label="LinkedIn URL" error={fieldError('linkedin_url')}><Input id="linkedin_url" type="url" value={personal.linkedin_url} onChange={e => updatePersonal('linkedin_url', e.target.value)} className="h-11" {...aria('linkedin_url')} /></Field>
          <Field id="bio" label="Bio" error={fieldError('bio')}><Textarea id="bio" rows={5} value={personal.bio} maxLength={600} onChange={e => updatePersonal('bio', e.target.value)} aria-invalid={!!errors.bio} aria-describedby={cn('bio-count', errors.bio && 'bio-error')} /><p id="bio-count" className="text-right text-xs text-muted-foreground">{personal.bio.length}/600</p></Field>
          <Field id="email" label="Email" hint="Your sign-in email. Contact support to change it."><Input id="email" type="email" readOnly value={user?.email ?? ''} className="h-11 bg-muted" aria-describedby="email-hint" /></Field>
          {saveButton('profile', personalDirty)}
        </form></Section>
        {hasInvestor && <Section id="investor" title="Investor profile"><form noValidate onSubmit={e => { e.preventDefault(); void saveInvestor(); }} className="space-y-5">
          {!data.investor && <p className="text-sm text-muted-foreground">Complete your investor profile</p>}
          <p className="text-sm text-muted-foreground">Used to match you with relevant opportunities and funding.</p>
          <Field id="investor-company" label="Organisation name" error={errors.company_name}><Input id="investor-company" maxLength={200} value={investor.company_name} onChange={e => setInvestor(i => ({ ...i, company_name: e.target.value }))} className="h-11" aria-invalid={!!errors.company_name} aria-describedby={errors.company_name ? 'investor-company-error' : undefined} /></Field>
          <div className="grid gap-5 sm:grid-cols-2"><EnumSelect id="investor-type" label="Investor type" value={investor.investor_type} options={INVESTOR_TYPES} onChange={v => setInvestor(i => ({ ...i, investor_type: v }))} /><EnumSelect id="ticket" label="Typical ticket" value={investor.investment_range} options={TICKETS} onChange={v => setInvestor(i => ({ ...i, investment_range: v }))} /></div>
          <Chips id="regions" label="Regions of interest" options={listOptions([...new Set([...REGIONS, ...investor.regions_of_interest])])} value={investor.regions_of_interest} onChange={v => setInvestor(i => ({ ...i, regions_of_interest: v }))} />
          <Chips id="technologies" label="Technologies of interest" options={TECHNOLOGIES} value={investor.technologies_of_interest} onChange={v => setInvestor(i => ({ ...i, technologies_of_interest: v }))} />
          {saveButton('investor', investorDirty)}
        </form></Section>}
        {hasDeveloper && <Section id="developer" title="Developer profile"><form noValidate onSubmit={e => { e.preventDefault(); void saveDeveloper(); }} className="space-y-5">
          {!data.developer && <p className="text-sm text-muted-foreground">Complete your developer profile</p>}
          <Field id="developer-company" label="Company name" error={errors.company_name}><Input id="developer-company" maxLength={200} value={developer.company_name} onChange={e => setDeveloper(d => ({ ...d, company_name: e.target.value }))} className="h-11" aria-invalid={!!errors.company_name} aria-describedby={errors.company_name ? 'developer-company-error' : undefined} /></Field>
          <Field id="position" label="Position" error={errors.position}><Input id="position" maxLength={160} value={developer.position} onChange={e => setDeveloper(d => ({ ...d, position: e.target.value }))} className="h-11" {...aria('position')} /></Field>
          <EnumSelect id="developer-type" label="Developer type" value={developer.developer_type} options={DEVELOPER_TYPES} onChange={v => setDeveloper(d => ({ ...d, developer_type: v }))} />
          <Chips id="stages" label="Project stages" options={STAGES} value={developer.project_stages} onChange={v => setDeveloper(d => ({ ...d, project_stages: v }))} />
          <Chips id="countries" label="Countries of operation" options={listOptions([...new Set([...COUNTRIES, ...developer.countries_of_operation])])} value={developer.countries_of_operation} onChange={v => setDeveloper(d => ({ ...d, countries_of_operation: v }))} />
          {saveButton('developer', developerDirty)}
        </form></Section>}
        <Section id="account" title="Account"><div className="space-y-6">
          <div><h3 className="text-sm font-semibold">Sign-in method</h3><p className="mt-2 text-sm text-muted-foreground">{[googleAccount ? 'Google' : '', emailAccount ? 'Email' : ''].filter(Boolean).join(' & ') || 'Not available'}</p></div>
          {emailAccount ? <form noValidate onSubmit={e => { e.preventDefault(); void changePassword(); }} className="space-y-5"><h3 className="font-display text-lg font-semibold">Change password</h3><Field id="password" label="New password" hint="Use at least 8 characters." error={errors.password}><Input id="password" type="password" autoComplete="new-password" value={passwords.password} onChange={e => setPasswords(p => ({ ...p, password: e.target.value }))} className="h-11" {...aria('password', true)} /></Field><Field id="confirm" label="Confirm new password" error={errors.confirm}><Input id="confirm" type="password" autoComplete="new-password" value={passwords.confirm} onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))} className="h-11" {...aria('confirm')} /></Field>{saveButton('account', !!passwords.password || !!passwords.confirm)}</form> : <p className="text-sm text-muted-foreground">{googleAccount ? 'You sign in with Google. Manage your password in your Google account.' : 'Password changes are available for email sign-in accounts only.'}</p>}
          <div className="border-t border-border pt-6"><h3 className="font-display text-lg font-semibold">Legal</h3>{data.legal.length ? <ul className="mt-3 divide-y divide-border">{data.legal.map(l => <li key={l.id} className="py-3 text-sm"><p className="font-medium">{legalDocument(l.document).label} · Version {l.version}</p><p className="mt-1 text-xs text-muted-foreground">Accepted {new Date(l.accepted_at).toLocaleDateString()}</p></li>)}</ul> : <p className="mt-3 text-sm text-muted-foreground">No accepted documents recorded.</p>}<p className="mt-3 text-xs text-muted-foreground">Legal pages are not available yet. <Link to="/app/support" className="text-accent underline">Contact support</Link> for a copy of your accepted documents.</p></div>
          <Button variant="outline" onClick={async () => { if (dirty && !window.confirm('You have unsaved changes. Sign out without saving?')) return; setPersonal(baseline.personal); setInvestor(baseline.investor); setDeveloper(baseline.developer); setFile(null); setRemoveAvatar(false); setPasswords({ password: '', confirm: '' }); await signOut(); navigate('/'); }}><LogOut />Sign out</Button>
        </div></Section>
      </div>
    </div>
    <AlertDialog open={blocker.status === 'blocked'}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Leave without saving?</AlertDialogTitle><AlertDialogDescription>You have unsaved changes. Leaving this page will discard them.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel onClick={() => blocker.reset?.()}>Keep editing</AlertDialogCancel><AlertDialogAction onClick={() => blocker.proceed?.()}>Leave without saving</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}