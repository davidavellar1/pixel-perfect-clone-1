import { createFileRoute } from "@tanstack/react-router";
import SignUp from "@/pages/SignUp";

export const Route = createFileRoute("/sign-up")({
  head: () => ({
    meta: [
      { title: 'Create an account — DHC Market' },
      { name: "description", content: 'Join DHC Market as a developer or investor and start engaging on live projects.' },
      { property: "og:title", content: 'Create an account — DHC Market' },
      { property: "og:description", content: 'Join DHC Market as a developer or investor and start engaging on live projects.' },
    ],
  }),
  component: () => <SignUp />,
});
