import { createFileRoute, redirect } from "@tanstack/react-router";
import { canonicalSignup } from "@/lib/funnel";
export const Route = createFileRoute("/investor-signup")({
  beforeLoad: ({ location }) => { throw redirect({ href: canonicalSignup(location.searchStr), replace: true }); },
  component: () => null,
});
