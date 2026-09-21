import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/pages/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: 'DHC Market — Deal space for infrastructure projects' },
      { name: "description", content: 'Verified project listings, staged data-room access and a transparent engagement workflow for developers and investors.' },
      { property: "og:title", content: 'DHC Market — Deal space for infrastructure projects' },
      { property: "og:description", content: 'Verified project listings, staged data-room access and a transparent engagement workflow for developers and investors.' },
    ],
  }),
  component: () => <Landing />,
});
