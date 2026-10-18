import { test } from "node:test";
import assert from "node:assert/strict";
import { GENERAL, TOPICS, routeTopic } from "../src/app/api/chat/lib/topic";
import { site } from "../src/data/site";

test("an unmatched question is general", () => {
  assert.deepEqual(routeTopic("What does Nathan build?").ids, ["general"]);
  assert.deepEqual(routeTopic("What does Nathan build?").feature, GENERAL);
});

/*
 * The owner reported TeraGo as the fixed lead: every broad and AI question opened with it,
 * because it was first in both feature lists. That list is what the prompt tells the model
 * to lead with, so the order decides, and the work he built for himself comes first now.
 */
test("AI work leads with what he built, not the internship", () => {
  const route = routeTopic("What AI work has Nathan done?");
  assert.equal(route.feature[0], "campus");
  assert.ok(route.feature.includes("terago"), "the internship is still offered, just not first");
  assert.ok(routeTopic("Does he run models on-device?").ids.includes("ai"));
});

test("a general question leads with his own work too", () => {
  assert.equal(GENERAL[0], "campus");
  assert.equal(GENERAL[GENERAL.length - 1], "terago");
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
 * A stem inside \b…\b closes on itself: \bretriev\b matches nothing at all, and
 * \bagent\b cannot match "agents". These are the shapes visitors type.
 */
test("plurals and stems still choose the topic", () => {
  assert.ok(routeTopic("What models does it run?").ids.includes("ai"));
  assert.ok(routeTopic("How does the retrieval work?").ids.includes("ai"));
  assert.ok(routeTopic("How many agents does Campus have?").ids.includes("ai"));
  assert.ok(routeTopic("We're hiring interns").ids.includes("industry"));
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
