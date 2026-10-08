/**
 * Public site settings used for canonical URLs, social previews and the sitemap.
 * To move to a custom domain, set VITE_SITE_URL (e.g. https://www.dhcmarket.eu)
 * or change the fallback below — nothing else needs to change.
 */
export const SITE_URL = (
  (import.meta.env.VITE_SITE_URL as string | undefined) || "https://dhc-deal-space.lovable.app"
).replace(/\/+$/, "");

export const SITE_NAME = "DHC Market";
export const OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export const absoluteUrl = (path: string) =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Paths that must never appear in search results (signed-in app, auth and API). */
const NOINDEX_PREFIXES = [
  "/app",
  "/sign-in",
  "/sign-up",
  "/signin",
  "/signup",
  "/developer-signup",
  "/investor-signup",
  "/submit-project",
  "/api",
  "/.lovable",
  "/mcp",
  // Project teasers are confidential listings with generic titles: kept out of search for now.
  "/projects",
];

export const isNoIndexPath = (pathname: string) =>
  NOINDEX_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

/** Public, indexable pages listed in the sitemap. */
export const PUBLIC_PATHS = [
  "/",
  "/for-investors",
  "/for-developers",
  "/investors",
  "/developers",
  "/how-it-works",
  "/public-funding",
  "/ecosystem",
];
