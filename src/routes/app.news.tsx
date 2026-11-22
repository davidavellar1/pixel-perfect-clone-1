import { createFileRoute, redirect } from "@tanstack/react-router";

// The standalone news page is cut. News appears in the overview work queue, on country pages
// and on project pages; old links land on the overview.
export const Route = createFileRoute("/app/news")({
  beforeLoad: () => {
    throw redirect({ href: "/app", replace: true });
  },
  component: () => null,
});
