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
  assert.equal(stats.tests, "308");
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
  assert.equal(stats.sessions, "411");
  assert.equal(stats.skills, "212");
  assert.equal(stats.toolCalls, "34,673");
  assert.equal(stats.containers, "35");
});

test("TeraGo keeps its corrected dates and the 760-case figure", () => {
  const terago = site.experience.find((e) => e.org === "TeraGo")!;
  assert.equal(terago.dates, "May 2026 to Aug 2026");
  assert.ok(terago.stats?.some((s) => s.value === "760"));
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
    "featured", "ai", "hardware", "xr", "tools", "archive",
  ];
  for (const g of groups) {
    assert.ok(site.projects.some((p) => p.group === g), `group ${g} is empty`);
  }
});

test("terago is an experience, not a project", () => {
  // It used to be both, which listed the internship twice on the home page.
  assert.equal(getProject("terago"), undefined, "terago must not be in site.projects");
  const terago = getExperience("TeraGo")!;
  assert.ok(terago.stats?.some((s) => s.key === "testCases" && s.value === "760"));
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
    ["homelab", "aware", "carebridge"]
  );
});

test("every ranked project exists and exactly one is the lead", () => {
  const ranked = site.projects.filter((p) => p.rank);
  assert.equal(ranked.filter((p) => p.rank === "lead").length, 1);
  assert.equal(ranked.length, 4, "campus (lead) plus three featured");
});

/*
 * The entry flattened a promotion into one title over one window, so answers dated the VP
 * role to Sep 2025. The body always had it right: Software Developer from Sep 2025,
 * promoted to VP of Data/ML for May to Aug 2026.
 */
test("3D Western states both titles and both windows", () => {
  const role = site.experience.find((entry) => entry.id === "3d-western");
  assert.ok(role, "3d-western is in site.experience");
  assert.match(role.role, /Software Developer \(Sep 2025 to Apr 2026\)/);
  assert.match(role.role, /VP of Data\/ML \(May 2026 to Aug 2026\)/);
  assert.equal(role.terms.length, 2, "the two terms are separate windows");
  assert.doesNotMatch(role.role, /promoted from/, "the flat phrasing is what misread");
});
