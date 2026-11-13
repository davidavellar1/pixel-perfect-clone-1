import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ href: `/sign-in?redirect=/app/projects/${encodeURIComponent(params.slug)}`, replace: true });
  },
  head: () => ({
    meta: [
      { title: 'Project - DHC Market' },
      { name: "description", content: 'Project teaser, transaction summary and access criteria on DHC Market.' },
      { property: "og:title", content: 'Project - DHC Market' },
      { property: "og:description", content: 'Project teaser, transaction summary and access criteria on DHC Market.' },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => null,
});
