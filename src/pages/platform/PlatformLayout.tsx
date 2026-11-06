import { useEffect, useMemo, useState } from "react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "@/lib/router-compat";
import { homePathFor, isPathAllowed, navGroupsFor, viewLabel } from "@/lib/navigation";
import { ChevronLeft, ChevronsUpDown, HelpCircle, LogOut, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AppShellProvider } from "@/contexts/AppShellContext";
import { supabase } from "@/integrations/supabase/client";

const PlatformLayout = () => {
  const { user, profile, view, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const groups = useMemo(() => navGroupsFor(view), [view]);
  const homePath = homePathFor(view);
  const storageKey = `dhc-app-shell-collapsed-${user?.id || "guest"}`;
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(storageKey) === "true");
  const { count: watchCount } = useWatchlist();
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => { setCollapsed(localStorage.getItem(storageKey) === "true"); }, [storageKey]);
  useEffect(() => { if (user) void supabase.from("notification").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null).then(({ count }) => setUnreadCount(count || 0)); }, [user]);
  const badgeCount = (badge?: string) => (badge === "watchlist" ? watchCount : badge === "notifications" ? unreadCount : 0);
  const toggleCollapsed = () => setCollapsed((value) => { const next = !value; localStorage.setItem(storageKey, String(next)); return next; });
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Member";
  const company = loading ? "" : viewLabel(view);
  const initials = displayName.slice(0, 2).toUpperCase();
  const context = useMemo(() => ({ collapsed, toggleCollapsed }), [collapsed]);
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return <AppShellProvider value={context}>
    <div className={cn("app-shell-grid grid min-h-screen bg-background transition-[grid-template-columns] duration-[220ms] ease-out", collapsed && "app-shell-collapsed")}>
      <aside className="sticky top-0 z-40 flex h-screen min-w-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <Link to={homePath} className="min-w-0 font-display text-xl font-bold text-white" title="DHC Market">
            <span className={cn("block w-[40px] text-center text-base", !collapsed && "md:hidden")}>D<span className="text-accent">M</span></span>{!collapsed && <span className="hidden md:block">DHC<span className="text-accent">Market</span></span>}
          </Link>
          <Button variant="outline" size="icon" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={cn("hidden h-[30px] w-[30px] shrink-0 border-accent text-accent transition-transform duration-[220ms] hover:bg-accent/10 md:inline-flex", collapsed && "rotate-180")}><ChevronLeft className="h-4 w-4" /></Button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
          {loading ? <div className="space-y-2 pt-5" aria-hidden="true">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-white/5" />)}</div> : groups.map((group) => <div key={group.label}>
            {!collapsed && <p className="hidden px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40 md:block">{group.label}</p>}
            <div className={cn("space-y-1", collapsed && "pt-3")}>
              {group.items.map(({ label, to, icon: Icon, badge }) => <NavLink key={to} to={to} title={label} className={({ isActive }) => cn("flex h-10 items-center rounded-md text-sm font-medium transition-colors", collapsed ? "justify-center px-0" : "justify-center px-0 md:justify-start md:gap-3 md:px-3", isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <><span className="hidden truncate md:inline">{label}</span>{badgeCount(badge) > 0 && <span className="ml-auto hidden rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent md:inline">{badgeCount(badge)}</span>}</>}
              </NavLink>)}
            </div>
          </div>)}
        </nav>
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" aria-label="Account menu" className={cn("h-auto min-h-14 w-full justify-center px-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring", !collapsed && "md:justify-start md:gap-3 md:px-1")}>
            <Avatar className="h-9 w-9"><AvatarImage src={profile?.avatar_url ?? undefined} alt="Your avatar" className="object-cover" /><AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">{initials}</AvatarFallback></Avatar>
            {!collapsed && <><span className="hidden min-w-0 text-left md:block"><span className="block truncate text-sm font-medium text-sidebar-accent-foreground">{displayName}</span><span className="block truncate text-xs text-sidebar-foreground">{company}</span></span><ChevronsUpDown className="ml-auto hidden shrink-0 md:block" /></>}
          </Button></DropdownMenuTrigger><DropdownMenuContent side="top" align="start" sideOffset={8} className="w-60 max-w-[calc(100vw-24px)]"><DropdownMenuLabel><span className="block truncate">{displayName}</span><span className="block truncate text-xs font-normal text-muted-foreground">{user?.email}</span></DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link to="/app/settings"><Settings className="mr-2 h-4 w-4" />Profile settings</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/app/support"><HelpCircle className="mr-2 h-4 w-4" />Help &amp; support</Link></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void handleSignOut()}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        </div>
      </aside>
      <main className="min-w-0"><div className="mx-auto w-full max-w-[1240px] px-5 py-8 lg:px-8">{loading ? null : isPathAllowed(view, location.pathname) ? <Outlet /> : <Navigate to={homePath} replace />}</div></main>
    </div>
  </AppShellProvider>;
};
export default PlatformLayout;
