import { useLocation, useNavigate } from "react-router-dom";
import { LogOut, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  isHome?: boolean;
}

const Navbar = ({ isHome: isHomeProp }: NavbarProps = {}) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const isHome = isHomeProp ?? pathname === "/";

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "";
  const initials = (displayName || "U").slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b border-primary-foreground/10"
      style={{ background: "var(--hero-gradient)" }}
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <a href="/" className="font-display text-xl font-bold text-primary-foreground tracking-tight">
          DHC<span className="text-accent">Market</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          <a href="/for-developers" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
            For Developers
          </a>
          <a href="/for-investors" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
            For Investors
          </a>
          <a href="/ecosystem" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
            Ecosystem
          </a>
          <a href="/public-funding" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
            Public Funding
          </a>
          <a href="/how-it-works" className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors">
            How it works
          </a>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Account menu"
                  className="flex items-center gap-2 rounded-full border border-primary-foreground/20 pl-1 pr-3 py-1 hover:bg-primary-foreground/10 transition-colors"
                >
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-semibold">
                    {initials}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-primary" />
                  </span>
                  <span className="max-w-[120px] truncate text-sm font-medium text-primary-foreground">
                    {displayName}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  Signed in as {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => navigate("/app/opportunities")}>
                  <LayoutGrid className="h-4 w-4" /> Platform
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <a href="/signin">
                <Button
                  size="default"
                  variant="outline"
                  className="px-6 bg-transparent text-primary-foreground border-primary-foreground/20 hover:bg-primary-foreground/10 font-semibold rounded-md"
                >
                  Sign In
                </Button>
              </a>
              <Button
                size="default"
                className="px-6 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold rounded-md"
                  onClick={() => navigate("/sign-up")}
              >
                Get Started
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
