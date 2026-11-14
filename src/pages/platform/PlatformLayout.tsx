import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "@/lib/router-compat";
import { NAV_GROUPS } from "@/lib/navigation";
import { ChevronDown, ChevronsUpDown, HelpCircle, LogOut, Plus, Settings } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Sidebar, SidebarProvider, SidebarHeader, SidebarFooter, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useWatchlist } from "@/hooks/useWatchlist";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const activePath = (pathname: string, path: string) => path === "/app" ? pathname.replace(/\/$/, "") === path : pathname === path || pathname.startsWith(`${path}/`);

function WorkspaceShell() {
  const { user, profile, loading, signOut } = useAuth();
  const { setOpenMobile } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { count: watchCount } = useWatchlist();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOnMine, setPendingOnMine] = useState(0);
  const [dealsOpen, setDealsOpen] = useState(true);
  useEffect(() => { setOpenMobile(false); if (location.pathname.startsWith("/app/my-deals")) setDealsOpen(true); }, [location.pathname, setOpenMobile]);
  useEffect(() => {
    if (!user) return;
    void supabase.from("notification").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null).then(({ count }) => setUnreadCount(count ?? 0));
    void supabase.from("access_request").select("id", { count: "exact", head: true }).eq("state", "pending").neq("investor_user_id", user.id).then(({ count }) => setPendingOnMine(count ?? 0));
  }, [user?.id, location.pathname]);
  const countFor = (badge?: string) => badge === "watchlist" ? watchCount : badge === "notifications" ? unreadCount : badge === "listing" ? pendingOnMine : 0;
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Member";
  const section = NAV_GROUPS.flatMap(g => g.items).flatMap(i => i.children ?? [i]).find(i => activePath(location.pathname, i.to))?.label || (location.pathname.includes("settings") ? "Profile settings" : "Workspace");
  return <>
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-3"><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild tooltip="DHC Market" className="text-sidebar-accent-foreground"><Link to="/app"><span className="font-display font-bold">D</span><span className="font-display text-lg font-bold">DHC<span className="text-accent">Market</span></span></Link></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader>
      <SidebarContent><nav aria-label="Workspace">{NAV_GROUPS.map(group => <SidebarGroup key={group.label}><SidebarGroupLabel>{group.label}</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>
        {loading ? Array.from({ length: 3 }).map((_, i) => <SidebarMenuItem key={i}><SidebarMenuSkeleton showIcon /></SidebarMenuItem>) : group.items.map(item => item.children ?
          <Collapsible key={item.key} open={dealsOpen} onOpenChange={setDealsOpen} asChild><SidebarMenuItem>
            <CollapsibleTrigger asChild><SidebarMenuButton tooltip={item.label} isActive={location.pathname.startsWith("/app/my-deals")}><item.icon /><span>{item.label}</span><ChevronDown className="ml-auto" /></SidebarMenuButton></CollapsibleTrigger>
            <CollapsibleContent><SidebarMenuSub>{item.children.map(child => <SidebarMenuSubItem key={child.key}><SidebarMenuSubButton asChild isActive={activePath(location.pathname, child.to)}><Link to={child.to}><span>{child.label}</span>{countFor(child.badge) > 0 && <span className="ml-auto text-xs">{countFor(child.badge)}</span>}</Link></SidebarMenuSubButton></SidebarMenuSubItem>)}</SidebarMenuSub></CollapsibleContent>
          </SidebarMenuItem></Collapsible> :
          <SidebarMenuItem key={item.key}><SidebarMenuButton asChild tooltip={item.label} isActive={activePath(location.pathname, item.to)}><Link to={item.to}><item.icon /><span>{item.label}</span></Link></SidebarMenuButton>{countFor(item.badge) > 0 && <SidebarMenuBadge>{countFor(item.badge)}</SidebarMenuBadge>}</SidebarMenuItem>)}
      </SidebarMenu></SidebarGroupContent></SidebarGroup>)}</nav></SidebarContent>
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
