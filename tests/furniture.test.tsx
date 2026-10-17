import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ProjectMetaRow } from "../src/components/ProjectMetaRow";
import { ExperienceMetaRow } from "../src/components/ExperienceMetaRow";
import { StackList } from "../src/components/StackList";
import { StatRow } from "../src/components/StatRow";
import { LinkRow } from "../src/components/LinkRow";
import { OnThisPage } from "../src/components/OnThisPage";
import { AwardsTable } from "../src/components/AwardsTable";
import { ModelTable } from "../src/components/ModelTable";
import { getProject } from "../src/data/site";
import { renderMarkdown } from "../src/lib/markdown";

test("ProjectMetaRow takes facts from site.ts, not props", () => {
  const html = renderToStaticMarkup(<ProjectMetaRow projectId="campus" />);
  assert.match(html, /Aug 2026 to now/);
  assert.match(html, /solo/);
});

test("'present' is rendered as 'now'", () => {
  const html = renderToStaticMarkup(<ProjectMetaRow projectId="campus" />);
  assert.doesNotMatch(html, /present/i);
});

test("ProjectMetaRow shows a status only where site.ts has one", () => {
  const withStatus = renderToStaticMarkup(<ProjectMetaRow projectId="agntos" />);
  assert.match(withStatus, /concept/);

  const withoutStatus = renderToStaticMarkup(<ProjectMetaRow projectId="campus" />);
  assert.doesNotMatch(withoutStatus, /concept/);
});

test("an unknown project renders nothing rather than throwing", () => {
  assert.equal(renderToStaticMarkup(<ProjectMetaRow projectId="nope" />), "");
  assert.equal(renderToStaticMarkup(<StatRow projectId="nope" />), "");
});

test("ExperienceMetaRow renders experience data for TeraGo", () => {
  const html = renderToStaticMarkup(<ExperienceMetaRow org="TeraGo" />);
  assert.match(html, /May 2026 to Aug 2026/);
  assert.match(html, /Software Engineering Intern/);
  assert.match(html, /Markham, ON/);
});

test("StackList renders from site.ts", () => {
  const html = renderToStaticMarkup(<StackList projectId="campus" />);
  assert.match(html, /FastAPI/);
  assert.ok(getProject("campus")!.stack.length > 0);
});

/*
 * There is no cap in the component: a stack is trimmed in site.ts to the pieces
 * that carry the project, and whatever is declared there is what a card shows.
 * A silent truncation here is the thing this guards against.
 */
test("StackList renders every declared item, capped nowhere", () => {
  const stack = getProject("campus")!.stack;
  const html = renderToStaticMarkup(<StackList projectId="campus" />);
  for (const item of stack) assert.ok(html.includes(item), `missing pill ${item}`);
  assert.doesNotMatch(html, /more<\/a>/, "no overflow count belongs on a card");
});

test("StatRow renders every keyed stat as a description list", () => {
  const html = renderToStaticMarkup(<StatRow projectId="campus" />);
  assert.match(html, /<dl/);
  assert.match(html, /4,687/);
  assert.match(html, /308/);
});

test("LinkRow renders project links", () => {
  const html = renderToStaticMarkup(<LinkRow projectId="campus" />);
  assert.match(html, /github\.com\/HasNate618\/Campus/);
});

test("OnThisPage anchors match the ids renderMarkdown emits", () => {
  const nav = renderToStaticMarkup(<OnThisPage items={["Why I built it"]} />);
  const heading = renderMarkdown("## Why I built it");
  assert.match(nav, /href="#why-i-built-it"/);
  assert.match(heading, /id="why-i-built-it"/);
});

test("OnThisPage renders nothing when a page has no sections", () => {
  assert.equal(renderToStaticMarkup(<OnThisPage items={[]} />), "");
});

test("the awards table has a caption and scoped headers", () => {
  const html = renderToStaticMarkup(<AwardsTable />);
  assert.match(html, /<caption/);
  assert.match(html, /scope="col"/);
  assert.match(html, /scope="row"/);
});

test("the awards table also offers a narrow-screen card view", () => {
  const html = renderToStaticMarkup(<AwardsTable />);
  assert.match(html, /sm:hidden/);
  assert.match(html, /hidden sm:block/);
});

test("the model table carries its rows and a caption", () => {
  const rows = getProject("aware")!.models!;
  const html = renderToStaticMarkup(<ModelTable rows={rows} caption="On-device models" />);
  assert.match(html, /<caption[^>]*>On-device models/);
  assert.match(html, /YOLOv8n/);
  assert.match(html, /MiniCPM5-1B/);
  assert.equal(renderToStaticMarkup(<ModelTable rows={[]} caption="none" />), "");
});
