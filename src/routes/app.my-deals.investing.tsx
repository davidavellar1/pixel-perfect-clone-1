import { createFileRoute, redirect } from "@tanstack/react-router";

// Investing and Listing were under My Deals; old links keep working, with their query and hash.
export const Route = createFileRoute("/app/my-deals/investing")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: location.href.replace("/app/my-deals/investing", "/app/investing"), replace: true });
  },
  component: () => null,
});
