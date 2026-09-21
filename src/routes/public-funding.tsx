import { createFileRoute } from "@tanstack/react-router";
import PublicExplainer from "@/pages/PublicExplainer";

export const Route = createFileRoute("/public-funding")({
  head: () => ({
    meta: [
      { title: 'Public funding — DHC Market' },
      { name: "description", content: 'How grants and public funding programmes fit alongside private capital on DHC Market.' },
      { property: "og:title", content: 'Public funding — DHC Market' },
      { property: "og:description", content: 'How grants and public funding programmes fit alongside private capital on DHC Market.' },
    ],
  }),
  component: () => <PublicExplainer kind="public-funding" />,
});
