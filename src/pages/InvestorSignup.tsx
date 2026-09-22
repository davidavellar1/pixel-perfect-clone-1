import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import GoogleSignupButton from "@/components/auth/GoogleSignupButton";
import { TrendingUp, CheckCircle } from "lucide-react";

const regions = [
  "Northern Europe",
  "Western Europe",
  "Central Europe",
  "Southern Europe",
  "Eastern Europe",
];

const InvestorSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    investorType: "",
    investmentRange: "",
    position: "",
    canMakeInvestmentDecisions: "",
    acceptedTerms: false,
    regionsOfInterest: [] as string[],
  });

  const handleRegionToggle = (region: string) => {
    setForm((prev) => ({
      ...prev,
      regionsOfInterest: prev.regionsOfInterest.includes(region)
        ? prev.regionsOfInterest.filter((r) => r !== region)
        : [...prev.regionsOfInterest, region],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            user_type: "investor",
            full_name: form.fullName,
            company_name: form.companyName || "",
            investor_type: form.investorType || "",
            investment_range: form.investmentRange || "",
            position: form.position || "",
            can_make_investment_decisions: form.canMakeInvestmentDecisions || "",
            regions_of_interest: form.regionsOfInterest,
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email to verify your account.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-start pt-8 px-16"
        style={{ background: "var(--hero-gradient)" }}
      >
        <div className="max-w-md">
          <a href="/" className="flex items-center gap-2 mb-8">
            <TrendingUp className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold text-primary-foreground font-serif">
              DHC<span className="text-accent">Market</span>
            </span>
          </a>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-6">
            Join 45+ Active Investors
          </h1>
          <p className="text-primary-foreground/60 text-lg mb-10 leading-relaxed">
            Access verified district heating & cooling projects with attractive risk-adjusted returns.
          </p>
          <ul className="space-y-4">
            {[
              "Browse 120+ verified projects across Europe",
              "Target 8-15% IRR on infrastructure assets",
              "Co-invest alongside public funding programs",
              "Full due diligence and advisory support",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-primary-foreground/70">
                <CheckCircle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Create your account</h2>
          <p className="text-muted-foreground mb-8">Start exploring investment opportunities today.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company</Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Acme Capital"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="john@acmecapital.com"
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Investor Type</Label>
                <Select onValueChange={(v) => setForm({ ...form, investorType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fund">Fund</SelectItem>
                    <SelectItem value="family_office">Family Office</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Investment Range</Label>
                <Select onValueChange={(v) => setForm({ ...form, investmentRange: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_1m">&lt; €1M</SelectItem>
                    <SelectItem value="1m_5m">€1M - €5M</SelectItem>
                    <SelectItem value="5m_25m">€5M - €25M</SelectItem>
                    <SelectItem value="25m_100m">€25M - €100M</SelectItem>
                    <SelectItem value="over_100m">&gt; €100M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Regions of Interest</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {regions.map((region) => (
                  <button
                    key={region}
                    type="button"
                    onClick={() => handleRegionToggle(region)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.regionsOfInterest.includes(region)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {region}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="position">Position / Title *</Label>
              <Input
                id="position"
                required
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="e.g. Managing Director, Partner"
              />
            </div>

            <div>
              <Label>Are you authorized to make investment decisions? *</Label>
              <Select onValueChange={(v) => setForm({ ...form, canMakeInvestmentDecisions: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I can make investment decisions</SelectItem>
                  <SelectItem value="no">No, I need approval from others</SelectItem>
                  <SelectItem value="partial">I can recommend but not approve</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={form.acceptedTerms}
                onCheckedChange={(checked) => setForm({ ...form, acceptedTerms: checked === true })}
              />
              <Label htmlFor="terms" className="text-sm text-muted-foreground leading-snug cursor-pointer">
                I agree to the{" "}
                <a href="/terms" className="text-primary hover:underline">Terms & Conditions</a>
                {" "}and{" "}
                <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
              </Label>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading || !form.acceptedTerms}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <a href="/signin" className="text-primary hover:underline font-medium">
                Sign in
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvestorSignup;
