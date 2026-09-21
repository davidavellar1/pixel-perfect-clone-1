import { createFileRoute } from "@tanstack/react-router";
import PlaceholderPage from "@/pages/platform/PlaceholderPage";

export const Route = createFileRoute("/app/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — DHC Market" },
      { name: "description", content: "Projects you're tracking." },
      { property: "og:title", content: "Watchlist — DHC Market" },
      { property: "og:description", content: "Projects you're tracking." },
    ],
  }),
  component: () => <PlaceholderPage title="Watchlist" description="Projects you're tracking." />,
});
