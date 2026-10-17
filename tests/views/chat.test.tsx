import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { ChatView } from "../../src/components/views/ChatView";
import { getPage } from "../../src/lib/content";

const page = getPage("/chat")!;
const html = renderToStaticMarkup(<ChatView page={page} />);

test("chat renders starters and the JS-off notice in the HTML", () => {
  assert.match(html, /What is Campus and how does its retrieval work\?/);
  assert.match(html, /needs JavaScript/);
  assert.match(html, /\/llms\.txt/);
});

test("chat states its limits and carries no phone number", () => {
  assert.match(html, /can be wrong/i);
  assert.doesNotMatch(html, /\b\d{3}-\d{3}-\d{4}\b/);
});

test("no Sources line is rendered", () => {
  assert.doesNotMatch(html, />Sources:/);
});

test("all five starters are offered as buttons for JS users", () => {
  for (const starter of page.starters ?? []) {
    assert.ok(html.includes(starter), `missing starter: ${starter}`);
    assert.ok(html.includes(`>${starter}</button>`), `starter is not a button: ${starter}`);
  }
});

test("the JS-off path lists the starters as text, not buttons", () => {
  const noscript = html.slice(html.indexOf("<noscript"), html.indexOf("</noscript>"));
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

test("the disclaimer links to the public text surface", () => {
  assert.match(html, /mailto:/);
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
