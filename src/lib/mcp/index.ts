import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchOpportunitiesTool from "./tools/search-opportunities";
import getProjectTool from "./tools/get-project";
import listWatchlistTool from "./tools/list-watchlist";
import addToWatchlistTool from "./tools/add-to-watchlist";
import listMyAccessRequestsTool from "./tools/list-my-access-requests";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "pixel-perfect-clone-1",
  title: "Pixel Perfect Clone 1",
  version: "0.1.0",
  instructions:
    "Tools for the DHC Market deal space. Use `search_opportunities` to find listed district heating and cooling projects, `get_project` for one project's profile, `list_watchlist` and `add_to_watchlist` to manage the signed-in user's saved projects, and `list_my_access_requests` to check data-room request status. All figures are developer-stated and unverified.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    searchOpportunitiesTool,
    getProjectTool,
    listWatchlistTool,
    addToWatchlistTool,
    listMyAccessRequestsTool,
  ],
});
