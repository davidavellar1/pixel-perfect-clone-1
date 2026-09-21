import { Button } from "@/components/ui/button";

type FooterLink = string | { label: string; href: string };

const footerLinks: Record<string, FooterLink[]> = {
  "For Investors": [{ label: "Browse Projects", href: "/investors" }, { label: "Portfolio Builder", href: "/investors" }, { label: "Pre-Arranged Portfolios", href: "/investors" }, { label: "Due Diligence", href: "/investors" }],
  "For Developers": [{ label: "List Your Project", href: "/developers" }, { label: "Project Portfolio", href: "/developers" }, { label: "Service Providers", href: "/developers" }, { label: "Public Funding", href: "/developers" }],
  "Platform": ["Ecosystem", "Partners", "About", "Contact"],
};

const Footer = () => {
  return (
    <footer style={{ background: "var(--hero-gradient)" }}>
      {/* CTA */}
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-foreground mb-4">
          Ready to Shape the Future of District Energy?
        </h2>
        <p className="text-primary-foreground/60 max-w-2xl mx-auto mb-10">
          Whether you're seeking investment opportunities or funding your next project, DHCMarket is your platform.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/investors">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8">
              Start Investing <span className="ml-2">→</span>
            </Button>
          </a>
          <a href="/developer-signup">
            <Button
              size="lg"
              className="bg-card/20 backdrop-blur-sm border border-primary-foreground/30 text-primary-foreground hover:bg-card/30 font-semibold px-8"
            >
              List a Project
            </Button>
          </a>
        </div>
      </div>

      {/* Footer Links */}
      <div className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <p className="text-lg font-bold text-primary-foreground mb-3">
              DHC<span className="text-accent">Market</span>
            </p>
            <p className="text-sm text-primary-foreground/50 leading-relaxed">
              Connecting district heating & cooling developers with private and public capital.
            </p>
          </div>
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <p className="text-xs font-semibold tracking-[0.15em] text-primary-foreground/70 uppercase mb-4">
                {category}
              </p>
              <ul className="space-y-2">
                {links.map((link) => {
                  const label = typeof link === "string" ? link : link.label;
                  const href = typeof link === "string" ? "#" : link.href;
                  return (
                    <li key={label}>
                      <a href={href} className="text-sm text-primary-foreground/60 hover:text-primary-foreground transition-colors">
                        {label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-6">
          <p className="text-xs text-primary-foreground/40 text-center">
            © 2026 DHCMarket. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
