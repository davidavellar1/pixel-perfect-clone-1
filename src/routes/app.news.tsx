import { createFileRoute } from "@tanstack/react-router";
import MarketNews from "@/pages/platform/MarketNews";

export const Route = createFileRoute("/app/news")({
  validateSearch: (search: Record<string, unknown>): { country?: string } =>
    typeof search.country === "string" ? { country: search.country } : {},
  head: () => ({
    meta: [
      { title: "Market news — DHC Market" },
      { name: "description", content: "District heating and cooling news from the markets you follow, summarised in English." },
      { property: "og:title", content: "Market news — DHC Market" },
      { property: "og:description", content: "District heating and cooling news from the markets you follow, summarised in English." },
    ],
  }),
  component: NewsRoute,
});

function NewsRoute() {
  const { country } = Route.useSearch();
  return <MarketNews initialCountry={country} />;
}
