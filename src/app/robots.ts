import type { MetadataRoute } from "next";
import { siteBaseUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      // Explicitly welcome AI crawlers. Remove or restrict here if you
      // ever want a bot to stop fetching the public knowledgebase.
      {
        userAgent: ["GPTBot", "ClaudeBot", "PerplexityBot", "Biren"],
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
