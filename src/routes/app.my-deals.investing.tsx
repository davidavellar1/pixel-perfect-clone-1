import { createFileRoute } from "@tanstack/react-router";
import InvestorDashboard from "@/pages/platform/InvestorDashboard";

export const Route = createFileRoute("/app/my-deals/investing")({
  head: () => ({
    meta: [
      { title: "Investing — My Deals — DHC Market" },
      { name: "description", content: "Projects you have reviewed, asked to see, or are negotiating on." },
      { property: "og:title", content: "Investing — My Deals — DHC Market" },
      { property: "og:description", content: "Projects you have reviewed, asked to see, or are negotiating on." },
    ],
  }),
  component: () => <InvestorDashboard />,
});
