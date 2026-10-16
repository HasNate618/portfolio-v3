import { site } from "@/data/site";

const FALLBACK_ORIGIN = "https://nathanespejo.com";

/**
 * Canonical origin string for concatenating absolute URLs (sitemap, llms.txt,
 * JSON-LD). Falls back to the known origin if the configured link is malformed.
 */
export function siteBaseUrl(): string {
  const portfolio = site.contact.links.find((link) => link.label === "Portfolio");
  const candidate = portfolio?.href ?? FALLBACK_ORIGIN;
  try {
    return new URL(candidate).origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

/** Canonical origin as a URL object, for Next.js `metadataBase`. */
export function siteMetadataBase(): URL {
  try {
    return new URL(siteBaseUrl());
  } catch {
    return new URL(FALLBACK_ORIGIN);
  }
}
