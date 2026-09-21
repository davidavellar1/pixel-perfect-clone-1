import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router-compat";
import {
  Rocket,
  Eye,
  Banknote,
  Handshake,
  BarChart3,
  Globe,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const benefits = [
  {
    icon: Eye,
    title: "Visibility to Global Investors",
    description:
      "Showcase your projects to a curated network of institutional and private investors actively seeking district energy opportunities.",
  },
  {
    icon: Banknote,
    title: "Faster Access to Capital",
    description:
      "Streamline your fundraising with structured project profiles, financial models, and direct investor engagement - no middlemen.",
  },
  {
    icon: BarChart3,
    title: "Professional Project Profiles",
    description:
      "Present your projects with interactive dashboards, financial projections, energy output charts, and timeline visualizations.",
  },
  {
    icon: Globe,
    title: "Pan-European Reach",
    description:
      "List projects from any EU country and reach investors across the continent who are aligned with your geography and technology.",
  },
  {
    icon: Handshake,
    title: "Investor Matchmaking",
    description:
      "Our platform matches your project profile with investors whose mandate, ticket size, and regional focus align with your needs.",
  },
  {
    icon: Rocket,
    title: "End-to-End Deal Support",
    description:
      "From teaser deck creation to data room access management, we provide the tools you need to close deals efficiently.",
  },
];

const stats = [
  { value: "200+", label: "Active Investors" },
  { value: "9+", label: "Countries Covered" },
  { value: "€500M+", label: "Capital Seeking Deployment" },
  { value: "30 Days", label: "Avg. Time to First Interest" },
];

const steps = [
  {
    step: "01",
    title: "Register & Create Profile",
    description: "Sign up as a developer and provide details about your company, expertise, and project pipeline.",
  },
  {
    step: "02",
    title: "List Your Projects",
    description: "Upload project details, financial models, and supporting documents to create a compelling listing.",
  },
  {
    step: "03",
    title: "Connect & Close",
    description: "Nothing about your project is revealed until you accept an investor request, and you approve the data room separately.",
  },
];

const Developers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16" style={{ background: "var(--hero-gradient)" }}>
        <div className="container mx-auto px-4 pt-12 pb-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase mb-4">
              For Developers
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-foreground mb-6 leading-tight">
              Fund Your District Energy Projects Faster
            </h1>
            <p className="text-lg text-primary-foreground/70 mb-8 max-w-2xl leading-relaxed">
              List your projects on Europe's dedicated marketplace for district heating & cooling.
              Reach qualified investors, streamline due diligence, and accelerate your path to financing.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/developer-signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8">
                  Sign Up as Developer <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/sign-in?redirect=/app/opportunities">
                <Button
                  size="lg"
                  className="bg-card/20 backdrop-blur-sm border border-primary-foreground/30 text-primary-foreground hover:bg-card/30 font-semibold px-8"
                >
                  See Listed Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-card border-b border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {stats.map((stat) => (
              <div key={stat.label} className="py-8 text-center">
                <p className="text-2xl md:text-3xl font-bold text-primary font-serif">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase text-center mb-4">
            Why List on DHC Market
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-4">
            Built for Project Developers
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14">
            Everything you need to attract investment and bring your district energy projects to life.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="bg-card border border-border rounded-xl p-6"
                style={{ boxShadow: "var(--card-shadow)" }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-serif font-bold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-secondary/50">
        <div className="container mx-auto px-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase text-center mb-4">
            How It Works
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-14">
            Three Steps to Investor Access
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-5 font-serif">
                  {s.step}
                </div>
                <h3 className="text-lg font-serif font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checklist / Trust */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-xl p-8 md:p-12" style={{ boxShadow: "var(--card-shadow)" }}>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6 text-center">
              What You Get as a Developer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                "Dedicated project listing page",
                "Interactive financial dashboards",
                "Developer-approved data room access",
                "Direct investor messaging",
                "Analytics on investor interest",
                "Professional teaser deck tools",
                "EU public funding guidance",
                "Dedicated developer support",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link to="/developer-signup">
                <Button size="lg" className="font-semibold px-10">
                  Get Started as Developer <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Developers;
