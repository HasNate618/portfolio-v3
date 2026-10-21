import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import sitemap from "../src/app/sitemap";
import { SeoJsonLd } from "../src/components/SeoJsonLd";
import { listPages } from "../src/lib/content";
import { getCorpusDocs } from "../src/lib/corpus";
import { site } from "../src/data/site";
import { pageMetadata } from "../src/lib/page-metadata";

const urls = sitemap().map((entry) => new URL(entry.url).pathname);

test("every route file appears in the sitemap", () => {
  for (const page of listPages()) {
    assert.ok(urls.includes(page.route), `missing ${page.route}`);
  }
});

test("every published corpus document appears in the sitemap", () => {
  for (const doc of getCorpusDocs()) {
    assert.ok(urls.includes(`/knowledgebase/${doc.path}`), `missing ${doc.path}`);
  }
});

test("the sitemap is not scoped to nav items", () => {
  assert.ok(urls.includes("/chat"), "chat is missing");
  assert.ok(urls.some((url) => url.startsWith("/projects/")), "case studies are missing");
  assert.ok(urls.includes("/now"), "now is missing");
});

test("the sitemap has no duplicates", () => {
  assert.equal(new Set(urls).size, urls.length);
});

test("JSON-LD emits Person, WebSite and ProfilePage", () => {
  const html = renderToStaticMarkup(<SeoJsonLd />);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /"@type":"WebSite"/);
  assert.match(html, /"@type":"ProfilePage"/);
  assert.match(html, /"@id":"https:\/\/www\.nathanespejo\.com\/#person"/);
  assert.ok(html.includes(site.contact.email), "the person graph should carry the email");
});

test("route metadata comes from frontmatter and marks case studies as articles", () => {
  const campus = listPages().find((page) => page.route === "/projects/campus")!;
  const metadata = pageMetadata(campus, { article: true });
  assert.equal(metadata.title, campus.title);
  assert.equal(metadata.description, campus.description);
  // Next types `openGraph` as a union whose base member has no `type`, so read it structurally.
  const openGraph: { type?: string } = metadata.openGraph as { type?: string };
  assert.equal(openGraph.type, "article");
  assert.equal(metadata.alternates?.canonical, "/projects/campus");
});

test("sitemap lastmod uses frontmatter dates", () => {
  const homePage = listPages().find((page) => page.route === "/")!;
  const home = sitemap().find((entry) => new URL(entry.url).pathname === "/")!;
  assert.equal((home.lastModified as Date).toISOString(), new Date(homePage.updated!).toISOString());
});

test("the person graph cannot break out of its script tag", () => {
  const html = renderToStaticMarkup(<SeoJsonLd />);
  const body = html.slice(html.indexOf(">") + 1, html.lastIndexOf("</script>"));
  assert.ok(!body.includes("</script"), "a raw </script in the payload would end the tag early");
});

// The v2 fallback compensated for a client-rendered UI that v3 does not have, and
// it rendered its own <h1>, which would duplicate the page's. It must not come back.
test("the hidden SEO fallback is gone", () => {
  assert.ok(
    !existsSync(new URL("../src/components/SeoFallback.tsx", import.meta.url)),
    "SeoFallback duplicates visible copy and adds a second h1"
  );
});
