import { createFileRoute } from "@tanstack/react-router";
import PlaceholderPage from "@/pages/platform/PlaceholderPage";

export const Route = createFileRoute("/app/support")({
  head: () => ({
    meta: [
      { title: "Support — DHC Market" },
      { name: "description", content: "Get help from the DHC Market team." },
      { property: "og:title", content: "Support — DHC Market" },
      { property: "og:description", content: "Get help from the DHC Market team." },
    ],
  }),
  component: () => <PlaceholderPage title="Support" description="Get help from the DHC Market team." />,
});
