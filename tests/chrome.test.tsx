import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader, NAV_LINKS } from "../src/components/SiteHeader";

/*
 * These three cases use `/resume` as the "current" route: any nav route works,
 * and it has to be one the nav actually lists.
 */
test("skip link comes before the nav", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/resume" />);
  assert.ok(html.indexOf("Skip to content") < html.indexOf("<nav"));
  assert.ok(html.indexOf('href="#content"') !== -1, "skip link must target the content region");
});

test("the current page is marked with aria-current", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/resume" />);
  assert.match(html, /aria-current="page"/);
});

test("no other nav item is marked current", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/resume" />);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
});

test("every nav route is present", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/" />);
  for (const link of NAV_LINKS) {
    assert.ok(html.includes(`href="${link.href}"`), `missing ${link.href}`);
  }
});

test("the nav is a single labelled landmark", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/" />);
  assert.equal((html.match(/<nav/g) ?? []).length, 1, "duplicated nav landmarks confuse screen readers");
  assert.match(html, /aria-label="Site"/);
});

test("identity links home", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/" />);
  assert.match(html, /href="\/"/);
});

test("the header contributes no headings, so each page owns its h1", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/" />);
  assert.doesNotMatch(html, /<h[1-6][\s>]/, "a banner heading would precede the page h1");
});

test("the contact icons include a real mailto link", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/" />);
  assert.match(html, /href="mailto:/);
  assert.match(html, /aria-label="Email"/);
});
