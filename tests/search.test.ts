import { test } from "node:test";
import assert from "node:assert/strict";
import { GET, parseSearchParams, shapeHits } from "../src/app/api/search/route";

test("q is required, trimmed and bounded", () => {
  assert.ok("error" in parseSearchParams(new URLSearchParams()), "no q");
  assert.ok("error" in parseSearchParams(new URLSearchParams({ q: "   " })), "blank q");
  assert.ok("error" in parseSearchParams(new URLSearchParams({ q: "a" })), "one character");
  assert.ok("error" in parseSearchParams(new URLSearchParams({ q: "a".repeat(201) })), "too long");

  const parsed = parseSearchParams(new URLSearchParams({ q: "  rust  " }));
  assert.ok(!("error" in parsed));
  assert.deepEqual(parsed, { query: "rust", limit: 5 });
});

test("limit defaults to five and never exceeds ten", () => {
  const withLimit = (limit: string) => {
    const parsed = parseSearchParams(new URLSearchParams({ q: "rust", limit }));
    assert.ok(!("error" in parsed));
    return parsed.limit;
  };

  assert.equal(withLimit("3"), 3);
  assert.equal(withLimit("99"), 10, "an agent cannot ask for the whole corpus in one call");
  assert.equal(withLimit("abc"), 5);
  assert.equal(withLimit("0"), 5);
  assert.equal(withLimit("-3"), 5);
});

test("a hit carries the record's own text and a citable URL", () => {
  const hits = shapeHits(
    [
      {
        score: 0.93751,
        source: "projects/ferret.md",
        section: "What it does",
        text: "Vector similarity, keyword and filename, fused with reciprocal rank fusion.",
      },
    ],
    "https://www.nathanespejo.com",
  );

  assert.deepEqual(hits, [
    {
      score: 0.9375,
      source: "projects/ferret.md",
      section: "What it does",
      url: "https://www.nathanespejo.com/knowledgebase/projects/ferret.md",
      text: "Vector similarity, keyword and filename, fused with reciprocal rank fusion.",
    },
  ]);
});

test("a malformed request is refused before anything is embedded", async () => {
  const res = await GET(new Request("https://www.nathanespejo.com/api/search"));
  assert.equal(res.status, 400);

  const body = (await res.json()) as { error: string };
  assert.match(body.error, /at least 2 characters/);
});
