import { test } from "node:test";
import assert from "node:assert/strict";
import {
  site,
  highlightProjects,
  leadProject,
  featuredProjects,
  getProject,
  getExperience,
  type ProjectGroup,
} from "../src/data/site";
import { caseStudyHref } from "../src/lib/content";

test("Campus carries the figures the draft states", () => {
  const stats = Object.fromEntries(getProject("campus")!.stats.map((s) => [s.key, s.value]));
  assert.equal(stats.tests, "403");
  assert.equal(stats.courses, "6");
  assert.ok(getProject("campus")!.stack.includes("FastAPI"));
});

/*
 * A stack is the short answer to "what is this built with", and a card is where
 * that answer is read. The three featured projects had grown to twelve,
 * seventeen and nineteen entries, which turned every card into a wall of tags
 * and buried the card's own text. The list stays a list; it does not grow into a
 * manifest.
 */
test("no project stack is long enough to bury its card", () => {
  for (const project of site.projects) {
    const count = project.stack?.length ?? 0;
    assert.ok(count <= 8, `${project.id} declares ${count} pills`);
  }
});

test("Homelab carries the figures the draft states", () => {
  const stats = Object.fromEntries(getProject("homelab")!.stats.map((s) => [s.key, s.value]));
  assert.equal(stats.machines, "2");
  assert.equal(stats.containers, "35");
  assert.equal(stats.sessions, undefined, "agent counts left with the stat tiles");
});

test("TeraGo keeps its corrected dates", () => {
  const terago = site.experience.find((e) => e.org === "TeraGo")!;
  assert.equal(terago.dates, "May 2026 to Aug 2026");
});

test("every project has a group, order, role and unique stat keys", () => {
  for (const p of site.projects) {
    assert.ok(p.group, `${p.id} missing group`);
    assert.equal(typeof p.order, "number", `${p.id} missing order`);
    assert.ok(p.displayRole, `${p.id} missing displayRole`);
    const keys = p.stats.map((s) => s.key);
    assert.equal(new Set(keys).size, keys.length, `${p.id} has duplicate stat keys`);
  }
});

test("no project still carries tier, and highlights are the case studies", () => {
  for (const p of site.projects) assert.ok(!("tier" in p), `${p.id} still has tier`);
  const ids = highlightProjects().map((p) => p.id);
  assert.ok(ids.includes("campus"));
  assert.ok(!ids.includes("wasteland"), "an archive-free case-study list must exclude Wasteland");
});

test("every display group has at least one project", () => {
  const groups: ProjectGroup[] = [
    "featured", "ai", "hardware", "xr", "tools", "games",
  ];
  for (const g of groups) {
    assert.ok(site.projects.some((p) => p.group === g), `group ${g} is empty`);
  }
});

test("terago is an experience, not a project", () => {
  // It used to be both, which listed the internship twice on the home page.
  assert.equal(getProject("terago"), undefined, "terago must not be in site.projects");
  assert.ok(getExperience("TeraGo"), "terago must be in site.experience");
});

test("aware carries the rows its model table renders", () => {
  const models = getProject("aware")!.models ?? [];
  assert.ok(models.some((m) => m.name === "YOLOv8n"));
});

test("experience carries the 3D Western dataset figure", () => {
  const stats = getExperience("3D Western")!.stats ?? [];
  assert.ok(stats.some((s) => s.value === "4,620"));
});

test("displayStatus is a plain word, never a colour", () => {
  assert.equal(getProject("agntos")!.displayStatus, "abandoned");
  assert.equal(getProject("cyberdeck")!.displayStatus, "abandoned");
});

test("ferret is a solo tool with a corpus doc but no case study", () => {
  const ferret = getProject("ferret");
  assert.equal(ferret?.group, "tools");
  assert.equal(ferret?.displayRole, "solo");
  assert.equal(ferret?.file, "/knowledgebase/projects/ferret.md");
  assert.equal(caseStudyHref(ferret!), null, "no route is declared, so the card has no page");
});

test("project order is unique", () => {
  const orders = site.projects.map((p) => p.order);
  assert.equal(new Set(orders).size, orders.length, "duplicate project order");
});

test("highlightProjects is sorted by order and contains case studies only", () => {
  const hi = highlightProjects();
  assert.deepEqual(
    hi.map((p) => p.order),
    [...hi.map((p) => p.order)].sort((a, b) => a - b)
  );
  assert.ok(hi.every((p) => p.group === "featured"));
});

test("the lead project is explicit data, not a hardcoded id in a view", () => {
  assert.equal(leadProject()?.id, "campus");
});

test("the featured cards are the ranked projects, in display order", () => {
  assert.deepEqual(
    featuredProjects().map((p) => p.id),
    ["clank", "homelab", "aware", "beacon"]
  );
});

test("every ranked project exists and exactly one is the lead", () => {
  const ranked = site.projects.filter((p) => p.rank);
  assert.equal(ranked.filter((p) => p.rank === "lead").length, 1);
  assert.equal(ranked.length, 5, "campus (lead) plus four featured");
});

/*
 * The entry flattened a promotion into one title over one window, so answers dated the VP
 * role to Sep 2025. The body always had it right: Software Developer from Sep 2025,
 * then VP of Data/ML for May to Aug 2026.
 */
test("3D Western names both titles and keeps both windows separate", () => {
  const role = site.experience.find((entry) => entry.id === "3d-western");
  assert.ok(role, "3d-western is in site.experience");
  assert.match(role.role, /VP of Data\/ML/);
  assert.match(role.role, /promoted from Software Developer/, "both titles are on the card");
  assert.equal(role.terms.length, 2, "the two terms are separate windows");
  // The card prints one span, so the windows live in `terms` and in the corpus
  // facts the chat reads, not in the title.
  assert.equal(role.dates, "Sep 2025 to Aug 2026");
});

test("every project outside the case studies has a score, and no case study does", () => {
  for (const p of site.projects) {
    const needs = p.group !== "featured";
    assert.equal(Boolean(p.score), needs, `${p.id} score presence`);
    if (p.score) {
      const { relevance, depth, award, shipped, ownership, recency } = p.score;
      assert.ok(relevance >= 0 && relevance <= 3 && depth >= 0 && depth <= 3 && award >= 0 && award <= 3, p.id);
      assert.ok(shipped >= -1 && shipped <= 1 && ownership >= 0 && ownership <= 1 && recency >= 0 && recency <= 2, p.id);
    }
  }
});

test("the case studies are exactly the five with a page; CareBridge is a scored grid card, no longer featured on Home", () => {
  assert.deepEqual(highlightProjects().map((p) => p.id), ["campus", "clank", "homelab", "aware", "beacon"]);
  const carebridge = site.projects.find((p) => p.id === "carebridge")!;
  assert.equal(carebridge.group, "ai");
  assert.equal(carebridge.rank, undefined);
  assert.ok(carebridge.score, "CareBridge needs a score in the grid");
  assert.match(carebridge.covers, /made-up case/, "the storm was the hackathon's case, not a real event");
  assert.match(carebridge.covers, /keyword rules/);
  assert.doesNotMatch(carebridge.covers, /model output/);
});
