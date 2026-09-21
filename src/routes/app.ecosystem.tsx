import { createFileRoute } from "@tanstack/react-router";
import Ecosystem from "@/pages/platform/Ecosystem";

export const Route = createFileRoute("/app/ecosystem")({
  head: () => ({
    meta: [
      { title: 'Ecosystem — DHC Market' },
      { name: "description", content: 'Advisors, lenders and service partners across the DHC Market ecosystem.' },
      { property: "og:title", content: 'Ecosystem — DHC Market' },
      { property: "og:description", content: 'Advisors, lenders and service partners across the DHC Market ecosystem.' },
    ],
  }),
  component: () => <Ecosystem />,
});
