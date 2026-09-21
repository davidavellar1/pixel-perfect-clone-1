import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Building2, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type RoleKey = "dev" | "inv" | "both" | "other";

const roles: { key: RoleKey; title: string; desc: string }[] = [
  { key: "dev", title: "Developer", desc: "List and finance DHC projects" },
  { key: "inv", title: "Investor", desc: "Discover and back projects" },
  { key: "both", title: "Both", desc: "I do both" },
  { key: "other", title: "Other", desc: "Advisor, funder, or exploring" },
];

const subRoles = [
  "Advisory partner (financial, legal, technical)",
  "Public co-investor / funding institution",
  "Just exploring",
];

const destinations: Record<RoleKey, string> = {
  dev: "/app/opportunities",
  inv: "/app/opportunities",
  both: "/app/opportunities",
  other: "/app/opportunities",
};

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
  const { toast } = useToast();
  const requestedRole = searchParams.get("role");
  const initialRole: RoleKey | "" = requestedRole === "developer" ? "dev" : requestedRole === "investor" ? "inv" : "";
  const [role, setRole] = useState<RoleKey | "">(initialRole);
  const [subRole, setSubRole] = useState("");
  const [fullName, setFullName] = useState("");
  const [organization, setOrganization] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = !!role && agreed && !loading;

  const handleSubmit = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 8) {
      toast({
        title: "Check your details",
        description: "Full name, a valid work email, and a password of at least 8 characters are required.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
            company_name: organization.trim(),
            role,
            sub_role: role === "other" ? subRole : undefined,
          },
        },
      });
      if (error) throw error;
      toast({
        title: "Account created",
        description: "You are signed in. Welcome to DHC Market.",
      });
      navigate(destinations[role as RoleKey] ?? "/app");
    } catch (err: any) {
      const message: string = err?.message || "Something went wrong. Please try again.";
      const alreadyRegistered = /already registered|already exists|User already/i.test(message);
      toast({
        title: alreadyRegistered ? "You already have an account" : "Sign-up failed",
        description: alreadyRegistered
          ? "This email is already registered. Please sign in instead, or use Forgot password."
          : message,
        variant: "destructive",
      });
      if (alreadyRegistered) navigate("/signin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[44%_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-b from-[#0b1b2e] to-[#081320] p-12 text-primary-foreground lg:flex lg:flex-col">
        <div className="pointer-events-none absolute -right-40 -top-32 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(47,128,237,0.22),transparent_70%)]" />
        <Link to="/" className="relative z-10 font-display text-2xl font-bold">
          DHC<span className="text-[#3ea0ff]">Market</span>
        </Link>
        <div className="relative z-10 my-auto">
          <h2 className="mb-6 max-w-[16ch] font-display text-3xl font-semibold leading-snug">
            Where DHC projects meet the right capital.
          </h2>
          <div className="flex flex-col gap-4">
            {brandPoints.map(({ icon: Icon, text }) => (
              <div key={text} className="flex max-w-[42ch] items-start gap-3 text-sm leading-relaxed text-[#c5d2e2]">
                <Icon className="mt-0.5 h-5 w-5 flex-none text-[#3ea0ff]" strokeWidth={1.8} />
                {text}
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-xs text-[#5d6f86]">
          Standardized DHC opportunities across Europe.
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-10 lg:px-8">
        <div className="w-full max-w-[430px]">
          <h1 className="mb-1.5 font-display text-[27px] font-semibold">Get started</h1>
          <p className="mb-6 text-sm text-muted-foreground">Create your account. It takes a minute.</p>

          <div className="mb-2.5">
            <Label className="mb-2 block text-[13.5px] font-semibold">I'm joining as a</Label>
            <div className="grid grid-cols-2 gap-2.5">
              {roles.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRole(r.key)}
                  className={cn(
                    "rounded-xl border border-border p-3.5 text-left transition-colors hover:border-[#c2cedb]",
                    role === r.key && "border-accent bg-accent/10",
                  )}
                >
                  <div className="font-display text-sm font-semibold">{r.title}</div>
                  <div className="mt-0.5 text-xs leading-snug text-muted-foreground">{r.desc}</div>
                </button>
              ))}
            </div>
            {role === "other" && (
              <div className="mb-2 mt-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
                {subRoles.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 py-1 text-[13.5px] text-foreground/80">
                    <input
                      type="radio"
                      name="subrole"
                      checked={subRole === s}
                      onChange={() => setSubRole(s)}
                      className="accent-[#2f80ed]"
                    />
                    {s}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="fullName" className="mb-1.5 block text-[13.5px] font-semibold">Full name</Label>
              <Input id="fullName" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="org" className="mb-1.5 block text-[13.5px] font-semibold">Organization</Label>
              <Input id="org" placeholder="Company / fund" value={organization} onChange={(e) => setOrganization(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="email" className="mb-1.5 block text-[13.5px] font-semibold">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="mt-4">
            <Label htmlFor="password" className="mb-1.5 block text-[13.5px] font-semibold">Password</Label>
            <Input id="password" type="password" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="mt-1.5 text-xs text-muted-foreground">At least 8 characters.</p>
          </div>

          <div className="mt-5 flex gap-2.5 rounded-lg border border-[#c9e8d5] bg-[#e6f5ec] p-3.5 text-[12.5px] leading-relaxed text-[#1c6e48]">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
            <span>
              After sign-up we verify your identity and organization. You can browse anonymized opportunities right
              away; full project details unlock once verified and you express interest.
            </span>
          </div>

          <label className="mb-5 mt-5 flex cursor-pointer items-start gap-2 text-[12.5px] leading-relaxed text-muted-foreground">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
            <span>
              I agree to the <span className="text-accent">Terms of Service</span> and{" "}
              <span className="text-accent">Privacy Policy</span>.
            </span>
          </label>

          <Button
            className="h-12 w-full bg-accent font-display text-[15px] font-semibold hover:bg-accent/90"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/signin" className="font-semibold text-accent">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
