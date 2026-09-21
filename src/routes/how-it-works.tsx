import { createFileRoute } from "@tanstack/react-router";
import HowItWorks from "@/pages/HowItWorks";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: 'How it works — DHC Market' },
      { name: "description", content: 'From listing to signed engagement: the steps developers and investors follow on DHC Market.' },
      { property: "og:title", content: 'How it works — DHC Market' },
      { property: "og:description", content: 'From listing to signed engagement: the steps developers and investors follow on DHC Market.' },
    ],
  }),
  component: () => <HowItWorks />,
});
