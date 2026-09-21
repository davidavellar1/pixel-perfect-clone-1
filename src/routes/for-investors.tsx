import { createFileRoute } from "@tanstack/react-router";
import ForInvestors from "@/pages/ForInvestors";

export const Route = createFileRoute("/for-investors")({
  head: () => ({
    meta: [
      { title: 'Investing on DHC Market' },
      { name: "description", content: 'How investors screen, request access and engage with infrastructure projects on DHC Market.' },
      { property: "og:title", content: 'Investing on DHC Market' },
      { property: "og:description", content: 'How investors screen, request access and engage with infrastructure projects on DHC Market.' },
    ],
  }),
  component: () => <ForInvestors />,
});
