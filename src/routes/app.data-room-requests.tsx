import { createFileRoute } from "@tanstack/react-router";
import DataRoomRequests from "@/pages/platform/DataRoomRequests";

export const Route = createFileRoute("/app/data-room-requests")({
  head: () => ({
    meta: [
      { title: 'Data-room requests — DHC Market' },
      { name: "description", content: 'Your outgoing data-room requests and their current status.' },
      { property: "og:title", content: 'Data-room requests — DHC Market' },
      { property: "og:description", content: 'Your outgoing data-room requests and their current status.' },
    ],
  }),
  component: () => <DataRoomRequests />,
});
