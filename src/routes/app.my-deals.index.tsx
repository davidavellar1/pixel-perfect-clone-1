import { createFileRoute, redirect } from "@tanstack/react-router";

// My Deals no longer exists as a parent; Investing and Listing are top-level.
export const Route = createFileRoute("/app/my-deals/")({
  beforeLoad: () => {
    throw redirect({ href: "/app/investing", replace: true });
  },
  component: () => null,
});
