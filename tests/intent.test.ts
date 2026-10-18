import { test } from "node:test";
import assert from "node:assert/strict";
import { routeIntent } from "../src/app/api/chat/lib/intent";

test("a hiring question is a hiring question", () => {
  assert.equal(routeIntent("We're hiring backend interns for next summer, is Nathan a fit?", []), "recruiter");
});

test("an ordinary question is not", () => {
  assert.equal(routeIntent("How does Campus retrieve?", []), "general");
});

/*
 * The reviewer's case: the visitor's last question was about fit, and this turn
 * is "tell me more". Without the history the prompt loses the hiring frame, and
 * the answer stops carrying the Summer 2027 and May 2028 facts.
 */
test("a follow-up in a hiring thread stays in the hiring frame", () => {
  const history = [
    { role: "user", content: "is he a fit for the internship?" },
    { role: "assistant", content: "Nathan's TeraGo work is closest to it." },
  ];
  assert.equal(routeIntent("tell me more", history), "recruiter");
});

test("availability is a hiring question too", () => {
  assert.equal(routeIntent("Is Nathan available for an internship?", []), "recruiter");
  assert.equal(routeIntent("Is he recruiting for a team?", []), "recruiter");
});

/*
 * "résumé" ends in an accented letter, which is not a \w, so a trailing \b can
 * never close it. Both spellings have to work, and the visitor types one or the
 * other at random.
 */
test("the résumé counts with or without its accents", () => {
  assert.equal(routeIntent("Could you send his résumé?", []), "recruiter");
  assert.equal(routeIntent("Could you send his resume?", []), "recruiter");
});

test("only the visitor's own turns count", () => {
  assert.equal(routeIntent("How does Campus retrieve?", [
    { role: "assistant", content: "He is looking for a Summer 2027 internship." },
  ]), "general");
});

test("only the last two visitor turns count", () => {
  const history = [
    { role: "user", content: "are you hiring?" },
    { role: "assistant", content: "I only speak for Nathan's record." },
    { role: "user", content: "How does Campus retrieve?" },
    { role: "assistant", content: "Campus uses hybrid retrieval." },
    { role: "user", content: "What about the index?" },
    { role: "assistant", content: "It embeds course files." },
  ];
  assert.equal(routeIntent("tell me more", history), "general");
});
