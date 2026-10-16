import { test } from "node:test";
import assert from "node:assert/strict";
import { isNavigationDoc } from "../src/app/api/chat/lib/rag";

test("the index maps are treated as navigation", () => {
  for (const source of ["index.md", "projects/index.md", "experience/index.md", "projects/other.md"]) {
    assert.ok(isNavigationDoc(source), `${source} should be demoted`);
  }
});

test("real documents are not demoted", () => {
  for (const source of [
    "projects/campus.md",
    "projects/homelab.md",
    "experience/terago.md",
    "about.md",
    "local-ai.md",
    "skills.md",
    "awards.md",
    "resume.md",
  ]) {
    assert.ok(!isNavigationDoc(source), `${source} must not be demoted`);
  }
});
