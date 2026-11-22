import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address; Investing and Listing are top-level workspace pages.
export const Route = createFileRoute("/app/investor")({
  beforeLoad: () => {
    throw redirect({ href: "/app/investing", replace: true });
  },
  component: () => null,
});
