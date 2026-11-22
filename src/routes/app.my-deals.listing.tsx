import { createFileRoute, redirect } from "@tanstack/react-router";

// Investing and Listing were under My Deals; old links keep working, with their query and hash.
export const Route = createFileRoute("/app/my-deals/listing")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: location.href.replace("/app/my-deals/listing", "/app/listing"), replace: true });
  },
  component: () => null,
});
