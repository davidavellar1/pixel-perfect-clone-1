import { createFileRoute } from "@tanstack/react-router";
import Feedback from "@/pages/platform/Feedback";

export const Route = createFileRoute("/app/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — DHC Market" },
      { name: "description", content: "Share suggestions to improve the platform." },
      { property: "og:title", content: "Feedback — DHC Market" },
      { property: "og:description", content: "Share suggestions to improve the platform." },
    ],
  }),
  component: () => <Feedback />,
});
