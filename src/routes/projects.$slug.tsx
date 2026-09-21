import { createFileRoute } from "@tanstack/react-router";
import ProjectDetail from "@/pages/ProjectDetail";

export const Route = createFileRoute("/projects/$slug")({
  head: () => ({
    meta: [
      { title: 'Project — DHC Market' },
      { name: "description", content: 'Project teaser, transaction summary and access criteria on DHC Market.' },
      { property: "og:title", content: 'Project — DHC Market' },
      { property: "og:description", content: 'Project teaser, transaction summary and access criteria on DHC Market.' },
    ],
  }),
  component: () => <ProjectDetail context="public" />,
});
