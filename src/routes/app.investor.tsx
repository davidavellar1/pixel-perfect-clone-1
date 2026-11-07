import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address from before investing and listing moved under My Deals.
export const Route = createFileRoute("/app/investor")({
  beforeLoad: () => {
    throw redirect({ href: "/app/my-deals/investing", replace: true });
  },
  component: () => null,
});
