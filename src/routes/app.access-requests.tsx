import { createFileRoute } from "@tanstack/react-router";
import AccessRequests from "@/pages/platform/AccessRequests";

export const Route = createFileRoute("/app/access-requests")({
  head: () => ({
    meta: [
      { title: 'Access requests — DHC Market' },
      { name: "description", content: 'Review, accept or decline investor requests for your project data rooms.' },
      { property: "og:title", content: 'Access requests — DHC Market' },
      { property: "og:description", content: 'Review, accept or decline investor requests for your project data rooms.' },
    ],
  }),
  component: () => <AccessRequests />,
});
