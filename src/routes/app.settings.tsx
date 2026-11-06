import { createFileRoute } from "@tanstack/react-router";
import ProfileSettings from "@/pages/platform/ProfileSettings";

export const Route = createFileRoute("/app/settings")({
  head: () => ({ meta: [
    { title: "Profile settings — DHC Market" },
    { name: "description", content: "Manage your DHC Market profile, investment preferences, developer details and account." },
    { property: "og:title", content: "Profile settings — DHC Market" },
    { property: "og:description", content: "Manage your DHC Market profile and account preferences." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProfileSettings,
});