import { useEffect, useMemo, useState } from "react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "@/lib/router-compat";
import { NAV_GROUPS, homePathFor, type NavItem } from "@/lib/navigation";
import { ChevronDown, ChevronLeft, ChevronsUpDown, HelpCircle, LogOut, Plus, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AppShellProvider } from "@/contexts/AppShellContext";
import { supabase } from "@/integrations/supabase/client";

const isUnder = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

const itemClass = (active: boolean, collapsed: boolean) =>
  cn(
    "flex h-10 w-full items-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
    collapsed ? "justify-center px-0" : "justify-center px-0 md:justify-start md:gap-3 md:px-3",
    active ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  );

const Badge = ({ count, onAccent }: { count: number; onAccent?: boolean }) =>
  count > 0 ? (
    <span className={cn("ml-auto hidden rounded-full px-2 py-0.5 text-[10px] font-semibold md:inline", onAccent ? "bg-accent-foreground/15 text-accent-foreground" : "bg-accent/15 text-accent")}>{count}</span>
  ) : null;

const PlatformLayout = () => {
  const { user, profile, intents, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const homePath = homePathFor(intents);
  const storageKey = `dhc-app-shell-collapsed-${user?.id || "guest"}`;
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(storageKey) === "true");
  const { count: watchCount } = useWatchlist();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOnMine, setPendingOnMine] = useState(0);
  const inDeals = isUnder(location.pathname, "/app/my-deals");
  const [dealsOpen, setDealsOpen] = useState(true);
  useEffect(() => { if (inDeals) setDealsOpen(true); }, [inDeals]);
  useEffect(() => { setCollapsed(localStorage.getItem(storageKey) === "true"); }, [storageKey]);
  useEffect(() => { if (user) void supabase.from("notification").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null).then(({ count }) => setUnreadCount(count || 0)); }, [user]);
  // Requests other members sent on this member's listings (RLS returns only those and their own).
  useEffect(() => { if (user) void supabase.from("access_request").select("id", { count: "exact", head: true }).eq("state", "pending").neq("investor_user_id", user.id).then(({ count }) => setPendingOnMine(count || 0)); }, [user, location.pathname]);
  const badgeCount = (badge?: string) => (badge === "watchlist" ? watchCount : badge === "notifications" ? unreadCount : badge === "listing" ? pendingOnMine : 0);
  const toggleCollapsed = () => setCollapsed((value) => { const next = !value; localStorage.setItem(storageKey, String(next)); return next; });
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Member";
  const subtitle = profile?.company_name || user?.email || "";
  const initials = displayName.slice(0, 2).toUpperCase();
  const context = useMemo(() => ({ collapsed, toggleCollapsed }), [collapsed]);
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const sectionTitle = useMemo(() => {
    for (const group of NAV_GROUPS) for (const item of group.items) {
      const child = item.children?.find((c) => isUnder(location.pathname, c.to));
      if (child) return `${item.label} / ${child.label}`;
      if (!item.children && isUnder(location.pathname, item.to)) return item.label;
    }
    if (isUnder(location.pathname, "/app/settings")) return "Profile settings";
    if (isUnder(location.pathname, "/app/submit-project")) return "List a project";
    return "";
  }, [location.pathname]);

  const renderParent = (item: NavItem) => {
    const Icon = item.icon;
    const children = item.children || [];
    if (collapsed) {
      return <NavLink key={item.key} to={item.to} title={item.label} className={() => itemClass(inDeals, true)}><Icon className="h-[18px] w-[18px] shrink-0" /></NavLink>;
    }
    return <div key={item.key}>
      {/* Phones show the icon rail only, so the parent links straight to its first page there. */}
      <NavLink to={item.to} title={item.label} className={() => cn(itemClass(inDeals, false), "md:hidden")}><Icon className="h-[18px] w-[18px] shrink-0" /></NavLink>
      <button type="button" aria-expanded={dealsOpen} aria-controls={`nav-${item.key}`} onClick={() => setDealsOpen((v) => !v)} className={cn("hidden h-10 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring md:flex", inDeals ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
        <Icon className="h-[18px] w-[18px] shrink-0" /><span className="flex-1 truncate">{item.label}</span><ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", dealsOpen && "rotate-180")} />
      </button>
      {dealsOpen && <div id={`nav-${item.key}`} className="ml-[21px] mt-1 hidden flex-col gap-0.5 border-l border-white/15 pl-2.5 md:flex">
        {children.map((child) => <NavLink key={child.key} to={child.to} className={({ isActive }) => cn("flex h-[34px] items-center rounded-md px-3 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring", isActive ? "bg-accent font-semibold text-accent-foreground" : "font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
          {({ isActive }: { isActive: boolean }) => <><span className="flex-1 truncate">{child.label}</span><Badge count={badgeCount(child.badge)} onAccent={isActive} /></>}
        </NavLink>)}
      </div>}
    </div>;
  };

  return <AppShellProvider value={context}>
    <div className={cn("app-shell-grid grid min-h-screen bg-background transition-[grid-template-columns] duration-[220ms] ease-out", collapsed && "app-shell-collapsed")}>
      <aside className="sticky top-0 z-40 flex h-screen min-w-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <Link to={homePath} className="min-w-0 font-display text-xl font-bold text-white" title="DHC Market">
            <span className={cn("block w-[40px] text-center text-base", !collapsed && "md:hidden")}>D<span className="text-accent">M</span></span>{!collapsed && <span className="hidden md:block">DHC<span className="text-accent">Market</span></span>}
          </Link>
          <Button variant="outline" size="icon" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={cn("hidden h-[30px] w-[30px] shrink-0 border-accent text-accent transition-transform duration-[220ms] hover:bg-accent/10 md:inline-flex", collapsed && "rotate-180")}><ChevronLeft className="h-4 w-4" /></Button>
        </div>
        <nav aria-label="Workspace" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
          {loading ? <div className="space-y-2 pt-5" aria-hidden="true">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-white/5" />)}</div> : NAV_GROUPS.map((group) => <div key={group.label}>
            {!collapsed && <p className="hidden px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50 md:block">{group.label}</p>}
            <div className={cn("space-y-1", collapsed && "pt-3")}>
              {group.items.map((item) => item.children ? renderParent(item) : <NavLink key={item.key} to={item.to} title={item.label} className={({ isActive }) => itemClass(isActive, collapsed)}>
                {({ isActive }: { isActive: boolean }) => <>
                  <item.icon className="h-[18px] w-[18px] shrink-0" />
                  {!collapsed && <><span className="hidden truncate md:inline">{item.label}</span><Badge count={badgeCount(item.badge)} onAccent={isActive} /></>}
                </>}
              </NavLink>)}
            </div>
          </div>)}
        </nav>
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" aria-label="Account menu" className={cn("h-auto min-h-14 w-full justify-center px-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring", !collapsed && "md:justify-start md:gap-3 md:px-1")}>
            <Avatar className="h-9 w-9"><AvatarImage src={profile?.avatar_url ?? undefined} alt="Your avatar" className="object-cover" /><AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials}</AvatarFallback></Avatar>
            {!collapsed && <><span className="hidden min-w-0 text-left md:block"><span className="block truncate text-sm font-medium text-sidebar-accent-foreground">{displayName}</span><span className="block truncate text-xs text-sidebar-foreground">{subtitle}</span></span><ChevronsUpDown className="ml-auto hidden shrink-0 md:block" /></>}
          </Button></DropdownMenuTrigger><DropdownMenuContent side="top" align="start" sideOffset={8} className="w-60 max-w-[calc(100vw-24px)]"><DropdownMenuLabel><span className="block truncate">{displayName}</span><span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link to="/app/settings"><Settings className="mr-2 h-4 w-4" />Profile settings</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/app/support"><HelpCircle className="mr-2 h-4 w-4" />Help &amp; support</Link></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void handleSignOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </aside>
      <main className="min-w-0">
        <div className="flex min-h-[60px] flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-2.5 lg:px-8">
          <p className="min-w-0 truncate text-sm font-medium text-muted-foreground">{sectionTitle}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link to="/app/opportunities">Browse opportunities</Link></Button>
            <Button asChild size="sm"><Link to="/app/submit-project"><Plus className="h-4 w-4" />List a project</Link></Button>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1240px] px-5 py-8 lg:px-8">{loading ? null : <Outlet />}</div>
      </main>
    </div>
  </AppShellProvider>;
};
export default PlatformLayout;
