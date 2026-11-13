import { createFileRoute } from "@tanstack/react-router";
import Investors from "@/pages/Investors";

export const Route = createFileRoute("/investors")({
  head: () => ({
    meta: [
      { title: 'For investors - DHC Market' },
      { name: "description", content: 'Screen developer-stated infrastructure opportunities, request data-room access and track your pipeline.' },
      { property: "og:title", content: 'For investors - DHC Market' },
      { property: "og:description", content: 'Screen developer-stated infrastructure opportunities, request data-room access and track your pipeline.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Investors />,
});
