import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/investor")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: "/app/my-portfolio", replace: true });
  },
  component: () => null,
});
