import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: "/sign-in?redirect=/app/opportunities", replace: true });
  },
  component: () => null,
});
