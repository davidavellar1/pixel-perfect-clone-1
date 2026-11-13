import { createFileRoute } from "@tanstack/react-router";
import LegalPlaceholder from "@/components/public/LegalPlaceholder";
export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy - DHC Market" },
    { name: "description", content: "Draft privacy policy for DHC Market, pending legal review." },
    { property: "og:title", content: "Privacy Policy - DHC Market" },
    { property: "og:description", content: "Draft privacy policy for DHC Market, pending legal review." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: () => <LegalPlaceholder title="Privacy Policy" />,
});
