import { createFileRoute } from "@tanstack/react-router";
import Opportunities from "@/pages/platform/Opportunities";

export const Route = createFileRoute("/app/opportunities")({
  head: () => ({
    meta: [
      { title: 'Opportunities — DHC Market' },
      { name: "description", content: 'Browse live infrastructure opportunities matched to your mandate.' },
      { property: "og:title", content: 'Opportunities — DHC Market' },
      { property: "og:description", content: 'Browse live infrastructure opportunities matched to your mandate.' },
    ],
  }),
  component: () => <Opportunities />,
});
