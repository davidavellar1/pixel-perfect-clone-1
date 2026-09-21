import { createFileRoute } from "@tanstack/react-router";
import PublicFunding from "@/pages/platform/PublicFunding";

export const Route = createFileRoute("/app/public-funding")({
  head: () => ({
    meta: [
      { title: 'Public funding — DHC Market' },
      { name: "description", content: 'Grant and public funding programmes relevant to your projects.' },
      { property: "og:title", content: 'Public funding — DHC Market' },
      { property: "og:description", content: 'Grant and public funding programmes relevant to your projects.' },
    ],
  }),
  component: () => <PublicFunding />,
});
