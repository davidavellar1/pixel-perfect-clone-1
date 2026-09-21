import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: "/app/opportunities", replace: true });
  },
  component: () => null,
});
