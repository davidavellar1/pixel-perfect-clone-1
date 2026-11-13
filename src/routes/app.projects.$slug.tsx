import { createFileRoute } from "@tanstack/react-router";
import ProjectDetail from "@/pages/ProjectDetail";

export const Route = createFileRoute("/app/projects/$slug")({
  head: () => ({
    meta: [
      { title: 'Project - DHC Market' },
      { name: "description", content: 'Full project view with transaction detail and data-room access state.' },
      { property: "og:title", content: 'Project - DHC Market' },
      { property: "og:description", content: 'Full project view with transaction detail and data-room access state.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ProjectDetail context="app" />,
});
