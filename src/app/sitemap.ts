import type { MetadataRoute } from "next";
import { listCorpusUpdated, listPages } from "@/lib/content";
import { getCorpusDocs } from "@/lib/corpus";
import { siteBaseUrl } from "@/lib/site-url";

function lastModified(updated: string | undefined, fallback: Date): Date {
  if (!updated) return fallback;
  const date = new Date(`${updated}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

/**
 * Every route file and every published corpus document.
 *
 * This reads `listPages()`, which returns all route files — not NAV_ORDER. Scoping
 * to the nav would silently drop /chat and every case study.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteBaseUrl();
  const now = new Date();
  const updated = new Map(listCorpusUpdated().map((entry) => [entry.path, entry.updated]));

  const routes = listPages().map((page) => ({
    url: `${base}${page.route === "/" ? "/" : page.route}`,
    lastModified: lastModified(page.updated, now),
    changeFrequency: "monthly" as const,
    priority: page.priority === "start-here" ? 1 : 0.8,
  }));

  const corpus = getCorpusDocs().map((doc) => ({
    url: `${base}/knowledgebase/${doc.path}`,
    lastModified: lastModified(updated.get(doc.path), now),
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
