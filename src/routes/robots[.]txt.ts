import { createFileRoute } from "@tanstack/react-router";
import { absoluteUrl } from "@/lib/site";

// Served dynamically so the sitemap URL follows SITE_URL when the domain changes.
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(
          [
            "User-agent: *",
            "Allow: /",
            "Disallow: /app/",
            "Disallow: /api/",
            "",
            `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
            "",
          ].join("\n"),
          {
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "cache-control": "public, max-age=3600",
            },
          },
        ),
    },
  },
});
