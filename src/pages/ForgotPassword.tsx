import { useEffect, useState } from "react";
import { Link } from "@/lib/router-compat";
import PublicShell from "@/components/public/PublicShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { recoveryPasswordError } from "@/lib/funnel";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [recovering, setRecovering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") { setRecovering(true); setMessage(""); }
    });
    // The client may process the recovery link before this screen mounts.
    const recoveryLink = new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery" || new URLSearchParams(window.location.search).get("recovery") === "1";
    if (recoveryLink) supabase.auth.getSession().then(({ data }) => { if (data.session) setRecovering(true); });
    return () => subscription.unsubscribe();
  }, []);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    if (recovering) {
      const validation = recoveryPasswordError(password, confirm);
      if (validation) { setError(validation); return; }
    }
    setLoading(true);
    try {
      if (recovering) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword(""); setConfirm(""); setRecovering(false);
        setMessage("Your password has been changed. You can now sign in with your new password.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/forgot-password?recovery=1` });
        if (error) throw error;
        setMessage("If an account exists for this email, a password reset link will be sent. Check your inbox and spam folder.");
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to complete your request. Please try again."); }
    finally { setLoading(false); }
  };
  return <PublicShell><section className="container max-w-lg py-16">
    <h1 className="mb-6 font-display text-3xl font-semibold">{recovering ? "Choose a new password" : "Reset your password"}</h1>
    {message && <p role="status" className="mb-6 text-sm text-foreground">{message}</p>}
    <form onSubmit={submit} className="space-y-5">
      {recovering ? <>
        <div><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e => setPassword(e.target.value)} aria-describedby="recovery-hint recovery-error" /></div>
        <div><Label htmlFor="confirm-password">Confirm new password</Label><Input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={e => setConfirm(e.target.value)} aria-describedby="recovery-error" /></div>
        <p id="recovery-hint" className="text-xs text-muted-foreground">Use at least 8 characters.</p>
      </> : <div><Label htmlFor="recovery-email">Email</Label><Input id="recovery-email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} aria-describedby="recovery-error" /></div>}
      <p id="recovery-error" role={error ? "alert" : undefined} className="text-sm text-destructive">{error}</p>
      <Button type="submit" disabled={loading}>{loading ? "Please wait..." : recovering ? "Save new password" : "Send reset link"}</Button>
    </form>
    <Link to="/sign-in" className="mt-6 inline-block text-sm text-accent underline">Back to sign in</Link>
  </section></PublicShell>;
}
