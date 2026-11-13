import { createFileRoute } from "@tanstack/react-router";
import WorkspaceOverview from "@/pages/platform/WorkspaceOverview";

export const Route = createFileRoute("/app/")({
  head: () => ({ meta: [
    { title: "Workspace overview - DHC Market" },
    { name: "description", content: "Your project access ladder, requests and European DHC opportunities." },
    { property: "og:title", content: "Workspace overview - DHC Market" },
    { property: "og:description", content: "Your project access ladder, requests and European DHC opportunities." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: WorkspaceOverview,
});
