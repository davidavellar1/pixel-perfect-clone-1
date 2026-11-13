import { createFileRoute } from "@tanstack/react-router";
import BundleBuilder from "@/pages/platform/BundleBuilder";

export const Route = createFileRoute("/app/bundle-builder")({
  head: () => ({
    meta: [
      { title: 'Bundle builder - DHC Market' },
      { name: "description", content: 'Build saved groups of DHC opportunities using disclosed project data.' },
      { property: "og:title", content: 'Bundle builder - DHC Market' },
      { property: "og:description", content: 'Build saved groups of DHC opportunities using disclosed project data.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <BundleBuilder />,
});
