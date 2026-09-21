import { Link, NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const publicLinks = [
  { label: "For Developers", to: "/for-developers" },
  { label: "For Investors", to: "/for-investors" },
  { label: "Ecosystem", to: "/ecosystem" },
  { label: "Public Funding", to: "/public-funding" },
  { label: "How it works", to: "/how-it-works" },
];

const PublicNavLink = ({ to, label, mobile = false }: { to: string; label: string; mobile?: boolean }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      cn(
        "font-medium transition-colors",
        mobile ? "block py-3 text-base" : "text-sm",
        isActive
          ? "border-b-2 border-accent py-5 text-primary-foreground"
          : "border-b-2 border-transparent py-5 text-primary-foreground/65 hover:text-primary-foreground",
      )
    }
  >
    {label}
  </NavLink>
);

const PublicShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-50 border-b border-primary-foreground/10 bg-foreground/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-7 px-5 lg:px-7">
        <Link to="/" className="shrink-0 font-display text-xl font-bold text-primary-foreground">
          DHC<span className="text-accent">Market</span>
        </Link>
        <nav className="hidden items-center gap-5 lg:flex">
          {publicLinks.map((link) => <PublicNavLink key={link.to} {...link} />)}
        </nav>
        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
             <Link to="/sign-in">Sign in</Link>
          </Button>
          <Button variant="hero" asChild>
            <Link to="/sign-up">Get started</Link>
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto text-primary-foreground hover:bg-primary-foreground/10 lg:hidden" aria-label="Open navigation">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[320px]">
            <Link to="/" className="font-display text-xl font-bold text-foreground">DHC<span className="text-accent">Market</span></Link>
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

    <main>{children}</main>

    <footer className="border-t border-primary-foreground/10 bg-foreground py-9 text-primary-foreground/55">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 px-5 text-xs sm:flex-row lg:px-7">
        <span>DHC Market - a neutral connector for district heating and cooling.</span>
        <span>Not an investment adviser. Figures are developer-stated.</span>
      </div>
    </footer>
  </div>
);

export default PublicShell;