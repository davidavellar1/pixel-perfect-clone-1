import { Bell, Boxes, Briefcase, Heart, HelpCircle, Landmark, LayoutGrid, MessageSquare, Newspaper, Users, type LucideIcon } from "lucide-react";

// Every member gets the same workspace: anyone can invest in projects and anyone can list one.

export interface NavLeaf {
  key: string;
  label: string;
  to: string;
  badge?: "watchlist" | "notifications" | "investing" | "listing";
}

export interface NavItem extends NavLeaf {
  icon: LucideIcon;
  /** A collapsible parent: `to` is where the parent itself points (its first child). */
  children?: NavLeaf[];
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const INVESTING_PATH = "/app/my-deals/investing";
export const LISTING_PATH = "/app/my-deals/listing";

export const NAV_GROUPS: NavGroup[] = [
  { label: "Discover", items: [
    { key: "opportunities", label: "Opportunities", to: "/app/opportunities", icon: LayoutGrid },
    { key: "public-funding", label: "Public Funding", to: "/app/public-funding", icon: Landmark },
    { key: "news", label: "Market news", to: "/app/news", icon: Newspaper },
    { key: "ecosystem", label: "Advisors & ecosystem", to: "/app/ecosystem", icon: Users },
  ] },
  { label: "My workspace", items: [
    { key: "my-deals", label: "My Deals", to: INVESTING_PATH, icon: Briefcase, children: [
      { key: "investing", label: "Investing", to: INVESTING_PATH, badge: "investing" },
      { key: "listing", label: "Listing", to: LISTING_PATH, badge: "listing" },
    ] },
    { key: "watchlist", label: "Watchlist", to: "/app/watchlist", icon: Heart, badge: "watchlist" },
    { key: "notifications", label: "Notifications", to: "/app/notifications", icon: Bell, badge: "notifications" },
  ] },
  { label: "Tools", items: [
    { key: "bundle-builder", label: "Bundle builder", to: "/app/bundle-builder", icon: Boxes },
  ] },
  { label: "Support", items: [
    { key: "support", label: "Support", to: "/app/support", icon: HelpCircle },
    { key: "feedback", label: "Feedback", to: "/app/feedback", icon: MessageSquare },
  ] },
];

/** What a member said brought them here at sign-up. It only picks the first page, never what they can open. */
export type SignupIntent = "investing" | "listing" | "advising" | "exploring";

export const SIGNUP_INTENTS: { value: SignupIntent; label: string }[] = [
  { value: "investing", label: "Investing in projects" },
  { value: "listing", label: "Listing projects" },
  { value: "advising", label: "Advising" },
  { value: "exploring", label: "Just exploring" },
];

export const readIntents = (meta: Record<string, unknown> | undefined | null): SignupIntent[] => {
  const raw = meta?.signup_intent;
  const valid = new Set(SIGNUP_INTENTS.map((i) => i.value));
  return Array.isArray(raw) ? raw.filter((v): v is SignupIntent => typeof v === "string" && valid.has(v as SignupIntent)) : [];
};

/** Members who only came to list a project start on Listing; everyone else starts on Opportunities. */
export const homePathFor = (intents: SignupIntent[]) =>
  intents.includes("listing") && !intents.includes("investing") ? LISTING_PATH : "/app/opportunities";
