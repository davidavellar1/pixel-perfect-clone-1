import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/my-deals/")({
  beforeLoad: () => {
    throw redirect({ href: "/app/my-deals/investing", replace: true });
  },
  component: () => null,
});
