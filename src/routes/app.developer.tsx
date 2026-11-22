import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address; Investing and Listing are top-level workspace pages.
export const Route = createFileRoute("/app/developer")({
  beforeLoad: () => {
    throw redirect({ href: "/app/listing", replace: true });
  },
  component: () => null,
});
