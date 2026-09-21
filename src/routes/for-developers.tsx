import { createFileRoute } from "@tanstack/react-router";
import AudiencePage from "@/pages/AudiencePage";

export const Route = createFileRoute("/for-developers")({
  head: () => ({
    meta: [
      { title: 'For developers — DHC Market' },
      { name: "description", content: 'List your project, control who sees your data room and reach qualified capital.' },
      { property: "og:title", content: 'For developers — DHC Market' },
      { property: "og:description", content: 'List your project, control who sees your data room and reach qualified capital.' },
    ],
  }),
  component: () => <AudiencePage audience="developer" />,
});
