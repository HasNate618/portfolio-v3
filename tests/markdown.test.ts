import { test } from "node:test";
import assert from "node:assert/strict";
import MarkdownIt from "markdown-it";
import { renderMarkdown, resolveStats } from "../src/lib/markdown";
import { MARKDOWN_OPTIONS } from "../src/lib/markdown-options";

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

/*
 * The chat transcript renders model answers straight into the DOM, and page
 * bodies do the same with content files, so `html: false` is the only thing
 * standing between either of them and injected markup. These assertions exist
 * to fail loudly if someone flips it.
 */
test("the shared markdown options keep raw html inert", () => {
  assert.equal(MARKDOWN_OPTIONS.html, false, "html must stay off: escaping is the sanitiser");

  const md = new MarkdownIt(MARKDOWN_OPTIONS);

  /*
   * Escaping neutralises a tag by turning its angle brackets into entities; it
   * does not delete the text. So the property to assert is that nothing but
   * markdown-it's own wrapper survives as markup, not that the words vanish.
   */
  for (const probe of [
    "<script>alert(1)</script>",
    '<img src=x onerror=alert(1)>',
    '<a href="#" onclick="alert(1)">x</a>',
  ]) {
    const text = md.render(probe).trim().replace(/<\/?p>/g, "");
    assert.ok(!text.includes("<"), `live markup survived: ${text}`);
    assert.ok(text.includes("&lt;"), `source tag should arrive escaped: ${text}`);
  }
});

test("unsafe link schemes never reach an href", () => {
  const md = new MarkdownIt(MARKDOWN_OPTIONS);
  for (const scheme of ["javascript:", "JaVaScRiPt:", "vbscript:", "data:"]) {
    const html = md.render(`[click](${scheme}alert(1))`);
    assert.ok(!html.includes("href="), `${scheme} produced a link: ${html}`);
  }
});

test("ids can be turned off for the bot view", () => {
  assert.ok(!renderMarkdown("## Heading", { ids: false }).includes('id="heading"'));
});

test("a diagram fence renders an accessible figure, not a code block", () => {
  const html = renderMarkdown("```diagram\nalt: Sync feeds SQLite.\na -> b\n```");
  assert.match(html, /<figure/);
  assert.match(html, /<pre aria-hidden="true"/);
  assert.match(html, /<figcaption class="sr-only">Sync feeds SQLite\.<\/figcaption>/);
  assert.match(html, /a -&gt; b/);
});

test("the alt line is not part of the art", () => {
  const html = renderMarkdown("```diagram\nalt: Words here.\nart line\n```");
  assert.ok(!/<pre[^>]*>[^<]*Words here/.test(html), "alt text must not be drawn inside the pre");
});

test("a diagram fence without an alt line throws rather than shipping silently", () => {
  assert.throws(() => renderMarkdown("```diagram\njust art\n```"), /alt/);
});

test("a plain fence still renders as a code block with its language", () => {
  const html = renderMarkdown("```python\nprint(1)\n```");
  assert.match(html, /<pre><code class="language-python">/);
});

test("a models fence renders the shared captioned table", () => {
  const html = renderMarkdown("```models aware\ncaption: On-device models.\n```");
  assert.match(html, /<caption class="sr-only">On-device models\.<\/caption>/);
  assert.match(html, /scope="col"/);
  assert.match(html, /YOLOv8n/);
});

test("a models fence without a caption throws", () => {
  assert.throws(() => renderMarkdown("```models aware\n```"), /caption/);
});

test("a models fence naming a project with no models throws", () => {
  assert.throws(() => renderMarkdown("```models glyph\ncaption: x\n```"), /no models/);
});
