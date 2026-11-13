import { Link } from "@/lib/router-compat";
const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "For Investors",
    links: [
      { label: "Browse projects", href: "/for-investors" },
      { label: "Public funding", href: "/public-funding" },
      { label: "Ecosystem", href: "/ecosystem" },
      { label: "How it works", href: "/how-it-works" },
    ],
  },
  {
    title: "For Developers",
    links: [
      { label: "List a project", href: "/sign-up" },
      { label: "Project portfolio", href: "/for-developers" },
      { label: "Find advisors", href: "/ecosystem" },
      { label: "Public funding", href: "/public-funding" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "For Developers", href: "/for-developers" },
      { label: "For Investors", href: "/for-investors" },
      { label: "How it works", href: "/how-it-works" },
      { label: "Sign in", href: "/sign-in" },
    ],
  },
];

const Footer = () => {
  return (
    <footer className="border-t border-inverse-foreground/5 bg-navy-900 pb-9 pt-14 text-inverse-subtle">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-3 font-display text-xl font-bold text-inverse-foreground">
              DHC<span className="text-accent">Market</span>
            </div>
            <p className="max-w-[260px] text-sm text-inverse-subtle">
              Connecting district heating & cooling developers with private and public capital.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.14em] text-inverse-subtle">
                {col.title}
              </h3>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="block py-1.5 text-sm text-inverse-muted transition-colors hover:text-inverse-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-10 border-t border-inverse-foreground/10 pt-5 text-center text-[13px] text-inverse-subtle">
          © 2026 DHC Market. An information and connection platform. DHC Market does not provide
          investment advice, underwrite, or make investment decisions.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
