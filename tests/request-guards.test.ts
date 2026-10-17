import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_HISTORY_CHARS,
  MAX_HISTORY_MESSAGES,
  isBrowserRequest,
  trimHistory,
} from "../src/app/api/chat/lib/request-guards";

const headers = (init: Record<string, string>): Headers => new Headers(init);

test("a fetch from this site's own pages passes", () => {
  assert.equal(isBrowserRequest(headers({ "sec-fetch-site": "same-origin" }), "www.nathanespejo.com"), true);
  assert.equal(isBrowserRequest(headers({ "sec-fetch-site": "same-site" }), "www.nathanespejo.com"), true);
});

test("a script, a cross-site page and a direct navigation are refused", () => {
  assert.equal(isBrowserRequest(headers({}), "www.nathanespejo.com"), false, "curl sends none of these");
  assert.equal(isBrowserRequest(headers({ "sec-fetch-site": "cross-site" }), "www.nathanespejo.com"), false);
  assert.equal(isBrowserRequest(headers({ "sec-fetch-site": "none" }), "www.nathanespejo.com"), false);
  assert.equal(
    isBrowserRequest(headers({ origin: "https://example.com" }), "www.nathanespejo.com"),
    false,
    "another site's page",
  );
});

test("a browser too old for Sec-Fetch-Site is judged by Origin", () => {
  assert.equal(
    isBrowserRequest(headers({ origin: "https://www.nathanespejo.com" }), "www.nathanespejo.com"),
    true,
  );
  assert.equal(isBrowserRequest(headers({ origin: "not a url" }), "www.nathanespejo.com"), false);
  assert.equal(isBrowserRequest(headers({ origin: "https://www.nathanespejo.com" }), null), false);
});

test("history keeps the most recent turns", () => {
  const history = Array.from({ length: 40 }, (_, index) => ({ role: "user", content: `turn ${index}` }));
  const kept = trimHistory(history);

  assert.equal(kept.length, MAX_HISTORY_MESSAGES);
  assert.equal(kept[kept.length - 1].content, "turn 39", "the newest turn survives");
  assert.equal(kept[0].content, "turn 10", "the oldest turns are the ones dropped");
});

test("history is capped by characters as well as by count", () => {
  const history = Array.from({ length: 30 }, (_, index) => ({
    role: "user",
    content: `${index}:`.padEnd(1000, "x"),
  }));
  const kept = trimHistory(history);

  const total = kept.reduce((sum, message) => sum + message.content.length, 0);
  assert.ok(total <= MAX_HISTORY_CHARS, `${total} characters must fit ${MAX_HISTORY_CHARS}`);
  assert.equal(kept.length, MAX_HISTORY_CHARS / 1000);
  assert.match(kept[kept.length - 1].content, /^29:/, "the newest turn still survives");
});

test("one over-long message is clipped rather than carried whole", () => {
  const kept = trimHistory([{ role: "user", content: "y".repeat(9000) }]);
  assert.equal(kept.length, 1);
  assert.ok(kept[0].content.length <= 4000, "clipped to the message limit");
});
