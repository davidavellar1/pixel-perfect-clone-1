import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, CheckCircle } from "lucide-react";

const countries = [
  "Denmark",
  "Sweden",
  "Finland",
  "Germany",
  "France",
  "Poland",
  "Netherlands",
  "Austria",
];


const DeveloperSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    position: "",
    developerType: "",
    canPostProjects: "",
    countriesOfOperation: [] as string[],
    acceptedTerms: false,
  });

  const handleToggle = (
    field: "countriesOfOperation",
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
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
            user_type: "developer",
            full_name: form.fullName,
            company_name: form.companyName || "",
            position: form.position || "",
            developer_type: form.developerType || "",
            can_post_projects: form.canPostProjects || "",
            countries_of_operation: form.countriesOfOperation,
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
            <FileText className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold text-primary-foreground font-serif">
              DHC<span className="text-accent">Market</span>
            </span>
          </a>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-6">
            List Your DHC Projects
          </h1>
          <p className="text-primary-foreground/60 text-lg mb-10 leading-relaxed">
            Connect with qualified investors and access public funding to bring your district energy projects to life.
          </p>
          <ul className="space-y-4">
            {[
              "Match with 45+ active infrastructure investors",
              "Access financial, legal & technical advisory",
              "Apply for EU grants and blended finance",
              "Full project portfolio management tools",
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
      <div className="flex-1 flex items-start justify-center p-8 pt-8 bg-background overflow-y-auto">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-serif font-bold text-foreground mb-2">Create your account</h2>
          <p className="text-muted-foreground mb-8">Start listing your projects and connecting with investors.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Maria Jensen"
                />
              </div>
              <div>
                <Label htmlFor="companyName">Company *</Label>
                <Input
                  id="companyName"
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Nordic Energy AB"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="position">Position / Title *</Label>
              <Input
                id="position"
                required
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                placeholder="e.g. Project Director, CEO"
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="maria@nordicenergy.com"
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

            <div>
              <Label>Organization Type</Label>
              <Select onValueChange={(v) => setForm({ ...form, developerType: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utility">Utility</SelectItem>
                  <SelectItem value="municipality">Municipality</SelectItem>
                  <SelectItem value="private_developer">Private Developer</SelectItem>
                  <SelectItem value="energy_company">Energy Company</SelectItem>
                  <SelectItem value="esco">ESCO</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>



            <div>
              <Label>Countries of Operation</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {countries.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleToggle("countriesOfOperation", country)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      form.countriesOfOperation.includes(country)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-secondary text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {country}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Are you authorized to list projects on behalf of your organization? *</Label>
              <Select onValueChange={(v) => setForm({ ...form, canPostProjects: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I am authorized</SelectItem>
                  <SelectItem value="no">No, I need approval from others</SelectItem>
                  <SelectItem value="partial">I can submit for review only</SelectItem>
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

export default DeveloperSignup;
