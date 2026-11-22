import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "@/lib/router-compat";
import { NAV_GROUPS } from "@/lib/navigation";
import { ChevronsUpDown, HelpCircle, LogOut, Plus, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarProvider, SidebarHeader, SidebarFooter, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge, SidebarMenuSkeleton, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const activePath = (pathname: string, path: string) => path === "/app" ? pathname.replace(/\/$/, "") === path : pathname === path || pathname.startsWith(`${path}/`);

function WorkspaceShell() {
  const { user, profile, roles, loading, signOut } = useAuth();
  const { setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { count: watchCount } = useWatchlist();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOnMine, setPendingOnMine] = useState(0);
  const [investingCount, setInvestingCount] = useState(0);
  useEffect(() => { setOpenMobile(false); }, [location.pathname, setOpenMobile]);
  useEffect(() => {
    if (!user) return;
    let active = true;
    void supabase.from("notification").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null).then(({ count }) => { if (active) setUnreadCount(count ?? 0); });
    // Investing: my requests awaiting the developer, plus accepted requests whose acceptance notice I have not opened.
    void Promise.all([
      supabase.from("access_request").select("id", { count: "exact", head: true }).eq("investor_user_id", user.id).eq("state", "pending"),
      supabase.from("notification").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null).in("kind", ["access_request_granted", "access_request_granted_full"]),
    ]).then(([waiting, accepted]) => { if (active) setInvestingCount((waiting.count ?? 0) + (accepted.count ?? 0)); });
    // Listing: pending requests on projects this user owns, filtered explicitly rather than left to RLS.
    void (async () => {
      const developer = await supabase.from("developer_profiles").select("id").eq("user_id", user.id).maybeSingle();
      const owned = developer.data ? await supabase.from("project").select("id").eq("developer_id", developer.data.id) : { data: [] };
      const ids = (owned.data ?? []).map((project) => project.id);
      const pending = ids.length ? await supabase.from("access_request").select("id", { count: "exact", head: true }).eq("state", "pending").in("project_id", ids).neq("investor_user_id", user.id) : { count: 0 };
      if (active) setPendingOnMine(pending.count ?? 0);
    })();
    return () => { active = false; };
  }, [user?.id, location.pathname]);
  const countFor = (badge?: string) => badge === "watchlist" ? watchCount : badge === "notifications" ? unreadCount : badge === "listing" ? pendingOnMine : badge === "investing" ? investingCount : 0;
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Member";
  const section = NAV_GROUPS.flatMap(g => g.items).find(i => activePath(location.pathname, i.to))?.label || (location.pathname.includes("settings") ? "Profile settings" : "Workspace");
  return <>
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3"><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild tooltip="DHC Market" className="text-sidebar-accent-foreground"><Link to="/app"><span className="font-display font-bold">D</span><span className="font-display text-lg font-bold">DHC<span className="text-accent">Market</span></span></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader>
      <SidebarContent><nav aria-label="Workspace">{NAV_GROUPS.map(group => <SidebarGroup key={group.label}><SidebarGroupLabel>{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
        {loading ? Array.from({ length: 3 }).map((_, i) => <SidebarMenuItem key={i}><SidebarMenuSkeleton showIcon /></SidebarMenuItem>) : group.items.map(item =>
          <SidebarMenuItem key={item.key}><SidebarMenuButton asChild tooltip={item.label} isActive={activePath(location.pathname, item.to)}><Link to={item.to}><item.icon /><span>{item.label}</span></Link></SidebarMenuButton>{countFor(item.badge) > 0 && <SidebarMenuBadge>{countFor(item.badge)}</SidebarMenuBadge>}</SidebarMenuItem>)}
      </SidebarMenu></SidebarGroupContent></SidebarGroup>)}{roles.includes("admin")&&<SidebarGroup><SidebarGroupLabel>Administration</SidebarGroupLabel><SidebarMenu>{[["/app/admin/contact-requests","Contact requests"],["/app/admin/funding-review","Funding verification"],["/app/admin/news-health","News source health"]].map(([path,label])=><SidebarMenuItem key={path}><SidebarMenuButton asChild><Link to={path??"/app"}><Settings/><span>{label}</span></Link></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroup>}</nav></SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border"><SidebarMenu><SidebarMenuItem><DropdownMenu><DropdownMenuTrigger asChild><SidebarMenuButton size="lg" tooltip="Account menu" aria-label="Account menu"><Avatar className="h-8 w-8"><AvatarImage src={profile?.avatar_url ?? undefined} alt="Your avatar" /><AvatarFallback className="bg-accent text-accent-foreground">{displayName.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0"><span className="block truncate">{displayName}</span><span className="block truncate text-xs">{profile?.company_name || user?.email}</span></span><ChevronsUpDown className="ml-auto" /></SidebarMenuButton></DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-60"><DropdownMenuLabel>{displayName}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem asChild><Link to="/app/settings"><Settings />Profile settings</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/app/support"><HelpCircle />Help and support</Link></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => void signOut().then(() => navigate("/"))}><LogOut />Sign out</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarMenuItem></SidebarMenu></SidebarFooter>
    </Sidebar>
    <div className="min-w-0 flex-1">
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-2 border-b border-border bg-card px-4 py-2"><div className="flex min-w-0 items-center gap-3"><SidebarTrigger className="min-h-11 min-w-11" /><p className="truncate text-sm text-muted-foreground">{section}</p></div><Button asChild size="sm"><Link to="/app/submit-project"><Plus />List a project</Link></Button></header>
      <main className="workspace-container px-4 py-6 sm:px-6 lg:px-8">{loading ? null : <Outlet />}</main>
    </div>
  </>;
}
export default function PlatformLayout() {
  const { user } = useAuth();
  const key = `dhc-app-shell-collapsed-${user?.id ?? "guest"}`;
  const [open, setOpen] = useState(true);
  useEffect(() => { try { setOpen(localStorage.getItem(key) !== "true"); } catch { setOpen(true); } }, [key]);
  return <SidebarProvider open={open} onOpenChange={value => { setOpen(value); try { localStorage.setItem(key, String(!value)); } catch { /* Storage may be unavailable. */ } }}><WorkspaceShell /></SidebarProvider>;
}
