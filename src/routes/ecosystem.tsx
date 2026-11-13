import { createFileRoute } from "@tanstack/react-router";
import PublicExplainer from "@/pages/PublicExplainer";

export const Route = createFileRoute("/ecosystem")({
  head: () => ({
    meta: [
      { title: 'The ecosystem - DHC Market' },
      { name: "description", content: 'Advisors, lenders and service partners that support projects across the DHC Market ecosystem.' },
      { property: "og:title", content: 'The ecosystem - DHC Market' },
      { property: "og:description", content: 'Advisors, lenders and service partners that support projects across the DHC Market ecosystem.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <PublicExplainer kind="ecosystem" />,
});
