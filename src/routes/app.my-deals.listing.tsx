import { createFileRoute } from "@tanstack/react-router";
import DeveloperDashboard from "@/pages/platform/DeveloperDashboard";

export const Route = createFileRoute("/app/my-deals/listing")({
  head: () => ({
    meta: [
      { title: "Listing - My Deals - DHC Market" },
      { name: "description", content: "Projects you have listed and the investors interested in them." },
      { property: "og:title", content: "Listing - My Deals - DHC Market" },
      { property: "og:description", content: "Projects you have listed and the investors interested in them." },
    ],
  }),
  component: () => <DeveloperDashboard />,
});
