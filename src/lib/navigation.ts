import { Bell, Briefcase, Boxes, Heart, HelpCircle, Landmark, LayoutGrid, ListChecks, Newspaper, MessageSquare, Users, type LucideIcon } from "lucide-react";

export type AppView = "investor" | "developer" | "both";

export interface NavItem {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
  badge?: "watchlist" | "notifications";
  views: AppView[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ALL: AppView[] = ["investor", "developer", "both"];
const INV: AppView[] = ["investor", "both"];

export const NAV_GROUPS: NavGroup[] = [
  { label: "Discover", items: [
    { key: "opportunities", label: "Opportunities", to: "/app/opportunities", icon: LayoutGrid, views: INV },
    { key: "public-funding", label: "Public Funding", to: "/app/public-funding", icon: Landmark, views: ALL },
    { key: "news", label: "Market news", to: "/app/news", icon: Newspaper, views: ALL },
    { key: "ecosystem", label: "Ecosystem", to: "/app/ecosystem", icon: Users, views: INV },
  ] },
  { label: "My workspace", items: [
    { key: "my-portfolio", label: "My Portfolio", to: "/app/my-portfolio", icon: Briefcase, views: INV },
    { key: "my-listings", label: "My Listings", to: "/app/my-listings", icon: ListChecks, views: ALL },
    { key: "watchlist", label: "Watchlist", to: "/app/watchlist", icon: Heart, badge: "watchlist", views: INV },
    { key: "notifications", label: "Notifications", to: "/app/notifications", icon: Bell, badge: "notifications", views: ALL },
  ] },
  { label: "Tools", items: [
    { key: "bundle-builder", label: "Bundle builder", to: "/app/bundle-builder", icon: Boxes, views: INV },
  ] },
  { label: "Support", items: [
    { key: "support", label: "Support", to: "/app/support", icon: HelpCircle, views: ALL },
    { key: "feedback", label: "Feedback", to: "/app/feedback", icon: MessageSquare, views: ALL },
  ] },
];

export const navGroupsFor = (view: AppView): NavGroup[] =>
  NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.views.includes(view)) })).filter((g) => g.items.length > 0);

export const homePathFor = (view: AppView) => (view === "developer" ? "/app/my-listings" : "/app/opportunities");

const DEVELOPER_ALLOWED = [
  "/app/public-funding",
  "/app/news",
  "/app/my-listings",
  "/app/notifications",
  "/app/support",
  "/app/feedback",
  "/app/submit-project",
  "/app/access-requests",
  "/app/data-room-requests",
  "/app/developer",
  "/app/projects",
  "/app/advisors",
];

const matches = (pathname: string, prefix: string) => pathname === prefix || pathname.startsWith(`${prefix}/`);

export const isPathAllowed = (view: AppView, pathname: string): boolean => {
  if (view !== "developer") return true;
  const path = pathname.replace(/\/+$/, "") || "/";
  if (path === "/app") return true;
  return DEVELOPER_ALLOWED.some((p) => matches(path, p));
};

export const viewLabel = (view: AppView) =>
  view === "developer" ? "Developer" : view === "both" ? "Investor & developer" : "Investor";
