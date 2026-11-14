import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "@/lib/router-compat";
import { Building2, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import GoogleSignupButton from "@/components/auth/GoogleSignupButton";
import type { SignupRole } from "@/lib/googleSignup";
import { cn } from "@/lib/utils";
import { funnelDestination } from "@/lib/funnel";
import { SIGNUP_INTENTS, homePathFor, type SignupIntent } from "@/lib/navigation";

// Every member gets the full workspace. This optional answer only picks the first page.
const ROLE_PARAM_INTENT: Record<string, SignupIntent> = { developer: "listing", investor: "investing" };

const brandPoints = [
  {
    icon: Building2,
    text: "List a project free, and find public co-financing before you even need an investor.",
  },
  {
    icon: ShieldCheck,
    text: "Browse anonymized opportunities; identities reveal only when you choose to connect.",
  },
  {
    icon: Users,
    text: "Reach a vetted network of developers, investors, and advisors.",
  },
];

const SignUp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get("role");
  const [intents, setIntents] = useState<SignupIntent[]>(() => (requestedRole && ROLE_PARAM_INTENT[requestedRole] ? [ROLE_PARAM_INTENT[requestedRole]] : []));
  const toggleIntent = (value: SignupIntent) =>
    setIntents((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = agreed && !loading;
  // Every new member can invest and list, so both profile records are created.
  const googleRoles: SignupRole[] = ["investor", "developer"];
  const destination = funnelDestination(searchParams.get("redirect"), homePathFor(intents));

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      toast.error("Check your details", { description: "Full name, a valid work email, and a password of at least 8 characters are required." });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/sign-in?redirect=${encodeURIComponent(destination)}`,
          data: {
            full_name: fullName.trim(),
            company_name: organization.trim(),
            role: "both",
            signup_intent: intents,
          },
        },
      });
      if (error) throw error;
      toast.success("Account created", { description: data.session ? "You are signed in. Welcome to DHC Market." : "Check your email to confirm your account, then sign in to continue." });
      navigate(data.session ? destination : `/sign-in?redirect=${encodeURIComponent(destination)}`);
    } catch (err: any) {
      const message: string = err?.message || "Something went wrong. Please try again.";
      const alreadyRegistered = /already registered|already exists|User already/i.test(message);
      toast.error(alreadyRegistered ? "You already have an account" : "Sign-up failed", { description: alreadyRegistered
          ? "This email is already registered. Please sign in instead, or use Forgot password."
          : message });
      if (alreadyRegistered) navigate(`/sign-in?redirect=${encodeURIComponent(destination)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[44%_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-b from-navy-800 to-navy-900 p-12 text-primary-foreground lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-40 -top-32 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(47,128,237,0.22),transparent_70%)]" />
        <Link to="/" className="relative z-10 font-display text-2xl font-bold">
          DHC<span className="text-accent">Market</span>
        </Link>
        <div className="relative z-10 my-auto rounded-lg bg-navy-900/80 p-6">
          <h2 className="mb-6 max-w-[16ch] font-display text-3xl font-semibold leading-snug">
            Where DHC projects meet the right capital.
          </h2>
          <div className="flex flex-col gap-4">
            {brandPoints.map(({ icon: Icon, text }) => (
              <div key={text} className="flex max-w-[42ch] items-start gap-3 text-sm leading-relaxed text-inverse-muted">
                <Icon className="mt-0.5 h-5 w-5 flex-none text-accent" strokeWidth={1.8} />
                {text}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs text-inverse-muted">
          Standardized DHC opportunities across Europe.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-3 sm:py-10 lg:px-8">
        <div className="w-full max-w-[430px]">
          <h1 className="mb-1.5 font-display text-[27px] font-semibold">Get started</h1>
          <p className="mb-2 text-sm text-muted-foreground sm:mb-6">One account to invest in projects, list your own, or both.</p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
            <div>
              <Label htmlFor="fullName" className="mb-1.5 block text-[13.5px] font-semibold">Full name</Label>
              <Input id="fullName" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="org" className="mb-1.5 block text-[13.5px] font-semibold">Organization</Label>
              <Input id="org" placeholder="Company / fund" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </div>
          </div>
          <div className="mt-2 sm:mt-4">
            <Label htmlFor="email" className="mb-1.5 block text-[13.5px] font-semibold">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mt-2 sm:mt-4">
            <Label htmlFor="password" className="mb-1.5 block text-[13.5px] font-semibold">Password</Label>
            <Input id="password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
          </div>

          <fieldset className="mt-2 rounded-lg border border-border bg-muted/40 px-4 pb-3 pt-2 sm:mt-5 sm:pb-4">
            <legend className="px-1 text-[13.5px] font-semibold">
              What brings you to DHC Market? <span className="font-normal text-muted-foreground">(optional)</span>
            </legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {SIGNUP_INTENTS.map((option) => {
                const checked = intents.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={cn(
                      "inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-[13px] transition-colors focus-within:ring-2 focus-within:ring-ring",
                      checked ? "border-primary bg-primary/10 font-semibold text-info" : "border-border bg-card font-medium text-foreground hover:border-border",
                    )}
                  >
                    <input type="checkbox" className="h-3.5 w-3.5 accent-primary" checked={checked} onChange={() => toggleIntent(option.value)} />
                    {option.label}
                  </label>
                );
              })}
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">This only sets the page you start on. Every member can invest and list.</p>
          </fieldset>

          <div className="mt-3 flex gap-2.5 rounded-lg border border-success-border bg-success-soft p-3 text-[12.5px] leading-relaxed text-success-foreground sm:mt-5 sm:p-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              After sign-up we verify your identity and organization. You can browse anonymized opportunities right
              away; full project details open after the developer accepts your request.
            </span>
          </div>

          <div className="mb-3 mt-3 flex items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground sm:mb-5 sm:mt-5">
            <Checkbox id="signup-agreement" aria-labelledby="signup-agreement-text" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
            <span id="signup-agreement-text">
              <Label htmlFor="signup-agreement" className="cursor-pointer text-[12.5px] font-normal">I agree to the</Label>{" "}<Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-primary underline">Terms of Service</Link> and{" "}
              <Link to="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary underline">Privacy Policy</Link>.
            </span>
          </div>

          <Button
            className="h-12 w-full bg-accent font-display text-[15px] font-semibold hover:bg-accent/90"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <GoogleSignupButton
            className="public-secondary w-full"
            roles={googleRoles}
            fullName={fullName}
            company={organization}
            intents={intents}
            destination={destination}
            disabled={!agreed}
            label="Sign up with Google"
          />
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Accept the terms first. Google accounts work straight away - no email confirmation needed.
          </p>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to={`/sign-in?redirect=${encodeURIComponent(destination)}`} className="font-semibold text-primary underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
