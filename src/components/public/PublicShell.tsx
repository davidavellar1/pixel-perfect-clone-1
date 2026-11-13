import { Link, NavLink } from "@/lib/router-compat";
import { Menu } from "lucide-react";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const publicLinks = [
  { label: "For Investors", to: "/for-investors" },
  { label: "For Developers", to: "/for-developers" },
  { label: "For Partners", to: "/ecosystem" },
  { label: "Public Funding", to: "/public-funding" },
  { label: "How it works", to: "/how-it-works" },
];

const PublicNavLink = ({ to, label, mobile = false }: { to: string; label: string; mobile?: boolean }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "public-navigation-control font-medium transition-colors",
        mobile
          ? cn("block py-3 text-base text-foreground", isActive && "text-primary")
          : cn("text-[14.5px]", isActive ? "text-inverse-foreground" : "text-inverse-subtle hover:text-inverse-foreground"),
      )
    }
  >
    {label}
  </NavLink>
);

const PublicShell = ({ children }: { children: React.ReactNode }) => (
  <div className="public-shell min-h-screen bg-background">
    <a href="#public-main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-foreground focus:ring-2 focus:ring-ring">Skip to content</a>
    <header className="sticky top-0 z-50 border-b border-inverse-foreground/[0.07] bg-navy-900/85 backdrop-blur-xl">
      <div className="container flex h-[68px] items-center gap-[30px]">
        <Link to="/" className="shrink-0 font-display text-[21px] font-bold tracking-[-0.03em] text-inverse-foreground">
          DHC<span className="text-accent">Market</span>
        </Link>
        <nav className="hidden items-center gap-[30px] lg:flex">
          {publicLinks.map((link) => <PublicNavLink key={link.to} {...link} />)}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link to="/sign-in" className="px-3 py-2 text-[14.5px] font-medium text-inverse-foreground transition-colors hover:text-accent">
            Sign in
          </Link>
          <Button variant="hero" asChild>
            <Link to="/sign-up">Get started</Link>
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto text-inverse-foreground hover:bg-inverse-foreground/10 hover:text-inverse-foreground lg:hidden" aria-label="Open navigation">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-ring [&_a:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-ring [&_button:focus-visible]:outline-offset-2">
            <Link to="/" className="public-navigation-control font-display text-xl font-bold text-foreground">DHC<span className="text-accent">Market</span></Link>
            <nav className="mt-8 border-y border-border py-2">
              {publicLinks.map((link) => <SheetClose asChild key={link.to}><PublicNavLink {...link} mobile /></SheetClose>)}
            </nav>
            <div className="mt-6 grid gap-3">
              <Button variant="outline" asChild><Link to="/sign-in">Sign in</Link></Button>
              <Button variant="hero" asChild><Link to="/sign-up">Get started</Link></Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>

    <main id="public-main" tabIndex={-1}>{children}</main>

    <Footer />
  </div>
);

export default PublicShell;
