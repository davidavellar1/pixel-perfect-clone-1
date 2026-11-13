import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/developers")({
  beforeLoad: () => { throw redirect({ href: "/for-developers", statusCode: 301, replace: true }); },
  component: () => null,
});
