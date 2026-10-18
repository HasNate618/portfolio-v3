import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatView } from "../../src/components/views/ChatView";
import { getPage } from "../../src/lib/content";
import { STARTERS } from "../../src/app/api/chat/lib/followup-fallback";

const page = getPage("/chat")!;
const html = renderToStaticMarkup(<ChatView page={page} />);
// React escapes text nodes, so an apostrophe arrives as &#x27;.
const text = html.replace(/&#x27;/g, "'");

test("chat renders starters and the JS-off notice in the HTML", () => {
  assert.match(text, /What does Nathan build\?/);
  assert.match(html, /needs JavaScript/);
  assert.match(html, /\/llms\.txt/);
});

/*
 * The page is the chat and nothing else: no title to read before it, no footnote
 * after it, no keyboard legend under it. The h1 stays for structure, which is
 * also what keeps this from being a headingless document.
 */
test("the chat page is chat only: no visible title, disclaimer or key hints", () => {
  assert.equal((html.match(/<h1/g) ?? []).length, 1, "exactly one h1");
  assert.match(html, /<h1 class="sr-only">/, "the h1 must stay for structure, unseen");
  assert.doesNotMatch(text, /can be wrong/i);
  assert.doesNotMatch(text, /Enter to send/);
  assert.doesNotMatch(html, /\b\d{3}-\d{3}-\d{4}\b/);
});

test("no Sources line is rendered", () => {
  assert.doesNotMatch(html, />Sources:/);
});

test("every starter is offered as a button for JS users", () => {
  for (const starter of page.starters ?? []) {
    assert.ok(text.includes(starter), `missing starter: ${starter}`);
    assert.ok(text.includes(`>${starter}</button>`), `starter is not a button: ${starter}`);
  }
});

/*
 * The served starters and the fallback starters are the same four questions. The
 * page opens with them, and a failed answer falls back to the first three, so if
 * the two lists drift apart the fallback offers questions the page never showed.
 */
test("the served starters are the fallback starters", () => {
  assert.deepEqual(page.starters, [...STARTERS], "content/chat.md and STARTERS must agree");
  for (const starter of STARTERS) {
    assert.ok(text.includes(`>${starter}</button>`), `missing starter button: ${starter}`);
  }
  assert.doesNotMatch(text, /proudest/);
});

test("the JS-off path lists the starters as text, not buttons", () => {
  const noscript = text.slice(text.indexOf("<noscript"), text.indexOf("</noscript>"));
  assert.ok(noscript.includes((page.starters ?? [])[0]), "the no-JS block must carry the starters");
  assert.ok(!noscript.includes("<button"), "a no-JS reader cannot press a button");
});

/*
 * A starter is a question the visitor asks the assistant, so it has to refer to
 * Nathan in the third person. "How do you keep model costs low?" reads as if the
 * visitor is asking Nathan himself, which is the one thing the chat is not.
 */
test("every starter is addressed to the assistant, not to Nathan", () => {
  for (const starter of page.starters ?? []) {
    assert.doesNotMatch(starter, /\byou\b|\byour\b/i, `starter speaks to Nathan: ${starter}`);
  }
});

/*
 * The intro is server-rendered into the panel, so a reader without script still
 * lands on something that says what the page is even though the composer cannot
 * work for them.
 */
test("the assistant's opening message is in the server-rendered HTML", () => {
  assert.match(html, /bubble-assistant/);
  assert.match(html, /class="markdown /, "the intro must render as markdown, not raw");
});

test("the idle state shows the input and none of the failure copy", () => {
  assert.match(html, /id="chat-input"/);
  assert.doesNotMatch(html, /Wait a minute and try again/);
  assert.doesNotMatch(html, /Something went wrong/);
});

// A source check, not a render check: the failure states only mount when they
// happen, so this exists to catch someone deleting the copy, not to prove it renders.
test("every failure state still defines a next step in the component", () => {
  const source = readFileSync(
    new URL("../../src/app/chat/ChatPanel.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /Wait a minute and try again/);
  assert.match(source, /Something went wrong/);
  assert.match(source, /href="\/projects"/);
  assert.match(source, /href="\/resume"/);
  assert.match(source, /Searching Nathan/);
});
