import { createFileRoute } from "@tanstack/react-router";
import LegalPlaceholder from "@/components/public/LegalPlaceholder";
export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Terms of Service - DHC Market" },
    { name: "description", content: "Draft terms of service for DHC Market, pending legal review." },
    { property: "og:title", content: "Terms of Service - DHC Market" },
    { property: "og:description", content: "Draft terms of service for DHC Market, pending legal review." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <LegalPlaceholder title="Terms of Service" />,
});
