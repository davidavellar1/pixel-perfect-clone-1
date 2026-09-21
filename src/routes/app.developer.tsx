import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/developer")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: "/app/my-listings", replace: true });
  },
  component: () => null,
});
