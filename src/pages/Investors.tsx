import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  ShieldCheck,
  BarChart3,
  Globe,
  FileText,
  Users,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const benefits = [
  {
    icon: TrendingUp,
    title: "Attractive Risk-Adjusted Returns",
    description:
      "District energy projects deliver stable, infrastructure-grade returns with target IRRs of 8-12%, backed by long-term offtake agreements and regulatory support.",
  },
  {
    icon: ShieldCheck,
    title: "De-Risked Investments",
    description:
      "Every listed project undergoes rigorous due diligence. Many benefit from public co-investment, municipal guarantees, and EU funding mechanisms.",
  },
  {
    icon: BarChart3,
    title: "Full Financial Transparency",
    description:
      "Access detailed financial models, 10-year projections, NPV analyses, and payback period calculations for every project before committing.",
  },
  {
    icon: Globe,
    title: "Pan-European Portfolio",
    description:
      "Diversify across geographies and technologies - from Scandinavian geothermal to Central European waste heat recovery and solar thermal grids.",
  },
  {
    icon: FileText,
    title: "Streamlined Due Diligence",
    description:
      "Access teaser decks, technical feasibility studies, and financial models directly on the platform. Request full data rooms with one click.",
  },
  {
    icon: Users,
    title: "Direct Developer Access",
    description:
      "Connect directly with vetted project developers. No intermediaries, no hidden fees - just transparent deal flow.",
  },
];

const stats = [
  { value: "€500M+", label: "Project Pipeline" },
  { value: "9+", label: "Countries" },
  { value: "8-12%", label: "Target IRR Range" },
  { value: "50+", label: "Listed Projects" },
];

const steps = [
  {
    step: "01",
    title: "Create Your Account",
    description: "Sign up as an investor and tell us about your investment preferences and target regions.",
  },
  {
    step: "02",
    title: "Browse & Filter Projects",
    description: "Explore our curated marketplace of verified DHC projects across Europe with detailed financials.",
  },
  {
    step: "03",
    title: "Request Access & Invest",
    description: "Request access to full project data rooms, connect with developers, and structure your investment.",
  },
];

const Investors = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16" style={{ background: "var(--hero-gradient)" }}>
        <div className="container mx-auto px-4 pt-12 pb-8">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.2em] text-accent uppercase mb-4">
              For Investors
            </p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-primary-foreground mb-6 leading-tight">
              Invest in Europe's Clean Energy Transition
            </h1>
            <p className="text-lg text-primary-foreground/70 mb-8 max-w-2xl leading-relaxed">
              Access a curated pipeline of investment-ready district heating & cooling projects.
              Stable returns, real impact, and full transparency - all in one platform.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/investor-signup">
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8">
                  Sign Up as Investor <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link to="/sign-in?redirect=/app/opportunities">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary-foreground/20 text-primary hover:bg-primary-foreground/10 font-semibold px-8"
                >
                  Browse Projects
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
            Why Invest with DHC Market
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-4">
            Built for Institutional & Private Investors
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14">
            Everything you need to evaluate, compare, and invest in district energy infrastructure.
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
            Three Steps to Your First Investment
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
              What You Get as an Investor
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {[
                "Access to verified project pipeline",
                "Detailed financial models & projections",
                "Direct communication with developers",
                "Portfolio builder & tracking tools",
                "Pre-arranged portfolio options",
                "Confidential data room access",
                "Regulatory & public funding insights",
                "Dedicated investor support",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link to="/investor-signup">
                <Button size="lg" className="font-semibold px-10">
                  Get Started as Investor <ArrowRight className="w-4 h-4 ml-1" />
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

export default Investors;
