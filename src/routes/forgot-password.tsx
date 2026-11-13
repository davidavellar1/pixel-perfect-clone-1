import { createFileRoute } from "@tanstack/react-router";
import ForgotPassword from "@/pages/ForgotPassword";
export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [
    { title: "Reset password - DHC Market" },
    { name: "description", content: "Request a password reset link for your DHC Market account." },
    { property: "og:title", content: "Reset password - DHC Market" },
    { property: "og:description", content: "Request a password reset link for your DHC Market account." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: ForgotPassword,
});
