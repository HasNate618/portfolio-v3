import { test } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../src/app/llms.txt/route";

test("llms.txt points machines at search, not at the chat", async () => {
  const res = await GET();
  assert.equal(res.status, 200);

  const body = await res.text();

  assert.match(body, /## Machine access/);
  assert.match(body, /GET https?:\/\/[^/\s]+\/api\/search\?q=<query>&limit=5/);
  assert.match(body, /limit defaults to 5 and caps at 10/);
  assert.match(body, /\/chat is a browser interface, not an API/);
});

test("llms.txt keeps the corpus as the thing to read", async () => {
  const body = await (await GET()).text();

  assert.match(body, /## Full text/);
  assert.match(body, /\/knowledgebase\/<path>/);
  assert.match(body, /Where this file and a page disagree, the page wins/);
});

test("llms.txt carries no em dash", async () => {
  const body = await (await GET()).text();
  assert.doesNotMatch(body, /[\u2013\u2014]/);
});
