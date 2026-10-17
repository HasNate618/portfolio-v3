import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { SiteHeader, NAV_LINKS, CHAT_LINK } from "../src/components/SiteHeader";
import { MobileTopBar } from "../src/components/MobileTopBar";

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

/*
 * The mobile top bar is the same nav in a second landmark. CSS guarantees only
 * one of the two is ever in the accessibility tree — the bar is `lg:hidden`,
 * the header nav `hidden lg:block` — and these cases pin that contract.
 */
test("the top bar lists every nav route", () => {
  const html = renderToStaticMarkup(<MobileTopBar current="/resume" />);
  assert.match(html, /aria-label="Site"/);
  for (const link of NAV_LINKS) {
    assert.ok(html.includes(`href="${link.href}"`), `missing ${link.href}`);
  }
});

test("the top bar marks exactly one item current", () => {
  const html = renderToStaticMarkup(<MobileTopBar current="/resume" />);
  assert.equal((html.match(/aria-current="page"/g) ?? []).length, 1);
});

test("the two nav landmarks can never be visible at once", () => {
  const bar = renderToStaticMarkup(<MobileTopBar current="/" />);
  const header = renderToStaticMarkup(<SiteHeader current="/" />);
  assert.match(bar, /lg:hidden/, "the bar must not render at desktop widths");
  assert.match(header, /hidden lg:block/, "the header nav must not render on mobile");
});

test("the top bar carries the mobile skip link, before its nav", () => {
  const html = renderToStaticMarkup(<MobileTopBar current="/" />);
  assert.ok(html.indexOf("Skip to content") < html.indexOf("<nav"));
  assert.ok(html.includes('href="#content"'), "skip link must target the content region");
});

/*
 * Below `lg` the identity block and the contact row belong to the first page:
 * on every other route they pushed the page's own content a screenful down to
 * repeat the same name and blurb. The desktop sidebar keeps both, where they sit
 * beside the content rather than ahead of it, so they are hidden, not removed.
 */
test("identity and contact links are first-page furniture on mobile", () => {
  const home = renderToStaticMarkup(<SiteHeader current="/" />);
  const other = renderToStaticMarkup(<SiteHeader current="/resume" />);
  // The home page's single occurrence is the desktop-only skip link.
  assert.equal((home.match(/max-lg:hidden/g) ?? []).length, 1);
  assert.equal((other.match(/max-lg:hidden/g) ?? []).length, 3);
});

/*
 * The chat is a call to action, not a nav destination: the header renders it
 * as a button near the identity, and the mobile bar leaves it out — four
 * items do not fit a phone width, and the button is on the page anyway.
 */
test("the header offers the chat as a button outside the nav", () => {
  const html = renderToStaticMarkup(<SiteHeader current="/" />);
  assert.ok(html.includes(`href="${CHAT_LINK.href}"`), "chat CTA missing");
  assert.ok(html.indexOf(`href="${CHAT_LINK.href}"`) < html.indexOf("<nav"), "CTA should sit near the top");
});

test("the top bar does not carry the chat", () => {
  const html = renderToStaticMarkup(<MobileTopBar current="/" />);
  assert.ok(!html.includes(`href="${CHAT_LINK.href}"`), "the bar must leave the chat to the page button");
});
