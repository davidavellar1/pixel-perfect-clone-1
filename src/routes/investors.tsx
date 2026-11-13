import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/investors")({
  beforeLoad: () => { throw redirect({ href: "/for-investors", statusCode: 301, replace: true }); },
  component: () => null,
});
