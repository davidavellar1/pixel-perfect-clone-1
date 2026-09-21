import { createFileRoute } from "@tanstack/react-router";
import SubmitProject from "@/pages/SubmitProject";

export const Route = createFileRoute("/app/submit-project")({
  head: () => ({
    meta: [
      { title: 'Submit a project — DHC Market' },
      { name: "description", content: 'Publish a new project listing with teaser, transaction terms and access criteria.' },
      { property: "og:title", content: 'Submit a project — DHC Market' },
      { property: "og:description", content: 'Publish a new project listing with teaser, transaction terms and access criteria.' },
    ],
  }),
  component: () => <SubmitProject />,
});
