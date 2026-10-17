import type { Metadata } from "next";
import type { Page } from "@/lib/content";

const HOME_TITLE = "Nathan Espejo, Software Engineer";

/** Per-route title, description and canonical URL, read from the page frontmatter. */
export function pageMetadata(page: Page, options?: { home?: boolean; article?: boolean }): Metadata {
  const title = options?.home ? { absolute: HOME_TITLE } : page.title;
  const ogTitle = options?.home ? HOME_TITLE : page.title;
  const type = options?.article ? "article" : options?.home ? "profile" : "website";

  return {
    title,
    description: page.description,
    alternates: { canonical: page.route },
    openGraph: {
      title: ogTitle,
      description: page.description,
      url: page.route,
      type,
    },
  };
}
