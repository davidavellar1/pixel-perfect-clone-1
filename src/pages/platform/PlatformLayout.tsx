import { useEffect, useMemo, useState } from "react";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate } from "@/lib/router-compat";
import { homePathFor, isPathAllowed, navGroupsFor, viewLabel } from "@/lib/navigation";
import { ChevronLeft, LogOut } from "lucide-react";
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
  const company = profile?.company_name || (loading ? "" : viewLabel(view));
  const initials = displayName.slice(0, 2).toUpperCase();
  const context = useMemo(() => ({ collapsed, toggleCollapsed }), [collapsed]);
  const handleSignOut = async () => { await signOut(); navigate("/"); };

  return <AppShellProvider value={context}>
    <div className={cn("grid min-h-screen bg-background transition-[grid-template-columns] duration-[220ms] ease-out", collapsed ? "grid-cols-[74px_minmax(0,1fr)]" : "grid-cols-[264px_minmax(0,1fr)]")}>
      <aside className="sticky top-0 z-40 flex h-screen min-w-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar">
        <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-sidebar-border px-4">
          <Link to={homePath} className="min-w-0 font-display text-xl font-bold text-white" title="DHC Market">
            {collapsed ? <span className="block w-[40px] text-center text-base">D<span className="text-accent">M</span></span> : <span>DHC<span className="text-accent">Market</span></span>}
          </Link>
          <Button variant="outline" size="icon" onClick={toggleCollapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} className={cn("h-[30px] w-[30px] shrink-0 border-accent text-accent transition-transform duration-[220ms] hover:bg-accent/10", collapsed && "rotate-180")}><ChevronLeft className="h-4 w-4" /></Button>
        </div>
        <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 pb-4">
          {loading ? <div className="space-y-2 pt-5" aria-hidden="true">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-10 animate-pulse rounded-md bg-white/5" />)}</div> : groups.map((group) => <div key={group.label}>
            {!collapsed && <p className="px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">{group.label}</p>}
            <div className={cn("space-y-1", collapsed && "pt-3")}>
              {group.items.map(({ label, to, icon: Icon, badge }) => <NavLink key={to} to={to} title={label} className={({ isActive }) => cn("flex h-10 items-center rounded-md text-sm font-medium transition-colors", collapsed ? "justify-center px-0" : "gap-3 px-3", isActive ? "bg-accent text-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                <Icon className="h-[18px] w-[18px] shrink-0" />
                {!collapsed && <><span className="truncate">{label}</span>{badgeCount(badge) > 0 && <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">{badgeCount(badge)}</span>}</>}
              </NavLink>)}
            </div>
          </div>)}
        </nav>
        <div className="shrink-0 border-t border-sidebar-border p-3">
          <div className={cn("mb-3 flex items-center", collapsed ? "justify-center" : "gap-3 px-1")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground" title={`${displayName}, ${company}`}>{initials}</div>
            {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium text-white">{displayName}</p><p className="truncate text-xs text-white/50">{company}</p></div>}
          </div>
          <Button variant="ghost" title="Sign out" onClick={handleSignOut} className={cn("w-full text-white/70 hover:bg-white/10 hover:text-white", collapsed ? "px-0" : "justify-start")}><LogOut className="h-4 w-4" />{!collapsed && "Sign out"}</Button>
        </div>
      </aside>
      <main className="min-w-0"><div className="mx-auto w-full max-w-[1240px] px-5 py-8 lg:px-8">{loading ? null : isPathAllowed(view, location.pathname) ? <Outlet /> : <Navigate to={homePath} replace />}</div></main>
    </div>
  </AppShellProvider>;
};
export default PlatformLayout;
