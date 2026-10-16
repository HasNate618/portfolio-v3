import { test } from "node:test";
import assert from "node:assert/strict";
import { buildSystemPrompt } from "../src/app/api/chat/lib/system-prompt";
import { site } from "../src/data/site";

const prompt = buildSystemPrompt([
  { text: "Campus is a study assistant.", source: "projects/campus.md" },
]);

test("Campus leads the project order", () => {
  const order = prompt.slice(prompt.indexOf("Order:"));
  assert.ok(order.includes("Campus"), "Campus must appear in the priority list");
  assert.ok(order.indexOf("Campus") < order.indexOf("Homelab"));
});

test("no stale v2 interface description survives", () => {
  assert.doesNotMatch(prompt, /React Three Fiber|ALLMIND mask|Three\.js/);
  assert.doesNotMatch(prompt, /Prototyped/);
});

test("resume highlights do not contradict site.ts", () => {
  assert.doesNotMatch(prompt, /Summer 2025/, "TeraGo was May-Aug 2026");
  assert.doesNotMatch(prompt, /3D Western \(current\)/, "3D Western ended Aug 2026");
  assert.match(prompt, /May 2026 to Aug 2026/);
});

test("every project in site.ts appears in the order list, in order", () => {
  const order = prompt.slice(prompt.indexOf("Order:"));
  const positions = [...site.projects]
    .sort((a, b) => a.order - b.order)
    .map((project) => order.indexOf(`**${project.name}**`));

  assert.ok(positions.every((p) => p !== -1), "a project is missing from the order list");
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b), "order list is out of order");
});

test("every role in site.ts is described with site.ts dates", () => {
  for (const role of site.experience) {
    assert.ok(prompt.includes(role.dates), `missing dates for ${role.org}`);
    assert.ok(prompt.includes(role.role), `missing title for ${role.org}`);
  }
});

test("the prompt no longer claims languages site.ts does not list", () => {
  assert.doesNotMatch(prompt, /\bJava\b/, "Java was never in site.skills");
  assert.match(prompt, /Rust/);
});

test("the fallback and off-topic wording match the draft", () => {
  assert.match(prompt, /I couldn't find that in Nathan's knowledgebase\. Try asking about a project or role/);
  assert.match(prompt, /I only answer questions about Nathan's work, projects and experience\./);
});

test("contact details come from site.contact", () => {
  assert.ok(prompt.includes(site.contact.email));
  for (const link of site.contact.links) {
    assert.ok(prompt.includes(link.href.replace(/^https?:\/\//, "")), `missing ${link.label}`);
  }
});

test("the context block still carries each chunk with its source", () => {
  assert.match(prompt, /\[1\] Source: projects\/campus\.md/);
  assert.match(prompt, /Campus is a study assistant\./);
});
