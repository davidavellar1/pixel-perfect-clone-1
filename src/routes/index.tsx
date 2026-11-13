import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: 'DHC Market - Deal space for infrastructure projects' },
      { name: "description", content: 'European district heating and cooling opportunities with developer-controlled access for investors.' },
      { property: "og:title", content: 'DHC Market - Deal space for infrastructure projects' },
      { property: "og:description", content: 'European district heating and cooling opportunities with developer-controlled access for investors.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Landing />,
});
