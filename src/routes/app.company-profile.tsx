import { createFileRoute } from "@tanstack/react-router";
import CompanyProfile from "@/pages/platform/CompanyProfile";

export const Route = createFileRoute("/app/company-profile")({
  head: () => ({
    meta: [
      { title: "Company profile — DHC Market" },
      {
        name: "description",
        content: "Your company details and track record, shared with investors you accept.",
      },
      { property: "og:title", content: "Company profile — DHC Market" },
      {
        property: "og:description",
        content: "Your company details and track record, shared with investors you accept.",
      },
    ],
  }),
  component: () => <CompanyProfile />,
});
