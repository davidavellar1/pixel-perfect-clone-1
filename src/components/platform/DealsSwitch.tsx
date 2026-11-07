import { NavLink } from "@/lib/router-compat";
import { INVESTING_PATH, LISTING_PATH } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Phones only show the sidebar's icon rail, so My Deals offers its two pages here too. */
const DealsSwitch = () => (
  <nav aria-label="My Deals" className="mb-5 flex rounded-lg border border-border bg-card p-1 md:hidden">
    {[{ to: INVESTING_PATH, label: "Investing" }, { to: LISTING_PATH, label: "Listing" }].map((tab) => (
      <NavLink key={tab.to} to={tab.to} className={({ isActive }) => cn("flex h-10 flex-1 items-center justify-center rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted")}>
        {tab.label}
      </NavLink>
    ))}
  </nav>
);

export default DealsSwitch;
