import { test } from "node:test";
import assert from "node:assert/strict";
import { speaksAsNathan, thirdPerson } from "../src/lib/voice";

/*
 * site.ts writes in his voice, and the boundary turns the pronouns around. The first
 * person plural is the trap: "we shaped the concept" became "he shaped the concept",
 * which credits Nathan with a team's work. That is the one direction this must not lean.
 */
test("a team we is never turned into Nathan", () => {
  assert.equal(thirdPerson("we shaped the concept"), "the team shaped the concept");
  assert.equal(thirdPerson("We built the parser"), "The team built the parser");
  assert.equal(thirdPerson("our part of the pipeline"), "the team's part of the pipeline");
  assert.equal(thirdPerson("Our design"), "The team's design");
  assert.equal(thirdPerson("they joined us"), "they joined the team");
});

test("the first person singular still becomes he", () => {
  assert.equal(thirdPerson("I built it"), "he built it");
  assert.equal(thirdPerson("my part"), "his part");
  assert.equal(thirdPerson("it is mine"), "it is his");
  assert.equal(thirdPerson("they asked me"), "they asked him");
});

test("a turned-around line no longer reads as Nathan speaking", () => {
  assert.equal(speaksAsNathan(thirdPerson("we built it, and I led it")), false);
  assert.equal(speaksAsNathan("I built it"), true);
  assert.equal(speaksAsNathan("the team built it"), false);
});
