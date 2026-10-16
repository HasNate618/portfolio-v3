import type { MetadataRoute } from "next";
import { knowledgebase } from "@/data/site";
import { siteBaseUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl();
  const now = new Date();
  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/llms.txt`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // Public knowledgebase files. Add new files to `knowledgebase` in
    // src/data/site.ts and they appear here automatically.
    ...knowledgebase.map((entry) => ({
      url: `${base}${entry.url}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: entry.priority === "start-here" ? 0.7 : 0.5,
    })),
  ];
}
