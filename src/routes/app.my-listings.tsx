import { createFileRoute } from "@tanstack/react-router";
import DeveloperDashboard from "@/pages/platform/DeveloperDashboard";

export const Route = createFileRoute("/app/my-listings")({
  head: () => ({
    meta: [
      { title: 'My listings — DHC Market' },
      { name: "description", content: 'Manage your published projects and incoming investor interest.' },
      { property: "og:title", content: 'My listings — DHC Market' },
      { property: "og:description", content: 'Manage your published projects and incoming investor interest.' },
    ],
  }),
  component: () => <DeveloperDashboard />,
});
