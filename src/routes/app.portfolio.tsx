import { createFileRoute } from "@tanstack/react-router";
import Portfolio from "@/pages/platform/Portfolio";

export const Route = createFileRoute("/app/portfolio")({
  head: () => ({
    meta: [
      { title: 'Portfolio — DHC Market' },
      { name: "description", content: 'Track performance and status across the projects you are engaged on.' },
      { property: "og:title", content: 'Portfolio — DHC Market' },
      { property: "og:description", content: 'Track performance and status across the projects you are engaged on.' },
    ],
  }),
  component: () => <Portfolio />,
});
