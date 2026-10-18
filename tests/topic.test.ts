import { test } from "node:test";
import assert from "node:assert/strict";
import { GENERAL, TOPICS, routeTopic } from "../src/app/api/chat/lib/topic";
import { site } from "../src/data/site";

test("an unmatched question is general", () => {
  assert.deepEqual(routeTopic("What does Nathan build?").ids, ["general"]);
  assert.deepEqual(routeTopic("What does Nathan build?").feature, GENERAL);
});

test("AI work leads with TeraGo before Campus", () => {
  assert.equal(routeTopic("What AI work has Nathan done?").feature[0], "terago");
  assert.ok(routeTopic("Does he run models on-device?").ids.includes("ai"));
});

test("backend internship unions two topics and caps at five", () => {
  const route = routeTopic("We're hiring backend interns for next summer");
  assert.ok(route.ids.includes("industry") && route.ids.includes("backend"));
  assert.ok(route.feature.length <= 5);
});

test("the union keeps first-seen order and drops repeats", () => {
  const route = routeTopic("hackathon awards for the VR game");
  assert.deepEqual(route.ids, ["hackathon", "xr"]);
  assert.equal(new Set(route.feature).size, route.feature.length);
  assert.equal(route.feature[0], "awards");
});

test("each topic leads with its own work", () => {
  assert.equal(routeTopic("Tell me about the homelab and NixOS infra").feature[0], "homelab");
  assert.equal(routeTopic("What XR and Unity work has Nathan done?").feature[0], "omni-reality");
  assert.equal(routeTopic("What backend Python work has he written?").feature[0], "terago");
});

/*
 * A typo in a feature id is invisible until a broad answer leads with nothing,
 * so every id is checked against the data the card is built from.
 */
test("GENERAL is six ids and every feature id names something real", () => {
  const known = new Set([
    ...site.projects.map((project) => project.id),
    ...site.experience.map((role) => role.id),
    "awards",
  ]);

  assert.equal(GENERAL.length, 6);
  for (const topic of TOPICS) {
    for (const id of topic.feature) {
      assert.ok(known.has(id), `${topic.id} names ${id}, which is no project, role or award`);
    }
  }
  for (const id of GENERAL) {
    assert.ok(known.has(id), `GENERAL names ${id}`);
  }
});
