import type { MetadataRoute } from "next";
import { listPages } from "@/lib/content";
import { getCorpusDocs } from "@/lib/corpus";
import { siteBaseUrl } from "@/lib/site-url";

/**
 * Every route file and every published corpus document.
 *
 * This reads `listPages()`, which returns all route files — not NAV_ORDER. Scoping
 * to the nav would silently drop /chat and every case study.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl();
  const now = new Date();

  const routes = listPages().map((page) => ({
    url: `${base}${page.route === "/" ? "/" : page.route}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: page.priority === "start-here" ? 1 : 0.8,
  }));

  const corpus = getCorpusDocs().map((doc) => ({
    url: `${base}/knowledgebase/${doc.path}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  return [
    ...routes,
    {
      url: `${base}/llms.txt`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...corpus,
  ];
}
