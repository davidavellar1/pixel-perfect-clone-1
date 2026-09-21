import { createFileRoute } from "@tanstack/react-router";
import SignIn from "@/pages/SignIn";

export const Route = createFileRoute("/sign-in")({
  head: () => ({
    meta: [
      { title: 'Sign in — DHC Market' },
      { name: "description", content: 'Sign in to your DHC Market account to access opportunities, listings and data rooms.' },
      { property: "og:title", content: 'Sign in — DHC Market' },
      { property: "og:description", content: 'Sign in to your DHC Market account to access opportunities, listings and data rooms.' },
    ],
  }),
  component: () => <SignIn />,
});
