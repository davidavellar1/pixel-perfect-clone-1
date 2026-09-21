import { createFileRoute } from "@tanstack/react-router";
import InvestorSignup from "@/pages/InvestorSignup";

export const Route = createFileRoute("/investor-signup")({
  head: () => ({
    meta: [
      { title: 'Investor sign-up — DHC Market' },
      { name: "description", content: 'Create an investor account to screen verified infrastructure projects on DHC Market.' },
      { property: "og:title", content: 'Investor sign-up — DHC Market' },
      { property: "og:description", content: 'Create an investor account to screen verified infrastructure projects on DHC Market.' },
    ],
  }),
  component: () => <InvestorSignup />,
});
