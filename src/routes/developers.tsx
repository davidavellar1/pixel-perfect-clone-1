import { createFileRoute } from "@tanstack/react-router";
import Developers from "@/pages/Developers";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: 'Developers — DHC Market' },
      { name: "description", content: 'Bring your infrastructure project to qualified investors with controlled data-room access.' },
      { property: "og:title", content: 'Developers — DHC Market' },
      { property: "og:description", content: 'Bring your infrastructure project to qualified investors with controlled data-room access.' },
    ],
  }),
  component: () => <Developers />,
});
