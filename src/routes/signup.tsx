import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  beforeLoad: ({ location }) => {
    throw redirect({ href: "/sign-up" + location.searchStr, replace: true });
  },
  component: () => null,
});
