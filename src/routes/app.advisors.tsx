import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/advisors")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: "/app/ecosystem", replace: true });
  },
  component: () => null,
});
