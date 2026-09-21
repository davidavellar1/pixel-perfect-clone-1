import { createFileRoute } from "@tanstack/react-router";
import DeveloperSignup from "@/pages/DeveloperSignup";

export const Route = createFileRoute("/developer-signup")({
  head: () => ({
    meta: [
      { title: 'Developer sign-up — DHC Market' },
      { name: "description", content: 'Create a developer account to list projects and manage access requests on DHC Market.' },
      { property: "og:title", content: 'Developer sign-up — DHC Market' },
      { property: "og:description", content: 'Create a developer account to list projects and manage access requests on DHC Market.' },
    ],
  }),
  component: () => <DeveloperSignup />,
});
