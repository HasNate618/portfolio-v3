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
  assert.match(renderMarkdown("over {{stat:campus.tests}} tests"), /over 403 tests/);
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
  assert.equal(resolveStats("over {{stat:campus.tests}} tests"), "over 403 tests");
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

test("bare urls in a link line become anchors", () => {
  assert.match(
    renderMarkdown("- Devpost: https://devpost.com/software/x"),
    /<a href="https:\/\/devpost\.com\/software\/x">/
  );
});

test("linkify leaves library and file names as prose", () => {
  const html = renderMarkdown("Node.js, Next.js, Three.js and index.md all stay text");
  assert.ok(!html.includes("<a "), `unexpected anchor in: ${html}`);
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

test("a named diagram fence draws the registered flow, with the alt as its caption", () => {
  const html = renderMarkdown("```diagram aware\nalt: Sensors feed perception.\n```");
  assert.match(html, /<div class="flow" aria-hidden="true">/);
  assert.match(html, /rules engine/);
  assert.match(html, /<figcaption class="sr-only">Sensors feed perception\.<\/figcaption>/);
  assert.ok(!html.includes("<pre"), "a named diagram is not text art");
});

test("an unknown diagram name throws rather than shipping a blank figure", () => {
  assert.throws(() => renderMarkdown("```diagram nope\nalt: Words.\n```"), /unknown diagram/);
});

test("a diagram fence without an alt line throws rather than shipping silently", () => {
  assert.throws(() => renderMarkdown("```diagram\njust art\n```"), /alt/);
});

test("a figure fence renders a captioned image with its intrinsic size", () => {
  const html = renderMarkdown(
    "```figure\nsrc: /projects/x.webp\nwidth: 1600\nheight: 693\nalt: A funnel of 4,620 files.\ncaption: From scraped files to clean ones.\n```"
  );
  assert.match(html, /<figure class="my-8">/);
  assert.match(
    html,
    /<img src="\/projects\/x\.webp" alt="A funnel of 4,620 files\." width="1600" height="693" loading="lazy" decoding="async"/
  );
  assert.match(html, /<figcaption[^>]*>From scraped files to clean ones\.<\/figcaption>/);
});

test("a figure fence without width and height still renders", () => {
  const html = renderMarkdown("```figure\nsrc: /projects/x.webp\nalt: A.\ncaption: C.\n```");
  assert.ok(!/width="/.test(html), "size attributes are optional, not defaulted");
  assert.match(html, /<img src="\/projects\/x\.webp"/);
});

test("a figure fence demands src, alt and caption, and a site-local path", () => {
  const fence = (body: string) => `\`\`\`figure\n${body}\n\`\`\``;
  assert.throws(() => renderMarkdown(fence("src: /a.webp\nalt: A.")), /caption/);
  assert.throws(() => renderMarkdown(fence("src: /a.webp\ncaption: C.")), /alt/);
  assert.throws(() => renderMarkdown(fence("alt: A.\ncaption: C.")), /src/);
  // Off-site and protocol-relative paths are refused: a content file cannot
  // hotlink an image or smuggle a scheme in through the fence.
  assert.throws(() => renderMarkdown(fence("src: https://evil.test/x.png\nalt: A.\ncaption: C.")), /site/);
  assert.throws(() => renderMarkdown(fence("src: //evil.test/x.png\nalt: A.\ncaption: C.")), /site/);
});

test("a figure fence reuses the project lightbox, ids included", () => {
  const html = renderMarkdown("```figure\nsrc: /projects/x.webp\nalt: A.\ncaption: C.\n```");

  // The same CSS `:target` overlay ProjectMedia builds, so the expansion works
  // with JavaScript off and Escape/focus from LightboxKeys applies here too.
  assert.match(
    html,
    /<a id="figure-projects-x-webp-thumb" href="#figure-projects-x-webp" class="block cursor-zoom-in">/
  );
  assert.match(html, /<div id="figure-projects-x-webp" class="lightbox" tabindex="-1">/);
  assert.match(
    html,
    /<a href="#figure-projects-x-webp-thumb" class="lightbox-backdrop" aria-label="Close the expanded image"><\/a>/
  );
  assert.match(html, /<figure class="lightbox-frame">/);
  assert.match(html, /<a href="\/projects\/x\.webp" target="_blank" rel="noopener noreferrer"/);

  // The pair is a contract with LightboxKeys, which derives the thumbnail as
  // `${overlay.id}-thumb`; break it and Escape has nowhere to send focus.
  const overlay = /<div id="([^"]+)" class="lightbox"/.exec(html)?.[1];
  assert.ok(
    overlay && html.includes(`id="${overlay}-thumb"`),
    "the overlay id must be the thumbnail's id minus -thumb"
  );
});

test("a figure fence cannot break out of its src attribute", () => {
  const html = renderMarkdown(
    "```figure\nsrc: /a.webp\" onerror=\"alert(1)\nalt: A.\ncaption: C.\n```"
  );
  assert.ok(!html.includes('onerror="alert(1)"'), `live attribute survived: ${html}`);
  assert.match(html, /&quot;/);
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
