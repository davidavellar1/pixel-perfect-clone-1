import { createFileRoute } from "@tanstack/react-router";
import BundleBuilder from "@/pages/platform/BundleBuilder";

export const Route = createFileRoute("/app/bundle-builder")({
  head: () => ({
    meta: [
      { title: 'Bundle builder — DHC Market' },
      { name: "description", content: 'Group projects into an investable bundle and share it with investors.' },
      { property: "og:title", content: 'Bundle builder — DHC Market' },
      { property: "og:description", content: 'Group projects into an investable bundle and share it with investors.' },
    ],
  }),
  component: () => <BundleBuilder />,
});
