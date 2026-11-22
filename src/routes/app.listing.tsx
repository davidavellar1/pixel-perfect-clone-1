import { createFileRoute } from "@tanstack/react-router";
import DeveloperDashboard from "@/pages/platform/DeveloperDashboard";

export const Route = createFileRoute("/app/listing")({
  head: () => ({
    meta: [
      { title: "Listing - DHC Market" },
      { name: "description", content: "Projects you have listed and the investors interested in them." },
      { property: "og:title", content: "Listing - DHC Market" },
      { property: "og:description", content: "Projects you have listed and the investors interested in them." },
    ],
  }),
  component: () => <DeveloperDashboard />,
});
