import { createFileRoute } from "@tanstack/react-router";
import InvestorDashboard from "@/pages/platform/InvestorDashboard";

export const Route = createFileRoute("/app/investing")({
  head: () => ({
    meta: [
      { title: "Investing - DHC Market" },
      { name: "description", content: "Projects you have reviewed, asked to see, or are negotiating on." },
      { property: "og:title", content: "Investing - DHC Market" },
      { property: "og:description", content: "Projects you have reviewed, asked to see, or are negotiating on." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <InvestorDashboard />,
});
