import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import sitemap from "../src/app/sitemap";
import { SeoJsonLd } from "../src/components/SeoJsonLd";
import { listPages } from "../src/lib/content";
import { getCorpusDocs } from "../src/lib/corpus";
import { site } from "../src/data/site";

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

test("JSON-LD emits Person and WebSite", () => {
  const html = renderToStaticMarkup(<SeoJsonLd />);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /"@type":"WebSite"/);
  assert.ok(html.includes(site.contact.email), "the person graph should carry the email");
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
