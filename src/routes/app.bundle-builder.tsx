import { createFileRoute } from "@tanstack/react-router";
import BundleBuilder from "@/pages/platform/BundleBuilder";

export const Route = createFileRoute("/app/bundle-builder")({
  head: () => ({
    meta: [
      { title: 'Portfolio view - DHC Market' },
      { name: "description", content: 'Save private project shortlists and compare developer-stated figures.' },
      { property: "og:title", content: 'Portfolio view - DHC Market' },
      { property: "og:description", content: 'Save private project shortlists and compare developer-stated figures.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <BundleBuilder />,
});
