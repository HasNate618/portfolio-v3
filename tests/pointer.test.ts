import { test } from "node:test";
import assert from "node:assert/strict";
import { pointerWhitelist } from "../src/app/api/chat/lib/pointer";
import { site } from "../src/data/site";
import { caseStudyHref } from "../src/lib/content";
import { siteBaseUrl } from "../src/lib/site-url";

/*
 * The closing link is gone, so the pointer module is now only the answer to one question:
 * which URLs may appear in an answer? Everything the site owns, and nothing it does not.
 */

const linkHref = (label: string) => site.contact.links.find((link) => link.label === label)!.href;

test("the allowlist holds the contact links and the address", () => {
  const whitelist = pointerWhitelist();
  assert.ok(whitelist.includes(linkHref("Resume PDF")), "the résumé is offerable");
  assert.ok(whitelist.includes(linkHref("LinkedIn")), "LinkedIn is offerable");
  assert.ok(whitelist.includes(`mailto:${site.contact.email}`), "the mailto address is offerable");
  assert.ok(whitelist.includes(site.contact.email), "the bare address is offerable");
});

test("the allowlist holds the projects page, which broad answers cite", () => {
  assert.ok(pointerWhitelist().includes(`${siteBaseUrl()}/projects`));
});

test("every case study and role page is offerable", () => {
  const whitelist = pointerWhitelist();
  for (const project of site.projects) {
    const href = caseStudyHref(project);
    if (href) assert.ok(whitelist.includes(`${siteBaseUrl()}${href}`), `${project.name} has no case study URL`);
  }
  assert.ok(whitelist.includes(`${siteBaseUrl()}/experience/terago`), "a role page is offerable");
});

test("every entry is a URL or address a browser would follow", () => {
  /* The bare address is whitelisted on purpose: an answer writes the email, not the mailto. */
  for (const url of pointerWhitelist()) {
    assert.match(url, /^(?:https:\/\/|mailto:|[^@\s]+@[^@\s]+$)/, `a whitelist entry is not a URL: ${url}`);
  }
});

test("the allowlist is deduplicated", () => {
  const whitelist = pointerWhitelist();
  assert.equal(new Set(whitelist).size, whitelist.length);
});
