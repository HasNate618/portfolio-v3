import { test } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown, resolveStats } from "../src/lib/markdown";

test("headings map to h1, h2 and h3 with ids", () => {
  assert.match(renderMarkdown("# A"), /<h1 id="a"/);
  assert.match(renderMarkdown("## Why I built it"), /<h2 id="why-i-built-it"/);
  assert.match(renderMarkdown("### C"), /<h3 id="c"/);
});

test("stat placeholders resolve from site data", () => {
  assert.match(renderMarkdown("over {{stat:campus.chunks}} chunks"), /over 4,687 chunks/);
});

test("an unknown stat key throws rather than rendering blank", () => {
  assert.throws(() => renderMarkdown("{{stat:campus.nope}}"), /unknown stat/);
  assert.throws(() => renderMarkdown("{{stat:nosuchproject.chunks}}"), /unknown stat/);
});

test("lists and inline code render", () => {
  assert.match(renderMarkdown("- one"), /<li>one<\/li>/);
  assert.match(renderMarkdown("use `nix`"), /<code>nix<\/code>/);
});

test("resolveStats substitutes without rendering markdown", () => {
  assert.equal(resolveStats("over {{stat:campus.chunks}} chunks"), "over 4,687 chunks");
  assert.ok(
    !resolveStats("**bold** {{stat:campus.tests}}").includes("<strong>"),
    "resolveStats must return plain text, not HTML"
  );
});

test("raw html in content is escaped, not passed through", () => {
  const html = renderMarkdown("<script>alert(1)</script>");
  assert.ok(!html.includes("<script>"), "html:false must escape raw tags");
  assert.match(html, /&lt;script&gt;/);
});

test("ids can be turned off for the bot view", () => {
  assert.ok(!renderMarkdown("## Heading", { ids: false }).includes('id="heading"'));
});
