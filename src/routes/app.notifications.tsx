import { createFileRoute } from "@tanstack/react-router";
import Notifications from "@/pages/platform/Notifications";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — DHC Market" },
      { name: "description", content: "Access requests, decisions and reminders for your projects." },
      { property: "og:title", content: "Notifications — DHC Market" },
      { property: "og:description", content: "Access requests, decisions and reminders for your projects." },
    ],
  }),
  component: Notifications,
});
