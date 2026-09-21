import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/submit-project")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: "/sign-in?redirect=/app/submit-project", replace: true });
  },
  component: () => null,
});
