import { createFileRoute } from "@tanstack/react-router";
import InvestorDashboard from "@/pages/platform/InvestorDashboard";

export const Route = createFileRoute("/app/my-portfolio")({
  head: () => ({
    meta: [
      { title: 'My portfolio — DHC Market' },
      { name: "description", content: 'Your engagements, access requests and pipeline at a glance.' },
      { property: "og:title", content: 'My portfolio — DHC Market' },
      { property: "og:description", content: 'Your engagements, access requests and pipeline at a glance.' },
    ],
  }),
  component: () => <InvestorDashboard />,
});
