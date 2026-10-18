/**
 * Every URL the chat may offer.
 *
 * The closing link is gone: an answer ended with a pointer sentence on every turn, and a
 * line that is always there stops carrying information. What remains here is the allowlist,
 * which is what makes a URL in an answer checkable: a model that can write a URL can invent
 * one, so the check is against the site's own links rather than against the model's word.
 */

import { site } from "@/data/site";
import { caseStudyHref, getPage } from "@/lib/content";
import { siteBaseUrl } from "@/lib/site-url";

const EMAIL_URL = `mailto:${site.contact.email}`;

/**
 * Every URL the chat may offer: the contact address, the links site.ts carries, the case
 * study of every project that has one, each project's own links, and the page of every
 * role that has one.
 */
export function pointerWhitelist(): string[] {
  const urls = new Set<string>([
    EMAIL_URL,
    site.contact.email,
    `${siteBaseUrl()}/projects`,
    ...site.contact.links.map((link) => link.href),
  ]);

  for (const project of site.projects) {
    const href = caseStudyHref(project);
    if (href) urls.add(`${siteBaseUrl()}${href}`);
    for (const link of project.links) urls.add(link.href);
  }

  for (const role of site.experience) {
    const href = `/experience/${role.id}`;
    if (getPage(href)) urls.add(`${siteBaseUrl()}${href}`);
  }

  return [...urls];
}
